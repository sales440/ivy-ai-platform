import vertexai
from vertexai.generative_models import GenerativeModel, Tool
from tools import sync_crm, consult_market_intel
import os

# Configuración Inicial
# Note: Ensure GCP_PROJECT_ID and GCP_LOCATION are set in env or passed here
project_id = os.getenv("GCP_PROJECT_ID", "tu-proyecto-id")
location = os.getenv("GCP_LOCATION", "us-central1")

try:
    vertexai.init(project=project_id, location=location)
except Exception as e:
    print(f"⚠️ Vertex AI Init Failed (Simulating): {e}")

# Prompt del Sistema (Versión Compacta)
ROPA_SYSTEM_PROMPT = """
ERES ROPA, el Meta-Agente de Ivy.AI.
OBJETIVO: Gestionar fuerza de ventas autónoma.
PERSONALIDAD: Agresiva, Estratégica, Cyberpunk.

TUS HERRAMIENTAS:
1. `sync_crm(action, data)`: Para registrar todo en Dynamics 365.
2. `consult_market_intel(company)`: Para buscar noticias antes de vender.

REGLAS:
- Si el mercado cae, sé empático. Si sube, sé agresivo.
- Reporta todo al CRM.
- Habla en Español técnico.
"""

# Definición de herramientas para Gemini
tools = [sync_crm, consult_market_intel]

# Inicializar modelo (usando Gemini Pro)
# Usamos un bloque try/except para permitir que la app arranque sin credenciales de GCP reales
try:
    model = GenerativeModel(
        "gemini-1.5-pro-preview-0409",
        system_instruction=[ROPA_SYSTEM_PROMPT],
        tools=tools
    )
    chat_session = model.start_chat()
except Exception:
    model = None
    chat_session = None

def ask_ropa(user_input: str):
    """Envía mensaje al núcleo y devuelve respuesta"""
    if not chat_session:
        # Fallback simulation if GCP not connected
        return f"[SIMULACIÓN ROPA] Recibido: {user_input}. (Conecta GCP para inteligencia real)"
        
    try:
        response = chat_session.send_message(user_input)
        # Aquí Vertex AI manejaría las llamadas a funciones automáticamente
        # y devolvería el texto final.
        return response.text
    except Exception as e:
        return f"⚠️ ROPA OFFLINE: {str(e)} (Verifica tus credenciales de GCP)"

def generate_campaign_strategy(company: str, context: str, package: str = "Full Cover"):
    """Genera una estrategia de campaña detallada basada en el paquete de servicios"""
    system_prompt = f"""
    ERES UN ESTRATEGA DE MARKETING DE ELITE DE IVY.AI.
    OBJETIVO: Crear un plan de ataque para la cuenta {company}.
    CONTEXTO PROSPECTO: {context}
    PAQUETE CONTRATADO: {package}
    
    TUS AGENTES DISPONIBLES SEGÚN PAQUETE:
    - Si es "Full Cover": Tienes a TODOS (Ventas, Soporte, Data, ROPA).
    - Si es "Sales Hunter": Solo tienes Agentes de Ventas Outbound.
    - Si es "Customer Care": Solo tienes Agentes de Soporte/Retención.
    
    FORMATO DE RESPUESTA:
    1. ESTRATEGIA ({package}): (Enfoque específico según el paquete)
    2. AGENTES ACTIVOS: (Lista de quiénes trabajarán)
    3. ACCIONES TACTICAS: (Pasos concretos)
    """
    
    if not chat_session:
        # SIMULACIÓN AVANZADA SEGÚN PAQUETE
        agentes = "🤖 ROPA (Orquestador), 🔫 Sales Agent, 🛡️ Support Agent"
        enfoque = "Dominación Total 360°"
        
        if package == "Sales Hunter":
            agentes = "🔫 Sales Agent (Hunter)"
            enfoque = "Ataque agresivo de Outbound (Cold Email + LinkedIn)"
        elif package == "Customer Care":
            agentes = "🛡️ Support Agent (Keeper)"
            enfoque = "Retención y Upselling mediante Soporte 24/7"

        return f"""[SIMULACIÓN ESTRATEGIA - {package.upper()}]
**ENFOQUE**: {enfoque}.

**EQUIPO DE AGENTES ASIGNADO**:
{agentes}

**PLAN DE EJECUCIÓN**:
1. **Fase 1**: Despliegue de {agentes.split(',')[0]}.
2. **Fase 2**: Integración con {context}.
3. **Objetivo**: Maximizar el valor del paquete {package}."""

    try:
        response = chat_session.send_message(system_prompt)
        return response.text
    except Exception as e:
        return f"⚠️ ERROR ESTRATEGIA: {str(e)}"

def analyze_company_strategy(company: str, stage: str, package: str = "Full Cover"):
    """Analiza un cliente y sugiere siguientes pasos considerando el paquete"""
    prompt = f"Analiza la empresa {company} (Etapa: {stage}) considerando que contrató el paquete '{package}'. ¿Cómo maximizamos este paquete?"
    
    if not chat_session:
        # SIMULACIÓN DE ANÁLISIS
        return f"""[SIMULACIÓN INTEL]
Analizando {company} para paquete **{package}**...
- **Viabilidad**: Alta. El paquete {package} encaja con su {stage}.
- **Sugerencia**: Activar inmediatamente los agentes de {package.split(' ')[0]} para demostrar valor rápido.
- **Próximo Paso**: Configurar los webhooks para este tipo de servicio."""

    try:
        response = chat_session.send_message(prompt)
        return response.text
    except Exception as e:
        return f"⚠️ ERROR ANALISIS: {str(e)}"
