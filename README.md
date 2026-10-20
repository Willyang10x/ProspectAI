<img width="1920" height="1080" alt="github-" src="https://github.com/user-attachments/assets/ba66be79-026c-4d54-b2c4-c458da9e68c5" />

## Executar localmente

O painel web e a API precisam rodar em terminais separados. No PowerShell, a partir da pasta do projeto:

```powershell
py -m pip install -r requirements.txt
py -m uvicorn api:app --reload
```

Em outro terminal, inicie o painel:

```powershell
cd web
npm.cmd install
npm.cmd run dev
```

Abra http://localhost:3000. A API fica disponível em http://127.0.0.1:8000. Para gerar leads, configure a chave `GOOGLE_API_KEY` no arquivo `.env` na raiz do projeto.
