interface Env {
  DB: D1Database;
  ORCID_CLIENT_ID: string;
  ORCID_CLIENT_SECRET: string;
  ORCID_REDIRECT_URI?: string;
  ORCID_BASE_URL?: string;
}

interface Paper {
  arxiv_id: string;
  title: string;
  authors_json: string;
  abstract: string;
  published_at: string | null;
  updated_at: string | null;
}

type PaperIdentifierType = "arxiv" | "doi" | "url";

interface PaperIdentifier {
  type: PaperIdentifierType;
  value: string;
  paper_id?: string;
  label: string | null;
  url: string;
}

interface FetchedPaper {
  paper: Paper;
  identifiers: PaperIdentifier[];
}

interface User {
  id: number;
  orcid: string;
  display_name: string;
}

interface CommentRow {
  id: number;
  paper_id: string;
  user_id: number;
  parent_id: number | null;
  body: string;
  created_at: string;
  display_name: string;
  orcid: string;
}

const SCHOLIA_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 310 310" role="img" aria-label="Scholia logo">
  <path fill="#BC4F3B" d="M 168 20 L 168 250 C 168 267 165 278 156 283 C 148 288 139 288 130 283 C 120 277 112 269 103 261 L 80 239 C 77 236 78 231 83 230 C 92 230 103 236 114 243 C 124 249 134 257 143 264 L 143 54 C 143 50 141 48 137 48 C 134 48 133 46 135 44 C 145 42 155 34 165 21 C 166 20 167 19 168 20 Z"/>
  <circle cx="211" cy="144" r="19" fill="#BC4F3B"/>
