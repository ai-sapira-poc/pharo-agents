#!/usr/bin/env bash
#
# Pharo Agents — Gateway Setup
# Run this on any machine running OpenClaw to connect it to the Pharo Agents platform.
# Registers the gateway, collects all agent data, and installs the heartbeat cron.
#
# Usage (interactive):
#   curl -fsSL https://pharo-agents.vercel.app/setup.sh | bash
#
# Usage (non-interactive):
#   GATEWAY_NAME=juninho TUNNEL_URL=https://juninho.pharo-ai.com \
#     curl -fsSL https://pharo-agents.vercel.app/setup.sh | bash
#
set -euo pipefail

PHARO_URL="${PHARO_URL:-https://pharo-agents.vercel.app}"
OPENCLAW_CONFIG="${HOME}/.openclaw/openclaw.json"
OPENCLAW_DIR="${HOME}/.openclaw"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

prompt_user() {
  local prompt="$1" default="$2" varname="$3"
  local answer=""
  if [ -t 0 ]; then
    read -p "$prompt" answer
  elif [ -e /dev/tty ]; then
    read -p "$prompt" answer < /dev/tty
  fi
  eval "$varname=\"\${answer:-$default}\""
}

echo ""
echo "⚡ Pharo Agents — Gateway Setup"
echo "================================"
echo ""

# ---------------------------------------------------------------------------
# 1. Prerequisites
# ---------------------------------------------------------------------------

if ! command -v python3 >/dev/null 2>&1; then
  echo "❌ python3 is required but not found."
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "❌ curl is required but not found."
  exit 1
fi

if [ ! -f "$OPENCLAW_CONFIG" ]; then
  echo "❌ OpenClaw config not found at $OPENCLAW_CONFIG"
  echo "   Is OpenClaw installed on this machine?"
  exit 1
fi

echo "✅ OpenClaw config found"

# ---------------------------------------------------------------------------
# 2. Collect inputs
# ---------------------------------------------------------------------------

DEFAULT_NAME=$(hostname -s 2>/dev/null || hostname)

if [ -z "${GATEWAY_NAME:-}" ]; then
  prompt_user "Gateway name [$DEFAULT_NAME]: " "$DEFAULT_NAME" GATEWAY_NAME
fi
GATEWAY_NAME="${GATEWAY_NAME:-$DEFAULT_NAME}"

if [ -z "${TUNNEL_URL:-}" ]; then
  prompt_user "Tunnel URL (e.g. https://juninho.pharo-ai.com): " "" TUNNEL_URL
fi

if [ -z "${TUNNEL_URL:-}" ]; then
  echo "⚠️  No tunnel URL provided. The gateway proxy won't work without it."
  echo "   You can update it later in Supabase or re-run this script."
fi

echo ""
echo "  Gateway name: $GATEWAY_NAME"
[ -n "${TUNNEL_URL:-}" ] && echo "  Tunnel URL:   $TUNNEL_URL"
echo ""

# ---------------------------------------------------------------------------
# 3. Extract token + collect full agent data via Python
# ---------------------------------------------------------------------------

MACHINE_HOST=$(hostname 2>/dev/null || echo "unknown")
MACHINE_OS=$(uname -srm 2>/dev/null || echo "unknown")
OC_VERSION=$(openclaw --version 2>/dev/null | head -1 || echo "unknown")

