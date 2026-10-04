# trails

*Through the maze.*

Beta for opening scientific papers and keeping activity around them in one place.

Current scope:

- resolve arXiv IDs, DOIs, and paper URLs
- fetch and cache paper metadata
- sign in with ORCID
- post threaded public comments
- view discussion, references, and related-work tabs
- store data in Cloudflare D1

References and related-paper indexing are not implemented yet.

## Setup

Requirements: Node.js and a Cloudflare account.

```bash
npm run setup
```

This installs dependencies, creates the `trails` D1 database, initializes it, and deploys the Worker.

Configure ORCID after the first deployment:

```bash
npx wrangler secret put ORCID_CLIENT_ID --name trails
npx wrangler secret put ORCID_CLIENT_SECRET --name trails
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

Deploy later changes:

```bash
npm run deploy
```

Type-check:

```bash
npm run typecheck
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
