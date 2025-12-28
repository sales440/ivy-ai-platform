# Ivy.AI GCP Meta-Agent Installer 🚀

This module is responsible for orchestrating the deployment of the Ivy.AI Meta-Agent and its ~129 capabilities to Google Cloud Platform.

It automates the provisioning of:
1.  **Infrastructure**: Cloud SQL, Vertex AI Agents, Secret Manager.
2.  **Tools**: Auto-discovery and registration of all TypeScript capabilities from `server/meta-agent/capabilities`.
3.  **Observability**: Integrated setup with Cloud Logging and OpenTelemetry.

## 📂 Project Structure

```
ivy-gcp-installer/
├── src/
│   ├── main.py              # Orchestrator entry point
│   ├── config/              # Environment configurations (env_prod.yaml)
│   ├── tools/               # Tool installer logic (Database, Agents, etc.)
│   └── common/              # Shared utilities (Secrets, Logger, Telemetry)
├── infra/
│   └── cloudbuild.yaml      # CI/CD Pipeline definition
├── scripts/
│   └── scan_tools.py        # 🤖 Auto-discovery script for tools
└── requirements.txt         # Python dependencies
```

## 🛠️ Usage

### 1. Auto-Discover Tools
Before deploying, ensure the `env_prod.yaml` registry is up-to-date with the latest TypeScript code.

```bash
# Run from backend/ivy-gcp-installer
python scripts/scan_tools.py
```
This scans `../../server/meta-agent/capabilities` and updates `src/config/env_prod.yaml`.

### 2. Deploy to GCP
The deployment is handled via Google Cloud Build.

**Prerequisites:**
- Google Cloud Project with Billing enabled.
- Artifact Registry repository created.
- Secrets (`ivy_api_key`, `db_password`) created in Secret Manager.

**Command:**
```bash
gcloud builds submit --config infra/cloudbuild.yaml .
```

### 3. Verification
Check the Cloud Build logs to verify tool installation status:

```bash
# View logs of the last build
gcloud builds log [BUILD_ID]
```

## 🧩 Adding New Tool Categories

To add support for a new category of tools (e.g., "Blockchain"):

1.  Create `src/tools/blockchain.py` inheriting from `BaseToolInstaller`.
2.  Update `src/main.py` to route the `blockchain` category to your new class.
3.  Add the TypeScript filename mapping in `scripts/scan_tools.py`.

## 🛡️ Security
- All secrets are fetched from Google Secret Manager at runtime.
- Least privilege service accounts should be used for the Cloud Build trigger.
