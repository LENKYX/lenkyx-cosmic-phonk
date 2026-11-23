# 🔒 MORRO GOLD — v95: VIP VERIFICADO (segurança do seu dinheiro!)

## O bug (GRAVE) que foi corrigido
- O botao "Ja paguei - ativar meu VIP" ativava o VIP NA CONFIANCA,
  sem comprovante nenhum! E como salvava nas configuracoes GLOBAIS,
  ativava o VIP pra TODO MUNDO que abrisse o app.
- RESULTADO: qualquer um (ou voce, sem querer) virava VIP sem pagar!

## Como ficou (correto!)
- ✅ "Ja paguei" agora EXIGE comprovante (codigo E... do PIX ou foto)
- ✅ O comprovante cai em "🛡️ Conferir PIX Recebidos" no seu painel
- ✅ Só VOCE confirmando o PIX (que caiu de verdade na sua conta) o VIP ativa
- ✅ VIP agora é POR PESSOA (por aparelho) — não global!
- ✅ Cartão/assinatura MP continua ativando sozinho pelo webhook (igual)

## Como publicar (GitHub Desktop)
1. Copie por cima do projeto (3 arquivos):
   - server/index.js
   - src/App.tsx
   - src/components/PixModal.tsx
2. GitHub Desktop → mensagem: `v95 vip verificado` → Commit → Push (sem dist\!)
3. Render publica sozinho.

## Como um fã vira VIP agora
1. Abre "Seja VIP" → escolhe o plano → paga no PIX (QR/copia e cola)
2. Toca em "✅ Já paguei — enviar comprovante" → manda o codigo E... ou a foto
3. VOCE confere se o PIX caiu (PicPay/app do banco) → "🛡️ Conferir PIX Recebidos" → ✅ Confirmar
4. O VIP dele ativa sozinho! (e aparece no Mural dos Apoiadores 👑)

## Pra VOCE ter o seu proprio VIP
- Pague um PIX pra voce mesmo (ou use o MP) e confirme no painel —
  voce é o dono, a confirmação é sua! 👑
