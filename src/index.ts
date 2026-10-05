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

const TRAILS_LOGO_SVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 128 128\" role=\"img\" aria-label=\"Trails logo\">\n  <image width=\"128\" height=\"128\" href=\"data:image/png;base64,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\"/>\n</svg>\n";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await route(request, env);
    } catch (error) {
      console.error(error);
      return htmlPage(
        "error",
        `<main class="shell utility-page"><h1>Something went wrong.</h1><p class="muted">${escapeHtml(
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
    return new Response(TRAILS_LOGO_SVG, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  }

  if (request.method === "GET" && path === "/health") {
    return json({ ok: true, service: "trails" });
  }

  return notFound("Page not found.");
}

async function renderHome(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const user = await currentUser(request, env);
  const error = url.searchParams.get("error");

  return htmlPage(
    "trails",
    `<header class="topbar">
      ${renderBrand()}
      ${renderIdentity(user)}
    </header>
    <main class="shell home">
      <h1>Through the maze.</h1>
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
    paper.title,
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

  if (!user) return new Response("Could not create user", { status: 500 });

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
  const token = cookies.get("session");

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
  const token = cookies.get("session");
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

async function ensurePaper(env: Env, rawPaperId: string): Promise<Paper> {
  const paperId = normalizePaperInput(rawPaperId);
  if (!paperId) throw new Error("Invalid paper identifier or URL");
  const requestedIdentifier = identifierFromPaperId(paperId);
  if (!requestedIdentifier) throw new Error("Invalid paper identifier or URL");

  const aliasedStorageId = await findStorageIdByIdentifier(env, requestedIdentifier);
  if (aliasedStorageId) {
    const aliased = await getPaperByStorageId(env, aliasedStorageId);
    if (aliased) {
      const matching = await findMatchingPaper(env, aliased, aliasedStorageId);
      if (matching) {
        const storageId = await mergePaperRows(env, aliasedStorageId, matching.arxiv_id);
        const merged = await getPaperByStorageId(env, storageId);
        if (merged) return merged;
      }
      return aliased;
    }
  }

  let cached = await getPaperByStorageId(env, paperId);
  if (cached) {
    const existingIdentifiers = await getPaperIdentifiers(env, cached.arxiv_id);
    let storageId = cached.arxiv_id;

    if (existingIdentifiers.length === 0) {
      storageId = await enrichPaperIdentifiers(env, cached, requestedIdentifier);
    }

    const matching = await findMatchingPaper(env, cached, storageId);
    if (matching) storageId = await mergePaperRows(env, storageId, matching.arxiv_id);

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
  const discovered: PaperIdentifier[] = [requestedIdentifier];

  try {
    if (requestedIdentifier.type === "arxiv") {
      discovered.push(...await fetchArxivRelations(requestedIdentifier.value));
    } else if (requestedIdentifier.type === "doi") {
      const refreshed = await fetchPaperFromCrossref(requestedIdentifier.value, paper.arxiv_id);
      discovered.push(...refreshed.identifiers);
    } else {
      const refreshed = await fetchPaperFromUrl(requestedIdentifier.value, paper.arxiv_id);
      discovered.push(...refreshed.identifiers);
    }
  } catch (error) {
    console.warn("Could not enrich legacy paper identifiers", error);
  }

  return attachIdentifiers(env, paper.arxiv_id, discovered);
}

async function getPaperByStorageId(env: Env, storageId: string): Promise<Paper | null> {
  return env.DB.prepare(
    "SELECT arxiv_id, title, authors_json, abstract, published_at, updated_at FROM papers WHERE arxiv_id = ?",
  )
    .bind(storageId)
    .first<Paper>();
}

async function getPaperIdentifiers(env: Env, storageId: string): Promise<PaperIdentifier[]> {
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
      WHERE (? IS NULL OR arxiv_id <> ?)
      ORDER BY fetched_at DESC
      LIMIT 250`,
  )
    .bind(excludeStorageId, excludeStorageId)
    .all<Paper>();

  const targetTitle = titleFingerprint(paper.title);
  if (!targetTitle) return null;

  for (const candidate of result.results ?? []) {
    if (titleFingerprint(candidate.title) !== targetTitle) continue;
    if (authorListsMatch(paper.authors_json, candidate.authors_json)) return candidate;
  }

  return null;
}

function titleFingerprint(value: string): string {
  return decodeHtmlEntities(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function authorListsMatch(firstJson: string, secondJson: string): boolean {
  const first = safeJsonArray(firstJson).map(authorFingerprint).filter(Boolean);
  const second = safeJsonArray(secondJson).map(authorFingerprint).filter(Boolean);
  if (!first.length || !second.length) return false;

  const secondSet = new Set(second);
  const overlap = first.filter((author) => secondSet.has(author)).length;
  return overlap >= Math.min(first.length, second.length, 2) &&
    overlap / Math.min(first.length, second.length) >= 0.75;
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
        "User-Agent": "trails/0.1",
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
      "User-Agent": "trails/0.1",
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
      "User-Agent": "trails/0.1",
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
      "User-Agent": "trails/0.1",
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

  try {
    const arxiv = await findArxivByTitleAndAuthors(title, authors);
    if (arxiv) identifiers.push(arxiv);
  } catch (error) {
    console.warn("Could not resolve Crossref paper to arXiv", error);
  }

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

async function findArxivByTitleAndAuthors(
  title: string,
  authors: string[],
): Promise<PaperIdentifier | null> {
  const words = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .match(/[a-z0-9]+/g)
    ?.filter((word) => word.length >= 6)
    .slice(0, 3) ?? [];

  if (words.length < 2) return null;

  const endpoint = new URL("https://export.arxiv.org/api/query");
  endpoint.searchParams.set(
    "search_query",
    words.map((word) => `ti:${word}`).join(" AND "),
  );
  endpoint.searchParams.set("start", "0");
  endpoint.searchParams.set("max_results", "8");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(endpoint, {
      headers: {
        "User-Agent": "trails/0.1",
        Accept: "application/atom+xml",
      },
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const xml = await response.text();
    const targetTitle = titleFingerprint(title);
    const targetAuthors = authors.map(authorFingerprint).filter(Boolean);

    for (const match of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
      const entry = match[1];
      const candidateTitle = cleanXmlText(extractTag(entry, "title"));
      if (titleFingerprint(candidateTitle) !== targetTitle) continue;

      const candidateAuthors = [...entry.matchAll(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g)]
        .map((authorMatch) => authorFingerprint(cleanXmlText(authorMatch[1])))
        .filter(Boolean);
      const candidateSet = new Set(candidateAuthors);
      const overlap = targetAuthors.filter((author) => candidateSet.has(author)).length;
      if (targetAuthors.length && overlap / Math.min(targetAuthors.length, candidateAuthors.length) < 0.75) {
        continue;
      }

      const idUrl = cleanXmlText(extractTag(entry, "id"));
      const arxiv = normalizeArxivInput(idUrl);
      if (!arxiv) continue;

      return {
        type: "arxiv",
        value: arxiv,
        label: "arXiv",
        url: `https://arxiv.org/abs/${encodeURIComponent(arxiv)}`,
      };
    }

    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchPaperFromUrl(sourceUrl: string, storageId: string): Promise<FetchedPaper> {
  if (!isSafePaperUrl(sourceUrl)) throw new Error("Only public HTTPS paper URLs are supported");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(sourceUrl, {
      headers: {
        "User-Agent": "trails/0.1",
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
  return `<a class="brand" href="/" aria-label="trails home">
    <img class="brand-mark" src="/favicon.svg" alt="" aria-hidden="true">
    <span>trails</span>
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
      --annotation: #315c84;
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
    .brand-mark {
      width: 34px;
      height: 26px;
      display: block;
      object-fit: contain;
      flex: 0 0 auto;
    }

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
      grid-template-columns: 148px minmax(0, 1fr);
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
      background: #e3eaf0;
      border-radius: 2px;
      color: #3d5569;
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
    "Not found",
    `<main class="shell utility-page"><h1>Not found.</h1><p class="muted">${escapeHtml(message)}</p><p><a href="/">Return home</a></p></main>`,
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
  return `session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
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
