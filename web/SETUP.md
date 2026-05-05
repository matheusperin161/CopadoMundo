# Setup — Copa 2026 Figurinhas

## 1. Configurar o Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto gratuito
2. No painel do Supabase, vá em **SQL Editor** e execute o arquivo `supabase-schema.sql`
3. Vá em **Authentication → Providers** e ative o **Google**:
   - Crie credenciais OAuth em [console.cloud.google.com](https://console.cloud.google.com)
   - Adicione a URL de callback: `https://SEU-PROJETO.supabase.co/auth/v1/callback`
4. Copie as chaves em **Settings → API**

## 2. Configurar variáveis de ambiente

Edite o arquivo `.env.local` na pasta `web/`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. Rodar localmente

```bash
cd web
npm install
npm run dev
```

Acesse: http://localhost:3000

## 4. Deploy na Vercel

1. Faça push do repositório para o GitHub
2. Importe no [vercel.com](https://vercel.com)
3. Configure as variáveis de ambiente
4. No Supabase, adicione a URL da Vercel em **Authentication → URL Configuration → Redirect URLs**

## Estrutura do projeto

```
web/
├── app/
│   ├── (app)/           # Páginas protegidas (requer login)
│   │   ├── colecao/     # Minha coleção
│   │   ├── repetidas/   # Figurinhas repetidas
│   │   └── trocas/      # Mural de trocas
│   ├── auth/callback/   # Callback OAuth
│   ├── login/           # Página de login
│   └── page.tsx         # Landing page
├── components/          # Componentes React
├── lib/
│   ├── data/stickers.ts # Catálogo completo das ~985 figurinhas
│   └── supabase/        # Clientes Supabase
├── public/
│   ├── manifest.json    # PWA manifest
│   └── sw.js            # Service worker
└── supabase-schema.sql  # Schema do banco de dados
```
