from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
from pathlib import Path
from google import genai

# Importa a inteligência do seu script original
from prospector import buscar_places, qualificar, gerar_mensagens

app = FastAPI(title="ProspectAI API")

# Permite comunicação com o Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = Path("leads.json")

class BuscaRequest(BaseModel):
    nicho: str
    cidade: str
    maximo: int = 10
    top: int = 3

@app.get("/api/leads")
def listar_leads():
    if not DATA_FILE.exists():
        return []
    return json.loads(DATA_FILE.read_text("utf-8"))

@app.post("/api/prospectar")
def iniciar_prospeccao(req: BuscaRequest):
    try:
        # 1. Carrega os leads atuais para não duplicar
        base = {l["id"]: l for l in json.loads(DATA_FILE.read_text("utf-8"))} if DATA_FILE.exists() else {}
        
        # 2. Faz a busca no Google Maps
        lugares = buscar_places(req.nicho, req.cidade, req.maximo)
        
        novos = []
        for p in lugares:
            if p["id"] in base:
                continue
            l = qualificar(p, False) # False para não usar pagespeed (mais rápido na web)
            l.update({"nicho": req.nicho, "cidade": req.cidade, "status": "novo"})
            novos.append(l)
            
        novos.sort(key=lambda x: x["score"], reverse=True)
        
        # 3. Liga a IA (Gemini)
        GEMINI_KEY = os.getenv("GEMINI_API_KEY", "").strip()
        cliente = genai.Client(api_key=GEMINI_KEY) if GEMINI_KEY else None
        
        for i, l in enumerate(novos[:req.top]):
            l["mensagens"] = gerar_mensagens(l, req.nicho, cliente)
            
        for l in novos[req.top:]:
            l["mensagens"] = {}
            
        # 4. Guarda tudo no JSON
        for l in novos:
            base[l["id"]] = l
            
        todos = sorted(base.values(), key=lambda x: x["score"], reverse=True)
        DATA_FILE.write_text(json.dumps(todos, ensure_ascii=False, indent=1), "utf-8")
        
        return {"status": "sucesso", "novos": len(novos), "total": len(todos)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/leads/{lead_id}/status")
def atualizar_status(lead_id: str, status: str):
    """Guarda a nova coluna quando arrasta um card"""
    if not DATA_FILE.exists():
        return {"erro": "Sem dados"}
    
    leads = json.loads(DATA_FILE.read_text("utf-8"))
    for l in leads:
        if l["id"] == lead_id:
            l["status"] = status
            break
            
    DATA_FILE.write_text(json.dumps(leads, ensure_ascii=False, indent=1), "utf-8")
    return {"status": "ok"}