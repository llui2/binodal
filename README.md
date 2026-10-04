# Scholia

An open discussion layer for scientific papers.

Scholia keeps papers where they already live and adds a persistent public discussion around them. The first version is intentionally small: resolve an arXiv paper, sign in with ORCID, and discuss it.

## Stack

- Cloudflare Workers
- Cloudflare D1
- ORCID OAuth
- arXiv metadata API

## Local setup

```bash
npm install
npx wrangler d1 create scholia
```

Copy the returned D1 database id into `wrangler.toml`, then initialize the database:

```bash
npm run db:migrate
```

Register an ORCID OAuth client and set the secrets:

```bash
npx wrangler secret put ORCID_CLIENT_ID
npx wrangler secret put ORCID_CLIENT_SECRET
```

For local development, put non-secret values in `.dev.vars`:

```
ORCID_CLIENT_ID=...
ORCID_CLIENT_SECRET=...
ORCID_REDIRECT_URI=http://localhost:8787/auth/orcid/callback
```

Run:

```bash
npm run dev
```

Deploy:

```bash
npm run deploy
```

For production, configure `ORCID_REDIRECT_URI` as a Worker variable or use the default `<origin>/auth/orcid/callback`.

## Current routes

- `/` — paper lookup
- `/p/:arxivId` — paper + discussion
- `/auth/orcid` — ORCID sign-in
- `/auth/orcid/callback` — OAuth callback
- `/logout`
- `/api/comments` — create a comment
- `/health`

## Principles

1. arXiv remains the canonical paper source.
2. Reading is public.
3. Posting requires a persistent ORCID identity.
4. Comments are generic; structure can emerge later from usage.
5. Keep the first version small enough to test whether researchers actually use a discussion layer.

## License

MIT
