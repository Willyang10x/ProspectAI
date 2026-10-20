import os
import json
from datetime import date
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from google import genai

# Importa a inteligência do seu script original
from prospector import buscar_places, qualificar, gerar_mensagens, wa_link

app = FastAPI(title="ProspectAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Conectar ao Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Credenciais do Supabase não encontradas no .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class BuscaRequest(BaseModel):
    nicho: str
    cidade: str
    maximo: int = 10
    top: int = 3

@app.get("/api/leads")
def listar_leads():
    try:
        response = supabase.table("leads").select("*").order("score", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/leads/{lead_id}/status")
def atualizar_status(lead_id: str, status: str):
    try:
        supabase.table("leads").update({"status": status}).eq("id", lead_id).execute()
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/prospectar")
def iniciar_prospeccao(req: BuscaRequest):
    try:
        # 1. Busca no Maps
        lugares = buscar_places(req.nicho, req.cidade, req.maximo)
        
        # 2. Puxa apenas os IDs que já existem no Supabase para não duplicar
        existentes_res = supabase.table("leads").select("id").execute()
        ids_existentes = {item["id"] for item in existentes_res.data}
        
        novos = []
        for p in lugares:
            if p["id"] in ids_existentes:
                continue
            l = qualificar(p, False)
            l.update({
                "nicho": req.nicho, 
                "cidade": req.cidade, 
                "status": "novo",
                "data": str(date.today())
            })
            novos.append(l)
            
        novos.sort(key=lambda x: x["score"], reverse=True)
        
        # 3. Chama o Gemini para gerar as mensagens
        GEMINI_KEY = os.getenv("GEMINI_API_KEY", "").strip()
        cliente = genai.Client(api_key=GEMINI_KEY) if GEMINI_KEY else None
        
        for i, l in enumerate(novos):
            if i < req.top:
                l["mensagens"] = gerar_mensagens(l, req.nicho, cliente)
            else:
                l["mensagens"] = {}
                
            # Gera o link do WhatsApp para gravar no Supabase
            msg_wpp = l.get("mensagens", {}).get("whatsapp", "")
            l["wa_link"] = wa_link(l, msg_wpp)
            
        # 4. Grava os novos leads no Supabase
        if novos:
            supabase.table("leads").upsert(novos).execute()
            
        return {"status": "sucesso", "novos": len(novos)}
    except Exception as e:
        print("Erro interno da API:", str(e))
        raise HTTPException(status_code=500, detail=str(e))