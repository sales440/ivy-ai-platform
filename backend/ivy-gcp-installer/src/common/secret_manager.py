from google.cloud import secretmanager
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class SecretManagerGCP:
    def __init__(self, project_id: Optional[str] = None):
        self.project_id = project_id or os.environ.get("GCP_PROJECT")
        if not self.project_id:
            logger.warning("GCP_PROJECT environment variable not set. Secret Manager may fail if not running on GCP.")
        
        try:
            self.client = secretmanager.SecretManagerServiceClient()
        except Exception as e:
            logger.warning(f"Failed to initialize Secret Manager client: {e}. using mock/local mode if available.")
            self.client = None

    def get_secret(self, secret_id: str, version: str = "latest") -> Optional[str]:
        if not self.client or not self.project_id:
            # Fallback for local testing if env var exists
            return os.environ.get(secret_id.upper())

        name = f"projects/{self.project_id}/secrets/{secret_id}/versions/{version}"
        try:
            resp = self.client.access_secret_version(name=name)
            return resp.payload.data.decode("UTF-8")
        except Exception as e:
            logger.error(f"Error fetching secret {secret_id}: {e}")
            return None

def load_secret(secret_id: str) -> str:
    """Helper function to load a secret cleanly."""
    sm = SecretManagerGCP()
    secret = sm.get_secret(secret_id)
    if not secret:
        raise ValueError(f"Secret '{secret_id}' not found in Secret Manager or environment.")
    return secret
