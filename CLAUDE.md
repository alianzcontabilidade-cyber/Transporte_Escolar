# NetEscol - Sistema de Gestao Escolar Municipal

## Arquitetura

**Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
**Backend:** Express + tRPC + Drizzle ORM + MySQL + Socket.IO
**Deploy:** Railway (nixpacks)

## Estrutura do Projeto

```
apps/web/          Frontend React
  src/pages/       70 paginas (lazy loaded)
  src/components/  15 componentes reutilizaveis
  src/lib/         17 bibliotecas utilitarias
  public/          Assets estaticos (sw.js, manifest.json, gps-worker.js)

packages/api/      Backend Node.js
  src/routers.ts   Todos os endpoints tRPC
  src/db/schema.ts Schema do banco (Drizzle ORM)
  src/index.ts     Express + Socket.IO server
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
5. **Central de Controle** - Config, IA Rotas, Transparencia, Backup

## Componentes Chave

- **ExportModal** - 7 formatos: Impressao, PDF, PDF Download, Word, CSV, HTML, HTML Download
- **ReportSignatureSelector** - Seletor de assinantes para relatorios
- **buildTableReportHTML** - Gera tabela com cabecalho institucional
- **generateReportHTML** - Template completo com assinaturas e rodape

## GPS Background

4 camadas: Wake Lock + NoSleep (video) + Web Worker + Notificacao Persistente

## Dados de Teste

- Admin: AILTON MARTINS (super_admin)
- Motorista: carlos.motorista@transescolar.com / motorista123
- Pai: jose.pai@email.com / motorista123
