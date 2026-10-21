import os
import smtplib
import json
import requests
import re
from datetime import date
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
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

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Aviso: Credenciais do Supabase não encontradas no .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

class BuscaRequest(BaseModel):
    nicho: str
    cidade: str
    maximo: int = 10
    top: int = 3

class EmailRequest(BaseModel):
    para: str
    assunto: str
    corpo: str

def extrair_email_do_site(url):
    """Robô que entra no site e pesca o e-mail."""
    if not url or any(x in url.lower() for x in ['instagram.com', 'facebook.com', 'wa.me', 'linktr.ee']):
        return ""
    try:
        # Timeout de 5s para não atrasar a prospecção
        res = requests.get(url, timeout=5, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        # Busca padrões de e-mail no código HTML
        emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', res.text)
        # Filtra lixo (imagens que o regex confunde com e-mail)
        validos = [e for e in set(emails) if not e.endswith(('.png', '.jpg', '.jpeg', '.webp', '.gif'))]
        return validos[0].lower() if validos else ""
    except:
        return ""

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
        lugares = buscar_places(req.nicho, req.cidade, req.maximo)
        
        existentes_res = supabase.table("leads").select("id").execute()
        ids_existentes = {item["id"] for item in existentes_res.data}
        
        novos = []
        for p in lugares:
            if p["id"] in ids_existentes:
                continue
                
            l = qualificar(p, False)
            
            # Pesca o e-mail se houver um site válido
            email_encontrado = extrair_email_do_site(l.get("site"))
            
            l.update({
                "nicho": req.nicho, 
                "cidade": req.cidade, 
                "status": "novo",
                "data": str(date.today()),
                "email": email_encontrado
            })
            novos.append(l)
            
        novos.sort(key=lambda x: x["score"], reverse=True)
        
        GEMINI_KEY = os.getenv("GEMINI_API_KEY", "").strip()
        cliente = genai.Client(api_key=GEMINI_KEY) if GEMINI_KEY else None
        
        for i, l in enumerate(novos):
            if i < req.top:
                l["mensagens"] = gerar_mensagens(l, req.nicho, cliente)
            else:
                l["mensagens"] = {}
                
            msg_wpp = l.get("mensagens", {}).get("whatsapp", "")
            l["wa_link"] = wa_link(l, msg_wpp)
            
        if novos:
            supabase.table("leads").upsert(novos).execute()
            
        return {"status": "sucesso", "novos": len(novos)}
    except Exception as e:
        print("Erro interno da API:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/enviar-email")
def enviar_email(req: EmailRequest):
    remetente = os.getenv("EMAIL_REMETENTE")
    senha = os.getenv("SENHA_APP_EMAIL")
    if not remetente or not senha:
        raise HTTPException(status_code=500, detail="Credenciais de e-mail não configuradas no .env")
    try:
        msg = MIMEMultipart()
        msg['From'] = remetente
        msg['To'] = req.para
        msg['Subject'] = req.assunto
        msg.attach(MIMEText(req.corpo, 'plain', 'utf-8'))
        
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(remetente, senha)
        server.send_message(msg)
        server.quit()
        return {"status": "E-mail enviado com sucesso!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))