</svg>`;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await route(request, env);
    } catch (error) {
      console.error(error);
      return htmlPage(
        "Scholia · error",
        `<main class="shell utility-page"><p class="eyebrow">Scholia</p><h1>Something went wrong.</h1><p class="muted">${escapeHtml(
          error instanceof Error ? error.message : "Unknown error",
        )}</p><p><a href="/">Return home</a></p></main>`,
        500,
      );
    }
  },
} satisfies ExportedHandler<Env>;

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === "GET" && path === "/") {
    return renderHome(request, env);
  }

  if (request.method === "GET" && path === "/go") {
    const raw = url.searchParams.get("paper") ?? url.searchParams.get("arxiv") ?? "";
    const id = normalizePaperInput(raw);
    if (!id) {
      return redirect("/?error=Enter+a+valid+arXiv+ID,+DOI,+or+paper+URL");
    }
    return redirect(`/p/${encodeURIComponent(id)}`);
  }

  if (request.method === "GET" && path.startsWith("/p/")) {
    const id = normalizePaperInput(decodeURIComponent(path.slice(3)));
    if (!id) return notFound("Invalid paper identifier or URL.");
    return renderPaper(request, env, id);
  }

  if (request.method === "GET" && path.startsWith("/api/papers/")) {
    const id = normalizePaperInput(decodeURIComponent(path.slice("/api/papers/".length)));
    if (!id) return json({ error: "invalid paper identifier or URL" }, 400);
    const paper = await ensurePaper(env, id);
    const identifiers = await getPaperIdentifiers(env, paper.arxiv_id);
    return json({
      ...paper,
      authors: safeJsonArray(paper.authors_json).map(normalizeAuthorName),
      identifiers,
      preferred_id: preferredPaperId(identifiers, paper.arxiv_id),
    });
  }

  if (request.method === "POST" && path === "/api/comments") {
    return createComment(request, env);
  }

  if (request.method === "GET" && path === "/auth/orcid") {
    return beginOrcidAuth(request, env);
  }

  if (request.method === "GET" && path === "/auth/orcid/callback") {
    return finishOrcidAuth(request, env);
  }

  if (request.method === "POST" && path === "/logout") {
    return logout(request, env);
  }

  if (request.method === "GET" && path === "/favicon.svg") {
    return new Response(SCHOLIA_LOGO_SVG, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  }

  if (request.method === "GET" && path === "/health") {
    return json({ ok: true, service: "scholia" });
  }

  return notFound("Page not found.");
}

async function renderHome(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const user = await currentUser(request, env);
  const error = url.searchParams.get("error");

  return htmlPage(
    "Scholia",
    `<header class="topbar">
      ${renderBrand()}
      ${renderIdentity(user)}
    </header>
    <main class="shell home">
      <h1>A public record of scientific activity around papers.</h1>
      ${error ? `<p class="notice">${escapeHtml(error)}</p>` : ""}
      <form class="lookup" action="/go" method="get">
        <label for="paper">paper</label>
        <div class="lookup-control">
          <input id="paper" name="paper" placeholder="Paste an arXiv ID, DOI, or paper URL" autocomplete="off" required>
          <button type="submit">Open</button>
        </div>
      </form>
    </main>`,
  );
}

async function renderPaper(request: Request, env: Env, requestedPaperId: string): Promise<Response> {
  const paper = await ensurePaper(env, requestedPaperId);
  const identifiers = await getPaperIdentifiers(env, paper.arxiv_id);
  const publicPaperId = preferredPaperId(identifiers, paper.arxiv_id);
  const requestUrl = new URL(request.url);

  if (requestedPaperId !== publicPaperId) {
    return redirect(`/p/${encodeURIComponent(publicPaperId)}${requestUrl.search}`);
  }

  const user = await currentUser(request, env);
  const replyToRaw = requestUrl.searchParams.get("reply");
  const replyTo = replyToRaw && /^\d+$/.test(replyToRaw) ? Number(replyToRaw) : null;
  const requestedTab = requestUrl.searchParams.get("tab");
  const tab = requestedTab === "references" || requestedTab === "related" ? requestedTab : "discussion";
  const storagePaperId = paper.arxiv_id;

  const result = await env.DB.prepare(
    `SELECT c.id, c.paper_id, c.user_id, c.parent_id, c.body, c.created_at,
            u.display_name, u.orcid
       FROM comments c
       JOIN users u ON u.id = c.user_id
      WHERE c.paper_id = ?
      ORDER BY c.created_at ASC, c.id ASC`,
  )
    .bind(storagePaperId)
    .all<CommentRow>();

  const comments = result.results ?? [];
  const commentIds = new Set(comments.map((comment) => comment.id));
  const validReplyTo = replyTo && commentIds.has(replyTo) ? replyTo : null;
  const authors = safeJsonArray(paper.authors_json).map(normalizeAuthorName);
  const paperUrl = `/p/${encodeURIComponent(publicPaperId)}`;

  const tabLink = (id: "discussion" | "references" | "related", label: string): string =>
    `<a href="${paperUrl}?tab=${id}"${tab === id ? ` class="active" aria-current="page"` : ""}>${label}</a>`;

  const discussion = `<section class="discussion">
    <div class="discussion-meta">
      <span>${comments.length} ${comments.length === 1 ? "comment" : "comments"}</span>
    </div>
    ${renderComposer(user, storagePaperId, publicPaperId, validReplyTo)}
    ${comments.length ? renderCommentTree(comments, publicPaperId) : `<p class="empty">No discussion yet.</p>`}
  </section>`;

  const references = `<section class="tab-empty">
    <h2>References</h2>
    <p>Not indexed yet.</p>
  </section>`;

  const related = `<section class="tab-empty">
    <h2>Related papers</h2>
    <p>Not indexed yet.</p>
  </section>`;

  const tabContent = tab === "references" ? references : tab === "related" ? related : discussion;

  return htmlPage(
    `${paper.title} · Scholia`,
    `<header class="topbar">
      ${renderBrand()}
      ${renderIdentity(user)}
    </header>
    <main class="shell paper-page">
      <a class="back" href="/">← papers</a>

      <article class="paper-window">
        <div class="paper-grid">
          <aside class="paper-meta" aria-label="Paper metadata">
            ${renderPaperSources(identifiers)}
          </aside>

          <div class="paper-main">
            <div class="paper-summary">
              <h1>${escapeHtml(paper.title)}</h1>
              <p class="authors">${authors.map(escapeHtml).join(", ")}</p>

              <details class="abstract-disclosure">
                <summary>Abstract</summary>
                <p>${escapeHtml(paper.abstract)}</p>
              </details>
            </div>

            <nav class="paper-tabs" aria-label="Paper sections">
              ${tabLink("discussion", "Discussion")}
              ${tabLink("references", "References")}
              ${tabLink("related", "Related papers")}
            </nav>

            <div class="paper-tab">
              ${tabContent}
            </div>
          </div>
        </div>
      </article>
    </main>`,
  );
}

function renderComposer(
  user: User | null,
  storagePaperId: string,
  publicPaperId: string,
  replyTo: number | null,
): string {
  if (!user) {
    const next = `/p/${encodeURIComponent(publicPaperId)}`;
    return `<div class="signin-plain">
      <p>Sign in with ORCID to contribute.</p>
      <a class="button-link" href="/auth/orcid?next=${encodeURIComponent(next)}">Sign in with ORCID</a>
    </div>`;
  }

  return `<form id="comment-form" class="composer" action="/api/comments" method="post">
    <input type="hidden" name="paper_id" value="${escapeAttr(storagePaperId)}">
    ${replyTo ? `<input type="hidden" name="parent_id" value="${replyTo}">` : ""}
    <div class="composer-meta">
      <span>Commenting as <strong>${escapeHtml(user.display_name)}</strong></span>
      ${replyTo ? `<a href="/p/${encodeURIComponent(publicPaperId)}#comment-form">cancel reply</a>` : ""}
    </div>
    ${replyTo ? `<p class="reply-note">Replying to comment #${replyTo}</p>` : ""}
    <textarea name="body" rows="5" maxlength="5000" placeholder="Add to the discussion…" required></textarea>
    <div class="composer-actions">
      <span>Plain text · 5,000 characters max</span>
      <button type="submit">Post comment</button>
    </div>
  </form>`;
}

function renderCommentTree(comments: CommentRow[], paperId: string): string {
  const children = new Map<number | null, CommentRow[]>();

  for (const comment of comments) {
    const parent = comment.parent_id && comments.some((item) => item.id === comment.parent_id)
      ? comment.parent_id
      : null;
    const list = children.get(parent) ?? [];
    list.push(comment);
    children.set(parent, list);
  }

  const renderBranch = (parentId: number | null, depth: number): string => {
    const list = children.get(parentId) ?? [];
    return list
      .map((comment) => {
        const replies = renderBranch(comment.id, depth + 1);
        return `<article class="comment" id="comment-${comment.id}" style="--depth:${Math.min(depth, 6)}">
          <div class="comment-head">
            <a href="https://orcid.org/${escapeAttr(comment.orcid)}" rel="noreferrer">${escapeHtml(comment.display_name)}</a>
            <span>ORCID ${escapeHtml(comment.orcid)}</span>
            <time datetime="${escapeAttr(comment.created_at)}">${escapeHtml(formatDate(comment.created_at))}</time>
          </div>
          <div class="comment-body">${escapeHtml(comment.body).replace(/\n/g, "<br>")}</div>
          <div class="comment-actions">
            <a href="/p/${encodeURIComponent(paperId)}?tab=discussion&reply=${comment.id}#comment-form">reply</a>
            <a href="#comment-${comment.id}">#${comment.id}</a>
          </div>
          ${replies ? `<div class="replies">${replies}</div>` : ""}
        </article>`;
      })
      .join("");
  };

  return `<div class="comments">${renderBranch(null, 0)}</div>`;
}

async function createComment(request: Request, env: Env): Promise<Response> {
  const user = await currentUser(request, env);
  if (!user) return new Response("Authentication required", { status: 401 });

  assertSameOrigin(request);

  const form = await request.formData();
  const rawPaper = String(form.get("paper_id") ?? "");
  const paperId = normalizePaperInput(rawPaper);
  const body = String(form.get("body") ?? "").trim();
  const parentRaw = String(form.get("parent_id") ?? "").trim();

  if (!paperId) return new Response("Invalid paper identifier or URL", { status: 400 });
  if (!body || body.length > 5000) {
    return new Response("Comment must contain 1–5000 characters", { status: 400 });
  }

  const paper = await ensurePaper(env, paperId);
  const storagePaperId = paper.arxiv_id;

  let parentId: number | null = null;
  if (parentRaw) {
    if (!/^\d+$/.test(parentRaw)) return new Response("Invalid parent comment", { status: 400 });
    parentId = Number(parentRaw);
    const parent = await env.DB.prepare(
      "SELECT id FROM comments WHERE id = ? AND paper_id = ?",
    )
      .bind(parentId, storagePaperId)
      .first();
    if (!parent) return new Response("Parent comment not found", { status: 400 });
  }

  await env.DB.prepare(
    "INSERT INTO comments (paper_id, user_id, parent_id, body) VALUES (?, ?, ?, ?)",
  )
    .bind(storagePaperId, user.id, parentId, body)
    .run();

  const identifiers = await getPaperIdentifiers(env, storagePaperId);
  const publicPaperId = preferredPaperId(identifiers, storagePaperId);
  return redirect(`/p/${encodeURIComponent(publicPaperId)}`, 303);
}

async function beginOrcidAuth(request: Request, env: Env): Promise<Response> {
  if (!env.ORCID_CLIENT_ID) {
    return new Response("ORCID_CLIENT_ID is not configured", { status: 503 });
  }

  const url = new URL(request.url);
  const requestedNext = url.searchParams.get("next") ?? "/";
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/";
  const state = randomToken();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await env.DB.prepare(
    "INSERT INTO oauth_states (state, expires_at) VALUES (?, ?)",
  )
    .bind(`${state}:${base64UrlEncode(next)}`, expiresAt)
    .run();

  const base = env.ORCID_BASE_URL ?? "https://orcid.org";
  const redirectUri = env.ORCID_REDIRECT_URI ?? `${url.origin}/auth/orcid/callback`;
  const authorize = new URL("/oauth/authorize", base);
  authorize.searchParams.set("client_id", env.ORCID_CLIENT_ID);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("scope", "/authenticate");
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("state", `${state}:${base64UrlEncode(next)}`);

  return Response.redirect(authorize.toString(), 302);
}

async function finishOrcidAuth(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) return new Response("Missing OAuth code or state", { status: 400 });

  const saved = await env.DB.prepare(
    "SELECT state, expires_at FROM oauth_states WHERE state = ?",
  )
    .bind(state)
    .first<{ state: string; expires_at: string }>();

  await env.DB.prepare("DELETE FROM oauth_states WHERE state = ?").bind(state).run();

  if (!saved || Date.parse(saved.expires_at) < Date.now()) {
    return new Response("OAuth state is invalid or expired", { status: 400 });
  }

  const base = env.ORCID_BASE_URL ?? "https://orcid.org";
  const redirectUri = env.ORCID_REDIRECT_URI ?? `${url.origin}/auth/orcid/callback`;

  const tokenResponse = await fetch(new URL("/oauth/token", base), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: env.ORCID_CLIENT_ID,
      client_secret: env.ORCID_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    const details = await tokenResponse.text();
    console.error("ORCID token exchange failed", tokenResponse.status, details);
    return new Response("ORCID sign-in failed", { status: 502 });
  }

  const token = (await tokenResponse.json()) as {
    orcid?: string;
    name?: string;
  };

  if (!token.orcid) return new Response("ORCID did not return an iD", { status: 502 });

  const displayName = token.name?.trim() || token.orcid;

  await env.DB.prepare(
    `INSERT INTO users (orcid, display_name)
     VALUES (?, ?)
     ON CONFLICT(orcid) DO UPDATE SET display_name = excluded.display_name`,
  )
    .bind(token.orcid, displayName)
    .run();

  const user = await env.DB.prepare(
    "SELECT id, orcid, display_name FROM users WHERE orcid = ?",
  )
    .bind(token.orcid)
    .first<User>();

  if (!user) return new Response("Could not create Scholia user", { status: 500 });

  const session = randomToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await env.DB.prepare(
    "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
  )
    .bind(session, user.id, expiresAt)
    .run();

  const next = decodeNextFromState(state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: next,
      "Set-Cookie": sessionCookie(session, request, 30 * 24 * 60 * 60),
    },
  });
}

async function logout(request: Request, env: Env): Promise<Response> {
  assertSameOrigin(request);
  const cookies = parseCookies(request.headers.get("Cookie") ?? "");
  const token = cookies.get("scholia_session");

  if (token) {
    await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: "/",
      "Set-Cookie": sessionCookie("", request, 0),
    },
  });
}

async function currentUser(request: Request, env: Env): Promise<User | null> {
  const cookies = parseCookies(request.headers.get("Cookie") ?? "");
  const token = cookies.get("scholia_session");
  if (!token) return null;

  const row = await env.DB.prepare(
    `SELECT u.id, u.orcid, u.display_name, s.expires_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token = ?`,
  )
    .bind(token)
    .first<User & { expires_at: string }>();

  if (!row) return null;

  if (Date.parse(row.expires_at) < Date.now()) {
    await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
    return null;
  }

  return {
    id: row.id,
    orcid: row.orcid,
    display_name: row.display_name,
  };
}

async function ensurePaperIdentifierSchema(env: Env): Promise<void> {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS paper_identifiers (
      type TEXT NOT NULL,
      value TEXT NOT NULL,
      paper_id TEXT NOT NULL,
      label TEXT,
      url TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (type, value),
      FOREIGN KEY (paper_id) REFERENCES papers(arxiv_id) ON DELETE CASCADE
    )`,
  ).run();
  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_paper_identifiers_paper ON paper_identifiers(paper_id)",
  ).run();
}

