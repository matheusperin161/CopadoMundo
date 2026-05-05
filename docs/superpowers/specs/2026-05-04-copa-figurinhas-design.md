# Design Spec — Site de Figurinhas Copa do Mundo 2026

**Data:** 2026-05-04  
**Status:** Aprovado

## Visão Geral

Site PWA para colecionadores de figurinhas da Copa do Mundo 2026 (álbum Panini). Usuários fazem login com Google, gerenciam sua coleção, registram repetidas e negociam com outros colecionadores.

## Stack

- **Frontend:** Next.js 15 (App Router, TypeScript)
- **UI:** shadcn/ui + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Google OAuth + Realtime)
- **PWA:** next-pwa (instalável no Android/iOS)
- **Deploy:** Vercel + Supabase free tier

## Estrutura do Álbum

- ~985 figurinhas no total
- **Seção FWC (história):** FWC 1 a FWC 25
- **48 seleções** em 12 grupos (A–L), ~20 figurinhas por seleção
- Código: `[SIGLA][NÚMERO]` ex: `BRA1`, `ENG5`, `FWC7`

### Grupos
| Grupo | Seleções |
|-------|----------|
| A | MEX, RSA, KOR, CZE |
| B | CAN, QAT, BIH, SUI |
| C | BRA, SCO, HAI, MAR |
| D | TUR, AUS, PAR, USA |
| E | ECU, CIV, CUW, GER |
| F | NED, TUN, SWE, JPN |
| G | NZL, IRN, EGY, BEL |
| H | URU, KSA, CPV, ESP |
| I | NOR, IRQ, SEN, FRA |
| J | JOR, AUT, ALG, ARG |
| K | COL, UZB, COD, POR |
| L | PAN, GHA, CRO, ENG |

## Rotas

| Rota | Descrição |
|------|-----------|
| `/` | Landing page com CTA de login |
| `/login` | Login com Google OAuth |
| `/colecao` | Minhas figurinhas (grid com filtro tenho/faltam) |
| `/repetidas` | Figurinhas repetidas com controle de quantidade |
| `/trocas` | Mural de trocas entre usuários |

## Banco de Dados (Supabase)

```sql
-- Catálogo base de figurinhas (seed data)
stickers (id, code, country, country_code, group, number, type)

-- Figurinhas que o usuário tem
user_collection (id, user_id, sticker_id, created_at)

-- Figurinhas repetidas com quantidade
user_duplicates (id, user_id, sticker_id, quantity, updated_at)

-- Posts de troca
trades (id, user_id, offering_sticker_id, wanting_sticker_id, note, status, created_at)
```

## Design Visual

- **Aesthetic:** Futebol editorial moderno — álbum Panini premium
- **Cores:** Azul escuro #0A1628 + Dourado #FFD700 + Vermelho #CC0000 + Branco
- **Fontes:** Bebas Neue (títulos) + DM Sans (corpo)
- **Motion:** Flip nas figurinhas ao marcar, stagger no grid, hover states
- **Layout:** Sidebar no desktop, bottom navigation no mobile

## Funcionalidades por Tela

### /colecao
- Grid de todas as ~985 figurinhas agrupadas por seção/país
- Figurinhas coletadas: coloridas + ✓
- Figurinhas faltando: visual apagado/grayscale
- Toggle: Todas / Tenho / Faltam
- Barra de progresso por grupo (ex: "Brasil 14/20")
- Click para marcar/desmarcar como coletada

### /repetidas
- Lista por seleção/código
- Input +/- para quantidade de cada repetida
- Badge mostrando total de repetidas

### /trocas
- Card por oferta: avatar usuário + figurinha ofertada + figurinha desejada + nota
- Botão "Quero trocar!" abre modal de contato
- Filtro por seleção/grupo
- Usuário pode postar sua própria oferta

## PWA
- `manifest.json` com ícone temático
- Service worker para cache offline das páginas principais
- Instalável no Android/iOS via "Adicionar à tela inicial"
