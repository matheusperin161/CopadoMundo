# Handoff: Redesign Copa 2026 — Álbum de Figurinhas

## Visão Geral
Redesign completo de um aplicativo web de álbum de figurinhas digital para a Copa do Mundo 2026. O app permite ao usuário coletar figurinhas, marcar repetidas e publicar/descobrir trocas com outros usuários. O redesign foca em dar mais "vida" à interface (animações, gradientes por seleção, micro-interações) e melhorar a UX (dashboard de início, sistema de match em trocas, milestones de progresso).

Este é um redesign de uma aplicação existente do usuário (`localhost:3000`), provavelmente em **Next.js + React**. O objetivo é portar este design para o codebase real.

## Sobre os arquivos de design
Os arquivos neste pacote são **referências de design criadas em HTML/JSX puro** — protótipos que mostram a aparência e comportamento pretendidos, **não código de produção para copiar diretamente**. A tarefa é **recriar estes designs no ambiente do codebase alvo** (Next.js/React, com o sistema de componentes e estilo já existente — Tailwind, CSS Modules, styled-components, etc.) seguindo seus padrões estabelecidos.

## Fidelidade
**Alta fidelidade (hi-fi).** Cores, tipografia, espaçamentos e interações estão definidos. O dev deve recriar pixel-perfect dentro do codebase, adaptando os tokens à infra existente.

## Telas

### 1. Início (Home / Dashboard) — NOVA TELA
- **Rota sugerida**: `/`
- **Objetivo**: Visão geral do progresso e atalhos para ação.
- **Layout**:
  - Page header com saudação ("Olá, matheus") + título grande "Faltam X figurinhas"
  - Hero de progresso (mesmo componente da Coleção)
  - Grid de 4 stat cards (Coladas, Repetidas, Matches, Sequência)
  - Grid 2 colunas: Coladas recentemente (esquerda, 2fr) | Trocas que combinam (direita, 1fr)

### 2. Coleção
- **Rota**: `/colecao`
- **Objetivo**: Marcar figurinhas como coletadas.
- **Layout**:
  - Page header
  - **Hero de Progresso**: card grande arredondado (radius 22), gradiente sutil, mostra contagem "X / 985" + porcentagem grande em dourado, barra de progresso com animação de brilho (shine), 4 marcos (25/50/75/100%) acesos quando atingidos
  - Search box + pills de filtro (Todas / ✓ Tenho / ○ Faltam) com contadores
  - Lista de **grupos** colapsáveis. Cada grupo: ícone, título, "X de Y coletadas", barra de progresso mini do grupo
  - **Grid de figurinhas**: `grid-template-columns: repeat(auto-fill, minmax(120px, 1fr))`, gap 12px, aspect-ratio 0.72 (formato carta)
- **Estados da figurinha**:
  - `empty`: stripes 45° sutis, número em cinza
  - `collected`: gradiente derivado das cores da seleção (`countryGradient(colors)`), check verde, sombra
  - `collected.special`: gradiente holográfico animado (figurinhas raras de mascote/copa)
  - `dupe-badge`: badge verde "×N" no canto quando há repetidas
- **Interação**: clique em figurinha vazia → confete + colar; clique em colada → descolar

### 3. Repetidas
- **Rota**: `/repetidas`
- **Objetivo**: Registrar quantas repetidas o usuário tem de cada figurinha.
- **Layout**:
  - Hero "Total de Repetidas: N figurinhas" + botão "Publicar Troca" no canto
  - Search + filtro (Todas / Com repetidas)
  - Grupos > grid 280px de **dupe-cards** horizontais (mini card do país + nome + contador +/−)
  - Cards com count > 0 ganham borda/fundo verde sutil
- **Counter**: botões − e +, número central; botão − desabilita em 0

