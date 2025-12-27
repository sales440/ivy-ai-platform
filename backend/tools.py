from crm_bridge import Dynamics365Client

d365 = Dynamics365Client()

def sync_crm(action: str, data: dict):
    """
    Función que ROPA llama para interactuar con Dynamics 365.
    """
    try:
        if action == "LOG_ACTIVITY":
            d365.log_activity(data.get('id', '000'), data.get('subject'), data.get('desc'))
            return "✅ Actividad registrada en CRM correctamente."
        elif action == "READ_LEADS":
            return "📋 Leads encontrados: [Tesla Germany, Banco Santander, Acme Corp]"
        return "⚠️ Acción desconocida."
    except Exception as e:
        return f"❌ Error en CRM Bridge: {str(e)}"

def consult_market_intel(company_name: str):
    """
    Simulación de búsqueda (Grounding) si no hay conexión real.
    """
    return f"🔍 INTEL {company_name}: Acciones estables. CEO anunció expansión a Asia ayer."
