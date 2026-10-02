# 🚀 Guia de Deploy - SmartVitae em Produção

O projeto **SmartVitae** foi totalmente compilado e validado (`next build` concluído com sucesso).

---

## 🔑 Variáveis de Ambiente Obrigatórias em Produção

Cadastre estas variáveis no painel de hospedagem (Render, Vercel ou Railway):

```env
# TypeSafe AI / JEV (Motor de Auditoria e Decisão Factual)
ENABLE_JEV=true
TYPESAFE_API_KEY=sua_chave_typesafe_aqui
TYPESAFE_MODEL=jev-latest

# OpenRouter / Claude (Cérebro Estruturador e Reestruturação de Currículo)
OPENROUTER_API_KEY=sua_chave_openrouter_aqui

# URL da Aplicação em Produção (ajuste conforme o domínio final)
NEXT_PUBLIC_APP_URL=https://smartvitae.onrender.com
NODE_ENV=production
```

---

## Opção 1: Deploy no Render (Web Service Ativo)

1. No painel do Render, crie um **New Web Service**.
2. Conecte o repositório GitHub (`https://github.com/rafaelleaomed/smartvitae`).
3. Configure:
   - **Environment:** `Node` ou `Docker`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. Adicione as variáveis de ambiente na aba **Environment**.
5. Clique em **Create Web Service**.

---

## Opção 2: Deploy na Vercel

Como o SmartVitae é construído em Next.js 15, o deploy na Vercel é nativo e automático:

1. Acesse [vercel.com](https://vercel.com) e clique em **Add New Project**.
2. Importe o repositório do GitHub.
3. Na seção **Environment Variables**, adicione as variáveis da lista acima.
4. Clique em **Deploy**.

---

## Opção 3: Deploy com Docker

Utilize o `Dockerfile` multi-stage incluído na raiz:

```bash
docker build -t smartvitae:latest .
docker run -p 3000:3000 \
  -e TYPESAFE_API_KEY="..." \
  -e OPENROUTER_API_KEY="..." \
  smartvitae:latest
```