# Python does all the heavy lifting: parses JSON5 config, scans workspaces
# for skills/sessions/identity, and outputs a single JSON blob to stdout.
AGENT_DATA=$(python3 << 'PYEOF'
import json, os, re, sys

HOME = os.path.expanduser("~")
OPENCLAW_DIR = os.path.join(HOME, ".openclaw")
CONFIG_FILE = os.path.join(OPENCLAW_DIR, "openclaw.json")


def read_config():
    """Parse openclaw.json — tries valid JSON first, falls back to JSON5 cleanup."""
    with open(CONFIG_FILE) as f:
        raw = f.read()
    # Try parsing as valid JSON first (most configs are already valid)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass
    # Fall back to JSON5 cleanup (comments, trailing commas, unquoted keys)
    raw = re.sub(r'//.*', '', raw)
    raw = re.sub(r',(\s*[}\]])', r'\1', raw)
    raw = re.sub(r"'([^']*)'", r'"\1"', raw)
    raw = re.sub(r'(?<=[{\s,\[])(\w+)(?=\s*:)', r'"\1"', raw)
    return json.loads(raw)


def read_file_safe(path, max_bytes=5000):
    """Read a text file safely, return content or empty string."""
    try:
        with open(os.path.expanduser(path)) as f:
            return f.read(max_bytes)
    except Exception:
        return ""


def scan_skills(workspace):
    """Find all SKILL.md files in the workspace skills directory."""
    skills = []
    skills_dir = os.path.join(workspace, "skills")
    if not os.path.exists(skills_dir):
        return skills
    for skill_dir in sorted(os.listdir(skills_dir)):
        skill_file = os.path.join(skills_dir, skill_dir, "SKILL.md")
        if os.path.isfile(skill_file):
            content = read_file_safe(skill_file)
            desc = ""
            for line in content.split("\n"):
                line = line.strip()
                if line and not line.startswith("#") and not line.startswith("---"):
                    desc = line[:200]
                    break
            skills.append({
                "name": skill_dir,
                "path": skill_file,
                "description": desc,
                "content_preview": content[:1000],
            })
    return skills


def scan_sessions(agent_id):
    """Get session stats from transcript files."""
    sessions_dir = os.path.join(OPENCLAW_DIR, "agents", agent_id, "sessions")
    if not os.path.exists(sessions_dir):
        return {"count": 0, "total_tokens": 0, "total_cost": 0, "models": []}

    total_tokens = 0
    total_cost = 0
    session_count = 0
    models = set()

    for fname in os.listdir(sessions_dir):
        if not fname.endswith(".jsonl"):
            continue
        session_count += 1
        fpath = os.path.join(sessions_dir, fname)
        try:
            with open(fpath) as f:
                for line in f:
                    try:
                        entry = json.loads(line)
                        msg = entry.get("message", entry)
                        usage = msg.get("usage")
                        if usage and isinstance(usage, dict):
                            total_tokens += usage.get("input", 0) + usage.get("output", 0)
                            models.add(msg.get("model", ""))
                            cost = usage.get("cost", {})
                            if isinstance(cost, dict):
                                total_cost += cost.get("total", 0)
                    except Exception:
                        continue
        except Exception:
            continue

    return {
        "count": session_count,
        "total_tokens": total_tokens,
        "total_cost": round(total_cost, 4),
        "models": list(models - {""}),
    }


try:
    config = read_config()
except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)

agents_config = config.get("agents", {})
if not agents_config:
    print(json.dumps({"error": f"No 'agents' key found in config. Top-level keys: {list(config.keys())}"}))
    sys.exit(1)

defaults = agents_config.get("defaults", {})
model_val = defaults.get("model", {})
primary_model = model_val.get("primary", "unknown") if isinstance(model_val, dict) else model_val
agent_list = agents_config.get("list", [])
bindings = config.get("bindings", [])

# If no explicit agent list, synthesize a "main" agent from defaults
if not agent_list:
    default_workspace = defaults.get("workspace", os.path.join(OPENCLAW_DIR, "workspace"))
    agent_list = [{
        "id": "main",
        "name": os.uname()[1],
        "workspace": default_workspace,
        "model": defaults.get("model", primary_model),
    }]

# Extract auth token
token = config.get("gateway", {}).get("auth", {}).get("token", "")

# Build comprehensive agent data
agents = []
for a in agent_list:
    agent_id = a.get("id", "")
    if not agent_id:
        continue

    workspace = a.get("workspace", os.path.join(OPENCLAW_DIR, "workspace"))
    model_val = a.get("model", primary_model)
    model = model_val.get("primary", primary_model) if isinstance(model_val, dict) else model_val

    # Read identity files
    soul = read_file_safe(os.path.join(workspace, "SOUL.md"))
    identity = read_file_safe(os.path.join(workspace, "IDENTITY.md"))

    # Extract purpose from SOUL.md
    purpose = ""
    for line in soul.split("\n"):
        line = line.strip()
        if line and not line.startswith("#") and not line.startswith("---") and len(line) > 20:
            purpose = line[:300]
            break

    skills = scan_skills(workspace)
    sessions = scan_sessions(agent_id)
    agent_bindings = [b for b in bindings if b.get("agentId") == agent_id]

    agents.append({
        "id": agent_id,
        "name": a.get("name", agent_id),
        "model": model,
        "workspace": workspace,
        "purpose": purpose,
        "status": "active" if sessions["count"] > 0 else "idle",
        "skills": skills,
        "sessions": sessions,
        "bindings": agent_bindings,
        "config": {
            "tools": a.get("tools", {}),
            "subagents": a.get("subagents", {}),
            "heartbeat": a.get("heartbeat", defaults.get("heartbeat", {})),
        },
        "identity": {
            "soul_preview": soul[:500],
            "identity_preview": identity[:500],
        },
    })

