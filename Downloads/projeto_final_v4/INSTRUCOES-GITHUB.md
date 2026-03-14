# 📋 Instruções para subir no GitHub

## O que fazer com este ZIP

### 1. Extraia o ZIP em uma pasta

### 2. Suba TODOS os arquivos para o GitHub
- Acesse github.com/alianzcontabilidade-cyber/Transporte_Escolar
- Delete todos os arquivos antigos
- Faça upload de todos os arquivos desta pasta

### 3. Configure a API no Railway (já feito ✅)
Serviço: Transporte_Escolar
- Root Directory: packages/api
- Build: npm install && npm run build  
- Start: node dist/index.js
- Variáveis já configuradas ✅

### 4. Crie as tabelas — IMPORTANTE
No Railway → Transporte_Escolar → Settings → Deploy:
- Pre-deploy Command: npm run db:push
- Clique Save → Deployments → Redeploy
- Após as tabelas criadas, APAGUE o Pre-deploy Command

### 5. Crie o serviço Web no Railway
- New Service → GitHub Repo → Transporte_Escolar
- Root Directory: apps/web
- Build: npm install && npm run build
- Start: npx serve dist -p $PORT
- Variável: VITE_API_URL = https://transporteescolar-production.up.railway.app
- Generate Domain → acesse o sistema!

