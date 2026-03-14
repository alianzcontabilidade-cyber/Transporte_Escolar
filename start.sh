#!/bin/bash
# Script para inicializar o TransEscolar localmente

set -e

echo "🚌 TransEscolar - Inicialização"
echo "================================"

# 1. Verificar/iniciar MySQL
echo "📦 Verificando MySQL..."
if ! service mysql status > /dev/null 2>&1; then
  echo "  Iniciando MySQL..."
  service mysql start
  sleep 2
fi
echo "  MySQL OK"

# 2. Criar banco se não existir
echo "🗄️  Configurando banco de dados..."
mysql -u root -e "
  CREATE DATABASE IF NOT EXISTS transescolar;
  CREATE USER IF NOT EXISTS 'transescolar'@'localhost' IDENTIFIED BY 'transescolar123';
  GRANT ALL PRIVILEGES ON transescolar.* TO 'transescolar'@'localhost';
  FLUSH PRIVILEGES;
" 2>/dev/null || true
echo "  Banco OK"

# 3. Instalar dependências
echo "📚 Verificando dependências..."
npm install --silent 2>/dev/null
echo "  Dependências OK"

# 4. Aplicar schema
echo "🔄 Aplicando schema..."
cd packages/api && npm run db:push 2>&1 | grep -E "(✓|Error|error)" || true
cd ../..
echo "  Schema OK"

echo ""
echo "✅ Tudo pronto! Iniciando sistema..."
echo "   Frontend: http://localhost:5173"
echo "   API:      http://localhost:3000"
echo ""

# 5. Iniciar API e frontend em paralelo
npm run dev
