from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from ropa_core import ask_ropa
from tools import sync_crm

app = FastAPI(title="Ivy.AI API")

# Habilitar CORS para el Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

class MoveCardRequest(BaseModel):
    company: str
    stage: str

@app.get("/")
def health():
    return {"status": "Ivy.AI Neural Core Online"}

@app.post("/api/chat")
def chat_endpoint(req: ChatRequest):
    response = ask_ropa(req.message)
    return {"response": response}

@app.post("/api/kanban/move")
def move_card_endpoint(req: MoveCardRequest):
    # 1. Registrar en CRM
    sync_crm("LOG_ACTIVITY", {"subject": f"Cambio de etapa: {req.stage}", "desc": f"{req.company} movida a {req.stage}"})
    
    # 2. Consultar a ROPA qué hacer
    ropa_instruction = ask_ropa(f"SISTEMA: La empresa {req.company} se movió a {req.stage}. ¿Cuál es el siguiente paso?")
    
    return {"status": "updated", "ropa_advice": ropa_instruction}

class CampaignRequest(BaseModel):
    company: str
    context: str
    package: str = "Full Cover"

class AnalyzeRequest(BaseModel):
    company: str
    stage: str
    package: str = "Full Cover"

@app.post("/api/campaign/generate")
def generate_campaign_endpoint(req: CampaignRequest):
    from ropa_core import generate_campaign_strategy
    strategy = generate_campaign_strategy(req.company, req.context, req.package)
    return {"response": strategy}

@app.post("/api/company/analyze")
def analyze_company_endpoint(req: AnalyzeRequest):
    from ropa_core import analyze_company_strategy
    analysis = analyze_company_strategy(req.company, req.stage, req.package)
    return {"response": analysis}
