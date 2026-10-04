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
    const raw = url.searchParams.get("arxiv") ?? "";
    const id = normalizeArxivInput(raw);
    if (!id) {
      return redirect("/?error=Enter+a+valid+arXiv+ID+or+URL");
    }
    return redirect(`/p/${encodeURIComponent(id)}`);
  }

  if (request.method === "GET" && path.startsWith("/p/")) {
    const id = normalizeArxivInput(decodeURIComponent(path.slice(3)));
    if (!id) return notFound("Invalid arXiv identifier.");
    return renderPaper(request, env, id);
  }

  if (request.method === "GET" && path.startsWith("/api/papers/")) {
    const id = normalizeArxivInput(decodeURIComponent(path.slice("/api/papers/".length)));
    if (!id) return json({ error: "invalid arXiv id" }, 400);
    const paper = await ensurePaper(env, id);
    return json({
      ...paper,
      authors: safeJsonArray(paper.authors_json),
      arxiv_url: `https://arxiv.org/abs/${paper.arxiv_id}`,
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
      <h1>A public discussion record for scientific papers.</h1>
      ${error ? `<p class="notice">${escapeHtml(error)}</p>` : ""}
      <form class="lookup" action="/go" method="get">
        <label for="arxiv">arXiv</label>
        <div class="lookup-control">
          <input id="arxiv" name="arxiv" placeholder="Paste an arXiv ID or URL" autocomplete="off" required>
          <button type="submit">Open</button>
        </div>
      </form>
    </main>`,
  );
}

async function renderPaper(request: Request, env: Env, arxivId: string): Promise<Response> {
  const paper = await ensurePaper(env, arxivId);
  const user = await currentUser(request, env);
  const url = new URL(request.url);
  const replyToRaw = url.searchParams.get("reply");
  const replyTo = replyToRaw && /^\\d+$/.test(replyToRaw) ? Number(replyToRaw) : null;
  const requestedTab = url.searchParams.get("tab");
  const tab = requestedTab === "references" || requestedTab === "related" ? requestedTab : "discussion";

  const result = await env.DB.prepare(
    `SELECT c.id, c.paper_id, c.user_id, c.parent_id, c.body, c.created_at,
            u.display_name, u.orcid
       FROM comments c
       JOIN users u ON u.id = c.user_id
      WHERE c.paper_id = ?
      ORDER BY c.created_at ASC, c.id ASC`,
  )
    .bind(arxivId)
    .all<CommentRow>();

  const comments = result.results ?? [];
  const commentIds = new Set(comments.map((comment) => comment.id));
  const validReplyTo = replyTo && commentIds.has(replyTo) ? replyTo : null;
  const authors = safeJsonArray(paper.authors_json);
  const paperUrl = `/p/${encodeURIComponent(arxivId)}`;

  const tabLink = (id: "discussion" | "references" | "related", label: string): string =>
    `<a href="${paperUrl}?tab=${id}"${tab === id ? ` class="active" aria-current="page"` : ""}>${label}</a>`;

  const discussion = `<section class="discussion">
    <div class="discussion-meta">
      <span>${comments.length} ${comments.length === 1 ? "comment" : "comments"}</span>
    </div>
    ${renderComposer(user, arxivId, validReplyTo)}
    ${comments.length ? renderCommentTree(comments, arxivId) : `<p class="empty">No discussion yet.</p>`}
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
        <div class="paper-summary">
          <p class="paper-id">arXiv:${escapeHtml(paper.arxiv_id)}</p>
          <h1>${escapeHtml(paper.title)}</h1>
          <p class="authors">${authors.map(escapeHtml).join(", ")}</p>

          <div class="paper-actions">
            <a href="https://arxiv.org/abs/${encodeURIComponent(paper.arxiv_id)}" rel="noreferrer">arXiv ↗</a>
            <details class="abstract-disclosure">
              <summary>Abstract</summary>
              <p>${escapeHtml(paper.abstract)}</p>
            </details>
          </div>
        </div>

        <nav class="paper-tabs" aria-label="Paper sections">
          ${tabLink("discussion", "Discussion")}
          ${tabLink("references", "References")}
          ${tabLink("related", "Related papers")}
        </nav>

        <div class="paper-tab">
          ${tabContent}
        </div>
      </article>
    </main>`,
  );
}

function renderComposer(user: User | null, paperId: string, replyTo: number | null): string {
  if (!user) {
    const next = `/p/${encodeURIComponent(paperId)}`;
    return `<div class="signin-box">
      <p>Contributions are attached to a persistent ORCID identity.</p>
      <a class="button-link" href="/auth/orcid?next=${encodeURIComponent(next)}">Sign in with ORCID</a>
    </div>`;
  }

  return `<form id="comment-form" class="composer" action="/api/comments" method="post">
    <input type="hidden" name="paper_id" value="${escapeAttr(paperId)}">
    ${replyTo ? `<input type="hidden" name="parent_id" value="${replyTo}">` : ""}
    <div class="composer-meta">
      <span>Commenting as <strong>${escapeHtml(user.display_name)}</strong></span>
      ${replyTo ? `<a href="/p/${encodeURIComponent(paperId)}#comment-form">cancel reply</a>` : ""}
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
  const paperId = normalizeArxivInput(rawPaper);
  const body = String(form.get("body") ?? "").trim();
  const parentRaw = String(form.get("parent_id") ?? "").trim();

  if (!paperId) return new Response("Invalid arXiv id", { status: 400 });
  if (!body || body.length > 5000) {
    return new Response("Comment must contain 1–5000 characters", { status: 400 });
  }

  await ensurePaper(env, paperId);

  let parentId: number | null = null;
  if (parentRaw) {
    if (!/^\d+$/.test(parentRaw)) return new Response("Invalid parent comment", { status: 400 });
    parentId = Number(parentRaw);
    const parent = await env.DB.prepare(
      "SELECT id FROM comments WHERE id = ? AND paper_id = ?",
    )
      .bind(parentId, paperId)
      .first();
    if (!parent) return new Response("Parent comment not found", { status: 400 });
  }

  await env.DB.prepare(
    "INSERT INTO comments (paper_id, user_id, parent_id, body) VALUES (?, ?, ?, ?)",
  )
    .bind(paperId, user.id, parentId, body)
    .run();

  return redirect(`/p/${encodeURIComponent(paperId)}`, 303);
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

async function ensurePaper(env: Env, arxivId: string): Promise<Paper> {
  const cached = await env.DB.prepare(
    "SELECT arxiv_id, title, authors_json, abstract, published_at, updated_at FROM papers WHERE arxiv_id = ?",
  )
    .bind(arxivId)
    .first<Paper>();

  if (cached) return cached;

  let paper: Paper | null = null;

  try {
    paper = await fetchPaperFromAbs(arxivId);
  } catch (error) {
    console.warn("Fast arXiv metadata lookup failed; falling back to Atom API", error);
  }

  if (!paper) {
    paper = await fetchPaperFromAtom(arxivId);
  }

  await env.DB.prepare(
    `INSERT INTO papers (arxiv_id, title, authors_json, abstract, published_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      paper.arxiv_id,
      paper.title,
      paper.authors_json,
      paper.abstract,
      paper.published_at,
      paper.updated_at,
    )
    .run();

  return paper;
}

async function fetchPaperFromAbs(arxivId: string): Promise<Paper> {
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

    if (!response.ok) {
      throw new Error(`arXiv abstract page returned HTTP ${response.status}`);
    }

    const html = await response.text();
    const title = metaContent(html, "citation_title");
    const authors = metaContents(html, "citation_author");
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

    return {
      arxiv_id: arxivId,
      title,
      authors_json: JSON.stringify(authors),
      abstract,
      published_at: published,
      updated_at: published,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchPaperFromAtom(arxivId: string): Promise<Paper> {
  const endpoint = new URL("https://export.arxiv.org/api/query");
  endpoint.searchParams.set("id_list", arxivId);

  const response = await fetch(endpoint, {
    headers: {
      "User-Agent": "Scholia/0.1 (+https://github.com/llui2/scholia)",
      Accept: "application/atom+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`arXiv returned HTTP ${response.status}`);
  }

  const xml = await response.text();
  const entry = xml.match(/<entry>([\s\S]*?)<\/entry>/)?.[1];
  if (!entry) throw new Error(`No arXiv paper found for ${arxivId}`);

  const title = cleanXmlText(extractTag(entry, "title"));
  const abstract = cleanXmlText(extractTag(entry, "summary"));
  const published = extractTag(entry, "published") || null;
  const updated = extractTag(entry, "updated") || null;
  const authors = [...entry.matchAll(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g)]
    .map((match) => cleanXmlText(match[1]))
    .filter(Boolean);

  if (!title) throw new Error(`Could not parse arXiv metadata for ${arxivId}`);

  return {
    arxiv_id: arxivId,
    title,
    authors_json: JSON.stringify(authors),
    abstract,
    published_at: published,
    updated_at: updated,
  };
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

      --font-main: Charter, "Bitstream Charter", "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;

      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 18px;

      color: var(--ink);
      background: var(--paper);
      font-family: var(--font-main);
      font-size: 16px;
      line-height: 1.55;
      font-kerning: normal;
      text-rendering: optimizeLegibility;
    }

    * { box-sizing: border-box; }
    body { margin: 0; background: var(--paper); }
    a { color: inherit; text-underline-offset: 3px; }
    a:hover { color: var(--annotation); }
    button, input, textarea { font: inherit; }
    button { cursor: pointer; }

    h1, h2, h3, p { margin-top: 0; }
    h1, h2, h3 {
      font-family: var(--font-main);
      font-weight: 400;
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
    }
    .lookup-control {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px;
      background: rgba(255, 255, 255, .48);
      border-radius: 14px;
      box-shadow: 0 12px 34px rgba(46, 46, 42, .05);
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
      background: transparent;
      padding: 13px 12px;
    }
    input:focus-visible,
    textarea:focus-visible {
      box-shadow: 0 0 0 3px rgba(184, 75, 60, .12);
    }
    textarea { resize: vertical; }

    button,
    .button-link {
      border: 0;
      background: var(--annotation);
      color: #fffaf5;
      padding: 11px 15px;
      border-radius: var(--radius-sm);
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
      padding: clamp(24px, 4vw, 44px);
      background: var(--surface);
      border-radius: var(--radius-lg);
      box-shadow: 0 18px 55px rgba(46, 46, 42, .05);
    }

    .paper-summary { max-width: 840px; }
    .paper-id {
      margin: 0 0 12px;
      color: var(--annotation);
      font-family: var(--font-main);
      font-size: .78rem;
      line-height: 1.3;
      letter-spacing: .015em;
    }

    .paper-summary h1 {
      max-width: 860px;
      margin: 0;
      font-size: clamp(2rem, 4.6vw, 3.55rem);
      line-height: 1.04;
      letter-spacing: -.03em;
    }

    .authors {
      margin: 16px 0 0;
      color: #69655e;
      font-size: .96rem;
      line-height: 1.5;
    }

    .paper-actions {
      display: flex;
      align-items: flex-start;
      gap: 18px;
      flex-wrap: wrap;
      margin-top: 22px;
      font-size: .86rem;
    }
    .paper-actions > a {
      color: var(--annotation);
      font-weight: 600;
      text-decoration: none;
    }

    .abstract-disclosure {
      max-width: 720px;
      color: #59564f;
    }
    .abstract-disclosure summary {
      cursor: pointer;
      color: var(--muted);
      font-weight: 500;
      list-style: none;
    }
    .abstract-disclosure summary::-webkit-details-marker { display: none; }
    .abstract-disclosure[open] { flex-basis: 100%; }
    .abstract-disclosure p {
      margin: 12px 0 0;
      max-width: 760px;
      font-size: .95rem;
      line-height: 1.65;
    }

    .paper-tabs {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-top: 34px;
      padding: 5px;
      background: var(--wash);
      border-radius: 11px;
    }
    .paper-tabs a {
      padding: 8px 12px;
      border-radius: 7px;
      color: var(--muted);
      font-size: .9rem;
      font-weight: 400;
      text-decoration: none;
    }
    .paper-tabs a.active {
      background: #fbf9f3;
      color: var(--ink);
      box-shadow: 0 5px 14px rgba(46, 46, 42, .06);
    }
    .paper-tab { margin-top: 26px; }

    .discussion-meta {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 8px;
      color: var(--muted);
      font-family: var(--font-main);
      font-size: .76rem;
    }

    .signin-box,
    .composer {
      margin: 12px 0 24px;
      padding: 18px;
      background: #fbf9f3;
      border-radius: var(--radius-md);
    }
    .signin-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
    }
    .signin-box p {
      margin: 0;
      color: #5f5b54;
      font-size: .93rem;
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
      background: #f2eee5;
      line-height: 1.55;
    }
    .reply-note {
      margin-bottom: 0;
      color: var(--muted);
      font-size: .78rem;
    }

    .comments {
      display: grid;
      gap: 10px;
      margin-top: 12px;
    }
    .comment {
      margin-left: calc(var(--depth) * 18px);
      padding: 17px 19px;
      background: rgba(255, 255, 255, .44);
      border-radius: var(--radius-md);
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
    }
    .comment-actions a { text-decoration: none; }
    .replies { margin-top: 8px; }

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
      font-weight: 400;
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
      border-radius: var(--radius-sm);
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
      .signin-box {
        flex-direction: column;
        align-items: stretch;
      }
      .paper-window {
        padding: 22px 18px;
        border-radius: 14px;
      }
      .paper-tabs {
        display: flex;
        width: 100%;
      }
      .paper-tabs a {
        flex: 1;
        text-align: center;
        padding-inline: 8px;
      }
      .comment {
        margin-left: calc(min(var(--depth), 2) * 10px);
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
        "Content-Security-Policy": "default-src 'self'; style-src 'unsafe-inline'; form-action 'self' https://orcid.org; frame-ancestors 'none'; base-uri 'none'",
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
