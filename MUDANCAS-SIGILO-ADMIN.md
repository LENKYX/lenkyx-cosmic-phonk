# 🔒 SEGURANCA: senha do administrador FORA do GitHub

## O que mudou
- render.yaml: ADMIN_PASSWORD agora usa `sync: false` (a senha vive SÓ no painel do Render)
- BONUS: .github/workflows/keepalive.yml — robotinho que entra no app a cada 10 min
  e impede a tela "Render acordando" de aparecer!

## Como publicar (GitHub Desktop)
1. Copie por cima do projeto:
   - render.yaml (na raiz)
   - .github/workflows/keepalive.yml (se pedir pra criar a pasta .github/workflows, cria!)
2. GitHub Desktop → mensagem: `senha fora do git + keepalive` → Commit → Push
3. IMPORTANTE: no Render (dashboard.render.com → Environment) a senha ja esta salva
   (voce acabou de mudar). O `sync: false` so impede dela voltar pro GitHub.

## Depois do push
- Actions do GitHub: aba "Actions" → "Manter app online" → Run workflow (testa o robozinho)
