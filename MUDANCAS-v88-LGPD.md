# MORRO GOLD — v88: Exclusão de Conta (LGPD) 🔒

## O que tem de novo
- **🗑️ Excluir conta** (Minha Conta → botão vermelho ao lado de "Desconectar"):
  - Apaga PERMANENTEMENTE: conta na nuvem (Supabase Auth), perfil, sacola e favoritos
  - Remove também a conta do aparelho
  - Pede digitar EXCLUIR pra confirmar (sem acidente!)
- Por que: **lei LGPD** + exigência das lojas (Google Play) para publicação

## Como publicar (GitHub Desktop)
1. Copie os 4 arquivos por cima da pasta do projeto:
   - src/utils/cloudSync.ts
   - src/utils/fanAuth.ts
   - src/components/ShopCriaView.tsx
   - server/index.js
2. Abra o GitHub Desktop → digite: `v88 lgpd` → **Commit to main** → **Push origin**
3. Pronto! O Render publica sozinho (build automático) ✅

## Teste rápido
Minha Conta (aba Loja) → botão 🗑️ Excluir conta → digita EXCLUIR → conta some.