async function ensurePaper(env: Env, rawPaperId: string): Promise<Paper> {
  await ensurePaperIdentifierSchema(env);

  const paperId = normalizePaperInput(rawPaperId);
  if (!paperId) throw new Error("Invalid paper identifier or URL");
  const requestedIdentifier = identifierFromPaperId(paperId);
  if (!requestedIdentifier) throw new Error("Invalid paper identifier or URL");

  const aliasedStorageId = await findStorageIdByIdentifier(env, requestedIdentifier);
  if (aliasedStorageId) {
    const aliased = await getPaperByStorageId(env, aliasedStorageId);
    if (aliased) {
      const storageId = await enrichPaperIdentifiers(env, aliased, requestedIdentifier);
      const enriched = await getPaperByStorageId(env, storageId);
      if (enriched) return enriched;
    }
  }

  let cached = await getPaperByStorageId(env, paperId);
  if (cached) {
    const storageId = await enrichPaperIdentifiers(env, cached, requestedIdentifier);
    cached = await getPaperByStorageId(env, storageId);
    if (!cached) throw new Error("Could not resolve cached paper");
    return cached;
  }

  const fetched = await fetchPaperByInput(paperId);

  for (const identifier of fetched.identifiers) {
    const existingStorageId = await findStorageIdByIdentifier(env, identifier);
    if (existingStorageId) {
      const storageId = await attachIdentifiers(env, existingStorageId, fetched.identifiers);
      const existing = await getPaperByStorageId(env, storageId);
      if (existing) return existing;
    }
  }

  const matching = await findMatchingPaper(env, fetched.paper, null);
  if (matching) {
    const storageId = await attachIdentifiers(env, matching.arxiv_id, fetched.identifiers);
    const existing = await getPaperByStorageId(env, storageId);
    if (existing) return existing;
  }

  await env.DB.prepare(
    `INSERT INTO papers (arxiv_id, title, authors_json, abstract, published_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      fetched.paper.arxiv_id,
      fetched.paper.title,
      fetched.paper.authors_json,
      fetched.paper.abstract,
      fetched.paper.published_at,
      fetched.paper.updated_at,
    )
    .run();

  const storageId = await attachIdentifiers(env, fetched.paper.arxiv_id, fetched.identifiers);
  const paper = await getPaperByStorageId(env, storageId);
  if (!paper) throw new Error("Could not store paper");
  return paper;
}

async function enrichPaperIdentifiers(
  env: Env,
  paper: Paper,
  requestedIdentifier: PaperIdentifier,
): Promise<string> {
  const existingIdentifiers = await getPaperIdentifiers(env, paper.arxiv_id);
  const discovered: PaperIdentifier[] = [requestedIdentifier];
  let allIdentifiers = dedupeIdentifiers([...existingIdentifiers, ...discovered]);

  try {
    if (requestedIdentifier.type === "arxiv" && !allIdentifiers.some((identifier) => identifier.type === "doi")) {
      discovered.push(...await fetchArxivRelations(requestedIdentifier.value));
    } else if (requestedIdentifier.type === "doi" && existingIdentifiers.length === 0) {
      const refreshed = await fetchPaperFromCrossref(requestedIdentifier.value, paper.arxiv_id);
      discovered.push(...refreshed.identifiers);
    } else if (requestedIdentifier.type === "url" && !allIdentifiers.some((identifier) => identifier.type === "doi")) {
      const refreshed = await fetchPaperFromUrl(requestedIdentifier.value, paper.arxiv_id);
      discovered.push(...refreshed.identifiers);
    }
  } catch (error) {
    console.warn("Could not enrich cached paper identifiers", error);
  }

  allIdentifiers = dedupeIdentifiers([...existingIdentifiers, ...discovered]);

  const doi = allIdentifiers.find(
    (identifier) => identifier.type === "doi" && !isArxivIssuedDoi(identifier.value),
  );
  const hasArxiv = allIdentifiers.some((identifier) => identifier.type === "arxiv");

  if (doi && !hasArxiv) {
    try {
      const arxiv = await fetchArxivIdentifierForDoi(doi.value);
      if (arxiv) discovered.push(arxiv);
    } catch (error) {
      console.warn("Could not resolve DOI to arXiv", error);
    }
  }

  let storageId = await attachIdentifiers(env, paper.arxiv_id, discovered);
  const matching = await findMatchingPaper(env, paper, storageId);
  if (matching) storageId = await mergePaperRows(env, storageId, matching.arxiv_id);
  return storageId;
}

async function fetchArxivIdentifierForDoi(doi: string): Promise<PaperIdentifier | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    const response = await fetch(
      `https://api.semanticscholar.org/graph/v1/paper/DOI:${encodeURIComponent(doi)}?fields=externalIds`,
      {
        headers: {
          "User-Agent": "Scholia/0.1 (+https://github.com/llui2/scholia)",
          Accept: "application/json",
        },
        signal: controller.signal,
      },
    );

    if (!response.ok) return null;

    const payload = await response.json() as {
      externalIds?: Record<string, string | number | null>;
    };
    const rawArxiv = payload.externalIds?.ArXiv;
    if (typeof rawArxiv !== "string") return null;

    const arxiv = normalizeArxivInput(rawArxiv);
    if (!arxiv) return null;

    return {
      type: "arxiv",
      value: arxiv,
      label: "arXiv",
      url: `https://arxiv.org/abs/${encodeURIComponent(arxiv)}`,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function getPaperByStorageId(env: Env, storageId: string): Promise<Paper | null> {
  return env.DB.prepare(
    "SELECT arxiv_id, title, authors_json, abstract, published_at, updated_at FROM papers WHERE arxiv_id = ?",
  )
    .bind(storageId)
    .first<Paper>();
}

async function getPaperIdentifiers(env: Env, storageId: string): Promise<PaperIdentifier[]> {
  await ensurePaperIdentifierSchema(env);
  const result = await env.DB.prepare(
    `SELECT type, value, paper_id, label, url
       FROM paper_identifiers
      WHERE paper_id = ?
      ORDER BY CASE type WHEN 'doi' THEN 0 WHEN 'arxiv' THEN 1 ELSE 2 END, created_at ASC`,
  )
    .bind(storageId)
    .all<PaperIdentifier>();
  return result.results ?? [];
}

async function findStorageIdByIdentifier(
  env: Env,
  identifier: PaperIdentifier,
): Promise<string | null> {
  const row = await env.DB.prepare(
    "SELECT paper_id FROM paper_identifiers WHERE type = ? AND value = ?",
  )
    .bind(identifier.type, identifier.value)
    .first<{ paper_id: string }>();
  return row?.paper_id ?? null;
}

async function attachIdentifiers(
  env: Env,
  initialStorageId: string,
  identifiers: PaperIdentifier[],
): Promise<string> {
  let storageId = initialStorageId;

  for (const identifier of dedupeIdentifiers(identifiers)) {
    const existingStorageId = await findStorageIdByIdentifier(env, identifier);
    if (existingStorageId && existingStorageId !== storageId) {
      storageId = await mergePaperRows(env, storageId, existingStorageId);
    }

    await env.DB.prepare(
      `INSERT INTO paper_identifiers (type, value, paper_id, label, url)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(type, value) DO UPDATE SET
         label = COALESCE(paper_identifiers.label, excluded.label),
         url = COALESCE(paper_identifiers.url, excluded.url)`,
    )
      .bind(identifier.type, identifier.value, storageId, identifier.label, identifier.url)
      .run();
  }

  return storageId;
}

async function mergePaperRows(env: Env, firstId: string, secondId: string): Promise<string> {
  if (firstId === secondId) return firstId;

  const targetId = storagePriority(firstId) <= storagePriority(secondId) ? firstId : secondId;
  const duplicateId = targetId === firstId ? secondId : firstId;

  await env.DB.prepare("UPDATE comments SET paper_id = ? WHERE paper_id = ?")
    .bind(targetId, duplicateId)
    .run();
  await env.DB.prepare("UPDATE OR IGNORE paper_identifiers SET paper_id = ? WHERE paper_id = ?")
    .bind(targetId, duplicateId)
    .run();
  await env.DB.prepare("DELETE FROM paper_identifiers WHERE paper_id = ?")
    .bind(duplicateId)
    .run();
  await env.DB.prepare("DELETE FROM papers WHERE arxiv_id = ?")
    .bind(duplicateId)
    .run();

  return targetId;
}

function storagePriority(storageId: string): number {
  if (normalizeArxivInput(storageId) === storageId) return 0;
  if (storageId.startsWith("doi:")) return 1;
  return 2;
}

async function findMatchingPaper(
  env: Env,
  paper: Paper,
  excludeStorageId: string | null,
): Promise<Paper | null> {
  const result = await env.DB.prepare(
    `SELECT arxiv_id, title, authors_json, abstract, published_at, updated_at
       FROM papers
      WHERE lower(trim(title)) = lower(trim(?))
        AND (? IS NULL OR arxiv_id <> ?)
      LIMIT 12`,
  )
    .bind(paper.title, excludeStorageId, excludeStorageId)
    .all<Paper>();

  for (const candidate of result.results ?? []) {
    if (sameAuthorList(paper.authors_json, candidate.authors_json)) return candidate;
  }

  return null;
}

function sameAuthorList(firstJson: string, secondJson: string): boolean {
  const first = safeJsonArray(firstJson).map(authorFingerprint).filter(Boolean);
  const second = safeJsonArray(secondJson).map(authorFingerprint).filter(Boolean);
  if (!first.length || first.length !== second.length) return false;
  return first.every((author, index) => author === second[index]);
}

function authorFingerprint(value: string): string {
  return normalizeAuthorName(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function dedupeIdentifiers(identifiers: PaperIdentifier[]): PaperIdentifier[] {
  const seen = new Set<string>();
  return identifiers.filter((identifier) => {
    const key = `${identifier.type}:${identifier.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function identifierFromPaperId(paperId: string): PaperIdentifier | null {
  if (paperId.startsWith("doi:")) {
    const doi = paperId.slice(4);
    return { type: "doi", value: doi, label: null, url: `https://doi.org/${doi}` };
  }

  if (paperId.startsWith("url:")) {
    const url = decodeUrlPaperId(paperId);
    if (!url) return null;
    return { type: "url", value: url, label: sourceHost(url), url };
  }

  const arxiv = normalizeArxivInput(paperId);
  if (!arxiv) return null;
  return {
    type: "arxiv",
    value: arxiv,
    label: "arXiv",
    url: `https://arxiv.org/abs/${encodeURIComponent(arxiv)}`,
  };
}

function preferredPaperId(identifiers: PaperIdentifier[], fallbackStorageId: string): string {
  const doi = identifiers.find((identifier) => identifier.type === "doi" && !isArxivIssuedDoi(identifier.value));
  if (doi) return `doi:${doi.value}`;
  const arxiv = identifiers.find((identifier) => identifier.type === "arxiv");
  if (arxiv) return arxiv.value;
  const url = identifiers.find((identifier) => identifier.type === "url");
  if (url) return `url:${encodeURIComponent(url.value)}`;
  return fallbackStorageId;
}

function renderPaperSources(identifiers: PaperIdentifier[]): string {
  const doi = identifiers.find((identifier) => identifier.type === "doi" && !isArxivIssuedDoi(identifier.value));
  const arxiv = identifiers.find((identifier) => identifier.type === "arxiv");
  const source = identifiers.find((identifier) => identifier.type === "url");

  if (doi) {
    const venue = doi.label && doi.label !== "Published version" ? doi.label : "Published version";
    return `<p class="paper-venue">${escapeHtml(venue)}</p>
      <div class="paper-links">
        <a class="paper-source" href="${escapeAttr(doi.url)}" rel="noreferrer">published version ↗</a>
        ${arxiv ? `<a class="paper-source" href="${escapeAttr(arxiv.url)}" rel="noreferrer">arXiv preprint ↗</a>` : ""}
      </div>
      <p class="paper-doi">DOI ${escapeHtml(doi.value)}</p>`;
  }

  if (arxiv) {
    return `<p class="paper-id">arXiv:${escapeHtml(arxiv.value)}</p>
      <a class="paper-source" href="${escapeAttr(arxiv.url)}" rel="noreferrer">open on arXiv ↗</a>`;
  }

  if (source) {
    return `<p class="paper-id">${escapeHtml(source.label ?? sourceHost(source.value))}</p>
      <a class="paper-source" href="${escapeAttr(source.url)}" rel="noreferrer">open source ↗</a>`;
  }

  return `<p class="paper-id">paper</p>`;
}

function sourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
}

async function fetchPaperByInput(paperId: string): Promise<FetchedPaper> {
  if (paperId.startsWith("doi:")) {
    return fetchPaperFromCrossref(paperId.slice(4), paperId);
  }

  if (paperId.startsWith("url:")) {
    const sourceUrl = decodeUrlPaperId(paperId);
    if (!sourceUrl) throw new Error("Invalid paper URL");
    return fetchPaperFromUrl(sourceUrl, paperId);
  }

  try {
    return await fetchPaperFromAbs(paperId);
  } catch (error) {
    console.warn("Fast arXiv metadata lookup failed; falling back to Atom API", error);
    return fetchPaperFromAtom(paperId);
  }
}

async function fetchPaperFromAbs(arxivId: string): Promise<FetchedPaper> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    const response = await fetch(`https://arxiv.org/abs/${encodeURIComponent(arxivId)}`, {
      headers: {
        "User-Agent": "Scholia/0.1 (+https://github.com/llui2/scholia)",
        Accept: "text/html",
      },
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`arXiv abstract page returned HTTP ${response.status}`);

    const html = await response.text();
    const title = metaContent(html, "citation_title");
    const authors = metaContents(html, "citation_author").map(normalizeAuthorName);
    const published = metaContent(html, "citation_date") || null;
    const abstractMatch = html.match(
      /<blockquote[^>]*class=["'][^"']*abstract[^"']*["'][^>]*>([\s\S]*?)<\/blockquote>/i,
    );
    const abstract = abstractMatch
      ? cleanHtmlText(
          abstractMatch[1].replace(
            /<span[^>]*class=["'][^"']*descriptor[^"']*["'][^>]*>[\s\S]*?<\/span>/i,
            "",
          ),
        )
      : "";

    if (!title || !authors.length || !abstract) {
      throw new Error("Could not parse arXiv abstract page metadata");
    }

    let relations: PaperIdentifier[] = [];
    try {
      relations = await fetchArxivRelations(arxivId);
    } catch (error) {
      console.warn("Could not fetch arXiv publication relations", error);
    }

    return {
      paper: {
        arxiv_id: arxivId,
        title,
        authors_json: JSON.stringify(authors),
        abstract,
        published_at: published,
        updated_at: published,
      },
      identifiers: dedupeIdentifiers([
        {
          type: "arxiv",
          value: arxivId,
          label: "arXiv",
          url: `https://arxiv.org/abs/${encodeURIComponent(arxivId)}`,
        },
        ...relations,
      ]),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchArxivRelations(arxivId: string): Promise<PaperIdentifier[]> {
  const endpoint = new URL("https://export.arxiv.org/api/query");
  endpoint.searchParams.set("id_list", arxivId);
  const response = await fetch(endpoint, {
    headers: {
      "User-Agent": "Scholia/0.1 (+https://github.com/llui2/scholia)",
      Accept: "application/atom+xml",
    },
  });
  if (!response.ok) return [];

  const xml = await response.text();
  const entry = xml.match(/<entry>([\s\S]*?)<\/entry>/)?.[1] ?? "";
  const doi = normalizePublicationDoi(cleanXmlText(extractTag(entry, "arxiv:doi")));
  const journalRef = cleanXmlText(extractTag(entry, "arxiv:journal_ref"));
  if (!doi) return [];

  return [{
    type: "doi",
    value: doi,
    label: journalRef || "Published version",
    url: `https://doi.org/${doi}`,
  }];
}

async function fetchPaperFromAtom(arxivId: string): Promise<FetchedPaper> {
  const endpoint = new URL("https://export.arxiv.org/api/query");
  endpoint.searchParams.set("id_list", arxivId);

  const response = await fetch(endpoint, {
    headers: {
      "User-Agent": "Scholia/0.1 (+https://github.com/llui2/scholia)",
      Accept: "application/atom+xml",
    },
  });

  if (!response.ok) throw new Error(`arXiv returned HTTP ${response.status}`);

  const xml = await response.text();
  const entry = xml.match(/<entry>([\s\S]*?)<\/entry>/)?.[1];
  if (!entry) throw new Error(`No arXiv paper found for ${arxivId}`);

  const title = cleanXmlText(extractTag(entry, "title"));
  const abstract = cleanXmlText(extractTag(entry, "summary"));
  const published = extractTag(entry, "published") || null;
  const updated = extractTag(entry, "updated") || null;
  const authors = [...entry.matchAll(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g)]
    .map((match) => normalizeAuthorName(cleanXmlText(match[1])))
    .filter(Boolean);
  const doi = normalizePublicationDoi(cleanXmlText(extractTag(entry, "arxiv:doi")));
  const journalRef = cleanXmlText(extractTag(entry, "arxiv:journal_ref"));

  if (!title) throw new Error(`Could not parse arXiv metadata for ${arxivId}`);

  const identifiers: PaperIdentifier[] = [{
    type: "arxiv",
    value: arxivId,
    label: "arXiv",
    url: `https://arxiv.org/abs/${encodeURIComponent(arxivId)}`,
  }];
  if (doi) identifiers.push({
    type: "doi",
    value: doi,
    label: journalRef || "Published version",
    url: `https://doi.org/${doi}`,
  });

  return {
    paper: {
      arxiv_id: arxivId,
      title,
      authors_json: JSON.stringify(authors),
      abstract,
      published_at: published,
      updated_at: updated,
    },
    identifiers,
  };
}

async function fetchPaperFromCrossref(doi: string, storageId = `doi:${doi.toLowerCase()}`): Promise<FetchedPaper> {
  const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
    headers: {
      "User-Agent": "Scholia/0.1 (+https://github.com/llui2/scholia)",
      Accept: "application/json",
    },
  });

  if (!response.ok) throw new Error(`Crossref returned HTTP ${response.status}`);

  const payload = await response.json() as {
    message?: {
      title?: string[];
      author?: Array<{ given?: string; family?: string; name?: string }>;
      abstract?: string;
      URL?: string;
      publisher?: string;
      "container-title"?: string[];
      "short-container-title"?: string[];
      published?: { "date-parts"?: number[][] };
      "published-print"?: { "date-parts"?: number[][] };
      "published-online"?: { "date-parts"?: number[][] };
      created?: { "date-time"?: string };
    };
  };

  const message = payload.message;
  if (!message) throw new Error(`No Crossref metadata found for ${doi}`);

  const title = cleanHtmlText(message.title?.[0] ?? "");
  const authors = (message.author ?? [])
    .map((author) => author.name ? normalizeAuthorName(author.name) : [author.given, author.family].filter(Boolean).join(" ").trim())
    .filter(Boolean);
  const abstract = cleanHtmlText(message.abstract ?? "");
  const published = crossrefDate(
    message["published-print"] ?? message["published-online"] ?? message.published,
  ) ?? message.created?.["date-time"] ?? null;
  const venue =
    cleanHtmlText(message["container-title"]?.[0] ?? "") ||
    cleanHtmlText(message["short-container-title"]?.[0] ?? "") ||
    cleanHtmlText(message.publisher ?? "") ||
    "Published version";

  if (!title) throw new Error(`Could not parse Crossref metadata for ${doi}`);

  const normalizedDoi = doi.toLowerCase();
  const identifiers: PaperIdentifier[] = [{
    type: "doi",
    value: normalizedDoi,
    label: venue,
    url: `https://doi.org/${normalizedDoi}`,
  }];
  const publisherUrl = message.URL ? normalizePaperUrl(message.URL) : null;
  if (publisherUrl) identifiers.push({
    type: "url",
    value: publisherUrl,
    label: venue,
    url: publisherUrl,
  });

  return {
    paper: {
      arxiv_id: storageId,
      title,
      authors_json: JSON.stringify(authors),
      abstract,
      published_at: published,
      updated_at: published,
    },
    identifiers,
  };
}

async function fetchPaperFromUrl(sourceUrl: string, storageId: string): Promise<FetchedPaper> {
  if (!isSafePaperUrl(sourceUrl)) throw new Error("Only public HTTPS paper URLs are supported");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(sourceUrl, {
      headers: {
        "User-Agent": "Scholia/0.1 (+https://github.com/llui2/scholia)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`Paper page returned HTTP ${response.status}`);

    const finalUrl = normalizePaperUrl(response.url || sourceUrl);
    if (!finalUrl) throw new Error("Paper URL redirected to an unsupported address");

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      throw new Error("Paper URL did not return an HTML page");
    }

    const contentLength = Number(response.headers.get("content-length") ?? "0");
    if (contentLength > 3_000_000) throw new Error("Paper page is too large to inspect");

    const html = await response.text();
    const doi = normalizePublicationDoi(metaContent(html, "citation_doi"));
    if (doi) {
      try {
        const crossref = await fetchPaperFromCrossref(doi, storageId);
        crossref.identifiers.push({
          type: "url",
          value: finalUrl,
          label: sourceHost(finalUrl),
          url: finalUrl,
        });
        crossref.identifiers = dedupeIdentifiers(crossref.identifiers);
        return crossref;
      } catch (error) {
        console.warn("Crossref lookup from paper URL failed; using page metadata", error);
      }
    }

    const title =
      metaContent(html, "citation_title") ||
      metaPropertyContent(html, "og:title") ||
      cleanHtmlText(extractHtmlTitle(html));
    const authors = metaContents(html, "citation_author").map(normalizeAuthorName);
    const abstract =
      metaContent(html, "citation_abstract") ||
      metaContent(html, "description") ||
      metaPropertyContent(html, "og:description");
    const published =
      metaContent(html, "citation_publication_date") ||
      metaContent(html, "citation_date") ||
      null;

    if (!title) throw new Error("Could not find paper metadata at this URL");

    return {
      paper: {
        arxiv_id: storageId,
        title,
        authors_json: JSON.stringify(authors),
        abstract,
        published_at: published,
        updated_at: published,
      },
      identifiers: [{
        type: "url",
        value: finalUrl,
        label: sourceHost(finalUrl),
        url: finalUrl,
      }],
    };
  } finally {
    clearTimeout(timeout);
  }
}

function normalizePublicationDoi(raw: string): string | null {
  const doi = normalizeDoiInput(raw);
  return doi && !isArxivIssuedDoi(doi) ? doi : null;
}

function isArxivIssuedDoi(doi: string): boolean {
  return /^10\.48550\/arxiv\./i.test(doi);
}

function crossrefDate(value?: { "date-parts"?: number[][] }): string | null {
  const parts = value?.["date-parts"]?.[0];
  if (!parts?.length) return null;
  const [year, month = 1, day = 1] = parts;
  if (!year) return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function metaPropertyContent(html: string, property: string): string {
  const escaped = property.replace(/[.*+?^$()|[\\]{}]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([\\s\\S]*?)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([\\s\\S]*?)["'][^>]+property=["']${escaped}["'][^>]*>`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeHtmlEntities(match[1]).trim();
  }

  return "";
}

function extractHtmlTitle(html: string): string {
  return html.match(/<title[^>]*>([\\s\\S]*?)<\/title>/i)?.[1] ?? "";
}

function metaContent(html: string, name: string): string {
  const escaped = name;
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([\\s\\S]*?)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([\\s\\S]*?)["'][^>]+name=["']${escaped}["'][^>]*>`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeHtmlEntities(match[1]).trim();
  }

  return "";
}

function metaContents(html: string, name: string): string[] {
  const escaped = name;
  const pattern = new RegExp(
    `<meta[^>]+name=["']${escaped}["'][^>]+content=["']([\\s\\S]*?)["'][^>]*>`,
    "gi",
  );
  return [...html.matchAll(pattern)]
    .map((match) => decodeHtmlEntities(match[1]).trim())
    .filter(Boolean);
}

function cleanHtmlText(value: string): string {
  return decodeHtmlEntities(
    value
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function normalizePaperInput(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  const arxiv = normalizeArxivInput(value);
  if (arxiv) return arxiv;

  if (value.toLowerCase().startsWith("doi:")) {
    const doi = normalizeDoiInput(value.slice(4));
    if (!doi) return null;
    const arxivFromDoi = arxivIdFromDoi(doi);
    return arxivFromDoi ?? `doi:${doi}`;
  }

  if (value.toLowerCase().startsWith("url:")) {
    const decoded = decodeUrlPaperId(value);
    return decoded && isSafePaperUrl(decoded) ? `url:${encodeURIComponent(decoded)}` : null;
  }

  const doi = normalizeDoiInput(value);
  if (doi) {
    const arxivFromDoi = arxivIdFromDoi(doi);
    return arxivFromDoi ?? `doi:${doi}`;
  }

  const url = normalizePaperUrl(value);
  return url ? `url:${encodeURIComponent(url)}` : null;
}

function normalizeArxivInput(raw: string): string | null {
  let value = raw.trim();
  if (!value) return null;

  value = value.replace(/^https?:\/\/(?:www\.)?arxiv\.org\/(?:abs|pdf)\//i, "");
  value = value.replace(/^arXiv:/i, "");
  value = value.replace(/\.pdf$/i, "");
  value = value.split(/[?#]/, 1)[0];
  value = value.replace(/v\d+$/i, "");

  const modern = /^\d{4}\.\d{4,5}$/;
  const legacy = /^[A-Za-z0-9.\-]+\/\d{7}$/;

  return modern.test(value) || legacy.test(value) ? value : null;
}

function normalizeDoiInput(raw: string): string | null {
  let value = decodeURIComponentSafe(raw.trim());
  if (!value) return null;

  value = value.replace(/^doi:\s*/i, "");
  value = value.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "");
  value = value.split(/[?#]/, 1)[0];

  const direct = value.match(/^10\.\d{4,9}\/\S+$/i)?.[0];
  if (direct) return direct.replace(/[\s.]+$/, "").toLowerCase();

  const embedded = value.match(/10\.\d{4,9}\/[^\s"'<>]+/i)?.[0];
  return embedded ? embedded.replace(/[\s.]+$/, "").toLowerCase() : null;
}

function arxivIdFromDoi(doi: string): string | null {
  const match = doi.match(/^10\.48550\/arxiv\.(.+)$/i);
  return match ? normalizeArxivInput(match[1]) : null;
}

function normalizePaperUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    url.hash = "";
    const normalized = url.toString();
    return isSafePaperUrl(normalized) ? normalized : null;
  } catch {
    return null;
  }
}

function decodeUrlPaperId(paperId: string): string | null {
  if (!paperId.toLowerCase().startsWith("url:")) return null;
  const decoded = decodeURIComponentSafe(paperId.slice(4));
  return normalizePaperUrl(decoded);
}

function isSafePaperUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return false;

    const host = url.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host.endsWith(".local") ||
      host === "::1" ||
      host.startsWith("127.") ||
      host.startsWith("0.") ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      host.startsWith("169.254.") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function decodeURIComponentSafe(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeAuthorName(raw: string): string {
  const value = raw.replace(/\s+/g, " ").trim();
  if (!value) return "";

  const parts = value.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length === 2 && parts[0] && parts[1]) {
    return `${parts[1]} ${parts[0]}`.replace(/\s+/g, " ").trim();
  }

  return value;
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1] ?? "";
}

function cleanXmlText(value: string): string {
  return decodeXmlEntities(value.replace(/\s+/g, " ").trim());
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function renderBrand(): string {
  return `<a class="brand" href="/" aria-label="Scholia home">
    <svg class="brand-mark" viewBox="0 0 310 310" aria-hidden="true">
      <path fill="#BC4F3B" d="M 168 20 L 168 250 C 168 267 165 278 156 283 C 148 288 139 288 130 283 C 120 277 112 269 103 261 L 80 239 C 77 236 78 231 83 230 C 92 230 103 236 114 243 C 124 249 134 257 143 264 L 143 54 C 143 50 141 48 137 48 C 134 48 133 46 135 44 C 145 42 155 34 165 21 C 166 20 167 19 168 20 Z"/>
      <circle cx="211" cy="144" r="19" fill="#BC4F3B"/>
    </svg>
    <span>Scholia</span>
  </a>`;
}

function renderIdentity(user: User | null): string {
  if (!user) {
    return `<a class="identity-link" href="/auth/orcid?next=/">Sign in with ORCID</a>`;
  }

  return `<div class="identity">
    <a href="https://orcid.org/${escapeAttr(user.orcid)}" rel="noreferrer">${escapeHtml(user.display_name)}</a>
    <form action="/logout" method="post"><button class="text-button" type="submit">sign out</button></form>
  </div>`;
}

function htmlPage(title: string, body: string, status = 200): Response {
  return new Response(
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="theme-color" content="#F7F4ED">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400..700&display=swap">
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      --paper: #f7f4ed;
      --ink: #2e2e2a;
      --annotation: #b84b3c;
      --stone: #a7a39a;
      --muted: #77736c;
      --wash: #ebe6dc;
      --surface: rgba(255, 255, 255, .52);

      --font-main: "Source Serif 4", Georgia, serif;

      --radius-sm: 3px;
      --radius-md: 4px;
      --radius-lg: 4px;

      color: var(--ink);
      background: var(--paper);
      font-family: var(--font-main);
      font-size: 16px;
      line-height: 1.55;
      font-weight: 500;
      font-kerning: normal;
      text-rendering: optimizeLegibility;
    }

    * { box-sizing: border-box; }
    body { margin: 0; background: var(--paper); }
    a { color: inherit; text-decoration: none; }
    a:hover { color: var(--annotation); }
    button, input, textarea { font: inherit; }
    button { cursor: pointer; }

    h1, h2, h3, p { margin-top: 0; }
    h1, h2, h3 {
      font-family: var(--font-main);
      font-weight: 500;
      color: var(--ink);
    }

    .topbar {
      min-height: 72px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      padding: 10px max(20px, calc((100vw - 980px) / 2));
    }

    .brand {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      text-decoration: none;
      font-family: var(--font-main);
      font-size: 1.48rem;
      font-weight: 600;
      line-height: 1;
      letter-spacing: -.025em;
    }
    .brand:hover { color: var(--ink); }
    .brand-mark { width: 30px; height: 30px; display: block; }

    .shell {
      width: min(980px, calc(100% - 40px));
      margin: 0 auto;
    }

    .home { padding: 13vh 0 90px; }
    .home h1 {
      max-width: 640px;
      margin: 0;
      font-size: clamp(2.05rem, 4vw, 3rem);
      line-height: 1.08;
      letter-spacing: -.028em;
    }

    .lookup {
      margin-top: 40px;
      max-width: 640px;
    }
    .lookup label,
    .eyebrow {
      display: block;
      margin: 0 0 8px 2px;
      font-family: var(--font-main);
      font-size: .76rem;
      line-height: 1.3;
      letter-spacing: .035em;
      color: var(--muted);
      font-weight: 500;
    }
    .lookup-control {
      display: flex;
      align-items: stretch;
      gap: 8px;
      padding: 0;
      background: transparent;
    }

    input, textarea {
      width: 100%;
      border: 0;
      outline: 0;
      background: #fbf9f3;
      color: var(--ink);
      padding: 13px 14px;
      border-radius: var(--radius-sm);
      font-family: var(--font-main);
    }
    .lookup input {
      min-width: 0;
      background: #ece7dc;
      padding: 13px 14px;
    }
    input:focus-visible,
    textarea:focus-visible {
      background: #f3ede3;
    }
    textarea { resize: vertical; }

    button,
    .button-link {
      border: 0;
      background: var(--annotation);
      color: #fffaf5;
      padding: 11px 16px;
      border-radius: 2px;
      font-family: var(--font-main);
      font-size: .92rem;
      font-weight: 500;
      text-decoration: none;
      white-space: nowrap;
    }
    button:hover,
    .button-link:hover {
      color: #fffaf5;
      filter: brightness(.96);
    }

    .paper-page { padding: 28px 0 90px; }
    .back {
      display: inline-block;
      margin-bottom: 22px;
      color: var(--muted);
      font-size: .8rem;
      text-decoration: none;
    }

    .paper-window {
      padding: 12px 0 0;
      background: transparent;
    }

    .paper-grid {
      display: grid;
      grid-template-columns: 158px minmax(0, 1fr);
      gap: 0 32px;
      align-items: start;
    }

    .paper-meta {
      padding-top: 7px;
    }

    .paper-id {
      margin: 0 0 12px;
      color: var(--annotation);
      font-size: .8rem;
      font-weight: 650;
      line-height: 1.3;
      letter-spacing: .01em;
    }

    .paper-venue {
      margin: 0 0 10px;
      color: var(--annotation);
      font-size: .82rem;
      font-weight: 650;
      line-height: 1.28;
    }

    .paper-links {
      display: grid;
      gap: 6px;
    }

    .paper-source {
      display: inline-block;
      color: var(--muted);
      font-size: .8rem;
      line-height: 1.3;
      white-space: nowrap;
    }

    .paper-doi {
      margin: 12px 0 0;
      color: #8a867e;
      font-size: .68rem;
      line-height: 1.25;
      overflow-wrap: anywhere;
    }

    .paper-main { min-width: 0; }
    .paper-summary { max-width: 760px; }

    .paper-summary h1 {
      max-width: 760px;
      margin: 0;
      font-size: clamp(1.9rem, 3.8vw, 2.9rem);
      line-height: 1.05;
      font-weight: 620;
      letter-spacing: -.025em;
    }

    .authors {
      margin: 20px 0 0;
      max-width: 720px;
      color: #625f58;
      font-size: .98rem;
      font-weight: 520;
      line-height: 1.55;
    }

    .abstract-disclosure {
      max-width: 720px;
      margin-top: 20px;
      color: #59564f;
    }
    .abstract-disclosure summary {
      cursor: pointer;
      color: var(--annotation);
      font-weight: 600;
      list-style: none;
    }
    .abstract-disclosure summary::-webkit-details-marker { display: none; }
    .abstract-disclosure p {
      margin: 12px 0 0;
      max-width: 720px;
      font-size: .97rem;
      line-height: 1.68;
      font-weight: 450;
    }

    .paper-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      margin-top: 52px;
      padding: 0;
      background: transparent;
    }
    .paper-tabs a {
      padding: 0;
      color: var(--muted);
      font-size: .9rem;
      font-weight: 600;
      letter-spacing: .012em;
      text-decoration: none;
    }
    .paper-tabs a.active {
      background: transparent;
      color: var(--annotation);
    }
    .paper-tab { margin-top: 32px; }

    .discussion-meta {
      display: flex;
      justify-content: flex-start;
      margin-bottom: 12px;
      color: var(--muted);
      font-family: var(--font-main);
      font-size: .76rem;
      font-weight: 500;
    }

    .signin-plain {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 20px;
      margin: 20px 0 32px;
    }
    .signin-plain p {
      margin: 0;
      color: #5f5b54;
      font-size: .95rem;
    }

    .composer {
      margin: 20px 0 32px;
      padding: 18px 20px;
      background: var(--wash);
      border-radius: 2px;
    }

    .composer-meta,
    .composer-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      color: var(--muted);
      font-size: .76rem;
    }
    .composer-meta strong { color: var(--ink); }
    .composer textarea {
      margin: 12px 0;
      background: #f7f4ed;
      line-height: 1.55;
      border-radius: 2px;
    }
    .reply-note {
      margin-bottom: 0;
      color: var(--muted);
      font-size: .78rem;
    }

    .comments {
      display: grid;
      gap: 32px;
      margin-top: 32px;
    }
    .comment {
      margin-left: calc(var(--depth) * 22px);
      padding: 0;
      background: transparent;
    }
    .comment-head {
      display: flex;
      gap: 9px;
      flex-wrap: wrap;
      align-items: baseline;
      font-size: .76rem;
    }
    .comment-head a {
      color: var(--ink);
      font-weight: 600;
      text-decoration: none;
    }
    .comment-head span,
    .comment-head time {
      color: #8a867e;
      font-family: var(--font-main);
      font-size: .73rem;
    }
    .comment-body {
      margin: 9px 0 10px;
      max-width: 760px;
      line-height: 1.62;
    }
    .comment-actions {
      display: flex;
      gap: 12px;
      color: #8a867e;
      font-size: .74rem;
      font-weight: 500;
    }
    .comment-actions a { text-decoration: none; }
    .replies { margin-top: 22px; }

    .tab-empty {
      min-height: 150px;
      padding: 20px 4px;
      color: var(--muted);
    }
    .tab-empty h2 {
      margin: 0 0 6px;
      font-size: 1.35rem;
    }
    .tab-empty p {
      margin: 0;
      font-size: .93rem;
    }

    .empty,
    .muted { color: var(--muted); }

    .identity {
      display: flex;
      gap: 12px;
      align-items: center;
      font-size: .78rem;
    }
    .identity-link {
      color: var(--muted);
      font-size: .78rem;
      text-decoration: none;
    }
    .identity form { margin: 0; }

    .text-button {
      background: none;
      color: #8a867e;
      padding: 0;
      border-radius: 0;
      font-size: .78rem;
      font-weight: 500;
      text-decoration: none;
    }
    .text-button:hover {
      color: var(--annotation);
      filter: none;
    }

    .notice {
      max-width: 640px;
      margin-top: 22px;
      padding: 11px 13px;
      background: #efe2dd;
      border-radius: 2px;
      color: #69433d;
      font-size: .9rem;
    }

    .utility-page {
      padding: 15vh 0 80px;
      max-width: 720px;
    }
    .utility-page h1 {
      margin: 0 0 14px;
      font-size: clamp(2rem, 4vw, 3rem);
      line-height: 1.08;
      letter-spacing: -.025em;
    }
    .utility-page p {
      max-width: 620px;
    }

    @media (max-width: 680px) {
      .topbar { min-height: 64px; }
      .brand { font-size: 1.3rem; }
      .brand-mark { width: 27px; height: 27px; }
      .home { padding-top: 10vh; }
      .lookup-control,
      .signin-plain {
        flex-direction: column;
        align-items: stretch;
      }
      .paper-window {
        padding: 8px 0 0;
      }
      .paper-grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }
      .paper-meta {
        display: flex;
        align-items: baseline;
        gap: 14px;
        padding-top: 0;
      }
      .paper-id,
      .paper-venue,
      .paper-doi { margin: 0; }
      .paper-links { display: flex; gap: 12px; }
      .paper-source { max-width: none; }
      .paper-tabs {
        display: flex;
        width: 100%;
        gap: 18px;
        overflow-x: auto;
      }
      .paper-tabs a {
        flex: 0 0 auto;
        text-align: left;
      }
      .comment {
        margin-left: calc(min(var(--depth), 2) * 14px);
      }
      .comment-head span { display: none; }
      .composer-actions { align-items: flex-end; }
    }
  </style>
</head>
<body>${body}</body>
</html>`,
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Content-Security-Policy": "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; form-action 'self' https://orcid.org; frame-ancestors 'none'; base-uri 'none'",
      },
    },
  );
}

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function redirect(location: string, status = 302): Response {
  return new Response(null, { status, headers: { Location: location } });
}

function notFound(message: string): Response {
  return htmlPage(
    "Not found · Scholia",
    `<main class="shell utility-page"><p class="eyebrow">Scholia</p><h1>Not found.</h1><p class="muted">${escapeHtml(message)}</p><p><a href="/">Return home</a></p></main>`,
    404,
  );
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(value: unknown): string {
  return escapeHtml(value);
}

function safeJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function formatDate(value: string): string {
  const date = new Date(value.endsWith("Z") || /[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function parseCookies(header: string): Map<string, string> {
  const cookies = new Map<string, string>();
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) cookies.set(key, decodeURIComponent(value));
  }
  return cookies;
}

function sessionCookie(token: string, request: Request, maxAge: number): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `scholia_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function randomToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function base64UrlEncode(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function decodeNextFromState(state: string): string {
  const separator = state.indexOf(":");
  if (separator < 0) return "/";
  try {
    const next = base64UrlDecode(state.slice(separator + 1));
    return next.startsWith("/") && !next.startsWith("//") ? next : "/";
  } catch {
    return "/";
  }
}

function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("Origin");
  if (!origin) return;
  if (origin !== new URL(request.url).origin) {
    throw new Error("Cross-origin form submission rejected");
  }
}
