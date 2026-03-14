# 🚌 TransEscolar — Guia de Deploy Completo
## Do zero ao ar em ~20 minutos

---

## ✅ PRÉ-REQUISITOS

Antes de começar, tenha em mãos:
- [ ] Conta no **GitHub** com este repositório criado
- [ ] Conta no **Railway** (railway.app) — já tem ✅
- [ ] Git instalado no seu computador
- [ ] Node.js 20+ instalado (para testar localmente)

---

## PASSO 1 — Subir o código para o GitHub

```bash
# Na pasta do projeto:
cd transescolar

git init
git add .
git commit -m "feat: TransEscolar v1.0 - sistema completo"

# Crie um repositório PRIVADO no GitHub e depois:
git remote add origin https://github.com/SEU_USUARIO/transescolar.git
git branch -M main
git push -u origin main
```

---

## PASSO 2 — Criar o Banco de Dados MySQL no Railway

1. Acesse https://railway.app → **New Project**
2. Clique em **Deploy MySQL**
3. Aguarde provisionar (~30 segundos)
4. Clique no serviço MySQL → aba **Variables**
5. Copie o valor de **MYSQL_URL** (vai parecer com:
   `mysql://root:SENHA@containers-us-west-XXX.railway.app:PORT/railway`)

> **Guarde essa URL!** Você vai usá-la no próximo passo.

---

## PASSO 3 — Deploy da API (Backend)

### 3.1 Criar serviço no Railway

1. No mesmo projeto Railway, clique **New Service → GitHub Repo**
2. Selecione o repositório `transescolar`
3. Em **Root Directory**, coloque: `packages/api`
4. Railway vai detectar Node.js automaticamente

### 3.2 Configurar variáveis de ambiente da API

Na aba **Variables** do serviço API, adicione:

```
DATABASE_URL        = [cole a MYSQL_URL do passo 2]
JWT_SECRET          = [gere uma chave: openssl rand -base64 64]
JWT_EXPIRES_IN      = 7d
PORT                = 3000
WEB_URL             = https://[dominio-do-web].up.railway.app
NODE_ENV            = production
```

### 3.3 Configurar o build

Na aba **Settings** do serviço API:
- **Build Command:** `npm install && npm run build`
- **Start Command:** `node dist/index.js`
- **Health Check Path:** `/health`

### 3.4 Aguardar o deploy

Railway vai buildar e subir automaticamente.
Quando aparecer ✅ **Active**, clique em **Generate Domain** para ter uma URL pública.

> Anote a URL: `https://transescolar-api-xxxx.up.railway.app`

---

## PASSO 4 — Rodar as Migrations do Banco

Após a API estar no ar, você precisa criar as tabelas.

### Opção A: Via CLI do Railway (mais fácil)

```bash
# Instale o CLI do Railway
npm install -g @railway/cli

# Faça login
railway login

# Link ao projeto
cd packages/api
railway link

# Execute as migrations
railway run npm run db:push
```

### Opção B: Localmente com a URL de produção

```bash
cd packages/api

# Crie um arquivo .env com a DATABASE_URL de produção:
echo 'DATABASE_URL="mysql://root:SENHA@containers...railway.app:PORT/railway"' > .env

npm install
npm run db:push
```

Você verá as tabelas sendo criadas:
```
✓ municipalities  ✓ schools   ✓ users     ✓ vehicles
✓ drivers         ✓ students  ✓ guardians ✓ routes
✓ stops           ✓ trips     ✓ notifications  ✓ location_history
```

---

## PASSO 5 — Deploy do Dashboard Web

### 5.1 Criar segundo serviço no Railway

1. No mesmo projeto Railway, **New Service → GitHub Repo**
2. Mesmo repositório `transescolar`
3. Em **Root Directory**, coloque: `apps/web`

### 5.2 Configurar variáveis do web

Na aba **Variables**:

```
VITE_API_URL = https://transescolar-api-xxxx.up.railway.app
```

### 5.3 Configurar o build do web

Na aba **Settings**:
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npx serve dist -p $PORT`

### 5.4 Aguardar e gerar domínio

Quando aparecer ✅ **Active**, clique em **Generate Domain**.

> URL final do dashboard: `https://transescolar-web-xxxx.up.railway.app`

---

## PASSO 6 — Atualizar a variável WEB_URL na API

Volte ao serviço da API → **Variables** → atualize:
```
WEB_URL = https://transescolar-web-xxxx.up.railway.app
```

Railway vai redeployar automaticamente.

---

## PASSO 7 — Testar o sistema

### 7.1 Verificar a API
```
GET https://transescolar-api-xxxx.up.railway.app/health
→ {"status":"ok","service":"TransEscolar API",...}
```

### 7.2 Acessar o Dashboard
Abra: `https://transescolar-web-xxxx.up.railway.app`

Você verá a tela de login. Clique em **"Cadastrar prefeitura"** para criar o primeiro acesso.

### 7.3 Criar a primeira prefeitura
Preencha:
- Nome: Prefeitura Municipal de [sua cidade]
- Estado / Cidade
- Nome do administrador
- E-mail e senha

