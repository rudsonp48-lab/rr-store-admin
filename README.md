# RR Store — Painel Administrativo

Projeto **separado** do site público (`rr-store`). Gerencia produtos, fotos dos banners, fretes e pedidos, publicando no Firebase (`landing-page-d9c04`). A loja lê esses dados automaticamente.

## Rodar localmente

```bash
cp .env.example .env.local   # ajuste NEXT_PUBLIC_ADMIN_EMAILS
npm install
npm run dev                  # http://localhost:3001
```

## Configuração única no Firebase Console

1. **Authentication → Sign-in method**: ativar **E-mail/senha**.
2. **Authentication → Users**: criar o usuário administrador (e-mail + senha). Depois, em *Settings → User actions*, desative o cadastro de novos usuários.
3. **Firestore Database → Regras**: cole [`firestore.rules`](./firestore.rules) trocando `SEU_EMAIL@exemplo.com` pelo e-mail do admin → Publicar.
4. **Storage**: clique em *Começar* (ativa o bucket; pode exigir plano Blaze) e cole [`storage.rules`](./storage.rules), também trocando o e-mail.

> A segurança real vem das regras. `NEXT_PUBLIC_ADMIN_EMAILS` apenas filtra a interface.

## Deploy (Vercel) — como segundo projeto

1. Suba esta pasta para um repositório GitHub próprio (ex.: `rr-store-admin`).
2. Vercel → *Add New Project* → importe o repositório.
3. Variáveis de ambiente: as de `.env.example` (principalmente `NEXT_PUBLIC_ADMIN_EMAILS` e `NEXT_PUBLIC_SITE_URL` com a URL da loja).
4. Em Firebase → Authentication → Settings → **Authorized domains**, adicione o domínio da Vercel do painel.

## Dados

| Firestore | Conteúdo |
|---|---|
| `rr_store_settings/catalog` | `products[]` |
| `rr_store_settings/shipping` | `regions[]` |
| `rr_store_settings/banners` | `banners[]` |
| `rr_store_orders` | pedidos (criados pela loja, gerenciados aqui) |
