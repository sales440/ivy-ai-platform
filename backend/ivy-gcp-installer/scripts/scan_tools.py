import os
import re
import yaml
from pathlib import Path

# Configuration
TS_CAPABILITIES_DIR = Path("../../../server/meta-agent/capabilities")
OUTPUT_YAML = Path("../src/config/env_prod.yaml")

# Map filenames to categories
CATEGORY_MAP = {
    "database-tools.ts": "base_datos",
    "agent-trainer.ts": "agentes",
    "agent-seeder.ts": "agentes",
    "meta-agent-tools.ts": "meta_agent_core",
    "web-search.ts": "investigacion",
    "deep-research.ts": "investigacion",
    "code-tools.ts": "desarrollo",
    "typescript-fixer.ts": "desarrollo",
    "platform-healer.ts": "mantenimiento",
    "platform-maintenance.ts": "mantenimiento",
    "monitoring-tools.ts": "observabilidad",
}

DEFAULT_CATEGORY = "varios"

def scan_files():
    tools_found = {}
    
    # Ensure directory exists relative to this script execution
    # We assume script is run from backend/ivy-gcp-installer
    base_dir = Path("..") / "server" / "meta-agent" / "capabilities"
    
    # Try absolute path based on user environment if relative fails
    if not base_dir.exists():
         # Fallback to absolute path derived from known structure
         # c:/Users/servi/OneDrive - fagor-automation.com/Documents/CRP/Ivy.AI plaatform/Project backup/ivy-ai-platform-complete_12072025/ivy-ai-platform
         base_dir = Path("../../server/meta-agent/capabilities")

    print(f"Scanning directory: {base_dir.resolve()}")

    if not base_dir.exists():
        print(f"Error: Capabilities directory not found at {base_dir}")
        return

    for ts_file in base_dir.glob("*.ts"):
        category = CATEGORY_MAP.get(ts_file.name, DEFAULT_CATEGORY)
        if category not in tools_found:
            tools_found[category] = []
        
        with open(ts_file, "r", encoding="utf-8") as f:
            content = f.read()
            
            # Pattern 1: export async function nameTool(...)
            matches = re.finditer(r"export\s+async\s+function\s+(\w+)(Tool)?\(", content)
            for m in matches:
                full_name = m.group(1)
                tool_id = full_name.replace("Tool", "")
                
                # Check duplication
                if not any(t["id"] == tool_id for t in tools_found[category]):
                    tools_found[category].append({
                        "id": tool_id,
                        "version": "1.0.0",
                        "config": {
                            "source_file": ts_file.name,
                            "type": "function_call"
                        }
                    })
    
    return tools_found

def update_yaml(tools):
    if not OUTPUT_YAML.exists():
        print(f"Config file not found: {OUTPUT_YAML}")
        return

    with open(OUTPUT_YAML, "r") as f:
        config = yaml.safe_load(f) or {}

    if "categories" not in config:
        config["categories"] = {}

    total_count = 0
    for cat, new_tools in tools.items():
        if cat not in config["categories"]:
            config["categories"][cat] = {"description": f"Auto-discovered {cat}", "tools": []}
        
        # Merge or Replace? Let's append new ones that don't exist
        existing_ids = {t["id"] for t in config["categories"][cat]["tools"]}
        
        for tool in new_tools:
            if tool["id"] not in existing_ids:
                config["categories"][cat]["tools"].append(tool)
                total_count += 1
    
    with open(OUTPUT_YAML, "w") as f:
        yaml.dump(config, f, sort_keys=False, default_flow_style=False)
    
    print(f"Successfully registered {total_count} new tools into {OUTPUT_YAML}")

if __name__ == "__main__":
    found = scan_files()
    if found:
        print(f"Found {sum(len(l) for l in found.values())} tools across {len(found)} categories.")
        update_yaml(found)
