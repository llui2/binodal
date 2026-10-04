# research paper tool

Small beta for opening scientific papers and keeping activity around them in one place.

Current scope:

- resolve arXiv IDs, DOIs, and paper URLs
- fetch and cache paper metadata
- sign in with ORCID
- post threaded public comments
- view discussion, references, and related-work tabs
- store data in Cloudflare D1

References and related-paper indexing are not implemented yet.

## Development

Requirements: Node.js and a Cloudflare account.

```bash
git clone https://github.com/llui2/bluepaper.git
cd bluepaper
npm install
```

Create a D1 database and bind it as `DB`:

```bash
npx wrangler d1 create paper-tool --binding DB --update-config
```

Initialize the database:

```bash
npm run db:migrate
```

Configure ORCID:

```bash
npx wrangler secret put ORCID_CLIENT_ID
npx wrangler secret put ORCID_CLIENT_SECRET
```

For local development, use `.dev.vars`:

```dotenv
ORCID_CLIENT_ID=...
ORCID_CLIENT_SECRET=...
ORCID_REDIRECT_URI=http://localhost:8787/auth/orcid/callback
```

Run locally:

```bash
npm run dev
```

Type-check:

```bash
npm run typecheck
```

Deploy:

```bash
npm run deploy
```

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Paper lookup |
| `/p/:paperId` | Paper page |
| `/auth/orcid` | Start ORCID authentication |
| `/auth/orcid/callback` | ORCID callback |
| `/logout` | End session |
| `/api/papers/:id` | Paper metadata |
| `/api/comments` | Create a comment |
| `/health` | Health check |

## License

[MIT](LICENSE)
