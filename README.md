# TransEscolar

Sistema monorepo com backend em Node.js/Express/tRPC/Socket.IO e frontend em React/Vite para gestão e monitoramento de transporte escolar.

## Estrutura

- `packages/api` → backend
- `apps/web` → frontend
- `docker-compose.yml` → ambiente local opcional
- `Dockerfile.api` e `Dockerfile.web` → deploy containerizado

## Requisitos

- Node.js 20+
- npm 10+
- MySQL 8+ ou banco MySQL na Railway

## Instalação

Na raiz do projeto:

```bash
npm install
```

## Configuração de ambiente

### Backend

Copie o exemplo abaixo para `packages/api/.env`:

```bash
cp packages/api/.env.example packages/api/.env
```

Preencha principalmente a variável `DATABASE_URL`.

Formato:

```env
DATABASE_URL=mysql://usuario:senha@host:3306/banco
```

> Se usar Railway no computador local, use o host/porta públicos do TCP Proxy. Não use `mysql.railway.internal` fora da Railway.

### Frontend

Copie `apps/web/.env.example` para `apps/web/.env` e ajuste `VITE_API_URL` se necessário.

## Comandos

Na raiz:

```bash
npm install
npm run dev
```

Backend isolado:

```bash
npm run dev --workspace=packages/api
```

Frontend isolado:

```bash
npm run dev --workspace=apps/web
```

## Banco de dados

Com `packages/api/.env` preenchido:

Na raiz:

```bash
npm run db:push
```

Ou direto no backend:

```bash
cd packages/api
npx drizzle-kit push
```

## Windows

Foram incluídos scripts `.bat` para facilitar:

- `scripts/setup-api-env.bat`
- `scripts/db-push-api.bat`
- `scripts/dev-all.bat`

## GitHub

Antes de subir para o GitHub:

- não envie `.env`
- não envie `node_modules`
- não envie `.git` antigo

Este pacote já foi preparado sem essas pastas.
