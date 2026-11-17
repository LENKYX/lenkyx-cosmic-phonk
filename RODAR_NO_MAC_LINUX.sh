#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "=================================================="
echo "   LENKYX COSMIC PHONK - INICIANDO SEU APP..."
echo "=================================================="

if ! command -v node >/dev/null 2>&1; then
  echo "[ERRO] Node.js nao encontrado! Instale em https://nodejs.org (versao LTS)."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "[1/3] Instalando dependencias pela primeira vez..."
  npm install
fi

if [ ! -d "dist" ]; then
  echo "[2/3] Compilando o aplicativo LENKYX..."
  npm run build
fi

echo "[3/3] Servidor rodando em http://localhost:3000"
echo "Senha inicial da Area Criador: lenkyx2026"
if command -v open >/dev/null 2>&1; then
  (sleep 2 && open "http://localhost:3000") &
elif command -v xdg-open >/dev/null 2>&1; then
  (sleep 2 && xdg-open "http://localhost:3000") &
fi

node server/index.js
