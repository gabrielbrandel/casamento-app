Banco de dados local + deploy para Vercel

O que foi adicionado

- `lib/server-db.ts` — adaptador DB que:
  - usa Postgres via `pg` quando `DATABASE_URL` está definida (recomendado em produção/Vercel)
  - usa `data/local-db.json` como fallback para desenvolvimento local
- Rotas API:
  - `GET  /api/gifts` — lista presentes
  - `POST /api/gifts` — cria ou atualiza um presente (envia um objeto) ou substitui todos (envia um array)
  - `PATCH /api/gifts/receive/[id]` — marcar/desmarcar recebido (body: `{ "received": true }`)
- `package.json` — adicionada dependência `pg` e `prisma` dev (opcional)

Como usar localmente

1. Instale dependências:

```powershell
pnpm install
# ou
npm install
```

2. Rodar em dev (usa `data/local-db.json` automaticamente):

```powershell
pnpm dev
# ou
npm run dev
```

3. Testar rotas API (exemplos):

```powershell
curl http://localhost:3000/api/gifts

curl -X POST http://localhost:3000/api/gifts -H "Content-Type: application/json" -d '{"id":"gift-1","nome":"Presente X"}'

curl -X PATCH http://localhost:3000/api/gifts/receive/gift-1 -H "Content-Type: application/json" -d '{"received": true}'
```

Deploy no Vercel (persistência)

- Crie um banco Postgres (recomendo Vercel Postgres).
- Configure `DATABASE_URL` no painel do Vercel com a string de conexão Postgres.
- O adaptador detecta `DATABASE_URL` e usará Postgres automaticamente.

Notas

- Para produção, crie um banco Postgres e set `DATABASE_URL` no Vercel.
- Se preferir usar Prisma/ORM, podemos adicionar migrações e `schema.prisma` posteriormente.