### 4. Trocas (Mural)
- **Rota**: `/trocas`
- **Objetivo**: Publicar e descobrir trocas.
- **Layout**:
  - Page header + search + botão "Publicar Troca"
  - Pills: Todas, ✨ Combinam comigo, Abertas, Minhas
  - Grid de `trade-card` (min 360px). Cada card:
    - Header: avatar inicial colorido, nome, data, reputação ★, badge "Aberta" (verde) / "Minha" (roxo)
    - Linha central: lado esquerdo "OFEREÇO" (mini-card + código + país) | swap icon | lado direito "QUERO"
    - **Selo MATCH**: tarja verde no topo direito quando `!t.mine && missing.has(t.want.id)`
    - Match meter (barra) + texto "Você tem o que ele quer"
    - Mensagem em itálico
    - Ações: Propor troca / Salvar (outras) | Editar / Marcar realizada / Remover (minhas)

## Sidebar (todas as telas)
- 264px largura, sticky, fundo gradient escuro
- Brand: marca quadrada gradiente dourada "26" + "COPA 2026" / "Álbum Digital"
- Nav items: Início, Coleção, Repetidas, Trocas — ativo tem barra dourada lateral + fundo gradiente dourado sutil + ícone/texto dourado
- Badges contextuais (count de repetidas e matches)
- Footer: avatar + user-name + handle + ícone logout

## Tokens de Design

### Cores
```
--bg-0:        #0a0e1a   /* fundo app */
--bg-1:        #11172a
--bg-2:        #1a2240
--bg-card:     #141a2e
--bg-card-2:   #1c2540
--line:        #232c4a   /* borders */
--line-2:      #2d3760
--ink-0:       #f4f6ff   /* texto principal */
--ink-1:       #c5cce8
--ink-2:       #8b95b8
--ink-3:       #5a6485   /* texto desabilitado */
--gold:        #FFD23F   /* accent primário */
--gold-2:      #FFB800
--gold-soft:   rgba(255, 210, 63, 0.12)
--success:     #34D399
--success-soft: rgba(52, 211, 153, 0.14)
--pink:        #F472B6
--violet:      #A78BFA
--cyan:        #38BDF8
--danger:      #F87171
```

Background do app usa dois radial-gradients sutis (dourado top-right, violeta left) sobre `--bg-0`.

### Tipografia
- **Display**: `Bebas Neue` (Google Fonts) — títulos, números grandes, marca; letter-spacing 0.04em
- **UI**: `Inter` 400/500/600/700/800 — corpo, labels, controles
- Font-feature-settings 'cv11', 'ss01'

Escala:
- Page title (Bebas): 56px / line-height 0.95
- Group title (Bebas): 24px
- Stat number (Bebas): 32px
- Hero count (Bebas): 64px; "of": 28px
- Hero %: 92px (Bebas, dourado)
- Eyebrow: 11px / letter-spacing 0.18em / uppercase / ink-3
- Body: 13–14px

### Espaçamento e raios
- Card radius: 18px (geral), 22px (hero), 12px (figurinha), 14px (mini hero badges)
- Pill: 999px
- Padding card: 20px
- Padding hero: 28px
- Sidebar: 20px 16px
- Main: 28px 36px 80px (16px em mobile)

### Sombras
- Card: `0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.35)`
- Glow dourado (toast/foco): `0 0 0 1px rgba(255, 210, 63, 0.5), 0 12px 40px rgba(255, 184, 0, 0.25)`

## Interações & Animações

### Confetti ao colar figurinha
Cria 24 partículas com cores variadas (gold, success, pink, violet, cyan, danger, coral). Cada partícula tem ângulo aleatório e distância 60–180px, rotação 720°, duração 1.4s ease-out. Veja `fireConfetti(x, y)` em `views.jsx`.

### Milestones de progresso
Quando o usuário cruza 25/50/75/100%, dispara um toast grande "🎉 N% completo!" por 3.5s. Caso contrário, toast simples "✓ Figurinha colada!" por 1.8s.

### Barra de progresso
Animação `shine` infinita: pseudo-element com gradient horizontal translada de -100% a 100% em 2.4s.

