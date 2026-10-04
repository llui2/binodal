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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await route(request, env);
    } catch (error) {
      console.error(error);
      return htmlPage(
        "Scholia · error",
        `<main class="shell"><p class="kicker">Scholia</p><h1>Something went wrong.</h1><p class="muted">${escapeHtml(
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
      <a class="brand" href="/">scholia</a>
      ${renderIdentity(user)}
    </header>
    <main class="shell home">
      <h1>A public discussion record for scientific papers.</h1>
      ${error ? `<p class="notice">${escapeHtml(error)}</p>` : ""}
      <form class="lookup" action="/go" method="get">
        <label for="arxiv">arXiv paper</label>
        <div class="lookup-row">
          <input id="arxiv" name="arxiv" placeholder="2601.12345 or arxiv.org/abs/2601.12345" autocomplete="off" required>
          <button type="submit">Open discussion</button>
        </div>
      </form>
      <section class="principles">
        <div><strong>Canonical source</strong><span>The paper stays on arXiv.</span></div>
        <div><strong>Persistent identity</strong><span>Posting requires ORCID.</span></div>
        <div><strong>Generic discussion</strong><span>No forced taxonomy of scientific interaction.</span></div>
      </section>
    </main>`,
  );
}

async function renderPaper(request: Request, env: Env, arxivId: string): Promise<Response> {
  const paper = await ensurePaper(env, arxivId);
  const user = await currentUser(request, env);
  const url = new URL(request.url);
  const replyToRaw = url.searchParams.get("reply");
  const replyTo = replyToRaw && /^\d+$/.test(replyToRaw) ? Number(replyToRaw) : null;

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

  return htmlPage(
    `${paper.title} · Scholia`,
    `<header class="topbar">
      <a class="brand" href="/">scholia</a>
      ${renderIdentity(user)}
    </header>
    <main class="shell paper-page">
      <a class="back" href="/">← papers</a>
      <article class="paper-card">
        <p class="kicker">arXiv:${escapeHtml(paper.arxiv_id)}</p>
        <h1>${escapeHtml(paper.title)}</h1>
        <p class="authors">${authors.map(escapeHtml).join(", ")}</p>
        <p class="abstract">${escapeHtml(paper.abstract)}</p>
        <div class="paper-links">
          <a href="https://arxiv.org/abs/${encodeURIComponent(paper.arxiv_id)}" rel="noreferrer">View on arXiv ↗</a>
        </div>
      </article>

      <section class="discussion">
        <div class="section-heading">
          <h2>Discussion</h2>
          <span>${comments.length} ${comments.length === 1 ? "comment" : "comments"}</span>
        </div>

        ${renderComposer(user, arxivId, validReplyTo)}
        ${comments.length ? renderCommentTree(comments, arxivId) : `<p class="empty">No discussion yet.</p>`}
      </section>
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
            <a href="/p/${encodeURIComponent(paperId)}?reply=${comment.id}#comment-form">reply</a>
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

  await env.DB.prepare(
    `INSERT INTO papers (arxiv_id, title, authors_json, abstract, published_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(arxivId, title, JSON.stringify(authors), abstract, published, updated)
    .run();

  return {
    arxiv_id: arxivId,
    title,
    authors_json: JSON.stringify(authors),
    abstract,
    published_at: published,
    updated_at: updated,
  };
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
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      color: #171717;
      background: #f6f4ee;
      line-height: 1.55;
    }
    * { box-sizing: border-box; }
    body { margin: 0; }
    a { color: inherit; text-underline-offset: 3px; }
    button, input, textarea { font: inherit; }
    button { cursor: pointer; }
    .topbar {
      height: 58px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 max(20px, calc((100vw - 920px) / 2));
    }
    .brand { font-weight: 700; text-decoration: none; letter-spacing: -.04em; }
    .shell { width: min(920px, calc(100% - 40px)); margin: 0 auto; }
    .home { padding: 12vh 0 80px; }
    .home h1, .paper-card h1 { letter-spacing: -.045em; line-height: 1.08; }
    .home h1 { max-width: 760px; font-size: clamp(2.4rem, 7vw, 5.4rem); margin: 12px 0 24px; }
    .lede { max-width: 700px; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 1.08rem; color: #52504b; }
    .kicker { text-transform: uppercase; letter-spacing: .12em; font-size: .76rem; color: #77736a; }
    .lookup { margin-top: 48px; max-width: 760px; }
    .lookup label { display: block; margin-bottom: 8px; font-size: .82rem; }
    .lookup-row { display: flex; gap: 8px; }
    input, textarea {
      width: 100%;
      border: 1px solid #bbb6aa;
      background: #fffefa;
      color: #171717;
      padding: 12px 13px;
      border-radius: 4px;
    }
    textarea { resize: vertical; }
    button, .button-link {
      border: 1px solid #171717;
      background: #171717;
      color: #fff;
      padding: 10px 14px;
      border-radius: 4px;
      text-decoration: none;
      white-space: nowrap;
    }
    .principles {
      margin-top: 64px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 28px;
    }
    .principles div { padding: 18px 18px 18px 0; }
    .principles strong, .principles span { display: block; }
    .principles span { color: #6b675f; font-family: ui-sans-serif, system-ui, sans-serif; font-size: .9rem; margin-top: 4px; }
    .paper-page { padding: 36px 0 100px; }
    .back { color: #6b675f; font-size: .85rem; }
    .paper-card { padding: 42px 0 50px; }
    .paper-card h1 { font-size: clamp(2rem, 5vw, 3.6rem); margin: 10px 0 18px; }
    .authors { color: #55514a; }
    .abstract { font-family: ui-sans-serif, system-ui, sans-serif; max-width: 820px; color: #35332f; margin-top: 26px; }
    .paper-links { margin-top: 24px; font-size: .9rem; }
    .discussion { padding-top: 40px; }
    .section-heading { display: flex; justify-content: space-between; align-items: baseline; }
    .section-heading h2 { font-size: 1.25rem; }
    .section-heading span { color: #77736a; font-size: .82rem; }
    .signin-box, .composer { margin: 24px 0 34px; padding: 18px; background: rgba(255,255,255,.45); border-radius: 8px; }
    .signin-box { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
    .signin-box p { margin: 0; color: #55514a; }
    .composer-meta, .composer-actions { display: flex; justify-content: space-between; align-items: center; gap: 16px; font-size: .78rem; color: #77736a; }
    .composer textarea { margin: 12px 0; }
    .reply-note { font-size: .78rem; color: #77736a; margin-bottom: 0; }
    .comments { margin-top: 10px; }
    .comment { margin: 0 0 0 calc(var(--depth) * 22px); padding: 18px 0 18px 14px; }
    .comment-head { display: flex; gap: 10px; flex-wrap: wrap; align-items: baseline; font-size: .78rem; }
    .comment-head a { font-weight: 700; }
    .comment-head span, .comment-head time { color: #77736a; }
    .comment-body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 10px 0; white-space: normal; }
    .comment-actions { display: flex; gap: 12px; font-size: .76rem; color: #77736a; }
    .replies { margin-top: 4px; }
    .empty, .muted { color: #77736a; }
    .identity { display: flex; gap: 12px; align-items: center; font-size: .8rem; }
    .identity-link { font-size: .8rem; }
    .identity form { margin: 0; }
    .text-button { background: none; border: 0; color: #77736a; padding: 0; text-decoration: underline; text-underline-offset: 3px; }
    .notice { padding: 10px 12px; border: 1px solid #b86b63; max-width: 760px; }
    @media (max-width: 680px) {
      .lookup-row, .signin-box { flex-direction: column; align-items: stretch; }
      .principles { grid-template-columns: 1fr; }
      .comment { margin-left: calc(min(var(--depth), 2) * 12px); }
      .comment-head span { display: none; }
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
    `<main class="shell"><p class="kicker">Scholia</p><h1>Not found.</h1><p class="muted">${escapeHtml(message)}</p><p><a href="/">Return home</a></p></main>`,
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
