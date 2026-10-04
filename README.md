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

Scholia is researcher-first infrastructure for discovering, understanding, and interacting around scientific work.

1. Papers remain where they already live; Scholia adds a public record around them.
2. Researchers and scientific interaction are the primary actors and value.
3. Participation should be low-friction and structured where useful; long-form discussion is secondary.
4. Discovery should prioritize relevance rather than virality or time spent on the platform.
5. Ranking and recommendation should be inspectable and controllable where practical.
6. Agent features should reduce search and coordination costs while strengthening researcher-to-researcher interaction.
7. Prefer open identifiers, exportable public contributions, and minimal platform lock-in.

See [docs/PRODUCT_PRINCIPLES.md](docs/PRODUCT_PRINCIPLES.md) for the full product direction.

## License

MIT