### Figurinha holográfica (raras)
Pseudo-element ::after com `repeating-linear-gradient(45deg, ...)` em mix-blend-mode overlay, animação `holo` de 4s linear infinita movendo background-position.

### Toast
Aparece bottom-center com `toast-in` (translate Y 30px → 0, fade) 0.3s.

### Modal
Fundo `rgba(5,8,18,0.7)` + `backdrop-filter: blur(8px)`; entrada scale 0.92 → 1.

### Hover
- `.sticker:hover`: translateY(-2px), border-color → line-2
- `.btn:hover`: border-color escurece
- `.pill:hover`: border-color → line-2

## Estado / Lógica

```ts
type Sticker = {
  id: string;          // ex "BRA-1"
  num: number;         // 1..total do grupo
  groupId: string;
  groupTitle: string;
  groupIcon: string;
  prefix: string;      // ex "BRA"
  country?: { code, name, flag, colors[3] };
  kind: 'history' | 'special' | 'host' | 'team';
  special: boolean;    // raras (holo)
};

type Trade = {
  id: string;
  user: string;
  date: string;
  mine?: boolean;
  rep?: string;        // "4.8"
  status: 'open' | 'closed';
  color?: string;      // gradient string para avatar
  offer: { id, num, country };
  want: { id, num, country };
  msg?: string;
};
```

State global (sugestão React Context ou Zustand):
- `stickers: Sticker[]` (derivado de `GROUPS` em `data.js`)
- `owned: Set<string>` (ids coletados)
- `dupes: Map<string, number>` (id → quantidade de repetidas)
- `trades: Trade[]`
- `missing: Set<string>` (derivado: stickers \\ owned)
- `dupesCount`, `openTradesCount` (derivados, exibidos como badge no sidebar)

Persistir `owned` e `dupes` em `localStorage` (chaves `copa26_owned`, `copa26_dupes`).

## Helpers
```js
// Gera gradient CSS a partir das cores da seleção
countryGradient(colors)  // 1, 2 ou 3 cores
gradFor(country)          // wrapper que cuida de country null
buildAllStickers()        // gera lista completa a partir de GROUPS
fireConfetti(x, y)        // dispara burst em coords da viewport
```

## Responsivo
- Sidebar 264px desktop; em < 900px pode virar bottom-tab ou hambúrguer
- Stats grid: 4 col → 2 col em < 900px
- Home grid: 2fr/1fr → 1col em < 1100px
- Stickers grid: auto-fill 120px (já responde sozinho)

## Assets
- Bandeiras: emoji unicode (`country.flag`)
- Sem ícones externos — todos SVG inline em `<Icon name="..." />` (`sidebar.jsx`)
- Sem imagens; placeholders gradient para mini-cards

## Arquivos do design (referência)
- `Copa 2026 Album.html` — entry HTML; carrega React 18 + Babel standalone + CSS + scripts
- `styles.css` — todos os tokens e classes
- `data.js` — `COUNTRIES`, `GROUPS`, helpers `countryGradient`/`findCountry`
- `sidebar.jsx` — `<Sidebar>` + `<Icon>` (todos os ícones SVG inline)
- `views.jsx` — `<Home>`, `<Colecao>`, `<Repetidas>`, `<Trocas>` + helpers
- `app.jsx` — `<App>` raiz com state, persistência e roteamento por aba

## Mensagem sugerida para o Claude do VSCode

> Este pacote é um redesign de alta fidelidade do meu app de álbum de figurinhas (Next.js no localhost:3000). Olhe os arquivos em `design_handoff_copa2026/` e implemente o redesign no codebase real, mantendo o sistema de componentes e estilo já existentes. Comece pela tela Coleção (a mais crítica), depois Repetidas, Trocas, e adicione a nova tela Início. Use o README como referência para tokens, layout e interações. Confete ao colar e o selo MATCH em trocas são prioritários — são o coração do redesign.
