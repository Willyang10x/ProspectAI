from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
from pathlib import Path

# Importar as funções que já construiu no prospector.py
# (Certifique-se de que tira o argparse e o main() do prospector.py ou importa apenas as funções puras)
from prospector import buscar_places, qualificar, gerar_mensagens

app = FastAPI(title="ProspectAI API")

# Configurar CORS para o Next.js conseguir comunicar com a API localmente
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
    usar_ia: bool = True

@app.get("/api/leads")
def listar_leads():
    """Retorna todos os leads salvos no banco de dados (JSON)."""
    if not DATA_FILE.exists():
        return []
    return json.loads(DATA_FILE.read_text("utf-8"))

@app.post("/api/prospectar")
def iniciar_prospeccao(req: BuscaRequest):
    """Rota para o Next.js acionar a busca de novos leads."""
    try:
        # 1. Busca
        lugares = buscar_places(req.nicho, req.cidade, req.maximo)
        
        # 2. Qualificação
        novos = [qualificar(p, False) for p in lugares]
        novos.sort(key=lambda x: x["score"], reverse=True)
        
        # Aqui integraria o cliente do Gemini para os top N
        # ...
        
        return {"status": "sucesso", "encontrados": len(novos), "leads": novos}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/leads/{lead_id}/status")
def atualizar_status(lead_id: str, status: str):
    """Rota para mover o lead no funil de vendas pelo frontend."""
    # Lógica para ler o JSON, atualizar o campo 'status' do lead específico e salvar
    pass