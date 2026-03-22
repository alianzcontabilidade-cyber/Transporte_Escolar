# NetEscol - Sistema de Gestao Escolar Municipal
## Versao 3.3.0

## Arquitetura

**Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
**Backend:** Express + tRPC + Drizzle ORM + MySQL + Socket.IO
**Deploy:** Railway (nixpacks)
**URL:** transporteescolar-production.up.railway.app

## Numeros do Sistema

- **85 paginas** (lazy loaded)
- **50 routers** tRPC
- **53 tabelas** MySQL
- **~181 endpoints** (queries + mutations)

## Estrutura do Projeto

```
apps/web/          Frontend React
  src/pages/       85 paginas (lazy loaded)
  src/components/  15 componentes reutilizaveis
  src/lib/         17 bibliotecas utilitarias
  public/          Assets estaticos (sw.js, manifest.json, gps-worker.js)

packages/api/      Backend Node.js
  src/routers.ts   Todos os endpoints tRPC (50 routers)
  src/db/schema.ts Schema do banco (53 tabelas, Drizzle ORM)
  src/index.ts     Express + Socket.IO server + PDF Puppeteer
  src/services/    pdfService.ts (Puppeteer + QR Code)
  public/          Frontend buildado (copiado de apps/web/dist)
```

## Deploy Workflow

```bash
cd apps/web && npx vite build
rm -rf packages/api/public && cp -r apps/web/dist packages/api/public
git add . && git commit -m "msg" && git push origin main
# Railway faz auto-deploy via GitHub
```

## Modulos do Sistema

1. **Gestao Escolar** - Alunos, Escolas, Matriculas, Turmas, Series, Professores
2. **Ensino e Aprendizagem** - Diario, Notas, Boletim, Parecer, Calendario, EDUCACENSO
3. **Frota e Rotas** - Rotas, Veiculos, Motoristas, Monitores, GPS, Portal Responsavel
4. **Gestao e Recursos** - RH, Financeiro, Contratos, Merenda, Biblioteca, Patrimonio
5. **Central de Controle** - Config, Transparencia, Backup, Comunicacao

## Componentes Chave

- **ExportModal** - 7 formatos: Impressao, PDF, PDF Download, Word, CSV, HTML, HTML Download
- **ReportSignatureSelector** - Seletor de assinantes para relatorios
- **buildTableReportHTML** - Gera tabela com cabecalho institucional
- **generateReportHTML** - Template completo com assinaturas e rodape
- **ExportModal CSV** - Extrai dados de tabelas HTML automaticamente quando data[] vazio

## PDF e QR Code

- Puppeteer server-side para geracao de PDF (Chrome bundled no Railway)
- QR Code de verificacao em todas as paginas do PDF
- Tabela `documents` com hash SHA-256 e codigo de verificacao
- Pagina publica /verificar/:code

## GPS Background

4 camadas: Wake Lock + NoSleep (video) + Web Worker + Notificacao Persistente

## QR Code Alunos

- QR grava matricula do aluno (string simples)
- Scanner decodifica via jsQR em tempo real pela camera
- Compativel com QR antigos (JSON) via parse automatico
- Carteirinha estudantil inclui QR Code

## Dados de Teste

- Admin: AILTON MARTINS (super_admin), email: ambrito@hotmail.com
- Motorista: carlos.motorista@transescolar.com / motorista123
- Pai: jose.pai@email.com / motorista123
- Script: node packages/api/seed-test-data.js (inserir) / --reset (limpar)