# Output everything the shell script needs
output = {
    "token": token,
    "agents": agents,
    "channels": list(config.get("channels", {}).keys()),
}
print(json.dumps(output))
PYEOF
)

# Check for Python errors
if echo "$AGENT_DATA" | python3 -c "import sys,json; d=json.load(sys.stdin); sys.exit(1) if 'error' in d else None" 2>/dev/null; then
  :
else
  ERROR=$(echo "$AGENT_DATA" | python3 -c "import sys,json; print(json.load(sys.stdin).get('error','Unknown error'))" 2>/dev/null || echo "Failed to parse OpenClaw config")
  echo "❌ $ERROR"
  exit 1
fi

# Extract token
GW_TOKEN=$(echo "$AGENT_DATA" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
AGENTS_JSON=$(echo "$AGENT_DATA" | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin)['agents']))")
AGENT_COUNT=$(echo "$AGENT_DATA" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['agents']))")

if [ -z "$GW_TOKEN" ]; then
  echo "⚠️  Could not extract auth token from config."
  prompt_user "Gateway auth token (from openclaw.json → gateway.auth.token): " "" GW_TOKEN
  if [ -z "$GW_TOKEN" ]; then
    echo "❌ Auth token is required."
    exit 1
  fi
fi

echo "✅ Found $AGENT_COUNT agents"

# Show skill/session summary
echo "$AGENT_DATA" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for a in data['agents']:
    skills = len(a.get('skills', []))
    sessions = a.get('sessions', {}).get('count', 0)
    tokens = a.get('sessions', {}).get('total_tokens', 0)
    print(f\"   {a['name']}: {skills} skills, {sessions} sessions, {tokens:,} tokens\")
"

# ---------------------------------------------------------------------------
# 4. Register gateway
# ---------------------------------------------------------------------------

echo ""
echo "Registering gateway..."

# Build registration payload (basic agent info for the register endpoint)
REG_AGENTS=$(echo "$AGENTS_JSON" | python3 -c "
import sys, json
agents = json.load(sys.stdin)
basic = [{'id': a['id'], 'name': a['name'], 'model': a['model'], 'workspace': a.get('workspace',''), 'status': a['status']} for a in agents]
print(json.dumps(basic))
")

TUNNEL_FIELD=""
if [ -n "${TUNNEL_URL:-}" ]; then
  TUNNEL_FIELD="\"tunnel_url\": \"$TUNNEL_URL\","
fi

RESPONSE=$(curl -sf -X POST "${PHARO_URL}/api/gateways/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$GATEWAY_NAME\",
    $TUNNEL_FIELD
    \"api_token\": \"$GW_TOKEN\",
    \"machine_host\": \"$MACHINE_HOST\",
    \"machine_os\": \"$MACHINE_OS\",
    \"openclaw_version\": \"$OC_VERSION\",
    \"agents\": $REG_AGENTS
  }" 2>&1) || true

GW_ID=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('gateway_id',''))" 2>/dev/null || echo "")

if [ -z "$GW_ID" ]; then
  echo "❌ Registration failed"
  echo "   $RESPONSE"
  exit 1
fi

echo "✅ Registered! Gateway ID: $GW_ID"

# ---------------------------------------------------------------------------
# 5. Save local config
# ---------------------------------------------------------------------------

mkdir -p ~/.pharo-agents

cat > ~/.pharo-agents/config.json << CFGEOF
{
  "gateway_id": "$GW_ID",
  "gateway_name": "$GATEWAY_NAME",
  "tunnel_url": "${TUNNEL_URL:-}",
  "pharo_url": "$PHARO_URL",
  "registered_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
CFGEOF

# ---------------------------------------------------------------------------
# 6. Send full heartbeat with all agent data (skills, sessions, identity)
# ---------------------------------------------------------------------------

echo "Sending full agent snapshot..."

REPORTED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
CHANNELS_JSON=$(echo "$AGENT_DATA" | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin).get('channels',[])))")

