import argparse
import sys
import yaml
import json
import os
from pathlib import Path
from src.common.logger import get_logger
from src.common.secret_manager import load_secret
from src.common.telemetry import setup_tracing

logger = get_logger(__name__)

def load_config(path: str) -> dict:
    try:
        with open(path, "r") as f:
            return yaml.safe_load(f)
    except Exception as e:
        logger.error(f"Failed to load config from {path}: {e}")
        sys.exit(1)

from src.tools.database import DatabaseInstaller
from src.tools.agents import AgentInstaller

def install_tool(tool_id: str, tool_def: dict, category: str, dry_run: bool = False) -> dict:
    """
    Installs a single tool using the appropriate installer strategy.
    """
    status = "skipped" if dry_run else "active"
    logger.info(f"[{status.upper()}] Processing tool: {tool_id} (Category: {category})")
    
    if dry_run:
        return {
            "tool_id": tool_id,
            "status": status,
            "version": tool_def.get("version", "latest")
        }

    installer = None
    if category == "base_datos":
        installer = DatabaseInstaller(tool_def.get("config", {}))
    elif category == "agentes":
        installer = AgentInstaller(tool_def.get("config", {}))
    
    if installer:
        try:
            installer.run(tool_id, tool_def.get("config", {}))
            status = "installed"
        except Exception as e:
            status = "failed"
            logger.error(f"Installation failed: {e}")
            raise e
    else:
        logger.warning(f"No specific installer found for category '{category}'. specific logic skipped.")
        status = "no_installer"

    return {
        "tool_id": tool_id,
        "status": status,
        "version": tool_def.get("version", "latest"),
        "config_hash": "mock_hash_123"
    }

def main():
    parser = argparse.ArgumentParser(description="Ivy.AI GCP Meta-Agent Installer")
    parser.add_argument("--env", default="prod", help="Environment (dev/prod)")
    parser.add_argument("--dry-run", action="store_true", help="Simulate installation without changes")
    args = parser.parse_args()

    setup_tracing(f"ivy-installer-{args.env}")
    logger.info(f"Starting Ivy.AI Installer [ENV: {args.env}]")

    config_path = Path(f"src/config/env_{args.env}.yaml")
    if not config_path.exists():
        logger.error(f"Config file not found: {config_path}")
        sys.exit(1)

    config = load_config(str(config_path))
    results = []
    
    # Iterate through tool categories
    categories = config.get("categories", {})
    total_tools = sum(len(cat.get("tools", [])) for cat in categories.values())
    logger.info(f"Found {total_tools} tools to process across {len(categories)} categories")

    for category_name, data in categories.items():
        logger.info(f"--- Category: {category_name} ---")
        for tool in data.get("tools", []):
            try:
                res = install_tool(tool["id"], tool, category=category_name, dry_run=args.dry_run)
                results.append(res)
            except Exception as e:
                logger.error(f"Failed to install {tool['id']}: {e}")
                results.append({"tool_id": tool['id'], "status": "failed", "error": str(e)})

    # Generate Report
    output_dir = Path("output")
    output_dir.mkdir(exist_ok=True)
    report_path = output_dir / "install_report.json"
    
    with open(report_path, "w") as f:
        json.dump({
            "env": args.env,
            "dry_run": args.dry_run,
            "total_tools": total_tools,
            "results": results
        }, f, indent=2)
    
    logger.info(f"Installation complete. Report saved to {report_path}")

if __name__ == "__main__":
    main()
