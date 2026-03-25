#!/usr/bin/env bash
#
# Pharo Agents — Gateway Setup
# Run this on any machine running OpenClaw to connect it to the Pharo Agents platform.
#
# Usage:
#   curl -fsSL https://pharo-agents.vercel.app/setup.sh | bash
#
set -euo pipefail

PHARO_URL="${PHARO_URL:-https://pharo-agents.vercel.app}"

echo "⚡ Pharo Agents — Gateway Setup"
echo "================================"
echo ""

# Check prerequisites
command -v jq >/dev/null 2>&1 || { echo "Installing jq..."; brew install jq 2>/dev/null || sudo apt-get install -y jq 2>/dev/null || { echo "❌ Please install jq first"; exit 1; }; }

# Find OpenClaw config
OPENCLAW_CONFIG="${HOME}/.openclaw/openclaw.json"
if [ ! -f "$OPENCLAW_CONFIG" ]; then
  echo "❌ OpenClaw config not found at $OPENCLAW_CONFIG"
  echo "   Is OpenClaw installed on this machine?"
  exit 1
fi

echo "✅ OpenClaw config found"

# Get gateway name
DEFAULT_NAME=$(hostname -s)
read -p "Gateway name [$DEFAULT_NAME]: " GW_NAME
GW_NAME="${GW_NAME:-$DEFAULT_NAME}"

# Extract gateway token
GW_TOKEN=$(python3 -c "
import json, re
with open('$OPENCLAW_CONFIG') as f:
    content = f.read()
    # Handle JSON5 format
    content = re.sub(r'//.*', '', content)
    content = re.sub(r',(\s*[}\]])', r'\1', content)
    content = re.sub(r\"'([^']*)'\", r'\"\\1\"', content)
    content = re.sub(r'(\w+)(?=\s*:)', r'\"\\1\"', content)
    try:
        d = json.loads(content)
        print(d.get('gateway',{}).get('auth',{}).get('token',''))
    except:
        print('')
" 2>/dev/null)

if [ -z "$GW_TOKEN" ]; then
  read -p "Gateway auth token (from openclaw.json → gateway.auth.token): " GW_TOKEN
fi

# Extract agent list
AGENTS=$(python3 -c "
import json, re, sys
with open('$OPENCLAW_CONFIG') as f:
    content = f.read()
    content = re.sub(r'//.*', '', content)
    content = re.sub(r',(\s*[}\]])', r'\1', content)
    content = re.sub(r\"'([^']*)'\", r'\"\\1\"', content)
    content = re.sub(r'(\w+)(?=\s*:)', r'\"\\1\"', content)
    try:
        d = json.loads(content)
        agents = d.get('agents',{}).get('list',[])
        result = []
        for a in agents:
            if a.get('id') == 'main': continue
            result.append({
                'id': a.get('id',''),
                'name': a.get('name', a.get('id','')),
                'model': a.get('model', d.get('agents',{}).get('defaults',{}).get('model',{}).get('primary','unknown')),
                'workspace': a.get('workspace',''),
                'status': 'active'
            })
        print(json.dumps(result))
    except Exception as e:
        print('[]', file=sys.stderr)
        print('[]')
" 2>/dev/null)

AGENT_COUNT=$(echo "$AGENTS" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
echo "✅ Found $AGENT_COUNT agents"

# Get machine info
MACHINE_HOST=$(hostname)
MACHINE_OS=$(uname -srm)
OC_VERSION=$(openclaw --version 2>/dev/null | head -1 || echo "unknown")

echo ""
echo "Registering with Pharo Agents..."

# Register with platform
RESPONSE=$(curl -sf -X POST "${PHARO_URL}/api/gateways/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$GW_NAME\",
    \"api_token\": \"$GW_TOKEN\",
    \"machine_host\": \"$MACHINE_HOST\",
    \"machine_os\": \"$MACHINE_OS\",
    \"openclaw_version\": \"$OC_VERSION\",
    \"agents\": $AGENTS
  }")

GW_ID=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('gateway_id',''))" 2>/dev/null)

if [ -z "$GW_ID" ]; then
  echo "❌ Registration failed"
  echo "$RESPONSE"
  exit 1
fi

echo "✅ Registered! Gateway ID: $GW_ID"
echo ""

# Save config locally
mkdir -p ~/.pharo-agents
cat > ~/.pharo-agents/config.json << CFGEOF
{
  "gateway_id": "$GW_ID",
  "gateway_name": "$GW_NAME",
  "pharo_url": "$PHARO_URL",
  "registered_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
CFGEOF

# Create heartbeat cron script
cat > ~/.pharo-agents/heartbeat.sh << 'HBEOF'
#!/usr/bin/env bash
# Pharo Agents heartbeat — sends agent status + usage data every 30 minutes
CONFIG="$HOME/.pharo-agents/config.json"
[ ! -f "$CONFIG" ] && exit 0

GW_ID=$(python3 -c "import json; print(json.load(open('$CONFIG'))['gateway_id'])")
PHARO_URL=$(python3 -c "import json; print(json.load(open('$CONFIG'))['pharo_url'])")

curl -sf -X POST "${PHARO_URL}/api/gateways/heartbeat" \
  -H "Content-Type: application/json" \
  -d "{\"gateway_id\": \"$GW_ID\"}" >/dev/null 2>&1
HBEOF
chmod +x ~/.pharo-agents/heartbeat.sh

echo "================================"
echo "⚡ Setup complete!"
echo ""
echo "Your gateway '$GW_NAME' is now connected to Pharo Agents."
echo "View it at: ${PHARO_URL}"
echo ""
echo "Next steps:"
echo "  1. Set up Cloudflare Tunnel for remote access (optional):"
echo "     brew install cloudflared"
echo "     cloudflared tunnel login"
echo "     cloudflared tunnel create $GW_NAME"
echo ""
echo "  2. To send heartbeats, add to crontab:"
echo "     */30 * * * * ~/.pharo-agents/heartbeat.sh"
echo ""