HEARTBEAT_PAYLOAD=$(python3 -c "
import json, sys
agents = json.loads(sys.argv[1])
print(json.dumps({
    'gateway_id': sys.argv[2],
    'name': sys.argv[3],
    'machine_host': sys.argv[4],
    'machine_os': sys.argv[5],
    'openclaw_version': sys.argv[6],
    'agents': agents,
    'channels': json.loads(sys.argv[7]),
    'reported_at': sys.argv[8],
}))
" "$AGENTS_JSON" "$GW_ID" "$GATEWAY_NAME" "$MACHINE_HOST" "$MACHINE_OS" "$OC_VERSION" "$CHANNELS_JSON" "$REPORTED_AT")

HB_RESPONSE=$(curl -sf -X POST "${PHARO_URL}/api/gateways/heartbeat" \
  -H "Content-Type: application/json" \
  -d "$HEARTBEAT_PAYLOAD" 2>&1) || true

HB_OK=$(echo "$HB_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('ok', False))" 2>/dev/null || echo "False")

if [ "$HB_OK" = "True" ]; then
  echo "✅ Full agent data sent (skills, sessions, bindings, identity)"
else
  echo "⚠️  Heartbeat failed — agent details may be incomplete."
  echo "   $HB_RESPONSE"
  echo "   The reporter cron will retry on the next run."
fi

# ---------------------------------------------------------------------------
# 7. Install reporter script
# ---------------------------------------------------------------------------

echo "Installing reporter..."

curl -sf "${PHARO_URL}/reporter.sh" -o ~/.pharo-agents/reporter.sh 2>/dev/null
if [ -f ~/.pharo-agents/reporter.sh ]; then
  chmod +x ~/.pharo-agents/reporter.sh
  echo "✅ Reporter installed at ~/.pharo-agents/reporter.sh"
else
  echo "⚠️  Could not download reporter.sh — creating from template..."
  # Fallback: create a minimal reporter that sends heartbeats
  cat > ~/.pharo-agents/reporter.sh << 'HBEOF'
#!/usr/bin/env bash
set -euo pipefail
CONFIG="$HOME/.pharo-agents/config.json"
[ ! -f "$CONFIG" ] && exit 0
GW_ID=$(python3 -c "import json; print(json.load(open('$CONFIG'))['gateway_id'])")
PHARO_URL=$(python3 -c "import json; print(json.load(open('$CONFIG'))['pharo_url'])")
curl -sf -X POST "${PHARO_URL}/api/gateways/heartbeat" \
  -H "Content-Type: application/json" \
  -d "{\"gateway_id\": \"$GW_ID\"}" >/dev/null 2>&1
HBEOF
  chmod +x ~/.pharo-agents/reporter.sh
fi

# ---------------------------------------------------------------------------
# 8. Install cron job
# ---------------------------------------------------------------------------

CRON_CMD="*/30 * * * * $HOME/.pharo-agents/reporter.sh >> $HOME/.pharo-agents/reporter.log 2>&1"

# Idempotent: remove any existing pharo-agents cron entry, then add the new one
if command -v crontab >/dev/null 2>&1; then
  ( crontab -l 2>/dev/null | grep -v 'pharo-agents/reporter' ; echo "$CRON_CMD" ) | crontab - 2>/dev/null
  if [ $? -eq 0 ]; then
    echo "✅ Cron job installed (runs every 30 minutes)"
  else
    echo "⚠️  Could not install cron job. Add manually:"
    echo "   $CRON_CMD"
  fi
else
  echo "⚠️  crontab not found. Add the heartbeat manually:"
  echo "   $CRON_CMD"
fi

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

echo ""
echo "================================"
echo "⚡ Setup complete!"
echo ""
echo "Gateway '$GATEWAY_NAME' is now connected to Pharo Agents."
[ -n "${TUNNEL_URL:-}" ] && echo "Tunnel:  $TUNNEL_URL"
echo "View it: ${PHARO_URL}"
echo ""
echo "  $AGENT_COUNT agents registered with full skill + session data."
echo "  Reporter runs every 30 minutes to keep data fresh."
echo ""
