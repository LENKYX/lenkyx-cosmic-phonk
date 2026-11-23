# 🛡️ MORRO GOLD — v94: Monitor de erros (Sentry) + base Cloudflare

## O que tem de novo
- 🩺 SENTRY (GRATIS): se qualquer usuario tiver um erro no app, aparece
  no seu painel do Sentry com o detalhe pra gente corrigir!
  - Ativa colando o DSN em: VIP & PIX → ⚙️ → "Sentry · DSN"
  - Servidor tambem reporta erros (env SENTRY_DSN no Render, opcional)
- Sem DSN colado = nada carrega, zero custo, app normal.

## Como publicar (GitHub Desktop)
1. Copie por cima do projeto (7 arquivos):
   - src/utils/sentry.ts (NOVO!)
   - src/types.ts
   - src/App.tsx
   - src/components/PixModal.tsx
   - server/index.js
   - package.json
   - package-lock.json
2. GitHub Desktop → mensagem: `v94 sentry` → Commit → Push (sem dist\!)
   IMPORTANTE: os 2 package* mudaram (nova biblioteca) — precisam ir sim!
3. Render publica sozinho (instala a biblioteca automatico).

## Depois: criar sua conta Sentry (5 min, gratis)
1. sentry.io → Sign up (plano Developer, gratis)
2. Create Project → plataforma "React" → nome: MORRO GOLD
3. Settings → Projects → Client Keys (DSN) → copia o DSN
4. Cola no app: VIP & PIX → ⚙️ → "Sentry · DSN" → Salvar
