#!/usr/bin/env bash
#
# Pharo Agents — Gateway Reporter
# Runs on the gateway machine. Reads local config, workspaces, sessions
# and sends a complete snapshot to the Pharo Agents platform.
#
# Usage: ~/.pharo-agents/reporter.sh
# Schedule: */30 * * * * ~/.pharo-agents/reporter.sh
#
set -euo pipefail

OPENCLAW_CONFIG="${HOME}/.openclaw/openclaw.json"
OPENCLAW_DIR="${HOME}/.openclaw"

# Load local pharo config
if [ ! -f ~/.pharo-agents/config.json ]; then
  echo "Not registered. Run the setup script first."
  exit 1
fi

export GW_ID=$(python3 -c "import json; print(json.load(open('$HOME/.pharo-agents/config.json'))['gateway_id'])")
export PHARO_URL=$(python3 -c "import json; print(json.load(open('$HOME/.pharo-agents/config.json')).get('pharo_url', 'https://pharo-agents.vercel.app'))")

# Collect everything via Python
python3 << 'PYEOF'
import json, os, re, sys, urllib.request, glob
from datetime import datetime, timezone

HOME = os.path.expanduser("~")
OPENCLAW_DIR = os.path.join(HOME, ".openclaw")
CONFIG_FILE = os.path.join(OPENCLAW_DIR, "openclaw.json")
PHARO_URL = os.environ.get("PHARO_URL", "https://pharo-agents.vercel.app")
GW_ID = os.environ.get("GW_ID", "GATEWAY_ID")

def read_config():
    """Parse openclaw.json — tries valid JSON first, falls back to JSON5 cleanup."""
    with open(CONFIG_FILE) as f:
        raw = f.read()
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
    except:
        return ""

def scan_skills(workspace):
    """Find all SKILL.md files in the workspace skills directory."""
    skills = []
    skills_dir = os.path.join(workspace, "skills")
    if not os.path.exists(skills_dir):
        return skills
    for skill_dir in os.listdir(skills_dir):
        skill_file = os.path.join(skills_dir, skill_dir, "SKILL.md")
        if os.path.isfile(skill_file):
            content = read_file_safe(skill_file)
            # Extract description from first non-empty, non-heading line
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
        return {"count": 0, "total_tokens": 0, "models": []}
    
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
                    except:
                        continue
        except:
            continue
    
    return {
        "count": session_count,
        "total_tokens": total_tokens,
        "total_cost": round(total_cost, 4),
        "models": list(models - {""}),
    }

# Main
try:
    config = read_config()
except Exception as e:
    print(f"Failed to read config: {e}", file=sys.stderr)
    sys.exit(1)

agents_config = config.get("agents", {})
defaults = agents_config.get("defaults", {})
primary_model = defaults.get("model", {}).get("primary", "unknown")
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

# Build agent data
agents = []
for a in agent_list:
    agent_id = a.get("id", "")
    if not agent_id:
        continue
    
    workspace = a.get("workspace", os.path.join(OPENCLAW_DIR, "workspace"))
    agent_dir = a.get("agentDir", os.path.join(OPENCLAW_DIR, "agents", agent_id, "agent"))
    model_val = a.get("model", primary_model)
    model = model_val.get("primary", primary_model) if isinstance(model_val, dict) else model_val
    
    # Read identity files
    soul = read_file_safe(os.path.join(workspace, "SOUL.md"))
    identity = read_file_safe(os.path.join(workspace, "IDENTITY.md"))
    agents_md = read_file_safe(os.path.join(workspace, "AGENTS.md"))
    
    # Extract purpose from SOUL.md
    purpose = ""
    for line in soul.split("\n"):
        line = line.strip()
        if line and not line.startswith("#") and not line.startswith("---") and len(line) > 20:
            purpose = line[:300]
            break
    
    # Get skills
    skills = scan_skills(workspace)
    
    # Get session stats
    sessions = scan_sessions(agent_id)
    
    # Get bindings for this agent
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

# Build payload
payload = {
    "gateway_id": GW_ID,
    "name": os.uname()[1],
    "machine_host": os.uname()[1],
    "machine_os": f"{os.uname()[0]} {os.uname()[2]} {os.uname()[4]}",
    "openclaw_version": config.get("meta", {}).get("lastTouchedVersion", "unknown"),
    "agents": agents,
    "channels": list(config.get("channels", {}).keys()),
    "reported_at": datetime.now(timezone.utc).isoformat(),
}

# Send to platform
data = json.dumps(payload).encode()
req = urllib.request.Request(
    f"{PHARO_URL}/api/gateways/heartbeat",
    data=data, method="POST",
    headers={"Content-Type": "application/json"},
)
try:
    resp = urllib.request.urlopen(req, timeout=15)
    print(f"Reported: {len(agents)} agents, {sum(a['sessions']['count'] for a in agents)} sessions")
except Exception as e:
    print(f"Report failed: {e}", file=sys.stderr)
    sys.exit(1)
PYEOF
