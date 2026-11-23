# 🧩 MORRO GOLD — v96: ORGANIZAÇÃO GERAL (PROMPT-LAYOUT aplicado!)

## Auditoria completa (checklist do PROMPT-LAYOUT-MORRO-GOLD.md)
| Regra | Status |
|---|---|
| Zero botão repetido | ✅ (scanner rodou: "Buscar" x2 = abas diferentes, ok!) |
| 1 logo só na abertura | ✅ |
| "Vibe" em todo rótulo (0 Reels/Shorts) | ✅ (4 rótulos, todos "Vibe") |
| ▲▼ só na taskbar | ✅ (▲▼ dos jogos = controles de gameplay, ficam!) |
| Vídeo: PC proporcional / mobile full-bleed / "Voltar" | ✅ |
| Janelas flutuantes e móveis | ✅ |
| Sem anúncios · barra verde · limpeza auto | ✅ |
| Loja: só "Comprar" + "Por na Sacola" | ✅ corrigido! |
| Card VIP só o que existe · preços reais | ✅ |
| Botões ≥ 44px · estados visíveis | ✅ |

## Ajustes deste pacote (3)
1. Loja: "Finalizar Compra" → "Comprar Tudo" (regra: verbo Comprar só!)
2. Carta Legal: botão "✕ Fechar" → só ✕ (ícone nos óbvios)
3. Busca: "Fechar" das sugestões → ✕ (padrão das janelas)

## Como publicar (GitHub Desktop)
1. Copie por cima (3 arquivos):
   - src/components/ShopCriaView.tsx
   - src/components/LegalCharterModal.tsx
   - src/components/CosmicSearchView.tsx
2. GitHub Desktop → mensagem: `v96 organizacao` → Commit → Push (sem dist\!)
3. Render publica sozinho.
