import os
import requests
import msal

class Dynamics365Client:
    def __init__(self):
        self.resource_url = os.getenv("MS_ORG_URL")
        self.authority = f"https://login.microsoftonline.com/{os.getenv('MS_TENANT_ID')}"
        self.client_id = os.getenv("MS_CLIENT_ID")
        self.client_secret = os.getenv("MS_CLIENT_SECRET")
        self.token = None

    def authenticate(self):
        # Simulación de autenticación para que el contenedor arranque sin credenciales reales
        if not self.client_secret:
            print("⚠️ [DYNAMICS] Modo Simulación (Faltan credenciales)")
            self.token = "simulated_token"
            return

        app = msal.ConfidentialClientApplication(
            self.client_id, authority=self.authority, client_credential=self.client_secret
        )
        result = app.acquire_token_for_client(scopes=[f"{self.resource_url}/.default"])
        if "access_token" in result:
            self.token = result['access_token']
        else:
            raise Exception(f"Dynamics Auth Failed: {result.get('error_description')}")

    def get_headers(self):
        if not self.token: self.authenticate()
        return {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}

    def log_activity(self, entity_id, subject, description):
        """Registra una tarea en Dynamics"""
        if self.token == "simulated_token":
            print(f"📝 [DYNAMICS MOCK] Logged: {subject}")
            return
            
        endpoint = f"{self.resource_url}/api/data/v9.2/tasks"
        data = {
            "subject": subject,
            "description": description,
            "regardingobjectid_lead_task@odata.bind": f"/leads({entity_id})"
        }
        requests.post(endpoint, headers=self.get_headers(), json=data)