Pronto! Você já pode:
- Cadastrar escolas
- Cadastrar motoristas (eles recebem login para o app mobile)
- Cadastrar veículos
- Criar rotas e paradas
- Monitorar viagens em tempo real

---

## PASSO 8 — App Mobile (Expo)

O dashboard web está no ar. Para o app dos motoristas e responsáveis:

```bash
# Instale o Expo CLI
npm install -g expo-cli eas-cli

# Navegue para o app mobile (já existente no seu projeto original)
cd apps/mobile   # ou o caminho do seu app React Native

# Configure a URL da API no arquivo de configuração
# Adicione em app.config.js ou .env:
EXPO_PUBLIC_API_URL=https://transescolar-api-xxxx.up.railway.app
```

Para **testar sem publicar na loja**:
```bash
npx expo start
# Escaneie o QR code com o app Expo Go no celular
```

Para **publicar na Play Store / App Store**:
```bash
eas build --platform android --profile production
eas submit --platform android
```

---

## 📁 ESTRUTURA FINAL DO PROJETO

```
transescolar/
├── packages/
│   └── api/                  ← Backend (Railway serviço 1)
│       ├── src/
│       │   ├── index.ts      ← Servidor Express + Socket.io
│       │   ├── routers.ts    ← Todos os endpoints tRPC
│       │   ├── db/
│       │   │   ├── index.ts  ← Conexão MySQL
│       │   │   └── schema.ts ← Todas as tabelas
│       │   └── middleware/
│       │       └── context.ts ← Autenticação JWT
│       ├── .env.example      ← Variáveis necessárias
│       └── drizzle.config.ts ← Config do ORM
│
├── apps/
│   └── web/                  ← Dashboard (Railway serviço 2)
│       └── src/
│           ├── pages/
│           │   ├── DashboardPage.tsx   ← Stats + gráficos
│           │   ├── MonitorPage.tsx     ← Tempo real GPS
│           │   ├── RoutesPage.tsx      ← CRUD de rotas
│           │   ├── StudentsPage.tsx    ← CRUD de alunos
│           │   ├── DriversPage.tsx     ← CRUD de motoristas
│           │   ├── VehiclesPage.tsx    ← CRUD de veículos
│           │   ├── SchoolsPage.tsx     ← CRUD de escolas
│           │   ├── ReportsPage.tsx     ← Histórico de viagens
│           │   ├── LoginPage.tsx       ← Login
│           │   └── RegisterPage.tsx    ← Cadastro de prefeitura
│           └── lib/
│               ├── trpc.ts   ← Cliente tRPC
│               ├── auth.tsx  ← Context de autenticação
│               └── socket.tsx ← WebSocket tempo real
│
├── docker-compose.yml        ← Para rodar local com Docker
├── Dockerfile.api            ← Build da API
├── Dockerfile.web            ← Build do Web
└── DEPLOY.md                 ← Este guia
```

---

## 🔧 RODAR LOCALMENTE (sem Railway)

```bash
# Opção 1: Docker (mais fácil)
docker compose up --build

# Aguarde os serviços subirem (~2 min na primeira vez)
# API: http://localhost:3000
# Web: http://localhost:80

# Opção 2: Manual
# Terminal 1 — banco:
docker run -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=transescolar mysql:8

# Terminal 2 — API:
cd packages/api
cp .env.example .env        # edite com DATABASE_URL local
npm install
npm run db:push             # cria as tabelas
npm run dev                 # inicia em modo watch

# Terminal 3 — Web:
cd apps/web
cp .env.example .env        # edite com VITE_API_URL=http://localhost:3000
npm install
npm run dev                 # inicia Vite em :5173
```

---

## 💰 CUSTO ESTIMADO NO RAILWAY

| Serviço       | Plano          | Custo/mês    |
|---------------|----------------|--------------|
| MySQL         | Starter ($5)   | ~$5          |
| API (Node)    | Starter ($5)   | ~$5–10       |
| Web (Static)  | Starter ($5)   | ~$1–3        |
| **Total**     |                | **~$15–20**  |

> O Railway tem **$5 de crédito grátis/mês** no plano Hobby.

---

## ❓ PROBLEMAS COMUNS

### "Cannot connect to database"
→ Verifique se `DATABASE_URL` está correta e se o MySQL está rodando no Railway.

### "CORS error" no browser
→ Verifique se `WEB_URL` na API inclui o domínio exato do dashboard (sem barra no final).

### "Module not found" no build
→ Execute `npm install` na raiz e na pasta do serviço antes de buildar.

### App mobile não conecta
→ Certifique-se de que `EXPO_PUBLIC_API_URL` aponta para a URL HTTPS da API, não localhost.

---

## 📞 RESUMO RÁPIDO (checklist)

- [ ] Código no GitHub
- [ ] MySQL criado no Railway → copiei a DATABASE_URL
- [ ] API deployada → variáveis configuradas → db:push executado
- [ ] Web deployada → VITE_API_URL configurada
- [ ] WEB_URL atualizada na API
- [ ] Acessei o dashboard e criei a primeira prefeitura
- [ ] Testei login ✅

**Sistema no ar! 🎉**
