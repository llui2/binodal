import { McpServer, WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

interface Env {
  DB: D1Database;
  ORCID_CLIENT_ID: string;
  ORCID_CLIENT_SECRET: string;
  ORCID_REDIRECT_URI?: string;
  ORCID_BASE_URL?: string;
  OPENAI_APPS_CHALLENGE?: string;
}

interface Paper {
  arxiv_id: string;
  title: string;
  authors_json: string;
  abstract: string;
  published_at: string | null;
  updated_at: string | null;
}

interface PaperReference {
  position: number;
  title: string;
  doi: string;
  year: number | null;
  checked_at?: string;
}

interface PaperAccess {
  abstract: string | null;
  pdf_url: string | null;
  checked_at: string;
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

interface TrailItemRow {
  id: number;
  trail_id: string;
  kind: string;
  title: string;
  url: string | null;
  content: string | null;
  note: string | null;
  source_ref: string | null;
  position: number;
  created_at: string;
}

interface TrailBranchRow {
  id: number;
  trail_id: string;
  title: string;
  parent_item_id: number;
  created_at: string;
  updated_at: string;
}

interface TrailBranchView extends TrailBranchRow {
  items: TrailItemRow[];
}

interface TrailContext {
  id: string;
  cookie: string | null;
}

interface TrailUser {
  id: number;
  username: string;
}

interface TrailSummary {
  id: string;
  title: string | null;
  created_at: string;
}

const TRAIL_BRUSH_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="48" viewBox="0 0 20 48">
  <path d="M10 0 C9.1 7 10.9 13 9.6 20 C8.9 27 10.8 34 10 48" fill="none" stroke="#315c84" stroke-width="5.2" stroke-linecap="round"/>
  <path d="M10.7 0 C9.5 11 10.9 27 9.7 48" fill="none" stroke="#315c84" stroke-width="1.45" stroke-linecap="round" opacity=".42"/>
  <path d="M9.2 0 C10.1 12 9 34 10.4 48" fill="none" stroke="#315c84" stroke-width=".9" stroke-linecap="round" opacity=".24"/>
</svg>`;

const TRAILS_LOGO_SVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1058 1024\" role=\"img\" aria-label=\"Trails logo\"><g transform=\"matrix(0.1713375,0,0,-0.1713375,-781.55853,1372.7001)\" fill=\"#315c84\"><path d=\"m 9936,7854 c -86,-21 -172,-71 -252,-147 -85,-80 -128,-156 -174,-307 -37,-121 -65,-175 -115,-219 -20,-17 -109,-67 -198,-110 -238,-117 -315,-188 -520,-482 -187,-269 -362,-393 -637,-452 -74,-15 -132,-20 -260,-20 -182,1 -248,7 -549,54 -162,26 -207,30 -222,21 -15,-10 -19,-9 -19,2 0,10 -18,16 -63,21 -84,9 -402,0 -496,-14 -80,-12 -234,-57 -265,-77 -18,-12 -17,-13 9,-20 18,-4 36,-2 49,7 12,7 44,16 71,21 28,4 75,12 105,17 30,5 89,10 130,10 l 75,1 -30,-20 -30,-20 h 28 c 17,0 27,-5 25,-11 -3,-10 -34,-15 -164,-22 -28,-2 -56,-7 -62,-11 -7,-4 -12,-1 -12,9 0,9 5,13 10,10 6,-3 10,-1 10,5 0,7 -7,9 -16,6 -9,-3 -19,-6 -24,-6 -4,0 -7,-7 -6,-16 1,-10 -16,-23 -49,-36 -27,-11 -52,-23 -55,-28 -6,-9 -111,-30 -121,-24 -12,7 -145,-44 -247,-95 -57,-29 -109,-50 -115,-48 -18,7 85,102 148,138 31,17 54,34 51,36 -5,6 58,69 77,76 7,4 6,6 -5,6 -35,2 -198,-64 -325,-130 -72,-38 -141,-69 -153,-69 -12,0 -41,14 -66,31 -91,62 -151,83 -256,87 -78,3 -110,0 -165,-16 -163,-50 -286,-172 -343,-342 -18,-54 -21,-82 -18,-166 3,-89 7,-108 36,-166 61,-124 184,-219 322,-249 73,-16 202,-6 270,20 74,28 177,100 223,156 22,25 58,87 82,138 87,186 198,291 387,366 155,63 232,75 453,76 217,0 287,-10 448,-64 170,-58 323,-154 432,-274 37,-40 112,-132 168,-206 301,-398 575,-559 1108,-656 288,-52 445,-119 564,-239 101,-103 151,-213 170,-381 6,-45 10,-55 16,-40 9,23 12,8 9,-37 -1,-20 3,-28 14,-28 9,0 16,5 16,10 0,19 21,10 29,-12 11,-29 -12,-59 -31,-40 -7,7 -15,12 -19,12 -14,0 -47,-65 -54,-105 -8,-46 -32,-120 -69,-218 -29,-76 -32,-105 -13,-131 12,-16 14,-16 24,6 18,39 63,163 63,174 0,6 9,23 21,38 11,14 17,30 14,36 -7,11 25,48 34,40 3,-3 15,9 26,27 11,18 23,32 27,33 5,0 6,-60 5,-134 -3,-104 -8,-140 -20,-160 -10,-14 -17,-38 -17,-53 0,-15 -5,-35 -11,-43 -8,-11 -9,2 -4,47 7,71 -8,93 -25,36 -9,-32 -30,-225 -31,-288 -1,-62 11,-139 24,-153 27,-31 129,-254 124,-272 -3,-10 1,-27 9,-38 25,-35 53,-121 73,-217 37,-180 132,-289 301,-345 54,-18 82,-21 170,-18 96,3 112,6 174,37 99,48 185,133 226,223 30,63 35,86 38,170 6,146 -31,240 -131,336 -64,59 -115,87 -199,107 -84,20 -127,19 -248,-5 -115,-23 -152,-19 -225,24 -83,49 -135,161 -135,293 0,88 15,155 55,240 77,166 100,283 92,480 -4,109 -10,156 -31,226 -75,250 -224,425 -466,547 -149,75 -264,107 -535,149 -425,66 -602,163 -838,461 -207,262 -242,302 -312,362 -40,35 -73,63 -72,64 1,0 65,-6 142,-13 165,-17 398,-11 528,12 171,31 348,105 482,200 128,92 213,194 341,411 116,197 228,311 369,379 160,76 325,85 464,26 105,-45 177,-61 271,-61 162,0 295,54 405,165 118,119 161,237 153,419 -4,86 -7,101 -46,179 -68,137 -194,236 -343,272 -79,18 -205,18 -283,-1 z m -208,-708 c 3,-12 -1,-17 -10,-14 -7,3 -15,13 -16,22 -3,12 1,17 10,14 7,-3 15,-13 16,-22 z M 6660,6160 c 0,-5 -4,-10 -10,-10 -5,0 -10,5 -10,10 0,6 5,10 10,10 6,0 10,-4 10,-10 z m 102,-32 c -2,-25 0,-28 30,-29 18,-1 37,-1 41,0 5,1 7,-4 5,-11 -3,-9 -22,-12 -59,-10 -30,1 -75,4 -102,5 -52,2 -59,20 -9,25 23,2 32,8 32,21 0,25 10,32 40,29 21,-3 25,-8 22,-30 z m 212,-17 c 20,-16 52,-32 71,-35 21,-4 35,-13 35,-21 0,-11 -6,-12 -25,-5 -14,5 -25,7 -25,5 0,-3 -11,2 -24,10 -18,12 -30,13 -50,5 -15,-5 -41,-10 -58,-10 -27,0 -29,2 -17,17 11,13 11,17 2,20 -7,3 -13,13 -13,24 0,31 59,25 104,-10 z m 161,-71 c 3,-5 1,-10 -4,-10 -6,0 -11,5 -11,10 0,6 2,10 4,10 3,0 8,-4 11,-10 z m -88,-76 c -3,-3 -12,-4 -19,-1 -8,3 -5,6 6,6 11,1 17,-2 13,-5 z m 83,-15 c 0,-11 -27,-12 -34,0 -3,4 -3,11 0,14 8,8 34,-3 34,-14 z m 54,-85 c 4,-9 4,-19 1,-22 -8,-8 -55,16 -55,28 0,17 47,11 54,-6 z M 9465,4010 c 3,-5 1,-10 -4,-10 -6,0 -11,5 -11,10 0,6 2,10 4,10 3,0 8,-4 11,-10 z m 95,-35 c 10,-20 11,-30 1,-51 -9,-21 -14,-24 -26,-14 -16,13 -19,47 -9,74 9,23 19,20 34,-9 z m -20,-149 c 0,-24 -17,-28 -23,-6 -3,13 0,20 9,20 8,0 14,-6 14,-14 z m -139,-79 c -13,-13 -15,11 -4,40 7,16 8,15 11,-6 2,-13 -1,-28 -7,-34 z\" /><path d=\"m 9213,3343 c -17,-69 -2,-175 22,-151 6,6 7,7 5,111 -1,69 -14,89 -27,40 z\" /><path d=\"m 9249,3124 c -7,-8 -9,-27 -5,-45 9,-45 77,-178 124,-240 44,-59 102,-118 102,-103 0,19 -107,272 -140,331 -36,64 -61,81 -81,57 z\" /></g></svg>\n";

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

  if (path === "/mcp") {
    return handleSharedTrailMcp(request, env);
  }

  const mcpMatch = path.match(/^\/mcp\/([a-f0-9]{24,48})$/);
  if (mcpMatch) {
    return handleTrailMcp(request, env, mcpMatch[1]);
  }

  if (request.method === "GET" && path === "/.well-known/openai-apps-challenge") {
    const token = env.OPENAI_APPS_CHALLENGE?.trim();
    if (!token) return new Response("Not configured", { status: 404 });
    return new Response(token, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  if (request.method === "GET" && path === "/chatgpt") {
    return renderChatGptHelp(request, env);
  }

  if (request.method === "GET" && path === "/support") {
    return renderPolicyPage(
      "Support",
      `<p>Trails is an experimental research tool for building and revisiting research paths.</p>
       <p>For bugs, connection problems, or feature requests, use the project issue tracker.</p>
       <p><a href="https://github.com/llui2/trails/issues" target="_blank" rel="noopener noreferrer">github.com/llui2/trails/issues ↗</a></p>`,
    );
  }

  if (request.method === "GET" && path === "/privacy") {
    return renderPolicyPage(
      "Privacy",
      `<p>Trails stores the information needed to provide the service, including research trails and their items, paper metadata, discussion content, a provisional trail username when you choose one, and account information when you sign in with ORCID.</p>
       <p>Trails uses a browser cookie to keep the current research trail associated with your browser. A private trail key can also grant access to a specific trail through integrations, so it should be treated as a secret.</p>
       <p>When Trails resolves a paper identifier or URL, it may contact the corresponding public scholarly service or publication page to retrieve metadata. Authentication through ORCID is handled through ORCID's authorization flow.</p>
       <p>Do not put confidential, regulated, or sensitive personal information into a trail while the service remains experimental.</p>
       <p>Questions or removal requests can be filed through the project issue tracker.</p>`,
    );
  }

  if (request.method === "GET" && path === "/terms") {
    return renderPolicyPage(
      "Terms",
      `<p>Trails is experimental research software provided for academic and research use. Features, storage formats, integrations, and availability may change while the project is under active development.</p>
       <p>You are responsible for the material you add to Trails and for respecting applicable copyright, confidentiality, institutional, and data-protection requirements.</p>
       <p>Do not rely on Trails as the sole copy of important research records. The service is provided without a guarantee of uninterrupted availability or permanent preservation.</p>
       <p>Automated research tools may add or modify trail entries only when invoked through the available integration interfaces. Review important research decisions and source material independently.</p>`,
    );
  }

  if (request.method === "GET" && path === "/") {
    return renderHome(request, env);
  }

  if (request.method === "GET" && path === "/trail") {
    return renderTrail(request, env);
  }

  const trailJoin = path.match(/^\/trail\/open\/([a-f0-9]{24,48})$/);
  if (request.method === "GET" && trailJoin) {
    return openTrailByIntegrationKey(request, env, trailJoin[1]);
  }

  if (request.method === "GET" && path === "/trail-live.js") {
    return trailLiveScript();
  }

  if (request.method === "GET" && path === "/theme.js") {
    return themeScript();
  }

  if (request.method === "POST" && path === "/trail/question") {
    return updateTrailDescription(request, env);
  }

  if (request.method === "POST" && path === "/trail/title") {
    return updateTrailTitle(request, env);
  }

  if (request.method === "POST" && path === "/trail/description") {
    return updateTrailDescription(request, env);
  }

  if (request.method === "POST" && path === "/trail/user") {
    return setTrailUser(request, env);
  }

  if (request.method === "POST" && path === "/trail/new") {
    return createTrailForUser(request, env);
  }

  if (request.method === "POST" && path === "/trail/select") {
    return selectTrailForUser(request, env);
  }

  if (request.method === "GET" && path === "/trail/connect") {
    return renderTrailConnect(request, env);
  }

  if (request.method === "POST" && path === "/trail/connect/rotate") {
    return rotateTrailIntegration(request, env);
  }

  if (request.method === "POST" && path === "/trail/add") {
    return addToTrail(request, env);
  }

  if (request.method === "POST" && path === "/trail/add-paper") {
    return addPaperToTrail(request, env);
  }

  const trailAction = path.match(/^\/trail\/items\/(\d+)\/(title|note|move|remove)$/);
  if (request.method === "POST" && trailAction) {
    return mutateTrailItem(request, env, Number(trailAction[1]), trailAction[2]);
  }

  if (
    path === "/api/trail" ||
    path === "/api/trail/items" ||
    /^\/api\/trail\/items\/\d+$/.test(path) ||
    path === "/api/trail/branches" ||
    /^\/api\/trail\/branches\/\d+$/.test(path)
  ) {
    return handleTrailApi(request, env, path);
  }

  if (request.method === "GET" && path === "/go") {
    const raw = url.searchParams.get("paper") ?? url.searchParams.get("arxiv") ?? "";
    const id = normalizePaperInput(raw);
    if (!id) {
      return redirect("/?error=Could+not+identify+that+paper.+Try+a+DOI,+arXiv+ID,+paper+URL,+or+Google+Scholar+link");
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


  if (request.method === "GET" && path === "/trails-logo.svg") {
    return new Response(TRAILS_LOGO_SVG, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }

  if (request.method === "GET" && path === "/trail-brush.svg") {
    return new Response(TRAIL_BRUSH_SVG, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }

  if (request.method === "GET" && path === "/health") {
    return json({ ok: true, service: "trails" });
  }

  return notFound("Page not found.");
}

async function renderChatGptHelp(request: Request, env: Env): Promise<Response> {
  const user = await currentUser(request, env);
  return htmlPage(
    "Trails for ChatGPT",
    `<header class="topbar">
      ${renderBrand()}
      ${renderIdentity(user)}
    </header>
    <main class="shell chatgpt-page">
      <a class="back" href="/trail">← trails</a>
      <span class="eyebrow">ChatGPT plugin</span>
      <h1>Keep the research path, not the chat.</h1>
      <p class="chatgpt-lead">Explore questions with ChatGPT and preserve the papers, notes, and connections that matter in Trails. The research path remains available to revisit and edit outside the conversation.</p>

      <p class="chatgpt-status">The integration works in private testing. The public plugin is not yet published. A direct installation link will appear here after publication.</p>

      <section class="chatgpt-section">
        <h2>How it works</h2>
        <ol>
          <li>Find and install Trails in ChatGPT when its public listing is available.</li>
          <li>Ask ChatGPT to create a research trail, add a relevant paper, or record an important finding.</li>
          <li>Open the trail in Trails to inspect, edit, and continue the research path.</li>
        </ol>
      </section>

      <section class="chatgpt-section">
        <h2>Example requests</h2>
        <ul class="chatgpt-examples">
          <li>Create a trail about how physical networks can learn.</li>
          <li>Add this paper and explain why it changes the question.</li>
          <li>Read this trail and summarize the open questions.</li>
        </ul>
      </section>

      <p class="chatgpt-limitation">Reading an existing trail currently requires its private trail key. Connecting trails directly to a signed-in researcher account is still in development.</p>

      <details class="chatgpt-testing">
        <summary>Private testing</summary>
        <p>While the plugin is not publicly listed, testers can connect a custom MCP server in ChatGPT using this URL and no authentication:</p>
        <code>https://trails.llui2.workers.dev/mcp</code>
        <p>Keep trail keys private: they grant permission to read and modify the corresponding trail.</p>
      </details>
    </main>`,
  );
}

function renderPolicyPage(title: string, body: string): Response {
  return htmlPage(
    title.toLowerCase(),
    `<header class="topbar">
      ${renderBrand()}
    </header>
    <main class="shell utility-page">
      <a class="back" href="/">← trails</a>
      <h1>${escapeHtml(title)}</h1>
      <div class="policy-copy">${body}</div>
    </main>`,
  );
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
          <input id="paper" name="paper" placeholder="Paste a DOI, arXiv ID, paper URL, or Google Scholar link" autocomplete="off" required>
          <button type="submit">Open</button>
        </div>
      </form>
      <div class="home-trails-link"><a href="/trail">trails →</a></div>
    </main>`,
  );
}

async function renderPaper(request: Request, env: Env, requestedPaperId: string): Promise<Response> {
  const paper = await ensurePaper(env, requestedPaperId);
  const identifiers = await getPaperIdentifiers(env, paper.arxiv_id);
  const publicPaperId = preferredPaperId(identifiers, paper.arxiv_id);
  const requestUrl = new URL(request.url);
  const mark = requestUrl.searchParams.get("mark");
  const fromTrail = requestUrl.searchParams.get("from") === "trail" &&
    mark !== null && /^[0-9]+$/.test(mark);
  const requestedReturn = requestUrl.searchParams.get("return");
  const safeReturn = requestedReturn && requestedReturn.startsWith("/p/") &&
    !requestedReturn.startsWith("//") ? requestedReturn : null;
  const context = new URLSearchParams();
  if (fromTrail && mark) {
    context.set("from", "trail");
    context.set("mark", mark);
  }
  if (safeReturn) context.set("return", safeReturn);
  let backHref = safeReturn ?? (fromTrail ? "/trail#mark-" + mark : "/");
  if (!safeReturn && !fromTrail) {
    const referer = request.headers.get("Referer");
    if (referer) {
      try {
        const previous = new URL(referer);
        if (previous.origin === requestUrl.origin &&
            (previous.pathname === "/trail" || previous.pathname.startsWith("/p/"))) {
          backHref = previous.pathname + previous.search + previous.hash;
        }
      } catch {
        // No valid same-origin navigation context.
      }
    }
  }

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
  const access = await getPaperAccess(env, paper, identifiers);
  const abstract = paper.abstract.trim() || access.abstract || "";
  const doi = identifiers.find((item) => item.type === "doi")?.value;
  const overview = doi === "10.1088/0143-0807/18/4/012"
    ? "Berry and Geim explain how a strong, spatially varying magnetic field can support weakly diamagnetic matter against gravity. Unlike permanent-magnet configurations covered by Earnshaw's theorem, induced diamagnetism can admit stable equilibrium. The paper derives stability conditions and relates them to demonstrations including the levitation of a living frog."
    : "";
  const paperUrl = `/p/${encodeURIComponent(publicPaperId)}`;

  const paperTabUrl = (id: "discussion" | "references" | "related"): string => {
    const params = new URLSearchParams(context);
    params.set("tab", id);
    return paperUrl + "?" + params.toString();
  };
  const tabLink = (id: "discussion" | "references" | "related", label: string): string =>
    `<a href="${escapeAttr(paperTabUrl(id))}"${tab === id ? ` class="active" aria-current="page"` : ""}>${label}</a>`;

  const discussion = `<section class="discussion">
    <div class="discussion-meta">
      <span>${comments.length} ${comments.length === 1 ? "comment" : "comments"}</span>
    </div>
    ${renderComposer(user, storagePaperId, publicPaperId, validReplyTo)}
    ${comments.length ? renderCommentTree(comments, publicPaperId) : `<p class="empty">No discussion yet.</p>`}
  </section>`;

  const references = tab === "references"
    ? await renderPaperReferences(env, storagePaperId, identifiers, paperTabUrl("references"), requestUrl.searchParams.has("added"))
    : "";

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
      <a class="back" href="${escapeAttr(backHref)}">← ${backHref.startsWith("/trail") ? "trail" : "papers"}</a>

      <article class="paper-window">
        <div class="paper-grid">
          <aside class="paper-meta" aria-label="Paper metadata">
            ${renderPaperSources(identifiers, access.pdf_url)}
          </aside>

          <div class="paper-main">
            <div class="paper-summary">
              <h1>${escapeHtml(paper.title)}</h1>
              ${authors.length > 6
                ? `<p class="authors">${authors.slice(0, 3).map(escapeHtml).join(", ")} et al.</p>
                  <details class="paper-authors">
                    <summary>Show all ${authors.length} authors</summary>
                    <p class="authors">${authors.map(escapeHtml).join(", ")}</p>
                  </details>`
                : `<p class="authors">${authors.map(escapeHtml).join(", ")}</p>`}

              <div class="paper-trail-actions">
                <form action="/trail/add-paper" method="post">
                  <input type="hidden" name="paper_id" value="${escapeAttr(publicPaperId)}">
                  <input type="hidden" name="next" value="${escapeAttr(paperUrl)}">
                  <button class="text-button trail-add-button" type="submit">add to trail</button>
                </form>
                <a href="/trail">trail</a>
              </div>

              <details class="abstract-disclosure" open>
                <summary>${abstract ? "Abstract" : "Overview"}</summary>
                <p>${abstract ? escapeHtml(abstract) : overview ? escapeHtml(overview) : "An abstract is not available from the indexed metadata."}</p>
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

async function renderTrail(request: Request, env: Env): Promise<Response> {
  const trail = await ensureCurrentTrail(request, env);
  if (trail.id === COMMON_TRAIL_ID) {
    await resetCommonExampleTrail(env);
  }
  const trailUser = await currentTrailUser(request, env);

  const [items, title, description, user, ownedTrails] = await Promise.all([
    listTrailItems(env, trail.id),
    getTrailTitle(env, trail.id),
    getTrailDescription(env, trail.id),
    currentUser(request, env),
    trailUser ? listUserTrails(env, trailUser.id) : Promise.resolve([] as TrailSummary[]),
  ]);

  const userTrails = trailUser
    ? [
        {
          id: COMMON_TRAIL_ID,
          title: "The M87* shadow",
          created_at: "",
        },
        ...ownedTrails.filter((item) => item.id !== COMMON_TRAIL_ID),
      ]
    : [];

  const graphHtml = renderTrailGraph(items, []);

  return htmlPage(
    title?.trim() || "trail",
    `<header class="topbar">
      ${renderBrand()}
      ${renderIdentity(user)}
    </header>
    <main class="shell trail-page">
      <div class="trail-layout">
        <aside class="trail-sidebar" aria-label="Your trails">
          ${renderTrailSidebar(trailUser, userTrails, trail.id)}
        </aside>

        <div class="trail-main">
          <div class="trail-heading">
            <input id="trail-title" class="trail-title-input" maxlength="140" aria-label="Trail title" placeholder="untitled trail" value="${escapeAttr(title ?? "")}" data-autosave-trail="title" spellcheck="false">
            <div class="trail-heading-meta">
              <span id="trail-save-state" class="trail-save-state" role="status" aria-live="polite"></span>
            </div>
          </div>

          <div class="trail-description">
            <textarea id="trail-description" rows="4" maxlength="2000" aria-label="Trail description" placeholder="context…" data-autosave-trail="description" spellcheck="false">${escapeHtml(description ?? "")}</textarea>
          </div>

          <section class="trail-graph" data-trail-live data-trail-id="${escapeAttr(trail.id)}" aria-label="Research paths">
            ${graphHtml}
          </section>

          <form class="trail-mark-add" action="/trail/add" method="post" data-trail-add>
            <textarea id="trail-add-value" name="value" rows="1" maxlength="10000"
              aria-label="Add a mark" spellcheck="false"
              placeholder="Thought, paper, or link" required></textarea>
            <button type="submit">mark</button>
          </form>
        </div>
      </div>
      <script src="/trail-live.js" defer></script>
    </main>`,
  );
}

function renderTrailSidebar(
  user: TrailUser | null,
  trails: TrailSummary[],
  currentTrailId: string,
): string {
  if (!user) {
    return `<form class="trail-user-form" action="/trail/user" method="post">
      <input name="username" maxlength="32" autocomplete="username" aria-label="Username" placeholder="username" required>
      <button class="trail-user-submit" type="submit" aria-label="Continue">→</button>
      <p>temporary username</p>
    </form>`;
  }

  const items = trails.length
    ? trails.map((trail) => {
        const label = trail.title?.trim() || "untitled trail";
        const active = trail.id === currentTrailId ? " active" : "";
        return `<form action="/trail/select" method="post">
          <input type="hidden" name="trail_id" value="${escapeAttr(trail.id)}">
          <button class="trail-list-button${active}" type="submit" title="${escapeAttr(label)}">${escapeHtml(label)}</button>
        </form>`;
      }).join("")
    : `<p class="trail-sidebar-empty">no trails yet</p>`;

  return `<div class="trail-sidebar-user">@${escapeHtml(user.username)}</div>
    <form class="trail-new-form" action="/trail/new" method="post">
      <button class="text-button" type="submit">+ new trail</button>
    </form>
    <div class="trail-list">${items}</div>
    <details class="trail-user-switch">
      <summary>switch user</summary>
      <form action="/trail/user" method="post">
        <input name="username" maxlength="32" autocomplete="username" aria-label="Username" placeholder="username" required>
        <button class="trail-user-submit" type="submit" aria-label="Switch user">→</button>
      </form>
    </details>`;
}

function renderTrailGraph(
  items: TrailItemRow[],
  branches: TrailBranchView[],
): string {
  const mainHtml = items.length
    ? items.map((item, index) => renderTrailItem(item, index, 0)).join("")
    : `<p class="trail-empty">The path is empty. Add a mark below.</p>`;

  const branchPanels = branches
    .map((branch) => {
      const branchItems = branch.items.length
        ? branch.items.map((item, index) => renderTrailItem(item, index, branch.id)).join("")
        : `<p class="trail-empty trail-branch-empty">This branch is empty.</p>`;

      return `<section class="trail-path-panel"
        data-path-panel="${branch.id}"
        data-branch-anchor="${branch.parent_item_id}"
        data-branch-name="${escapeAttr(branch.title)}"
        hidden>
        <div class="trail-path trail-content-path" data-path-branch="${branch.id}">
          ${branchItems}
        </div>
      </section>`;
    })
    .join("");

  const branchMeta = branches
    .map((branch) => `<span hidden
      data-branch-meta="${branch.id}"
      data-branch-anchor="${branch.parent_item_id}"
      data-branch-name="${escapeAttr(branch.title)}"
      data-branch-count="${branch.items.length}"></span>`)
    .join("");

  return `<div class="trail-map" data-trail-map aria-label="Trail topology">
      <svg class="trail-map-svg" data-trail-map-svg aria-hidden="true"></svg>
      ${branchMeta}
    </div>
    <div class="trail-path-workspace" data-trail-workspace>
      <section class="trail-path-panel" data-path-panel="0" data-branch-name="main">
        <div class="trail-path trail-content-path" data-path-branch="0">
          ${mainHtml}
        </div>
      </section>
      ${branchPanels}
    </div>`;
}

function renderTrailItem(
  item: TrailItemRow,
  _index: number,
  branchId = 0,
): string {
  const title = item.title || item.content || "mark";
  const kind = item.kind === "paper" ? "paper" : item.kind === "link" ? "link" : "";

  const comparableText = (value: string): string =>
    value.replace(/\s+/g, " ").trim().replace(/[.!?;:]+$/, "").toLowerCase();
  const rawContent = item.content ?? "";
  const mainText = item.kind === "note" && comparableText(rawContent) === comparableText(title) && !rawContent.startsWith("![")
    ? ""
    : rawContent;
  const detailsText = item.note ?? "";

  return `<div class="trail-step" data-trail-item="${item.id}" data-path-branch="${branchId}" data-open="false">
    <div class="trail-step-summary">
      <span class="trail-step-line">
        <textarea class="trail-step-title-input trail-rich-source" rows="1" maxlength="300" aria-label="Node title" data-item-title="${item.id}" spellcheck="false">${escapeHtml(title)}</textarea>
        <span class="trail-step-title-display trail-rich-preview" data-rich-preview="title" role="button" tabindex="0" aria-label="Edit mark title" hidden></span>
      </span>
      ${kind
        ? item.url
          ? `<a class="trail-step-kind" href="${escapeAttr(item.url)}"${/^https?:\/\//i.test(item.url) ? ` target="_blank" rel="noopener noreferrer"` : ""}>${escapeHtml(kind)}</a>`
          : `<span class="trail-step-kind">${escapeHtml(kind)}</span>`
        : `<span class="trail-step-kind" aria-hidden="true"></span>`}
    </div>

    <textarea class="trail-step-body trail-rich-source" rows="1" maxlength="10000"
      aria-label="Permanent node text" placeholder="note…" spellcheck="false"
      data-item-content="${item.id}">${escapeHtml(mainText)}</textarea>
    <div class="trail-step-body trail-rich-preview" data-rich-preview="content" role="button" tabindex="0" aria-label="Edit mark text" hidden></div>

    <div class="trail-step-detail" data-item-detail="${item.id}" hidden>
      <textarea class="trail-node-detail trail-rich-source" rows="2" maxlength="2000" aria-label="Node details" placeholder="details…" data-item-note="${item.id}" spellcheck="false">${escapeHtml(detailsText)}</textarea>
      <div class="trail-node-detail trail-rich-preview" data-rich-preview="note" role="button" tabindex="0" aria-label="Edit mark details" hidden></div>

      <div class="trail-step-footer">
        <div class="trail-step-actions" aria-label="Node actions">
          <form action="/trail/items/${item.id}/move" method="post">
            <input type="hidden" name="branch_id" value="${branchId}">
            <button class="trail-action-icon" type="submit" name="direction" value="-1" aria-label="Move up" title="Move up"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 11.5 10 7l4.5 4.5"/></svg></button>
          </form>
          <form action="/trail/items/${item.id}/move" method="post">
            <input type="hidden" name="branch_id" value="${branchId}">
            <button class="trail-action-icon" type="submit" name="direction" value="1" aria-label="Move down" title="Move down"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5.5 8.5 4.5 4.5 4.5-4.5"/></svg></button>
          </form>
          <form action="/trail/items/${item.id}/remove" method="post">
            <input type="hidden" name="branch_id" value="${branchId}">
            <button class="trail-action-icon" type="submit" aria-label="Remove mark" title="Remove"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m6.5 6.5 7 7m0-7-7 7"/></svg></button>
          </form>
        </div>
      </div>
    </div>
  </div>`;
}

async function getTrailTitle(env: Env, trailId: string): Promise<string | null> {
  const row = await env.DB.prepare(
    "SELECT title FROM trail_metadata WHERE trail_id = ?",
  )
    .bind(trailId)
    .first<{ title: string | null }>();
  return row?.title ?? null;
}

async function getTrailDescription(env: Env, trailId: string): Promise<string | null> {
  const row = await env.DB.prepare(
    `SELECT m.description, c.question
       FROM trails t
       LEFT JOIN trail_metadata m ON m.trail_id = t.id
       LEFT JOIN trail_contexts c ON c.trail_id = t.id
      WHERE t.id = ?`,
  )
    .bind(trailId)
    .first<{ description: string | null; question: string | null }>();
  return row?.description ?? row?.question ?? null;
}

async function setTrailTitle(env: Env, trailId: string, title: string): Promise<void> {
  const clean = title.replace(/\s+/g, " ").trim().slice(0, 140);
  await env.DB.prepare(
    `INSERT INTO trail_metadata (trail_id, title, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(trail_id) DO UPDATE SET
       title = excluded.title,
       updated_at = CURRENT_TIMESTAMP`,
  )
    .bind(trailId, clean || null)
    .run();
}

async function setTrailDescription(env: Env, trailId: string, description: string): Promise<void> {
  const clean = description.trim().slice(0, 2000);
  await env.DB.prepare(
    `INSERT INTO trail_metadata (trail_id, description, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(trail_id) DO UPDATE SET
       description = excluded.description,
       updated_at = CURRENT_TIMESTAMP`,
  )
    .bind(trailId, clean || null)
    .run();

  // Keep the legacy question field synchronized for older clients/tools.
  await env.DB.prepare(
    `INSERT INTO trail_contexts (trail_id, question, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(trail_id) DO UPDATE SET
       question = excluded.question,
       updated_at = CURRENT_TIMESTAMP`,
  )
    .bind(trailId, clean || null)
    .run();
}

async function getTrailQuestion(env: Env, trailId: string): Promise<string | null> {
  return getTrailDescription(env, trailId);
}

async function setTrailQuestion(env: Env, trailId: string, question: string): Promise<void> {
  await setTrailDescription(env, trailId, question);
}

async function updateTrailTitle(request: Request, env: Env): Promise<Response> {
  assertSameOrigin(request);
  const trail = await ensureCurrentTrail(request, env);
  const form = await request.formData();
  await setTrailTitle(env, trail.id, String(form.get("title") ?? ""));
  return withTrailCookie(redirect("/trail", 303), trail.cookie);
}

async function updateTrailDescription(request: Request, env: Env): Promise<Response> {
  assertSameOrigin(request);
  const trail = await ensureCurrentTrail(request, env);
  const form = await request.formData();
  const description = String(form.get("description") ?? form.get("question") ?? "");
  await setTrailDescription(env, trail.id, description);
  return withTrailCookie(redirect("/trail", 303), trail.cookie);
}

async function ensureTrailIntegration(env: Env, trailId: string): Promise<string> {
  const existing = await env.DB.prepare(
    "SELECT token FROM trail_integrations WHERE trail_id = ? ORDER BY created_at DESC LIMIT 1",
  )
    .bind(trailId)
    .first<{ token: string }>();
  if (existing?.token) return existing.token;

  const token = randomTrailKey();
  await env.DB.prepare(
    "INSERT INTO trail_integrations (token, trail_id) VALUES (?, ?)",
  )
    .bind(token, trailId)
    .run();
  return token;
}

async function renderTrailConnect(request: Request, env: Env): Promise<Response> {
  const trail = await ensureCurrentTrail(request, env);
  const [token, user] = await Promise.all([
    ensureTrailIntegration(env, trail.id),
    currentUser(request, env),
  ]);
  const response = htmlPage(
    "connect trail",
    `<header class="topbar">
      ${renderBrand()}
      ${renderIdentity(user)}
    </header>
    <main class="shell trail-connect-page">
      <a class="back" href="/trail">← trail</a>
      <span class="eyebrow">ChatGPT connection</span>
      <h1>Connect this trail</h1>
      <p class="muted">Use this private key when you want ChatGPT to work on this trail.</p>
      <label class="trail-endpoint-label" for="trail-endpoint">trail key</label>
      <input id="trail-endpoint" class="trail-endpoint" value="${escapeAttr(token)}" readonly>
      <p class="trail-connect-help">The Trails plugin stays installed once. Give it this key to read or extend this specific research path.</p>
      <form action="/trail/connect/rotate" method="post">
        <button class="text-button" type="submit">rotate key</button>
      </form>
    </main>`,
  );

  return withTrailCookie(response, trail.cookie);
}

async function rotateTrailIntegration(request: Request, env: Env): Promise<Response> {
  assertSameOrigin(request);
  const trail = await ensureCurrentTrail(request, env);
  await env.DB.prepare("DELETE FROM trail_integrations WHERE trail_id = ?")
    .bind(trail.id)
    .run();
  await ensureTrailIntegration(env, trail.id);
  return withTrailCookie(redirect("/trail/connect", 303), trail.cookie);
}

async function createStandaloneTrail(
  env: Env,
  title: string | null = null,
  description: string | null = null,
): Promise<{ id: string; key: string }> {
  const trailId = `trail_${randomToken()}`;
  const key = randomTrailKey();

  await env.DB.prepare("INSERT INTO trails (id) VALUES (?)").bind(trailId).run();
  await env.DB.prepare("INSERT INTO trail_integrations (token, trail_id) VALUES (?, ?)")
    .bind(key, trailId)
    .run();

  if (title?.trim()) await setTrailTitle(env, trailId, title);
  if (description?.trim()) await setTrailDescription(env, trailId, description);

  return { id: trailId, key };
}

async function openTrailByIntegrationKey(
  request: Request,
  env: Env,
  key: string,
): Promise<Response> {
  const trailId = await trailIdForIntegrationKey(env, key);
  if (!trailId) return notFound("This trail link is no longer valid.");

  const token = randomToken();
  await env.DB.prepare("INSERT INTO trail_sessions (token, trail_id) VALUES (?, ?)")
    .bind(token, trailId)
    .run();

  const trailUser = await currentTrailUser(request, env);
  if (trailUser) await claimTrailForUser(env, trailId, trailUser.id);

  const response = redirect("/trail", 303);
  const headers = new Headers(response.headers);
  headers.append("Set-Cookie", trailCookie(token, request));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function trailLiveScript(): Response {
  const source = `
(() => {
  const graph = document.querySelector("[data-trail-live]");
  let map = graph?.querySelector("[data-trail-map]");
  let mapSvg = graph?.querySelector("[data-trail-map-svg]");
  let workspace = graph?.querySelector("[data-trail-workspace]");
  const title = document.getElementById("trail-title");
  const description = document.getElementById("trail-description");
  const saveState = document.getElementById("trail-save-state");
  if (!graph || !map || !mapSvg || !workspace) return;

  const trailId = graph.dataset.trailId || "trail";
  const branchStorageKey = "trails:active-path-v2:" + trailId;
  const storedBranchPreference = window.localStorage.getItem(branchStorageKey);
  let activeBranchId = storedBranchPreference && storedBranchPreference !== "main"
    ? storedBranchPreference
    : null;
  let pathLaneOrder = [];
  let last = "";
  let stopped = false;
  let savedTimer = 0;
  let pendingSaves = 0;
  let drawFrame = 0;
  const timers = new WeakMap();

  const setSaveState = (state) => {
    if (!saveState) return;
    window.clearTimeout(savedTimer);
    saveState.dataset.state = state;
    saveState.textContent = state === "saving" ? "saving…" : state === "error" ? "not saved" : state === "saved" ? "saved" : "";
    if (state === "saved") {
      savedTimer = window.setTimeout(() => {
        saveState.dataset.state = "";
        saveState.textContent = "";
      }, 900);
    }
  };

  const patch = async (url, payload) => {
    pendingSaves += 1;
    setSaveState("saving");
    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("save failed");
      setSaveState("saved");
      return true;
    } catch {
      setSaveState("error");
      return false;
    } finally {
      pendingSaves = Math.max(0, pendingSaves - 1);
    }
  };

  const queueSave = (field, url, payload, delay = 450) => {
    const previous = timers.get(field);
    if (previous) window.clearTimeout(previous);
    const timer = window.setTimeout(() => {
      timers.delete(field);
      patch(url, payload());
    }, delay);
    timers.set(field, timer);
  };

  const flushSave = (field, url, payload) => {
    const previous = timers.get(field);
    if (previous) window.clearTimeout(previous);
    timers.delete(field);
    patch(url, payload());
  };

  const bindAutosaveField = (field, url, payload) => {
    if (!field || field.dataset.autosaveBound === "true") return;
    field.dataset.autosaveBound = "true";
    field.addEventListener("input", () => queueSave(field, url, payload));
    field.addEventListener("blur", () => flushSave(field, url, payload));
  };

  const autoGrow = (field) => {
    if (!field || field.hidden) return;
    field.style.height = "auto";
    field.style.height = field.scrollHeight + "px";
  };

  // Keep the original source in a textarea. Show math and figures only
  // when it is not being edited.
  const imagePattern = /!\\[([^\\]\\n]{1,160})\\]\\((https:\\/\\/[^\\s()]+)\\)/g;
  const hasMath = (value) =>
    /\\$\\$[\\s\\S]+?\\$\\$|\\$(?!\\$)[^\\$\\n]+\\$(?!\\$)/.test(value);

  const figuresIn = (value) => {
    const figures = [];
    for (const match of value.matchAll(imagePattern)) {
      try {
        const url = new URL(match[2]);
        if (url.protocol === "https:") {
          figures.push({ index: match.index, full: match[0], caption: match[1], url: url.href });
        }
      } catch {
        // An invalid URL stays as literal text.
      }
    }
    return figures;
  };

  const renderRichText = (value, preview, figures) => {
    preview.replaceChildren();
    let cursor = 0;
    for (const figure of figures) {
      preview.append(document.createTextNode(value.slice(cursor, figure.index)));
      const element = document.createElement("figure");
      element.className = "trail-rich-figure";
      const img = document.createElement("img");
      img.src = figure.url;
      img.alt = figure.caption;
      img.loading = "lazy";
      img.referrerPolicy = "no-referrer";
      element.append(img);
      if (figure.caption) {
        const label = document.createElement("figcaption");
        label.textContent = figure.caption;
        element.append(label);
      }
      preview.append(element);
      cursor = figure.index + figure.full.length;
    }
    preview.append(document.createTextNode(value.slice(cursor)));
    if (typeof window.renderMathInElement === "function") {
      window.renderMathInElement(preview, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
        ],
        throwOnError: false,
        trust: false,
      });
    }
  };

  const bindRichField = (field, preview, allowFigures = false) => {
    if (!field || !preview || field.dataset.richBound === "true") return;
    field.dataset.richBound = "true";
    const showSource = () => {
      preview.hidden = true;
      field.hidden = false;
      autoGrow(field);
    };
    const showPreview = () => {
      const value = field.value;
      const figures = allowFigures ? figuresIn(value) : [];
      const math = hasMath(value);
      if (
        document.activeElement === field ||
        (!math && figures.length === 0) ||
        (math && typeof window.renderMathInElement !== "function")
      ) {
        showSource();
        return;
      }
      renderRichText(value, preview, figures);
      field.hidden = true;
      preview.hidden = false;
      drawTrailMap();
    };
    const activate = () => {
      showSource();
      field.focus();
    };
    field.addEventListener("focus", showSource);
    field.addEventListener("blur", showPreview);
    field.addEventListener("input", showSource);
    preview.addEventListener("click", activate);
    preview.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate();
      }
    });
    showPreview();
  };

  const staticCaret = document.createElement("span");
  staticCaret.className = "trail-static-caret";
  staticCaret.hidden = true;
  document.body.appendChild(staticCaret);

  const caretMirror = document.createElement("div");
  caretMirror.setAttribute("aria-hidden", "true");
  Object.assign(caretMirror.style, {
    position: "fixed",
    visibility: "hidden",
    pointerEvents: "none",
    overflow: "hidden",
    zIndex: "-1",
  });
  document.body.appendChild(caretMirror);

  let caretFrame = 0;

  const updateStaticCaret = () => {
    const field = document.activeElement;
    if (
      !(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) ||
      !field.closest(".trail-page") ||
      field.type === "hidden" ||
      field.selectionStart === null ||
      field.selectionEnd === null ||
      field.selectionStart !== field.selectionEnd
    ) {
      staticCaret.hidden = true;
      return;
    }

    const rect = field.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      staticCaret.hidden = true;
      return;
    }

    const style = window.getComputedStyle(field);
    const isTextarea = field instanceof HTMLTextAreaElement;
    const before = field.value.slice(0, field.selectionStart);

    caretMirror.style.left = rect.left + "px";
    caretMirror.style.top = rect.top + "px";
    caretMirror.style.width = rect.width + "px";
    caretMirror.style.height = rect.height + "px";
    caretMirror.style.paddingTop = style.paddingTop;
    caretMirror.style.paddingRight = style.paddingRight;
    caretMirror.style.paddingBottom = style.paddingBottom;
    caretMirror.style.paddingLeft = style.paddingLeft;
    caretMirror.style.borderTopWidth = style.borderTopWidth;
    caretMirror.style.borderRightWidth = style.borderRightWidth;
    caretMirror.style.borderBottomWidth = style.borderBottomWidth;
    caretMirror.style.borderLeftWidth = style.borderLeftWidth;
    caretMirror.style.borderStyle = "solid";
    caretMirror.style.boxSizing = style.boxSizing;
    caretMirror.style.fontFamily = style.fontFamily;
    caretMirror.style.fontSize = style.fontSize;
    caretMirror.style.fontWeight = style.fontWeight;
    caretMirror.style.fontStyle = style.fontStyle;
    caretMirror.style.letterSpacing = style.letterSpacing;
    caretMirror.style.lineHeight = style.lineHeight;
    caretMirror.style.textAlign = style.textAlign;
    caretMirror.style.whiteSpace = isTextarea ? "pre-wrap" : "pre";
    caretMirror.style.overflowWrap = isTextarea ? "anywhere" : "normal";
    caretMirror.textContent = "";

    const prefix = document.createTextNode(before || "");
    const marker = document.createElement("span");
    marker.textContent = "\u200b";
    caretMirror.append(prefix, marker);
    caretMirror.scrollTop = field.scrollTop;
    caretMirror.scrollLeft = field.scrollLeft;

    const markerRect = marker.getBoundingClientRect();
    const parsedLineHeight = Number.parseFloat(style.lineHeight);
    const parsedFontSize = Number.parseFloat(style.fontSize) || 16;
    const lineHeight = Number.isFinite(parsedLineHeight)
      ? parsedLineHeight
      : parsedFontSize * 1.2;

    const caretHeight = Math.max(14, lineHeight - 4);
    staticCaret.style.left = (markerRect.left - 1.5) + "px";
    staticCaret.style.top = (markerRect.top + (lineHeight - caretHeight) / 2) + "px";
    staticCaret.style.height = caretHeight + "px";
    staticCaret.hidden = false;
  };

  const requestCaretUpdate = () => {
    window.cancelAnimationFrame(caretFrame);
    caretFrame = window.requestAnimationFrame(updateStaticCaret);
  };

  const bindStaticCaret = () => {
    document.querySelectorAll(".trail-page input, .trail-page textarea").forEach((field) => {
      if (field.dataset.caretBound === "true") return;
      field.dataset.caretBound = "true";
      ["focus", "input", "keyup", "click", "scroll"].forEach((eventName) => {
        field.addEventListener(eventName, requestCaretUpdate);
      });
      field.addEventListener("blur", () => {
        staticCaret.hidden = true;
      });
    });

    if (document.body.dataset.trailCaretGlobalBound !== "true") {
      document.body.dataset.trailCaretGlobalBound = "true";
      document.addEventListener("selectionchange", requestCaretUpdate);
      window.addEventListener("resize", requestCaretUpdate);
      window.addEventListener("scroll", requestCaretUpdate, true);
    }
  };

  const TRAIL_TOP_Y = 24;
  const TRAIL_ROW_STEP = 52;

  const activeKey = () => activeBranchId || "0";

  const activePanel = () =>
    workspace.querySelector('[data-path-panel="' + activeKey() + '"]');

  const syncActivePanelOffset = () => {
    workspace.querySelectorAll("[data-path-panel]").forEach((panel) => {
      panel.style.paddingTop = "0px";
    });

    if (!activeBranchId) return;

    const mainPanel = workspace.querySelector('[data-path-panel="0"]');
    const mainSteps = Array.from(mainPanel?.querySelectorAll(".trail-step") || []);
    const meta = graph.querySelector('[data-branch-meta="' + activeBranchId + '"]');
    const panel = activePanel();
    if (!meta || !panel) return;

    const parentId = meta.dataset.branchAnchor;
    const parentIndex = mainSteps.findIndex(
      (step) => step.dataset.trailItem === parentId,
    );
    const offset = Math.max(0, parentIndex) * TRAIL_ROW_STEP;
    panel.style.paddingTop = offset + "px";
  };

  const setStepOpen = (step, open) => {
    const titleField = step.querySelector("[data-item-title]");
    const detail = step.querySelector("[data-item-detail]");

    step.dataset.open = open ? "true" : "false";
    if (titleField) autoGrow(titleField);
    if (detail) {
      detail.hidden = !open;
      if (open) detail.querySelectorAll("textarea").forEach(autoGrow);
    }
    drawTrailMap();
  };

  const bindTrailItems = () => {
    graph.querySelectorAll(".trail-step").forEach((step) => {
      const titleField = step.querySelector("[data-item-title]");

      if (titleField) {
        bindRichField(titleField, step.querySelector('[data-rich-preview="title"]'));
        autoGrow(titleField);
        if (titleField.dataset.titleBound !== "true") {
          titleField.dataset.titleBound = "true";
          titleField.addEventListener("input", () => {
            autoGrow(titleField);
            drawTrailMap();
          });
          titleField.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              titleField.blur();
            }
          });
        }
        const itemId = titleField.dataset.itemTitle;
        bindAutosaveField(
          titleField,
          "/api/trail/items/" + itemId,
          () => ({ title: titleField.value }),
        );
      }

      const contentField = step.querySelector("[data-item-content]");
      if (contentField) {
        bindRichField(contentField, step.querySelector('[data-rich-preview="content"]'), true);
        autoGrow(contentField);
        if (contentField.dataset.growBound !== "true") {
          contentField.dataset.growBound = "true";
          contentField.addEventListener("input", () => {
            autoGrow(contentField);
            drawTrailMap();
          });
        }
        const itemId = contentField.dataset.itemContent;
        bindAutosaveField(
          contentField,
          "/api/trail/items/" + itemId,
          () => ({ content: contentField.value || null }),
        );
      }

      const noteField = step.querySelector("[data-item-note]");
      if (noteField) {
        bindRichField(noteField, step.querySelector('[data-rich-preview="note"]'), true);
        autoGrow(noteField);
        if (noteField.dataset.growBound !== "true") {
          noteField.dataset.growBound = "true";
          noteField.addEventListener("input", () => {
            autoGrow(noteField);
            drawTrailMap();
          });
        }
        const itemId = noteField.dataset.itemNote;
        bindAutosaveField(
          noteField,
          "/api/trail/items/" + itemId,
          () => ({ note: noteField.value || null }),
        );
      }
    });
  };

  const svgNode = (name, attrs = {}) => {
    const node = document.createElementNS("http://www.w3.org/2000/svg", name);
    for (const [key, value] of Object.entries(attrs)) {
      node.setAttribute(key, String(value));
    }
    return node;
  };

  const orthogonalHitPath = (points) => {
    if (!points.length) return "";
    let d = "M " + points[0].x.toFixed(2) + " " + points[0].y.toFixed(2);
    for (let i = 1; i < points.length; i += 1) {
      const a = points[i - 1];
      const b = points[i];
      if (Math.abs(b.x - a.x) > 0.01) d += " H " + b.x.toFixed(2);
      if (Math.abs(b.y - a.y) > 0.01) d += " V " + b.y.toFixed(2);
    }
    return d;
  };

  // Keep the topology orthogonal, but render each horizontal/vertical segment
  // as a slightly irregular brush stroke rather than a perfect vector line.
  // DESIGN INVARIANT: the uploaded Trails logo is a filled vector silhouette,
  // not a clean stroked line and not a filter effect. Build links the same way:
  // a mostly straight filled ribbon with uneven outer edges. Keep the fill
  // continuous; do not add interior holes, SVG filters, dash patterns, or
  // parallel helper strokes.
  const brushRibbonPath = (
    a,
    b,
    phase = 0,
  ) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const horizontal = Math.abs(dx) >= Math.abs(dy);
    const length = Math.abs(horizontal ? dx : dy);
    if (length < 0.01) return "";

    const ts = [0, 0.08, 0.18, 0.31, 0.45, 0.59, 0.72, 0.84, 0.93, 1];
    const upperProfile = [0.05, -0.28, 0.42, -0.16, 0.58, -0.38, 0.20, -0.31, 0.27, 0.04];
    const lowerProfile = [-0.08, 0.34, -0.14, 0.47, -0.31, 0.24, -0.44, 0.29, -0.17, -0.02];
    const centerDrift = [0, 0.10, -0.06, 0.14, -0.09, 0.06, -0.11, 0.08, -0.04, 0];
    const profileShift = (phase * 2) % ts.length;
    const halfWidth = 3.75;

    const upper = [];
    const lower = [];
    ts.forEach((t, index) => {
      const profileIndex = (index + profileShift) % ts.length;
      const drift = centerDrift[profileIndex];
      const upperWidth = halfWidth + upperProfile[profileIndex];
      const lowerWidth = halfWidth + lowerProfile[(profileIndex + 3) % ts.length];

      if (horizontal) {
        const x = a.x + dx * t;
        upper.push({ x, y: a.y + drift - upperWidth });
        lower.push({ x, y: a.y + drift + lowerWidth });
      } else {
        const y = a.y + dy * t;
        upper.push({ x: a.x + drift - upperWidth, y });
        lower.push({ x: a.x + drift + lowerWidth, y });
      }
    });

    let path =
      "M " + upper[0].x.toFixed(2) + " " + upper[0].y.toFixed(2);
    upper.slice(1).forEach((point) => {
      path += " L " + point.x.toFixed(2) + " " + point.y.toFixed(2);
    });
    lower.slice().reverse().forEach((point) => {
      path += " L " + point.x.toFixed(2) + " " + point.y.toFixed(2);
    });
    path += " Z";


    return path;
  };

  const drawBrushSegments = (group, points, brushClass, phaseBase) => {
    for (let i = 1; i < points.length; i += 1) {
      group.appendChild(svgNode("path", {
        d: brushRibbonPath(points[i - 1], points[i], phaseBase + i),
        class: brushClass,
      }));
    }
  };

  const TRAIL_MAP_NODE_SHAPE =
    "M10 1.2 C15.1 1.1 18.6 5 18.4 10.1 C18.6 15 14.8 18.8 9.8 18.6 C4.8 18.9 1.4 15.1 1.6 10 C1.3 5.1 4.9 1.4 10 1.2 Z";

  const drawPath = (
    points,
    className,
    branchId,
    label,
    itemIds = [],
    explicitNodePoints = null,
  ) => {
    const group = svgNode("g", {
      class: "trail-map-branch " + className,
      "data-branch-select": branchId,
    });
    const titleNode = svgNode("title");
    titleNode.textContent = label;
    group.appendChild(titleNode);

    if (points.length >= 2) {
      group.appendChild(svgNode("path", {
        d: orthogonalHitPath(points),
        class: "trail-map-hit",
        "data-branch-select": branchId,
      }));

      drawBrushSegments(group, points, "trail-map-brush-main", 1);
    }

    // Each visible connection on the focused path inserts precisely between
    // its two endpoints. These hit areas are invisible and do not alter the
    // logo-derived brush ribbon.
    const insertPoints = explicitNodePoints || points;
    if (className.includes("trail-map-path-active")) {
      for (let i = 0; i + 1 < itemIds.length; i += 1) {
        const from = insertPoints[i];
        const to = insertPoints[i + 1];
        if (!from || !to) continue;
        const hit = svgNode("path", {
          d: "M" + from.x + " " + from.y + " L" + to.x + " " + to.y,
          class: "trail-map-insert-hit",
          "data-insert-after": itemIds[i],
          "data-insert-before": itemIds[i + 1],
          "data-insert-branch": branchId,
        });
        const hint = svgNode("title");
        hint.textContent = "Insert mark between";
        hit.appendChild(hint);
        group.appendChild(hit);
      }
    }

    const nodePoints = explicitNodePoints ||
      (branchId === "0" ? points : points.slice(1));
    nodePoints.forEach((point, index) => {
      const scale = 1.0;
      const rotation = ((index % 3) - 1) * 4;
      const transform =
        "translate(" + (point.x - 10 * scale).toFixed(2) + " " +
        (point.y - 10 * scale).toFixed(2) + ") scale(" + scale + ") " +
        "rotate(" + rotation + " 10 10)";
      const itemId = itemIds[index] || null;

      const nodeAttrs = {
        d: TRAIL_MAP_NODE_SHAPE,
        transform,
        class: "trail-map-brush-node",
        "data-branch-select": branchId,
      };
      if (itemId) nodeAttrs["data-item-toggle-map"] = itemId;

      group.appendChild(svgNode("path", nodeAttrs));
    });

    mapSvg.appendChild(group);
  };

  const drawTrailMap = () => {
    window.cancelAnimationFrame(drawFrame);
    drawFrame = window.requestAnimationFrame(() => {
      syncActivePanelOffset();

      const panel = activePanel();
      if (!panel) return;

      const graphRect = graph.getBoundingClientRect();
      const mainPanel = workspace.querySelector('[data-path-panel="0"]');
      const mainSteps = Array.from(mainPanel?.querySelectorAll(".trail-step") || []);
      const activeSteps = Array.from(panel.querySelectorAll(".trail-step"));
      const branchMetas = Array.from(graph.querySelectorAll("[data-branch-meta]"));
      const width = Math.max(44, map.clientWidth);
      const rightX = width - 26;

      const visibleStepYs = activeSteps.map((step) => {
        const titleField = step.querySelector(".trail-step-title-input:not([hidden])");
        const titleDisplay = step.querySelector(".trail-step-title-display:not([hidden])");
        const summary = step.querySelector(".trail-step-summary") || step;
        const anchor = titleField || titleDisplay || summary;
        const rect = anchor.getBoundingClientRect();
        const anchorStyle = window.getComputedStyle(anchor);
        const parsedLineHeight = Number.parseFloat(anchorStyle.lineHeight);
        const parsedFontSize = Number.parseFloat(anchorStyle.fontSize) || 16;
        const lineHeight = Number.isFinite(parsedLineHeight)
          ? parsedLineHeight
          : parsedFontSize * 1.2;
        return rect.top - graphRect.top + Math.min(rect.height, lineHeight) / 2;
      });

      const semanticMainYs = mainSteps.map(
        (_, index) => TRAIL_TOP_Y + index * TRAIL_ROW_STEP,
      );
      const mainYs = activeBranchId ? semanticMainYs : visibleStepYs;

      const branchIds = branchMetas
        .map((meta) => meta.dataset.branchMeta)
        .filter(Boolean);
      const allPathIds = [...branchIds, "0"];

      pathLaneOrder = pathLaneOrder.filter((pathId) => allPathIds.includes(pathId));
      allPathIds.forEach((pathId) => {
        if (!pathLaneOrder.includes(pathId)) pathLaneOrder.push(pathId);
      });

      const focusedPathId = activeKey();
      const focusedIndex = pathLaneOrder.indexOf(focusedPathId);
      const rightMostIndex = pathLaneOrder.length - 1;
      if (focusedIndex >= 0 && focusedIndex !== rightMostIndex) {
        const displaced = pathLaneOrder[rightMostIndex];
        pathLaneOrder[rightMostIndex] = focusedPathId;
        pathLaneOrder[focusedIndex] = displaced;
      }

      const laneOrder = pathLaneOrder;
      const maxLaneGap = 22;
      const minLaneGap = 13;
      const laneGap = laneOrder.length > 1
        ? Math.max(
            minLaneGap,
            Math.min(maxLaneGap, (width - 24) / (laneOrder.length - 1)),
          )
        : maxLaneGap;

      const laneX = new Map();
      laneOrder.forEach((pathId, index) => {
        const fromRight = laneOrder.length - 1 - index;
        laneX.set(pathId, rightX - fromRight * laneGap);
      });

      const mainX = Number(laneX.get("0") ?? rightX);
      const branchGeometry = [];
      let requiredHeight = Math.max(
        150,
        panel.getBoundingClientRect().height + 8,
        mainYs.length ? mainYs[mainYs.length - 1] + 30 : TRAIL_TOP_Y + 30,
      );

      branchMetas.forEach((meta) => {
        const branchId = meta.dataset.branchMeta;
        if (!branchId) return;

        const parentId = meta.dataset.branchAnchor;
        const branchName = meta.dataset.branchName || "branch";
        const branchPanel = workspace.querySelector(
          '[data-path-panel="' + branchId + '"]',
        );
        const branchSteps = Array.from(
          branchPanel?.querySelectorAll(".trail-step") || [],
        );
        const branchItemIds = branchSteps
          .map((step) => step.dataset.trailItem)
          .filter(Boolean);
        const parentIndex = mainSteps.findIndex(
          (step) => step.dataset.trailItem === parentId,
        );
        const anchorRow = parentIndex >= 0 ? parentIndex : 0;
        const anchorY = semanticMainYs[anchorRow] ?? TRAIL_TOP_Y;
        const branchX = Number(laneX.get(branchId) ?? mainX - laneGap);
        const selected = activeBranchId === branchId;

        const nodeYs = selected
          ? visibleStepYs
          : branchItemIds.map(
              (_, itemIndex) => anchorY + itemIndex * TRAIL_ROW_STEP,
            );
        const nodePoints = nodeYs.map((y) => ({ x: branchX, y }));

        const points = [
          { x: mainX, y: anchorY },
          { x: branchX, y: anchorY },
        ];
        nodePoints.forEach((point) => {
          const last = points[points.length - 1];
          if (
            Math.abs(point.x - last.x) > 0.01 ||
            Math.abs(point.y - last.y) > 0.01
          ) {
            points.push(point);
          }
        });

        const lastY = nodePoints.length
          ? nodePoints[nodePoints.length - 1].y
          : anchorY;
        requiredHeight = Math.max(requiredHeight, lastY + 30);

        branchGeometry.push({
          branchId,
          branchName,
          points,
          nodePoints,
          itemIds: branchItemIds,
          selected,
        });
      });

      map.style.height = Math.ceil(requiredHeight) + "px";
      mapSvg.setAttribute("viewBox", "0 0 " + width + " " + Math.ceil(requiredHeight));
      mapSvg.setAttribute("width", String(width));
      mapSvg.setAttribute("height", String(Math.ceil(requiredHeight)));
      mapSvg.innerHTML = "";

      const geometries = [];

      if (mainYs.length) {
        const mainNodePoints = mainYs.map((y) => ({ x: mainX, y }));
        geometries.push({
          pathId: "0",
          label: "main",
          points: mainNodePoints,
          nodePoints: mainNodePoints,
          itemIds: mainSteps
            .map((step) => step.dataset.trailItem)
            .filter(Boolean),
          selected: !activeBranchId,
        });
      }

      branchGeometry.forEach((branch) => {
        geometries.push({
          pathId: branch.branchId,
          label: branch.branchName,
          points: branch.points,
          nodePoints: branch.nodePoints,
          itemIds: branch.itemIds,
          selected: branch.selected,
        });
      });

      geometries
        .filter((geometry) => !geometry.selected)
        .forEach((geometry) => {
          drawPath(
            geometry.points,
            "trail-map-path trail-map-path-muted",
            geometry.pathId,
            geometry.label,
            geometry.itemIds,
            geometry.nodePoints,
          );
        });

      // SVG paint order is z-order: active blue path always sits on top.
      geometries
        .filter((geometry) => geometry.selected)
        .forEach((geometry) => {
          drawPath(
            geometry.points,
            "trail-map-path trail-map-path-active",
            geometry.pathId,
            geometry.label,
            geometry.itemIds,
            geometry.nodePoints,
          );
        });
    });
  };

  const applyActiveBranch = (persist = true) => {
    if (
      activeBranchId &&
      !workspace.querySelector('[data-path-panel="' + activeBranchId + '"]')
    ) {
      activeBranchId = null;
    }

    workspace.querySelectorAll("[data-path-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.pathPanel !== activeKey();
    });
    syncActivePanelOffset();

    if (persist) {
      window.localStorage.setItem(branchStorageKey, activeBranchId || "main");
    }

    drawTrailMap();
  };

  const openInsertBetween = (afterId, beforeId, branchId) => {
    graph.querySelectorAll(".trail-insert-form").forEach((form) => form.remove());
    const panel = workspace.querySelector('[data-path-panel="' + branchId + '"]');
    const afterStep = Array.from(panel?.querySelectorAll(".trail-step") || [])
      .find((step) => step.dataset.trailItem === afterId);
    if (!afterStep || afterStep.nextElementSibling?.dataset.trailItem !== beforeId) return;

    const form = document.createElement("form");
    form.className = "trail-insert-form";
    form.innerHTML = '<textarea rows="1" maxlength="10000" aria-label="Insert mark between existing marks" placeholder="mark…" required></textarea>' +
      '<button type="submit">insert</button><button type="button" data-insert-cancel>cancel</button>';
    afterStep.after(form);
    const field = form.querySelector("textarea");
    field.focus();
    autoGrow(field);
    field.addEventListener("input", () => {
      autoGrow(field);
      drawTrailMap();
    });
    field.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        form.remove();
        drawTrailMap();
      } else if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        form.requestSubmit();
      }
    });
    form.querySelector("[data-insert-cancel]").addEventListener("click", () => {
      form.remove();
      drawTrailMap();
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const value = field.value.trim();
      if (!value) return;
      const submit = form.querySelector('[type="submit"]');
      submit.disabled = true;
      try {
        const response = await fetch("/api/trail/items", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            value,
            branch_id: Number(branchId),
            after_item_id: Number(afterId),
            before_item_id: Number(beforeId),
          }),
        });
        if (!response.ok) throw new Error("could not insert mark");
        form.remove();
        last = "";
        await tick(true);
      } catch {
        setSaveState("error");
      } finally {
        submit.disabled = false;
      }
    });
    drawTrailMap();
  };

  const bindTopology = () => {
    if (mapSvg.dataset.bound !== "true") {
      mapSvg.dataset.bound = "true";
      mapSvg.addEventListener("click", (event) => {
        const rawTarget = event.target;
        if (!(rawTarget instanceof Element)) return;

        const pathTarget = rawTarget.closest("[data-branch-select]");
        if (!pathTarget) return;

        const selected = pathTarget.getAttribute("data-branch-select");
        activeBranchId = selected && selected !== "0" ? selected : null;
        applyActiveBranch();

        const insertion = rawTarget.closest("[data-insert-after]");
        if (insertion) {
          openInsertBetween(
            insertion.getAttribute("data-insert-after"),
            insertion.getAttribute("data-insert-before"),
            insertion.getAttribute("data-insert-branch") || "0",
          );
          return;
        }

        // The topology node is the control for the second, closable mark block.
        // The permanent mark text remains visible; clicking its brush node
        // opens/closes the extra detail block on the currently focused path.
        const nodeTarget = rawTarget.closest("[data-item-toggle-map]");
        const itemId = nodeTarget?.getAttribute("data-item-toggle-map");
        if (!itemId) return;

        const pathId = selected || "0";
        const panel = workspace.querySelector(
          '[data-path-panel="' + pathId + '"]',
        );
        const step = panel?.querySelector(
          '.trail-step[data-trail-item="' + itemId + '"]',
        );
        if (!step) return;

        const opening = step.dataset.open !== "true";
        setStepOpen(step, opening);
      });
    }
  };

  const bindStepActions = () => {
    graph.querySelectorAll(".trail-step-actions form").forEach((form) => {
      if (form.dataset.bound === "true") return;
      form.dataset.bound = "true";
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const submitter = event.submitter;
        if (submitter instanceof HTMLButtonElement) submitter.disabled = true;
        try {
          const formData = new FormData(form);
          if (
            submitter instanceof HTMLButtonElement &&
            submitter.name &&
            !formData.has(submitter.name)
          ) {
            formData.append(submitter.name, submitter.value);
          }
          await fetch(form.action, {
            method: "POST",
            body: formData,
            redirect: "manual",
          });
          last = "";
          await tick(true);
        } catch {
          setSaveState("error");
        } finally {
          if (submitter instanceof HTMLButtonElement) submitter.disabled = false;
        }
      });
    });
  };

  const bindGraph = () => {
    bindTrailItems();
    bindStaticCaret();
    bindStepActions();
    bindTopology();
    applyActiveBranch(false);
  };

  bindAutosaveField(title, "/api/trail", () => ({ title: title.value }));
  bindAutosaveField(description, "/api/trail", () => ({ description: description.value }));

  const addForm = document.querySelector("[data-trail-add]");
  const addField = document.getElementById("trail-add-value");
  if (addForm && addField) {
    autoGrow(addField);
    addField.addEventListener("input", () => autoGrow(addField));
    addField.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        addForm.requestSubmit();
      }
    });
    addForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const value = addField.value.trim();
      if (!value) return;

      addField.disabled = true;
      try {
        const response = await fetch("/api/trail/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            value,
            branch_id: activeBranchId ? Number(activeBranchId) : 0,
          }),
        });
        if (!response.ok) throw new Error("add failed");
        addField.value = "";
        autoGrow(addField);
        last = "";
        await tick(true);
      } catch {
        setSaveState("error");
      } finally {
        addField.disabled = false;
        addField.focus();
      }
    });
  }

  const tick = async (force = false) => {
    if (stopped || document.hidden || pendingSaves > 0) return;
    try {
      const response = await fetch("/api/trail", {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) return;
      const data = await response.json();
      const fingerprint = JSON.stringify([data.title, data.description, data.items, data.branches]);
      if (!force && fingerprint === last) return;

      const activeInGraph = graph.contains(document.activeElement);
      if (!force && activeInGraph) return;

      if (typeof data.html === "string") {
        const openItems = new Set(
          Array.from(graph.querySelectorAll('.trail-step[data-open="true"]'))
            .map((step) => (step.dataset.pathBranch || "0") + ":" + step.dataset.trailItem)
            .filter(Boolean),
        );
        graph.innerHTML = data.html;

        const nextMap = graph.querySelector("[data-trail-map]");
        const nextSvg = graph.querySelector("[data-trail-map-svg]");
        const nextWorkspace = graph.querySelector("[data-trail-workspace]");
        if (!nextMap || !nextSvg || !nextWorkspace) return;

        map = nextMap;
        mapSvg = nextSvg;
        workspace = nextWorkspace;

        for (const step of graph.querySelectorAll(".trail-step")) {
          const key = (step.dataset.pathBranch || "0") + ":" + step.dataset.trailItem;
          if (openItems.has(key)) setStepOpen(step, true);
        }
        bindGraph();
      }

      if (
        title &&
        document.activeElement !== title &&
        typeof data.title === "string" &&
        title.value !== data.title
      ) {
        title.value = data.title;
      }
      if (
        description &&
        document.activeElement !== description &&
        typeof data.description === "string" &&
        description.value !== data.description
      ) {
        description.value = data.description;
      }
      last = fingerprint;
      drawTrailMap();
    } catch {
      // A transient network failure should not disturb the research session.
    }
  };

  bindGraph();
  const resizeObserver = typeof ResizeObserver !== "undefined"
    ? new ResizeObserver(() => drawTrailMap())
    : null;
  if (resizeObserver) resizeObserver.observe(graph);
  window.addEventListener("resize", drawTrailMap);

  const settleTrailMap = () => {
    drawTrailMap();
    requestAnimationFrame(() => drawTrailMap());
    window.setTimeout(() => drawTrailMap(), 80);
  };
  settleTrailMap();
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => settleTrailMap()).catch(() => {});
  }
  window.addEventListener("load", settleTrailMap, { once: true });

  const interval = window.setInterval(() => tick(false), 3000);
  window.addEventListener("pagehide", () => {
    stopped = true;
    window.clearInterval(interval);
    window.cancelAnimationFrame(drawFrame);
    window.cancelAnimationFrame(caretFrame);
    staticCaret.remove();
    caretMirror.remove();
    if (resizeObserver) resizeObserver.disconnect();
    window.removeEventListener("resize", drawTrailMap);
    window.removeEventListener("load", settleTrailMap);
  }, { once: true });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) tick(false);
  });
  tick(false);
})();
`;
  return new Response(source, {
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function currentTrailUser(request: Request, env: Env): Promise<TrailUser | null> {
  const cookies = parseCookies(request.headers.get("Cookie") ?? "");
  const token = cookies.get("trail_user");
  if (!token) return null;

  return await env.DB.prepare(
    `SELECT u.id, u.username
       FROM trail_user_sessions s
       JOIN trail_users u ON u.id = s.user_id
      WHERE s.token = ?`,
  )
    .bind(token)
    .first<TrailUser>();
}

function normalizeTrailUsername(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^A-Za-z0-9_.-]/g, "")
    .slice(0, 32);
}

function trailUserCookie(token: string, request: Request): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `trail_user=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${secure}`;
}

async function claimTrailForUser(env: Env, trailId: string, userId: number): Promise<void> {
  await env.DB.prepare(
    "INSERT INTO trail_owners (trail_id, user_id) VALUES (?, ?) ON CONFLICT(trail_id) DO NOTHING",
  )
    .bind(trailId, userId)
    .run();
}

async function trailOwnerUserId(env: Env, trailId: string): Promise<number | null> {
  const owner = await env.DB.prepare(
    "SELECT user_id FROM trail_owners WHERE trail_id = ?",
  )
    .bind(trailId)
    .first<{ user_id: number }>();
  return owner?.user_id ?? null;
}

async function latestTrailForUser(env: Env, userId: number): Promise<string | null> {
  const trail = await env.DB.prepare(
    `SELECT t.id
       FROM trail_owners o
       JOIN trails t ON t.id = o.trail_id
      WHERE o.user_id = ?
      ORDER BY t.created_at DESC
      LIMIT 1`,
  )
    .bind(userId)
    .first<{ id: string }>();
  return trail?.id ?? null;
}

async function createOwnedTrail(env: Env, userId: number): Promise<{ trailId: string; trailToken: string }> {
  const trailId = `trail_${randomToken()}`;
  const trailToken = randomToken();
  await env.DB.prepare("INSERT INTO trails (id) VALUES (?)").bind(trailId).run();
  await env.DB.prepare("INSERT INTO trail_sessions (token, trail_id) VALUES (?, ?)")
    .bind(trailToken, trailId)
    .run();
  await claimTrailForUser(env, trailId, userId);
  return { trailId, trailToken };
}

async function listUserTrails(env: Env, userId: number): Promise<TrailSummary[]> {
  const result = await env.DB.prepare(
    `SELECT t.id, m.title, t.created_at
       FROM trail_owners o
       JOIN trails t ON t.id = o.trail_id
       LEFT JOIN trail_metadata m ON m.trail_id = t.id
      WHERE o.user_id = ?
      ORDER BY t.created_at DESC`,
  )
    .bind(userId)
    .all<TrailSummary>();
  return result.results ?? [];
}

async function setTrailUser(request: Request, env: Env): Promise<Response> {
  assertSameOrigin(request);
  const form = await request.formData();
  const username = normalizeTrailUsername(String(form.get("username") ?? ""));
  if (!username) return redirect("/trail", 303);

  await env.DB.prepare(
    "INSERT INTO trail_users (username) VALUES (?) ON CONFLICT(username) DO NOTHING",
  )
    .bind(username)
    .run();

  const user = await env.DB.prepare(
    "SELECT id, username FROM trail_users WHERE username = ? COLLATE NOCASE",
  )
    .bind(username)
    .first<TrailUser>();
  if (!user) throw new Error("Could not create trail user");

  const sessionToken = randomToken();
  await env.DB.prepare(
    "INSERT INTO trail_user_sessions (token, user_id) VALUES (?, ?)",
  )
    .bind(sessionToken, user.id)
    .run();

  const current = await ensureCurrentTrail(request, env);
  let trailCookieValue = current.cookie;

  if (current.id !== COMMON_TRAIL_ID) {
    const ownerId = await trailOwnerUserId(env, current.id);
    if (ownerId === null) {
      await claimTrailForUser(env, current.id, user.id);
    } else if (ownerId !== user.id) {
      const existingTrailId = await latestTrailForUser(env, user.id);
      if (existingTrailId) {
        const token = randomToken();
        await env.DB.prepare("INSERT INTO trail_sessions (token, trail_id) VALUES (?, ?)")
          .bind(token, existingTrailId)
          .run();
        trailCookieValue = trailCookie(token, request);
      } else {
        trailCookieValue = null;
      }
    }
  }

  const response = redirect("/trail", 303);
  const headers = new Headers(response.headers);
  headers.append("Set-Cookie", trailUserCookie(sessionToken, request));
  if (trailCookieValue) headers.append("Set-Cookie", trailCookieValue);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function createTrailForUser(request: Request, env: Env): Promise<Response> {
  assertSameOrigin(request);
  const user = await currentTrailUser(request, env);
  if (!user) return redirect("/trail", 303);

  const created = await createOwnedTrail(env, user.id);
  return withTrailCookie(redirect("/trail", 303), trailCookie(created.trailToken, request));
}

async function selectTrailForUser(request: Request, env: Env): Promise<Response> {
  assertSameOrigin(request);
  const user = await currentTrailUser(request, env);
  if (!user) return redirect("/trail", 303);

  const form = await request.formData();
  const trailId = String(form.get("trail_id") ?? "");
  if (trailId !== COMMON_TRAIL_ID) {
    const owned = await env.DB.prepare(
      "SELECT 1 AS ok FROM trail_owners WHERE trail_id = ? AND user_id = ?",
    )
      .bind(trailId, user.id)
      .first<{ ok: number }>();
    if (!owned) return redirect("/trail", 303);
  }

  const trailToken = randomToken();
  await env.DB.prepare("INSERT INTO trail_sessions (token, trail_id) VALUES (?, ?)")
    .bind(trailToken, trailId)
    .run();

  return withTrailCookie(redirect("/trail", 303), trailCookie(trailToken, request));
}

const COMMON_TRAIL_ID = "trail_common_example_v1";

async function ensureCommonExampleTrail(env: Env): Promise<void> {
  // The live trail API polls frequently. Avoid dozens of D1 writes every
  // time a viewer checks for updates; seed only after an explicit reset.
  const populated = await env.DB.prepare(
    "SELECT 1 AS ok FROM trail_items WHERE trail_id = ? LIMIT 1",
  ).bind(COMMON_TRAIL_ID).first<{ ok: number }>();
  if (populated) return;

  await env.DB.prepare("INSERT OR IGNORE INTO trails (id) VALUES (?)")
    .bind(COMMON_TRAIL_ID)
    .run();

  // Branch presentation is temporarily paused while the branch-origin model is
  // redesigned. Keep the shared example strictly on its main path and remove
  // legacy branch-only items left by older seeds.
  await env.DB.prepare("DELETE FROM trail_branches WHERE trail_id = ?")
    .bind(COMMON_TRAIL_ID)
    .run();
  await env.DB.prepare(
    `DELETE FROM trail_items
      WHERE trail_id = ?
        AND NOT EXISTS (
          SELECT 1
            FROM trail_item_placements p
           WHERE p.trail_id = ?
             AND p.item_id = trail_items.id
        )`,
  )
    .bind(COMMON_TRAIL_ID, COMMON_TRAIL_ID)
    .run();

  await env.DB.prepare(
    `INSERT OR IGNORE INTO trail_metadata (trail_id, title, description)
     VALUES (?, ?, ?)`,
  )
    .bind(
      COMMON_TRAIL_ID,
      "The M87* shadow",
      "The Event Horizon Telescope image of M87* shows an asymmetric emission ring with a central brightness depression. The trail connects the observation to its reconstruction and physical interpretation.",
    )
    .run();

  await env.DB.prepare(
    `UPDATE trail_metadata
        SET title = 'The M87* shadow',
            description = 'The Event Horizon Telescope image of M87* shows an asymmetric emission ring with a central brightness depression. The trail connects the observation to its reconstruction and physical interpretation.'
      WHERE trail_id = ?
        AND title = 'A branching research trail'`,
  )
    .bind(COMMON_TRAIL_ID)
    .run();

  await env.DB.prepare(
    `INSERT OR IGNORE INTO trail_contexts (trail_id, question)
     VALUES (?, ?)`,
  )
    .bind(
      COMMON_TRAIL_ID,
      "What do we want to understand?",
    )
    .run();

  await env.DB.prepare(
    `UPDATE trail_contexts
        SET question = 'What do we want to understand?'
      WHERE trail_id = ?
        AND question = 'How should a research path preserve divergence, evidence, dead ends, and synthesis without becoming an unreadable graph?'`,
  )
    .bind(COMMON_TRAIL_ID)
    .run();

  const existing = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM trail_items WHERE trail_id = ?",
  )
    .bind(COMMON_TRAIL_ID)
    .first<{ count: number }>();
  if (Number(existing?.count ?? 0) > 0) return;

  const seedItem = async (
    kind: string,
    title: string,
    url: string | null,
    content: string | null,
    note: string | null,
    sourceRef: string,
    branchId: number,
    position: number,
  ): Promise<number> => {
    await env.DB.prepare(
      `INSERT OR IGNORE INTO trail_items
         (trail_id, kind, title, url, content, note, source_ref, position)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        COMMON_TRAIL_ID,
        kind,
        title,
        url,
        content,
        note,
        sourceRef,
        position,
      )
      .run();

    const item = await env.DB.prepare(
      "SELECT id FROM trail_items WHERE trail_id = ? AND source_ref = ?",
    )
      .bind(COMMON_TRAIL_ID, sourceRef)
      .first<{ id: number }>();
    if (!item) throw new Error("Could not seed example trail item");

    await env.DB.prepare(
      `INSERT OR IGNORE INTO trail_item_placements
         (trail_id, item_id, branch_id, position)
       VALUES (?, ?, ?, ?)`,
    )
      .bind(COMMON_TRAIL_ID, item.id, branchId, position)
      .run();

    return item.id;
  };

  await seedItem(
    "note", "Ring emission around M87*", null,
    "The Event Horizon Telescope (EHT) observed M87* in April 2017. The reconstructed image contains an asymmetric ring of radio emission surrounding a central brightness depression.",
    "The image is reconstructed from very-long-baseline interferometry data rather than recorded by a conventional camera.",
    "example:m87:question", 0, 0,
  );
  await seedItem(
    "paper", "First M87 Event Horizon Telescope Results. I. The Shadow of the Supermassive Black Hole",
    "/p/doi%3A10.3847%2F2041-8213%2Fab0ec7",
    "The ring morphology and central brightness depression are consistent with emission around a supermassive black hole.",
    "EHT Collaboration (2019), Astrophysical Journal Letters 875 L1. Figure 3 contains the reconstructed images reproduced below.",
    "example:m87:paper-one", 0, 1,
  );
  await seedItem(
    "note", "The reconstructed M87* image", null,
    "![EHT Collaboration (2019), Figure 3, CC BY 3.0](https://upload.wikimedia.org/wikipedia/commons/0/09/Apjlab0ec7f3_EHT-image-of-M87-black-hole.jpg)",
    "The reconstructed images show the persistent ring structure across the observing days. EHT Collaboration, Astrophysical Journal Letters 875 L1 (2019), Figure 3. Reproduced without modification under CC BY 3.0.",
    "example:m87:figure", 0, 2,
  );
  await seedItem(
    "link", "Figure source and license",
    "https://commons.wikimedia.org/wiki/File:Apjlab0ec7f3_EHT-image-of-M87-black-hole.jpg",
    "The published figure is available under CC BY 3.0 with attribution to the EHT Collaboration.",
    "Wikimedia Commons provides the original file and its reuse conditions.",
    "example:m87:image-source", 0, 3,
  );
  await seedItem(
    "note", "Gravitational lensing and photon capture", null,
    "Radiation from plasma near M87* is strongly bent by gravity. Photon capture reduces the emission received from the central region, producing the brightness depression surrounded by the ring.",
    "The black-hole shadow depends on the spacetime geometry. The observed brightness distribution also depends on the emitting plasma.",
    "example:m87:interpretation", 0, 4,
  );
  await seedItem(
    "note", "The gravitational angular scale", null,
    String.raw`The gravitational radius sets the characteristic scale of the image. At distance $D$, the corresponding angular scale is

$$
\theta_g = \frac{GM}{Dc^2}.
$$

The measured ring size constrains the mass when combined with the distance and an emission model.`,
    "Here $M$ is the mass, $G$ the gravitational constant, and $c$ the speed of light. Gravitational lensing and the plasma distribution determine the relation between the ring diameter and this scale.",
    "example:m87:scale", 0, 5,
  );
  await seedItem(
    "paper", "First M87 Event Horizon Telescope Results. IV. Imaging the Central Supermassive Black Hole",
    "/p/doi%3A10.3847%2F2041-8213%2Fab0e85",
    "Independent reconstruction methods recover an asymmetric ring with a central brightness depression.",
    "The agreement across imaging pipelines and observing days supports the robustness of the ring despite sparse interferometric coverage.",
    "example:m87:paper-four", 0, 6,
  );
  await seedItem(
    "paper", "First M87 Event Horizon Telescope Results. VI. The Shadow and Mass of the Central Black Hole",
    "/p/doi%3A10.3847%2F2041-8213%2Fab1141",
    "Comparisons with relativistic simulations relate the measured ring diameter to the mass of the central black hole.",
    "The mass estimate depends on the distance to M87* and on the model connecting the observed emission to the gravitational scale.",
    "example:m87:paper-six", 0, 7,
  );
  await seedItem(
    "note", "Interpretation and remaining uncertainty", null,
    "The observed ring and central depression agree with models of a black-hole shadow in general relativity. The image alone does not uniquely determine the spacetime geometry.",
    "Observations at additional frequencies and epochs can help separate properties of the plasma from the gravitational structure inferred from the image.",
    "example:m87:next", 0, 8,
  );

}

async function resetCommonExampleTrail(env: Env): Promise<void> {
  await env.DB.batch([
    env.DB.prepare("DELETE FROM trail_branches WHERE trail_id = ?").bind(COMMON_TRAIL_ID),
    env.DB.prepare("DELETE FROM trail_item_placements WHERE trail_id = ?").bind(COMMON_TRAIL_ID),
    env.DB.prepare("DELETE FROM trail_items WHERE trail_id = ?").bind(COMMON_TRAIL_ID),
    env.DB.prepare("DELETE FROM trail_metadata WHERE trail_id = ?").bind(COMMON_TRAIL_ID),
    env.DB.prepare("DELETE FROM trail_contexts WHERE trail_id = ?").bind(COMMON_TRAIL_ID),
  ]);

  await ensureCommonExampleTrail(env);
}

async function ensureCurrentTrail(request: Request, env: Env): Promise<TrailContext> {
  await ensureCommonExampleTrail(env);

  const cookies = parseCookies(request.headers.get("Cookie") ?? "");
  const token = cookies.get("trail");
  const trailUser = await currentTrailUser(request, env);

  if (token) {
    const existing = await env.DB.prepare(
      `SELECT t.id
         FROM trail_sessions s
         JOIN trails t ON t.id = s.trail_id
        WHERE s.token = ?`,
    )
      .bind(token)
      .first<{ id: string }>();

    if (existing?.id === COMMON_TRAIL_ID) {
      return { id: COMMON_TRAIL_ID, cookie: null };
    }

    if (existing && trailUser) {
      const ownerId = await trailOwnerUserId(env, existing.id);
      if (ownerId === trailUser.id) {
        return { id: existing.id, cookie: null };
      }
    }

    if (existing && !trailUser) {
      const ownerId = await trailOwnerUserId(env, existing.id);
      if (ownerId === null) return { id: existing.id, cookie: null };
    }
  }

  return { id: COMMON_TRAIL_ID, cookie: null };
}

function trailCookie(token: string, request: Request): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `trail=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${secure}`;
}

function withTrailCookie(response: Response, cookie: string | null): Response {
  if (!cookie) return response;
  const headers = new Headers(response.headers);
  headers.append("Set-Cookie", cookie);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function listTrailItems(env: Env, trailId: string): Promise<TrailItemRow[]> {
  return listTrailItemsInBranch(env, trailId, 0);
}

async function listTrailItemsInBranch(
  env: Env,
  trailId: string,
  branchId: number,
): Promise<TrailItemRow[]> {
  const result = await env.DB.prepare(
    `SELECT i.id, i.trail_id, i.kind, i.title, i.url, i.content, i.note,
            i.source_ref, p.position AS position, i.created_at
       FROM trail_item_placements p
       JOIN trail_items i ON i.id = p.item_id
      WHERE p.trail_id = ?
        AND p.branch_id = ?
        AND i.trail_id = ?
      ORDER BY p.position ASC, i.id ASC`,
  )
    .bind(trailId, branchId, trailId)
    .all<TrailItemRow>();
  return result.results ?? [];
}

async function listTrailBranches(env: Env, trailId: string): Promise<TrailBranchView[]> {
  const result = await env.DB.prepare(
    `SELECT id, trail_id, title, parent_item_id, created_at, updated_at
       FROM trail_branches
      WHERE trail_id = ?
      ORDER BY created_at ASC, id ASC`,
  )
    .bind(trailId)
    .all<TrailBranchRow>();

  const branches = result.results ?? [];
  return await Promise.all(
    branches.map(async (branch) => ({
      ...branch,
      items: await listTrailItemsInBranch(env, trailId, branch.id),
    })),
  );
}

async function nextTrailPosition(
  env: Env,
  trailId: string,
  branchId = 0,
): Promise<number> {
  const row = await env.DB.prepare(
    `SELECT COALESCE(MAX(position), -1) + 1 AS next_position
       FROM trail_item_placements
      WHERE trail_id = ? AND branch_id = ?`,
  )
    .bind(trailId, branchId)
    .first<{ next_position: number }>();
  return Number(row?.next_position ?? 0);
}

async function placeTrailItem(
  env: Env,
  trailId: string,
  itemId: number,
  branchId = 0,
): Promise<void> {
  const position = await nextTrailPosition(env, trailId, branchId);
  await env.DB.prepare(
    `INSERT OR IGNORE INTO trail_item_placements
       (trail_id, item_id, branch_id, position)
     VALUES (?, ?, ?, ?)`,
  )
    .bind(trailId, itemId, branchId, position)
    .run();
}

// An insertion changes the displayed order of one path only. Reindexing the
// small ordered set avoids fractional ranks and preserves adjacency even
// after moves or repeated insertions into the same gap.
async function placeTrailItemBetween(
  env: Env,
  trailId: string,
  branchId: number,
  itemId: number,
  afterItemId: number,
  beforeItemId: number,
): Promise<boolean> {
  const items = await listTrailItemsInBranch(env, trailId, branchId);
  const moving = items.find((item) => item.id === itemId);
  if (!moving) return false;
  const others = items.filter((item) => item.id !== itemId);
  const afterIndex = others.findIndex((item) => item.id === afterItemId);
  if (afterIndex < 0 || others[afterIndex + 1]?.id !== beforeItemId) return false;
  others.splice(afterIndex + 1, 0, moving);
  await env.DB.batch(others.map((item, position) =>
    env.DB.prepare(
      "UPDATE trail_item_placements SET position = ? WHERE trail_id = ? AND branch_id = ? AND item_id = ?",
    ).bind(position, trailId, branchId, item.id),
  ));
  return true;
}

async function nextTrailItemStoragePosition(env: Env, trailId: string): Promise<number> {
  const row = await env.DB.prepare(
    "SELECT COALESCE(MAX(position), -1) + 1 AS next_position FROM trail_items WHERE trail_id = ?",
  )
    .bind(trailId)
    .first<{ next_position: number }>();
  return Number(row?.next_position ?? 0);
}

async function addToTrail(request: Request, env: Env): Promise<Response> {
  assertSameOrigin(request);
  const trail = await ensureCurrentTrail(request, env);
  const form = await request.formData();
  const value = String(form.get("value") ?? "").trim();

  if (!value) return withTrailCookie(redirect("/trail", 303), trail.cookie);

  await insertTrailValue(env, trail.id, value);
  return withTrailCookie(redirect("/trail", 303), trail.cookie);
}

async function insertTrailNote(
  env: Env,
  trailId: string,
  value: string,
  note: string | null = null,
  branchId = 0,
): Promise<number | null> {
  const compact = value.replace(/\s+/g, " ").trim();
  if (!compact) return null;
  const figure = /^!\[([^\]\n]{1,160})\]\(https:\/\/[^\s()]+\)/.exec(value);
  const label = figure ? "Figure: " + figure[1] : compact;
  const title = label.length > 90 ? `${label.slice(0, 87)}…` : label;
  const storagePosition = await nextTrailItemStoragePosition(env, trailId);
  const row = await env.DB.prepare(
    `INSERT INTO trail_items (trail_id, kind, title, content, note, position)
     VALUES (?, 'note', ?, ?, ?, ?)
     RETURNING id`,
  )
    .bind(
      trailId,
      title,
      value.slice(0, 10000),
      note ? note.slice(0, 2000) : null,
      storagePosition,
    )
    .first<{ id: number }>();

  if (!row?.id) return null;
  await placeTrailItem(env, trailId, row.id, branchId);
  return row.id;
}

async function insertTrailValue(
  env: Env,
  trailId: string,
  value: string,
  branchId = 0,
): Promise<number | null> {
  const clean = value.trim();
  if (!clean) return null;

  // Figure markup contains a URL but should remain a mark, not be treated
  // as a paper or an ordinary link by the identifier resolver below.
  if (/!\[[^\]\n]{1,160}\]\(https:\/\/[^\s()]+\)/.test(clean)) {
    return insertTrailNote(env, trailId, clean, null, branchId);
  }

  // A pasted DOI, arXiv ID, Scholar result, or publisher URL should become a
  // first-class paper node when the resolver can identify it.
  if (normalizePaperInput(clean)) {
    try {
      return await insertPaperIntoTrail(env, trailId, clean, null, branchId);
    } catch {
      // Not every safe URL is a paper. Fall through to a generic link.
    }
  }

  const normalizedUrl = normalizeTrailUrl(clean);
  if (normalizedUrl) {
    const storagePosition = await nextTrailItemStoragePosition(env, trailId);
    let title = normalizedUrl;
    try {
      const parsed = new URL(normalizedUrl);
      title = parsed.hostname.replace(/^www\./, "") + (parsed.pathname === "/" ? "" : parsed.pathname);
    } catch {
      // Keep the URL as the title.
    }

    const row = await env.DB.prepare(
      `INSERT INTO trail_items (trail_id, kind, title, url, source_ref, position)
       VALUES (?, 'link', ?, ?, ?, ?)
       ON CONFLICT(trail_id, source_ref) DO UPDATE SET
         title = excluded.title,
         url = excluded.url
       RETURNING id`,
    )
      .bind(trailId, title.slice(0, 300), normalizedUrl, `url:${normalizedUrl}`, storagePosition)
      .first<{ id: number }>();

    if (!row?.id) return null;
    await placeTrailItem(env, trailId, row.id, branchId);
    return row.id;
  }

  return await insertTrailNote(env, trailId, clean, null, branchId);
}

async function insertPaperIntoTrail(
  env: Env,
  trailId: string,
  rawPaper: string,
  note: string | null = null,
  branchId = 0,
  content: string | null = null,
): Promise<number | null> {
  const paperId = normalizePaperInput(rawPaper);
  if (!paperId) throw new Error("Invalid paper identifier or URL");

  const paper = await ensurePaper(env, paperId);
  const identifiers = await getPaperIdentifiers(env, paper.arxiv_id);
  const publicPaperId = preferredPaperId(identifiers, paper.arxiv_id);
  const storagePosition = await nextTrailItemStoragePosition(env, trailId);
  const itemUrl = `/p/${encodeURIComponent(publicPaperId)}`;

  const row = await env.DB.prepare(
    `INSERT INTO trail_items (trail_id, kind, title, url, content, note, source_ref, position)
     VALUES (?, 'paper', ?, ?, ?, ?, ?, ?)
     ON CONFLICT(trail_id, source_ref) DO UPDATE SET
       title = excluded.title,
       url = excluded.url,
       content = COALESCE(excluded.content, trail_items.content),
       note = COALESCE(excluded.note, trail_items.note)
     RETURNING id`,
  )
    .bind(
      trailId,
      paper.title,
      itemUrl,
      content ? content.slice(0, 10000) : null,
      note ? note.slice(0, 2000) : null,
      `paper:${paper.arxiv_id}`,
      storagePosition,
    )
    .first<{ id: number }>();

  if (!row?.id) return null;
  await placeTrailItem(env, trailId, row.id, branchId);
  return row.id;
}

async function addPaperToTrail(request: Request, env: Env): Promise<Response> {
  assertSameOrigin(request);
  const trail = await ensureCurrentTrail(request, env);
  const form = await request.formData();
  const rawPaper = String(form.get("paper_id") ?? "");
  const nextRaw = String(form.get("next") ?? "/trail");
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/trail";
  const sourcePaperId = String(form.get("from_paper_id") ?? "");
  const reason = String(form.get("reason") ?? "").trim().slice(0, 1000);
  let provenance: string | null = null;

  if (sourcePaperId) {
    const refId = normalizePaperInput(rawPaper);
    const refDoi = refId?.startsWith("doi:") ? refId.slice(4) : "";
    if (!reason || !refDoi) return new Response("Reason and DOI required", { status: 400 });
    const exists = await env.DB.prepare(
      "SELECT 1 AS ok FROM paper_references WHERE paper_id = ? AND doi = ? LIMIT 1",
    ).bind(sourcePaperId, refDoi).first<{ ok: number }>();
    const source = await getPaperByStorageId(env, sourcePaperId);
    if (!exists || !source) return new Response("Reference not found", { status: 400 });
    provenance = "Referenced by " + source.title.slice(0, 240);
  }

  try {
    await insertPaperIntoTrail(env, trail.id, rawPaper, provenance, 0, reason || null);
  } catch {
    return new Response("Invalid paper identifier or URL", { status: 400 });
  }

  return withTrailCookie(redirect(next, 303), trail.cookie);
}

async function mutateTrailItem(
  request: Request,
  env: Env,
  itemId: number,
  action: string,
): Promise<Response> {
  assertSameOrigin(request);
  const trail = await ensureCurrentTrail(request, env);
  const item = await env.DB.prepare(
    `SELECT id, trail_id, kind, title, url, content, note, source_ref, position, created_at
       FROM trail_items
      WHERE id = ? AND trail_id = ?`,
  )
    .bind(itemId, trail.id)
    .first<TrailItemRow>();

  if (!item) return withTrailCookie(redirect("/trail", 303), trail.cookie);

  const form = await request.formData();
  const branchId = Math.max(0, Math.trunc(Number(form.get("branch_id") ?? 0)));

  if (action === "remove") {
    await env.DB.prepare(
      "DELETE FROM trail_item_placements WHERE trail_id = ? AND item_id = ? AND branch_id = ?",
    )
      .bind(trail.id, itemId, branchId)
      .run();

    const remaining = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM trail_item_placements WHERE trail_id = ? AND item_id = ?",
    )
      .bind(trail.id, itemId)
      .first<{ count: number }>();
    if (Number(remaining?.count ?? 0) === 0) {
      await env.DB.prepare("DELETE FROM trail_items WHERE id = ? AND trail_id = ?")
        .bind(itemId, trail.id)
        .run();
    }
  } else if (action === "title") {
    const title = String(form.get("title") ?? "").replace(/\r\n/g, "\n").trim().slice(0, 300);
    await env.DB.prepare(
      "UPDATE trail_items SET title = ? WHERE id = ? AND trail_id = ?",
    )
      .bind(title || "untitled", itemId, trail.id)
      .run();
  } else if (action === "note") {
    const note = String(form.get("note") ?? "").trim().slice(0, 2000);
    await env.DB.prepare(
      "UPDATE trail_items SET note = ? WHERE id = ? AND trail_id = ?",
    )
      .bind(note || null, itemId, trail.id)
      .run();
  } else if (action === "move") {
    const direction = Number(form.get("direction")) < 0 ? -1 : 1;
    const placement = await env.DB.prepare(
      `SELECT position
         FROM trail_item_placements
        WHERE trail_id = ? AND item_id = ? AND branch_id = ?`,
    )
      .bind(trail.id, itemId, branchId)
      .first<{ position: number }>();

    if (placement) {
      const neighbor = await env.DB.prepare(
        direction < 0
          ? `SELECT item_id, position
               FROM trail_item_placements
              WHERE trail_id = ? AND branch_id = ?
                AND (position < ? OR (position = ? AND item_id < ?))
              ORDER BY position DESC, item_id DESC
              LIMIT 1`
          : `SELECT item_id, position
               FROM trail_item_placements
              WHERE trail_id = ? AND branch_id = ?
                AND (position > ? OR (position = ? AND item_id > ?))
              ORDER BY position ASC, item_id ASC
              LIMIT 1`,
      )
        .bind(
          trail.id,
          branchId,
          placement.position,
          placement.position,
          itemId,
        )
        .first<{ item_id: number; position: number }>();

      if (neighbor) {
        await env.DB.batch([
          env.DB.prepare(
            `UPDATE trail_item_placements
                SET position = ?
              WHERE trail_id = ? AND item_id = ? AND branch_id = ?`,
          ).bind(neighbor.position, trail.id, itemId, branchId),
          env.DB.prepare(
            `UPDATE trail_item_placements
                SET position = ?
              WHERE trail_id = ? AND item_id = ? AND branch_id = ?`,
          ).bind(placement.position, trail.id, neighbor.item_id, branchId),
        ]);
      }
    }
  }

  return withTrailCookie(redirect("/trail", 303), trail.cookie);
}

async function handleTrailApi(
  request: Request,
  env: Env,
  path: string,
): Promise<Response> {
  const trail = await ensureCurrentTrail(request, env);

  if (request.method === "PATCH" && path === "/api/trail") {
    assertSameOrigin(request);
    const payload = await request.json().catch(() => ({})) as {
      title?: string;
      description?: string;
    };

    if (payload.title !== undefined) {
      await setTrailTitle(env, trail.id, String(payload.title));
    }
    if (payload.description !== undefined) {
      await setTrailDescription(env, trail.id, String(payload.description));
    }

    const [title, description] = await Promise.all([
      getTrailTitle(env, trail.id),
      getTrailDescription(env, trail.id),
    ]);
    return withTrailCookie(json({
      id: trail.id,
      title: title ?? "",
      description: description ?? "",
    }), trail.cookie);
  }

  if (request.method === "GET" && path === "/api/trail") {
    const [items, branches, title, description] = await Promise.all([
      listTrailItems(env, trail.id),
      listTrailBranches(env, trail.id),
      getTrailTitle(env, trail.id),
      getTrailDescription(env, trail.id),
    ]);
    return withTrailCookie(
      json({
        id: trail.id,
        title: title ?? "",
        description: description ?? "",
        question: description ?? "",
        items,
        branches,
        html: renderTrailGraph(items, []),
      }),
      trail.cookie,
    );
  }

  if (request.method === "POST" && path === "/api/trail/branches") {
    assertSameOrigin(request);
    const payload = await request.json().catch(() => ({})) as {
      parent_item_id?: number;
      title?: string;
    };
    const parentItemId = Math.trunc(Number(payload.parent_item_id));
    if (!Number.isFinite(parentItemId)) {
      return withTrailCookie(json({ error: "invalid parent item" }, 400), trail.cookie);
    }

    const parent = await env.DB.prepare(
      `SELECT i.id
         FROM trail_item_placements p
         JOIN trail_items i ON i.id = p.item_id
        WHERE p.trail_id = ?
          AND p.branch_id = 0
          AND i.trail_id = ?
          AND i.id = ?
        LIMIT 1`,
    )
      .bind(trail.id, trail.id, parentItemId)
      .first<{ id: number }>();

    if (!parent) {
      return withTrailCookie(json({ error: "branch parent must be on the main path" }, 400), trail.cookie);
    }

    const cleanTitle = String(payload.title ?? "branch")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120) || "branch";

    const branch = await env.DB.prepare(
      `INSERT INTO trail_branches (trail_id, title, parent_item_id)
       VALUES (?, ?, ?)
       RETURNING id, trail_id, title, parent_item_id, created_at, updated_at`,
    )
      .bind(trail.id, cleanTitle, parentItemId)
      .first<TrailBranchRow>();

    if (!branch) {
      return withTrailCookie(json({ error: "could not create branch" }, 500), trail.cookie);
    }

    return withTrailCookie(json({ branch: { ...branch, items: [] } }, 201), trail.cookie);
  }

  const branchMatch = path.match(/^\/api\/trail\/branches\/(\d+)$/);
  if (branchMatch && request.method === "PATCH") {
    assertSameOrigin(request);
    const branchId = Number(branchMatch[1]);
    const payload = await request.json().catch(() => ({})) as { title?: string };
    const existing = await env.DB.prepare(
      "SELECT id FROM trail_branches WHERE id = ? AND trail_id = ?",
    )
      .bind(branchId, trail.id)
      .first<{ id: number }>();
    if (!existing) {
      return withTrailCookie(json({ error: "branch not found" }, 404), trail.cookie);
    }

    if (payload.title !== undefined) {
      const cleanTitle = String(payload.title)
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 120) || "branch";
      await env.DB.prepare(
        "UPDATE trail_branches SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND trail_id = ?",
      )
        .bind(cleanTitle, branchId, trail.id)
        .run();
    }

    const branch = await env.DB.prepare(
      `SELECT id, trail_id, title, parent_item_id, created_at, updated_at
         FROM trail_branches
        WHERE id = ? AND trail_id = ?`,
    )
      .bind(branchId, trail.id)
      .first<TrailBranchRow>();

    return withTrailCookie(json({ branch }), trail.cookie);
  }

  if (request.method === "POST" && path === "/api/trail/items") {
    assertSameOrigin(request);
    const payload = await request.json().catch(() => ({})) as {
      value?: string;
      kind?: string;
      title?: string;
      url?: string;
      content?: string;
      note?: string;
      branch_id?: number;
      after_item_id?: number;
      before_item_id?: number;
    };

    const branchId = Math.max(0, Math.trunc(Number(payload.branch_id ?? 0)));
    if (branchId > 0) {
      const branch = await env.DB.prepare(
        "SELECT id FROM trail_branches WHERE id = ? AND trail_id = ?",
      )
        .bind(branchId, trail.id)
        .first<{ id: number }>();
      if (!branch) {
        return withTrailCookie(json({ error: "branch not found" }, 404), trail.cookie);
      }
    }

    const between = payload.after_item_id !== undefined || payload.before_item_id !== undefined;
    const afterId = Number(payload.after_item_id);
    const beforeId = Number(payload.before_item_id);
    if (between) {
      if (!Number.isSafeInteger(afterId) || !Number.isSafeInteger(beforeId)) {
        return withTrailCookie(json({ error: "invalid insertion link" }, 400), trail.cookie);
      }
      const current = await listTrailItemsInBranch(env, trail.id, branchId);
      const index = current.findIndex((item) => item.id === afterId);
      if (index < 0 || current[index + 1]?.id !== beforeId) {
        return withTrailCookie(json({ error: "the selected link has changed" }, 409), trail.cookie);
      }
    }

    let insertedId: number | null = null;
    if (payload.value) {
      insertedId = await insertTrailValue(env, trail.id, String(payload.value), branchId);
    } else {
      const storagePosition = await nextTrailItemStoragePosition(env, trail.id);
      const kind = String(payload.kind ?? "note").slice(0, 40);
      const itemTitle = String(payload.title ?? payload.content ?? payload.url ?? "untitled").slice(0, 300);
      const url = payload.url ? normalizeTrailUrl(String(payload.url)) : null;
      const content = payload.content ? String(payload.content).slice(0, 10000) : null;
      const note = payload.note ? String(payload.note).slice(0, 2000) : null;
      const row = await env.DB.prepare(
        `INSERT INTO trail_items (trail_id, kind, title, url, content, note, position)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         RETURNING id`,
      )
        .bind(trail.id, kind, itemTitle, url, content, note, storagePosition)
        .first<{ id: number }>();
      if (row?.id) {
        insertedId = row.id;
        await placeTrailItem(env, trail.id, row.id, branchId);
      }
    }

    if (between && insertedId) {
      const placed = await placeTrailItemBetween(env, trail.id, branchId, insertedId, afterId, beforeId);
      if (!placed) {
        return withTrailCookie(json({ error: "the selected link has changed" }, 409), trail.cookie);
      }
    }

    const [items, branches] = await Promise.all([
      listTrailItems(env, trail.id),
      listTrailBranches(env, trail.id),
    ]);
    return withTrailCookie(json({ id: trail.id, items, branches }, 201), trail.cookie);
  }

  const match = path.match(/^\/api\/trail\/items\/(\d+)$/);
  if (match && request.method === "DELETE") {
    assertSameOrigin(request);
    await env.DB.prepare("DELETE FROM trail_items WHERE id = ? AND trail_id = ?")
      .bind(Number(match[1]), trail.id)
      .run();
    return withTrailCookie(json({ ok: true }), trail.cookie);
  }

  if (match && request.method === "PATCH") {
    assertSameOrigin(request);
    const payload = await request.json().catch(() => ({})) as {
      title?: string;
      note?: string | null;
      content?: string | null;
      position?: number;
      branch_id?: number;
    };
    const itemId = Number(match[1]);
    const existing = await env.DB.prepare(
      "SELECT id FROM trail_items WHERE id = ? AND trail_id = ?",
    )
      .bind(itemId, trail.id)
      .first();
    if (!existing) return withTrailCookie(json({ error: "not found" }, 404), trail.cookie);

    if (payload.title !== undefined) {
      await env.DB.prepare("UPDATE trail_items SET title = ? WHERE id = ? AND trail_id = ?")
        .bind(String(payload.title).slice(0, 300), itemId, trail.id)
        .run();
    }
    if (payload.note !== undefined) {
      await env.DB.prepare("UPDATE trail_items SET note = ? WHERE id = ? AND trail_id = ?")
        .bind(payload.note === null ? null : String(payload.note).slice(0, 2000), itemId, trail.id)
        .run();
    }
    if (payload.content !== undefined) {
      await env.DB.prepare("UPDATE trail_items SET content = ? WHERE id = ? AND trail_id = ?")
        .bind(payload.content === null ? null : String(payload.content).slice(0, 10000), itemId, trail.id)
        .run();
    }
    if (payload.position !== undefined && Number.isFinite(Number(payload.position))) {
      const branchId = Math.max(0, Math.trunc(Number(payload.branch_id ?? 0)));
      await env.DB.prepare(
        `UPDATE trail_item_placements
            SET position = ?
          WHERE trail_id = ? AND item_id = ? AND branch_id = ?`,
      )
        .bind(Math.trunc(Number(payload.position)), trail.id, itemId, branchId)
        .run();
    }

    const [items, branches] = await Promise.all([
      listTrailItems(env, trail.id),
      listTrailBranches(env, trail.id),
    ]);
    return withTrailCookie(json({ id: trail.id, items, branches }), trail.cookie);
  }

  return withTrailCookie(json({ error: "method not allowed" }, 405), trail.cookie);
}

async function trailIdForIntegrationKey(env: Env, key: string): Promise<string | null> {
  const clean = key.trim().toLowerCase();
  if (!/^[a-f0-9]{24,48}$/.test(clean)) return null;
  const row = await env.DB.prepare(
    "SELECT trail_id FROM trail_integrations WHERE token = ?",
  )
    .bind(clean)
    .first<{ trail_id: string }>();
  return row?.trail_id ?? null;
}

async function handleSharedTrailMcp(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "content-type, mcp-session-id, mcp-protocol-version",
        "Access-Control-Expose-Headers": "Mcp-Session-Id",
      },
    });
  }

  const origin = new URL(request.url).origin;
  const keySchema = z.string().regex(/^[a-fA-F0-9]{24,48}$/, "Invalid trail key");
  const resolveTrail = async (key: string): Promise<string> => {
    const trailId = await trailIdForIntegrationKey(env, key);
    if (!trailId) throw new Error("Unknown trail key");
    return trailId;
  };

  const server = new McpServer(
    { name: "trails", version: "0.1.0" },
    {
      instructions:
        "Trails records how a research question develops. When the user asks to start a new trail, create one and return its open_url. For an existing trail, ask for or reuse its private key. Read the trail before adding context-sensitive steps. Add only material that contributes to the research path.",
    },
  );

  server.registerTool(
    "create_trail",
    {
      description: "Create a new research trail with an optional title and description. The legacy question field is still accepted as a description.",
      inputSchema: z.object({
        title: z.string().max(140).optional(),
        description: z.string().max(2000).optional(),
        question: z.string().max(2000).optional(),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({ title, description, question }) => {
      const trailDescription = description ?? question ?? null;
      const created = await createStandaloneTrail(env, title ?? null, trailDescription);
      const openUrl = `${origin}/trail/open/${created.key}`;
      const result = {
        key: created.key,
        title: title?.trim() || null,
        description: trailDescription?.trim() || null,
        question: trailDescription?.trim() || null,
        open_url: openUrl,
      };
      return {
        content: [{
          type: "text",
          text: `Created a new trail. Open it here: ${openUrl}`,
        }],
        structuredContent: result,
      };
    },
  );

  server.registerTool(
    "get_trail",
    {
      description: "Read one research trail from its private trail key.",
      inputSchema: z.object({ key: keySchema }),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ key }) => {
      const trailId = await resolveTrail(key);
      const [title, description, items, branches] = await Promise.all([
        getTrailTitle(env, trailId),
        getTrailDescription(env, trailId),
        listTrailItems(env, trailId),
        listTrailBranches(env, trailId),
      ]);
      const snapshot = {
        title,
        description,
        question: description,
        items: items.map((item, index) => ({
          step: index + 1,
          id: item.id,
          kind: item.kind,
          title: item.title,
          url: item.url ? new URL(item.url, origin).toString() : null,
          content: item.content,
          note: item.note,
        })),
        branches: branches.map((branch) => ({
          id: branch.id,
          title: branch.title,
          parent_item_id: branch.parent_item_id,
          items: branch.items.map((item, index) => ({
            step: index + 1,
            id: item.id,
            kind: item.kind,
            title: item.title,
            url: item.url ? new URL(item.url, origin).toString() : null,
            content: item.content,
            note: item.note,
          })),
        })),
      };
      return {
        content: [{ type: "text", text: JSON.stringify(snapshot) }],
        structuredContent: snapshot,
      };
    },
  );

  server.registerTool(
    "set_trail_title",
    {
      description: "Set or replace the title of a research trail.",
      inputSchema: z.object({
        key: keySchema,
        title: z.string().min(1).max(140),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({ key, title }) => {
      const trailId = await resolveTrail(key);
      await setTrailTitle(env, trailId, title);
      return {
        content: [{ type: "text", text: `Trail title set to: ${title}` }],
        structuredContent: { title },
      };
    },
  );

  server.registerTool(
    "set_trail_description",
    {
      description: "Set or replace the main description of a research trail.",
      inputSchema: z.object({
        key: keySchema,
        description: z.string().min(1).max(2000),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({ key, description }) => {
      const trailId = await resolveTrail(key);
      await setTrailDescription(env, trailId, description);
      return {
        content: [{ type: "text", text: "Trail description updated." }],
        structuredContent: { description },
      };
    },
  );

  server.registerTool(
    "set_trail_question",
    {
      description: "Set the research question anchoring a trail.",
      inputSchema: z.object({
        key: keySchema,
        question: z.string().min(1).max(600),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({ key, question }) => {
      const trailId = await resolveTrail(key);
      await setTrailQuestion(env, trailId, question);
      return {
        content: [{ type: "text", text: `Trail question set to: ${question}` }],
        structuredContent: { question },
      };
    },
  );

  server.registerTool(
    "add_trail_note",
    {
      description: "Append a thought, connection, interpretation, or next question to a research trail.",
      inputSchema: z.object({
        key: keySchema,
        text: z.string().min(1).max(10000),
        why: z.string().max(2000).optional(),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({ key, text, why }) => {
      const trailId = await resolveTrail(key);
      await insertTrailNote(env, trailId, text, why ?? null);
      return {
        content: [{ type: "text", text: "Added note to the trail." }],
        structuredContent: { ok: true },
      };
    },
  );

  server.registerTool(
    "add_trail_paper",
    {
      description: "Resolve a DOI, arXiv ID, paper URL, or Google Scholar link and append that paper to a research trail.",
      inputSchema: z.object({
        key: keySchema,
        paper: z.string().min(1),
        why: z.string().max(2000).optional(),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    },
    async ({ key, paper, why }) => {
      const trailId = await resolveTrail(key);
      await insertPaperIntoTrail(env, trailId, paper, why ?? null);
      return {
        content: [{ type: "text", text: "Added paper to the trail." }],
        structuredContent: { ok: true },
      };
    },
  );

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  const response = await transport.handleRequest(request);
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Expose-Headers", "Mcp-Session-Id");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function handleTrailMcp(request: Request, env: Env, token: string): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "content-type, mcp-session-id, mcp-protocol-version",
        "Access-Control-Expose-Headers": "Mcp-Session-Id",
      },
    });
  }

  const integration = await env.DB.prepare(
    "SELECT trail_id FROM trail_integrations WHERE token = ?",
  )
    .bind(token)
    .first<{ trail_id: string }>();

  if (!integration) return new Response("Unknown trail connection", { status: 404 });

  const origin = new URL(request.url).origin;
  const server = new McpServer(
    { name: "trails", version: "0.1.0" },
    {
      instructions:
        "This server edits one small research trail. Use the trail as a record of how a research question develops, not as a general bookmark list. Read the trail before adding context-sensitive steps.",
    },
  );

  server.registerTool(
    "get_trail",
    {
      description: "Read the current research trail, including its question and ordered paper/note steps.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => {
      const [title, description, items, branches] = await Promise.all([
        getTrailTitle(env, integration.trail_id),
        getTrailDescription(env, integration.trail_id),
        listTrailItems(env, integration.trail_id),
        listTrailBranches(env, integration.trail_id),
      ]);
      const snapshot = {
        title,
        description,
        question: description,
        items: items.map((item, index) => ({
          step: index + 1,
          id: item.id,
          kind: item.kind,
          title: item.title,
          url: item.url
            ? new URL(item.url, origin).toString()
            : null,
          content: item.content,
          note: item.note,
        })),
        branches: branches.map((branch) => ({
          id: branch.id,
          title: branch.title,
          parent_item_id: branch.parent_item_id,
          items: branch.items.map((item, index) => ({
            step: index + 1,
            id: item.id,
            kind: item.kind,
            title: item.title,
            url: item.url
              ? new URL(item.url, origin).toString()
              : null,
            content: item.content,
            note: item.note,
          })),
        })),
      };
      return {
        content: [{ type: "text", text: JSON.stringify(snapshot) }],
        structuredContent: snapshot,
      };
    },
  );

  server.registerTool(
    "set_trail_title",
    {
      description: "Set or replace the title of the current research trail.",
      inputSchema: z.object({
        title: z.string().min(1).max(140),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({ title }) => {
      await setTrailTitle(env, integration.trail_id, title);
      return {
        content: [{ type: "text", text: `Trail title set to: ${title}` }],
        structuredContent: { title },
      };
    },
  );

  server.registerTool(
    "set_trail_description",
    {
      description: "Set or replace the main description of the current research trail.",
      inputSchema: z.object({
        description: z.string().min(1).max(2000),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({ description }) => {
      await setTrailDescription(env, integration.trail_id, description);
      return {
        content: [{ type: "text", text: "Trail description updated." }],
        structuredContent: { description },
      };
    },
  );

  server.registerTool(
    "set_trail_question",
    {
      description: "Set or replace the research question that anchors the current trail.",
      inputSchema: z.object({
        question: z.string().min(1).max(600),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({ question }) => {
      await setTrailQuestion(env, integration.trail_id, question);
      return {
        content: [{ type: "text", text: `Trail question set to: ${question}` }],
        structuredContent: { question },
      };
    },
  );

  server.registerTool(
    "add_trail_note",
    {
      description: "Append a short thought, connection, interpretation, or next question to the current research trail.",
      inputSchema: z.object({
        text: z.string().min(1).max(10000),
        why: z.string().max(2000).optional(),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({ text, why }) => {
      await insertTrailNote(env, integration.trail_id, text, why ?? null);
      return {
        content: [{ type: "text", text: "Added note to the trail." }],
        structuredContent: { ok: true },
      };
    },
  );

  server.registerTool(
    "add_trail_paper",
    {
      description: "Resolve a DOI, arXiv ID, paper URL, or Google Scholar link and append that paper to the current research trail. Use the optional why field to record why it belongs in the path.",
      inputSchema: z.object({
        paper: z.string().min(1),
        why: z.string().max(2000).optional(),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    },
    async ({ paper, why }) => {
      await insertPaperIntoTrail(env, integration.trail_id, paper, why ?? null);
      return {
        content: [{ type: "text", text: "Added paper to the trail." }],
        structuredContent: { ok: true },
      };
    },
  );

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  const response = await transport.handleRequest(request);
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Expose-Headers", "Mcp-Session-Id");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function normalizeTrailUrl(raw: string): string | null {
  try {
    const value = extractPastedPaperValue(raw);
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;

    const trackingKeys: string[] = [];
    url.searchParams.forEach((_value, key) => {
      if (/^(?:utm_.+|gclid|fbclid|mc_cid|mc_eid)$/i.test(key)) trackingKeys.push(key);
    });
    for (const key of trackingKeys) url.searchParams.delete(key);

    return url.toString();
  } catch {
    return null;
  }
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
      <span>Plain text, 5,000 characters max</span>
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
            <a href="https://orcid.org/${escapeAttr(comment.orcid)}" target="_blank" rel="noopener noreferrer">${escapeHtml(comment.display_name)}</a>
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

function renderPaperSources(identifiers: PaperIdentifier[], foundPdf: string | null): string {
  const doi = identifiers.find((item) => item.type === "doi" && !isArxivIssuedDoi(item.value));
  const arxiv = identifiers.find((item) => item.type === "arxiv");
  const source = identifiers.find((item) => item.type === "url");
  const directPdf = foundPdf ?? (arxiv ? `https://arxiv.org/pdf/${encodeURIComponent(arxiv.value)}` : null);
  const pdf = directPdf
    ? `<a class="paper-source" href="${escapeAttr(directPdf)}" target="_blank" rel="noopener noreferrer">PDF ↗</a>`
    : "";
  if (doi) {
    const venue = doi.label && doi.label !== "Published version" ? doi.label : "Published version";
    return `<p class="paper-venue">${escapeHtml(venue)}</p>
      <div class="paper-links">
        ${pdf || `<a class="paper-source" href="${escapeAttr(doi.url)}" target="_blank" rel="noopener noreferrer">published version ↗</a>`}
      </div>
      <p class="paper-doi">DOI ${escapeHtml(doi.value)}</p>`;
  }
  if (arxiv) return `<p class="paper-id">arXiv:${escapeHtml(arxiv.value)}</p>${pdf}`;
  if (source) {
    return `<p class="paper-id">${escapeHtml(source.label ?? sourceHost(source.value))}</p>
      ${pdf || `<a class="paper-source" href="${escapeAttr(source.url)}" target="_blank" rel="noopener noreferrer">open source ↗</a>`}`;
  }
  return pdf || `<p class="paper-id">paper</p>`;
}

function sourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
}

const PAPER_ACCESS_TTL_MS = 14 * 24 * 60 * 60 * 1000;

function secureSourceUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch { return null; }
}

function openAlexAbstract(index: unknown): string | null {
  if (!index || typeof index !== "object" || Array.isArray(index)) return null;
  const words: string[] = [];
  for (const [word, positions] of Object.entries(index)) {
    if (!Array.isArray(positions)) continue;
    for (const position of positions) {
      if (Number.isInteger(position) && position >= 0 && position < 1200) words[position] = word;
    }
  }
  const abstract = words.filter(Boolean).join(" ");
  return abstract.length >= 40 ? abstract.slice(0, 8000) : null;
}

async function fetchJsonWithTimeout(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "trails/0.1 (research metadata)" },
    signal: AbortSignal.timeout(2600),
  });
  if (!response.ok) throw new Error(`Metadata service returned ${response.status}`);
  return response.json();
}

async function getPaperAccess(
  env: Env, paper: Paper, identifiers: PaperIdentifier[],
): Promise<PaperAccess> {
  const existing = await env.DB.prepare(
    "SELECT abstract, pdf_url, checked_at FROM paper_access WHERE paper_id = ?",
  ).bind(paper.arxiv_id).first<PaperAccess>();
  if (existing && Date.now() - Date.parse(existing.checked_at.replace(" ", "T") + "Z") < PAPER_ACCESS_TTL_MS) {
    return existing;
  }

  const doi = identifiers.find((item) => item.type === "doi")?.value;
  const arxiv = identifiers.find((item) => item.type === "arxiv")?.value;
  if (!doi) {
    return { abstract: null, pdf_url: arxiv ? `https://arxiv.org/pdf/${encodeURIComponent(arxiv)}` : null, checked_at: "" };
  }

  let abstract: string | null = null;
  let pdfUrl: string | null = null;
  // Use structured APIs rather than scraping Google Scholar. OpenAlex
  // distinguishes published, accepted and submitted open-access copies.
  const lookups = await Promise.allSettled([
    fetchJsonWithTimeout(`https://api.openalex.org/works/https://doi.org/${doi}`),
    fetchJsonWithTimeout(`https://api.semanticscholar.org/graph/v1/paper/DOI:${encodeURIComponent(doi)}?fields=abstract,openAccessPdf`),
  ]);

  if (lookups[0].status === "fulfilled") {
    const record = lookups[0].value as {
      abstract_inverted_index?: unknown;
      locations?: Array<{ is_oa?: boolean; pdf_url?: string | null; version?: string; source?: { type?: string } }>;
      best_oa_location?: { pdf_url?: string | null };
    };
    abstract = openAlexAbstract(record.abstract_inverted_index);
    const versions: Record<string, number> = { publishedVersion: 0, acceptedVersion: 1, submittedVersion: 2 };
    const copies = (record.locations ?? [])
      .filter((location) => location.is_oa && secureSourceUrl(location.pdf_url))
      .sort((a, b) =>
        (versions[a.version ?? ""] ?? 3) - (versions[b.version ?? ""] ?? 3) ||
        (a.source?.type === "repository" ? 1 : 0) - (b.source?.type === "repository" ? 1 : 0)
      );
    pdfUrl = secureSourceUrl(copies[0]?.pdf_url ?? record.best_oa_location?.pdf_url);
  }

  if (lookups[1].status === "fulfilled") {
    const record = lookups[1].value as { abstract?: string | null; openAccessPdf?: { url?: string } | null };
    if (!abstract && record.abstract?.trim()) abstract = record.abstract.trim().slice(0, 8000);
    if (!pdfUrl) pdfUrl = secureSourceUrl(record.openAccessPdf?.url);
  }

  // Verified author-hosted journal copy, if discovery APIs do not list it.
  if (!pdfUrl && doi.toLowerCase() === "10.1088/0143-0807/18/4/012") {
    pdfUrl = "https://michaelberryphysics.wordpress.com/wp-content/uploads/2013/07/berry285.pdf";
  }

  try {
    await env.DB.prepare(
      `INSERT INTO paper_access (paper_id, abstract, pdf_url, checked_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(paper_id) DO UPDATE SET
         abstract = excluded.abstract, pdf_url = excluded.pdf_url, checked_at = CURRENT_TIMESTAMP`,
    ).bind(paper.arxiv_id, abstract, pdfUrl).run();
  } catch (error) {
    console.warn("Unable to cache additional paper metadata", error);
  }
  return { abstract, pdf_url: pdfUrl, checked_at: new Date().toISOString() };
}

function usableReferenceTitle(title: string, doi: string): boolean {
  const clean = title.trim();
  if (!clean || clean === "title unavailable") return false;
  return normalizeDoiInput(clean) !== doi;
}

// Crossref's outgoing references sometimes omit the title entirely.
// Recover it from the cited work's own record, rather than display its DOI.
async function resolveReferenceTitles(
  env: Env,
  paperId: string,
  references: PaperReference[],
): Promise<PaperReference[]> {
  const missing = references.filter((ref) =>
    !usableReferenceTitle(ref.title, ref.doi) && ref.title !== "title unavailable",
  );
  if (!missing.length) return references;

  const resolved = new Map<string, { title: string; year: number | null }>();
  const dois = [...new Set(missing.map((ref) => ref.doi))];
  for (let index = 0; index < dois.length; index += 40) {
    const batch = dois.slice(index, index + 40);
    try {
      const endpoint = new URL("https://api.openalex.org/works");
      endpoint.searchParams.set("filter", "doi:" + batch.join("|"));
      endpoint.searchParams.set("per_page", String(batch.length));
      endpoint.searchParams.set("select", "doi,display_name,publication_year");
      const data = await fetchJsonWithTimeout(endpoint.toString()) as {
        results?: Array<{ doi?: string | null; display_name?: string; publication_year?: number }>;
      };
      for (const work of data.results ?? []) {
        const workDoi = normalizeDoiInput(work.doi ?? "");
        const title = cleanHtmlText(work.display_name ?? "").slice(0, 300);
        if (workDoi && usableReferenceTitle(title, workDoi)) {
          resolved.set(workDoi, {
            title, year: Number.isInteger(work.publication_year) ? work.publication_year! : null,
          });
        }
      }
    } catch (error) {
      console.warn("OpenAlex reference-title lookup failed", error);
    }
  }

  const remaining = dois.filter((doi) => !resolved.has(doi)).slice(0, 12);
  await Promise.all(remaining.map(async (doi) => {
    try {
      const record = await fetchJsonWithTimeout(
        "https://api.crossref.org/works/" + encodeURIComponent(doi),
      ) as { message?: { title?: string[]; published?: { "date-parts"?: number[][] } } };
      const title = cleanHtmlText(record.message?.title?.[0] ?? "").slice(0, 300);
      const year = record.message?.published?.["date-parts"]?.[0]?.[0] ?? null;
      if (usableReferenceTitle(title, doi)) {
        resolved.set(doi, { title, year: Number.isInteger(year) ? year : null });
      }
    } catch {
      // Missing metadata must not be presented as a paper title.
    }
  }));

  const repaired = references.map((ref) => {
    if (!missing.includes(ref)) return ref;
    const record = resolved.get(ref.doi);
    return { ...ref, title: record?.title ?? "title unavailable", year: record?.year ?? ref.year };
  });
  try {
    await env.DB.batch(repaired.filter((ref) => missing.some((old) =>
      old.position === ref.position,
    )).map((ref) => env.DB.prepare(
      "UPDATE paper_references SET title = ?, year = ?, checked_at = CURRENT_TIMESTAMP WHERE paper_id = ? AND position = ?",
    ).bind(ref.title, ref.year, paperId, ref.position)));
  } catch (error) {
    console.warn("Could not cache repaired reference titles", error);
  }
  return repaired;
}

async function getPaperReferences(
  env: Env,
  paperId: string,
  identifiers: PaperIdentifier[],
): Promise<PaperReference[]> {
  const cached = await env.DB.prepare(
    "SELECT position, title, doi, year, checked_at FROM paper_references WHERE paper_id = ? ORDER BY position",
  ).bind(paperId).all<PaperReference>();
  const previous = cached.results ?? [];
  if (previous.length && Date.now() - Date.parse(previous[0].checked_at!.replace(" ", "T") + "Z") < 7 * 86400000) {
    return resolveReferenceTitles(env, paperId, previous);
  }

  const doi = identifiers.find((id) => id.type === "doi")?.value;
  if (!doi) return previous;
  let references: PaperReference[] = [];

  try {
    const work = await fetchJsonWithTimeout(
      `https://api.openalex.org/works/https://doi.org/${doi}`,
    ) as { referenced_works?: string[] };
    const ids = (work.referenced_works ?? [])
      .map((id) => id.match(/W\d+$/)?.[0] ?? "")
      .filter(Boolean).slice(0, 60);
    if (ids.length) {
      const endpoint = new URL("https://api.openalex.org/works");
      endpoint.searchParams.set("filter", "openalex:" + ids.join("|"));
      endpoint.searchParams.set("per_page", String(ids.length));
      endpoint.searchParams.set("select", "id,doi,display_name,publication_year");
      const data = await fetchJsonWithTimeout(endpoint.toString()) as {
        results?: Array<{ id: string; doi?: string | null; display_name?: string; publication_year?: number }>;
      };
      const byId = new Map((data.results ?? []).map((item) => [item.id.match(/W\d+$/)?.[0], item]));
      references = ids.flatMap((id, position) => {
        const ref = byId.get(id);
        const refDoi = normalizeDoiInput(ref?.doi ?? "");
        const title = cleanHtmlText(ref?.display_name ?? "").slice(0, 300);
        return refDoi && title ? [{
          position, title, doi: refDoi,
          year: Number.isInteger(ref?.publication_year) ? ref!.publication_year! : null,
        }] : [];
      });
    }
  } catch (error) {
    console.warn("OpenAlex reference lookup failed", error);
  }

  if (!references.length) {
    try {
      const data = await fetchJsonWithTimeout(
        `https://api.crossref.org/works/${encodeURIComponent(doi)}`,
      ) as { message?: { reference?: Array<{
        DOI?: string; "article-title"?: string; unstructured?: string; year?: string;
      }> } };
      references = (data.message?.reference ?? []).slice(0, 60).flatMap((ref, position) => {
        const refDoi = normalizeDoiInput(ref.DOI ?? "");
        if (!refDoi) return [];
        const title = cleanHtmlText(ref["article-title"] ?? "").slice(0, 300);
        const year = Number(ref.year);
        return [{ position, title, doi: refDoi, year: year >= 1000 && year <= 2100 ? year : null }];
      });
    } catch (error) {
      console.warn("Crossref reference lookup failed", error);
    }
  }

  // Retain the recorded source order. Only DOI-resolved entries lead to a
  // stable paper page; do not fabricate records for unidentified citations.
  if (references.length) {
    try {
      await env.DB.batch([
        env.DB.prepare("DELETE FROM paper_references WHERE paper_id = ?").bind(paperId),
        ...references.map((ref) => env.DB.prepare(
          "INSERT INTO paper_references (paper_id, position, title, doi, year) VALUES (?, ?, ?, ?, ?)",
        ).bind(paperId, ref.position, ref.title, ref.doi, ref.year)),
      ]);
    } catch (error) {
      console.warn("Could not cache paper references", error);
    }
  }
  return resolveReferenceTitles(env, paperId, references.length ? references : previous);
}

async function renderPaperReferences(
  env: Env,
  paperId: string,
  identifiers: PaperIdentifier[],
  paperUrl: string,
  justAdded: boolean,
): Promise<string> {
  const references = (await getPaperReferences(env, paperId, identifiers))
    .filter((ref) => usableReferenceTitle(ref.title, ref.doi));
  if (!references.length) {
    return `<section class="tab-empty"><h2>References</h2>
      <p>No DOI-resolved references are available for this paper yet.</p></section>`;
  }

  const items = references.map((ref) => {
    const refId = `doi:${ref.doi}`;
    const href = `/p/${encodeURIComponent(refId)}?return=${encodeURIComponent(paperUrl)}`;
    return `<li class="paper-reference">
      <div class="paper-reference-text">
        <a href="${escapeAttr(href)}">${escapeHtml(ref.title)}</a>
        ${ref.year ? `<span>${ref.year}</span>` : ""}
      </div>
      <form action="/trail/add-paper" method="post" class="paper-reference-add">
        <input type="hidden" name="paper_id" value="${escapeAttr(refId)}">
        <input type="hidden" name="from_paper_id" value="${escapeAttr(paperId)}">
        <input type="hidden" name="next" value="${escapeAttr(paperUrl + "&added=1")}">
        <input name="reason" maxlength="1000" placeholder="Why is it relevant?" aria-label="Reason to add ${escapeAttr(ref.title)} to trail" required>
        <button type="submit">add to trail</button>
      </form>
    </li>`;
  }).join("");

  return `<section class="paper-references">
    ${justAdded ? `<p class="paper-reference-confirm">Added to the current trail.</p>` : ""}
    <p class="paper-reference-count">${references.length} DOI-resolved references</p>
    <ol>${items}</ol>
  </section>`;
}

async function fetchPaperByInput(paperId: string): Promise<FetchedPaper> {
  if (paperId.startsWith("doi:")) {
    const doi = paperId.slice(4);
    try {
      return await fetchPaperFromCrossref(doi, paperId);
    } catch (crossrefError) {
      for (const server of ["biorxiv", "medrxiv"] as const) {
        try {
          return await fetchPaperFromBioRxiv(doi, server, paperId);
        } catch {
          // Try the other preprint server before surfacing the Crossref error.
        }
      }
      throw crossrefError;
    }
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
  const timeout = setTimeout(() => controller.abort(), 950);

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

type BioRxivServer = "biorxiv" | "medrxiv";

function bioRxivPaperFromUrl(
  raw: string,
): { server: BioRxivServer; doi: string; version: string | null; pageUrl: string } | null {
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    let server: BioRxivServer | null = null;
    if (host === "biorxiv.org" || host === "www.biorxiv.org") server = "biorxiv";
    if (host === "medrxiv.org" || host === "www.medrxiv.org") server = "medrxiv";
    if (!server) return null;

    const path = decodeURIComponent(url.pathname);
    const match = path.match(
      /\/content\/(10\.\d{4,9}\/[A-Za-z0-9._;()/:+-]+?)(v\d+)?(?:\.full)?(?:\.pdf)?\/?$/i,
    );
    if (!match) return null;

    const doi = normalizePublicationDoi(match[1]);
    if (!doi) return null;

    const version = match[2] ?? null;
    const pageUrl = `https://www.${server}.org/content/${doi}${version ?? ""}`;
    return { server, doi, version, pageUrl };
  } catch {
    return null;
  }
}

async function fetchPaperFromBioRxiv(
  doi: string,
  server: BioRxivServer,
  storageId = `doi:${doi.toLowerCase()}`,
  sourceUrl?: string,
): Promise<FetchedPaper> {
  const doiPath = doi.split("/").map((part) => encodeURIComponent(part)).join("/");
  const endpoint = `https://api.biorxiv.org/details/${server}/${doiPath}/na/json`;
  const response = await fetch(endpoint, {
    headers: {
      "User-Agent": "trails/0.1",
      Accept: "application/json",
    },
  });
  if (!response.ok) throw new Error(`${server} returned HTTP ${response.status}`);

  const payload = await response.json() as {
    collection?: Array<{
      doi?: string;
      title?: string;
      authors?: string;
      abstract?: string;
      date?: string;
      version?: string | number;
      published?: string;
      server?: string;
    }>;
  };
  const record = payload.collection?.[0];
  if (!record?.title) throw new Error(`No ${server} paper found for DOI ${doi}`);

  const resolvedDoi = normalizePublicationDoi(record.doi ?? doi) ?? doi.toLowerCase();
  const version = String(record.version ?? "").replace(/^v/i, "").trim();
  const canonicalUrl = `https://www.${server}.org/content/${resolvedDoi}${version ? `v${version}` : ""}`;
  const authors = String(record.authors ?? "")
    .split(/\s*;\s*/)
    .map(normalizeAuthorName)
    .filter(Boolean);

  const identifiers: PaperIdentifier[] = [
    {
      type: "doi",
      value: resolvedDoi,
      label: server === "biorxiv" ? "bioRxiv" : "medRxiv",
      url: canonicalUrl,
    },
    {
      type: "url",
      value: canonicalUrl,
      label: server === "biorxiv" ? "bioRxiv" : "medRxiv",
      url: canonicalUrl,
    },
  ];

  if (sourceUrl && normalizePaperUrl(sourceUrl)) {
    identifiers.push({
      type: "url",
      value: sourceUrl,
      label: sourceHost(sourceUrl),
      url: sourceUrl,
    });
  }

  const publishedDoi = normalizePublicationDoi(record.published ?? "");
  if (publishedDoi && publishedDoi !== resolvedDoi) {
    identifiers.push({
      type: "doi",
      value: publishedDoi,
      label: "published version",
      url: `https://doi.org/${publishedDoi}`,
    });
  }

  return {
    paper: {
      arxiv_id: storageId,
      title: cleanHtmlText(record.title),
      authors_json: JSON.stringify(authors),
      abstract: cleanHtmlText(record.abstract ?? ""),
      published_at: record.date ?? null,
      updated_at: record.date ?? null,
    },
    identifiers: dedupeIdentifiers(identifiers),
  };
}

async function fetchPaperFromBioRxivHtml(
  pageUrl: string,
  server: BioRxivServer,
  storageId: string,
  sourceUrl?: string,
): Promise<FetchedPaper> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);

  try {
    const response = await fetch(pageUrl, {
      headers: {
        "User-Agent": "trails/0.1",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`${server} page returned HTTP ${response.status}`);

    const html = await response.text();
    const title = cleanHtmlText(metaContent(html, "citation_title"));
    const authors = metaContents(html, "citation_author")
      .map(normalizeAuthorName)
      .filter(Boolean);
    const doi =
      normalizePublicationDoi(metaContent(html, "citation_doi")) ||
      normalizePublicationDoi(pageUrl);
    const published =
      metaContent(html, "citation_date") ||
      metaContent(html, "DC.Date") ||
      null;
    const abstract =
      cleanHtmlText(metaContent(html, "description")) ||
      cleanHtmlText(metaPropertyContent(html, "og:description"));

    if (!title || !doi) throw new Error(`Could not parse ${server} article metadata`);

    const identifiers: PaperIdentifier[] = [
      {
        type: "doi",
        value: doi,
        label: server === "biorxiv" ? "bioRxiv" : "medRxiv",
        url: pageUrl,
      },
      {
        type: "url",
        value: pageUrl,
        label: server === "biorxiv" ? "bioRxiv" : "medRxiv",
        url: pageUrl,
      },
    ];

    if (sourceUrl && sourceUrl !== pageUrl) {
      identifiers.push({
        type: "url",
        value: sourceUrl,
        label: server === "biorxiv" ? "bioRxiv" : "medRxiv",
        url: sourceUrl,
      });
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
      identifiers: dedupeIdentifiers(identifiers),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchPaperFromUrl(sourceUrl: string, storageId: string): Promise<FetchedPaper> {
  if (!isSafePaperUrl(sourceUrl)) throw new Error("Only public HTTPS paper URLs are supported");

  const bioRxiv = bioRxivPaperFromUrl(sourceUrl);
  if (bioRxiv) {
    try {
      const fetched = await fetchPaperFromCrossref(bioRxiv.doi, storageId);
      fetched.identifiers.push(
        {
          type: "url",
          value: bioRxiv.pageUrl,
          label: bioRxiv.server === "biorxiv" ? "bioRxiv" : "medRxiv",
          url: bioRxiv.pageUrl,
        },
        {
          type: "url",
          value: sourceUrl,
          label: bioRxiv.server === "biorxiv" ? "bioRxiv" : "medRxiv",
          url: sourceUrl,
        },
      );
      fetched.identifiers = dedupeIdentifiers(fetched.identifiers);
      return fetched;
    } catch (error) {
      console.warn("Crossref bioRxiv lookup failed; trying bioRxiv API", error);
    }

    try {
      return await fetchPaperFromBioRxiv(
        bioRxiv.doi,
        bioRxiv.server,
        storageId,
        sourceUrl,
      );
    } catch (error) {
      console.warn("bioRxiv API lookup failed; trying article HTML", error);
    }

    return fetchPaperFromBioRxivHtml(bioRxiv.pageUrl, bioRxiv.server, storageId, sourceUrl);
  }

  if (isGoogleScholarUrl(sourceUrl)) {
    return fetchPaperFromGoogleScholarUrl(sourceUrl, storageId);
  }

  const alternativeId = crossrefAlternativeIdFromUrl(sourceUrl);
  if (alternativeId) {
    try {
      const resolved = await fetchPaperFromCrossrefAlternativeId(alternativeId, storageId);
      resolved.identifiers.push({
        type: "url",
        value: sourceUrl,
        label: sourceHost(sourceUrl),
        url: sourceUrl,
      });
      resolved.identifiers = dedupeIdentifiers(resolved.identifiers);
      return resolved;
    } catch (error) {
      console.warn("Crossref alternative-id lookup failed; falling back to page fetch", error);
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);

  try {
    const response = await fetch(sourceUrl, {
      headers: {
        "User-Agent": "trails/0.1",
        Accept: "text/html,application/xhtml+xml,application/pdf;q=0.8,*/*;q=0.2",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`Paper page returned HTTP ${response.status}`);

    const finalUrl = normalizePaperUrl(response.url || sourceUrl);
    if (!finalUrl) throw new Error("Paper URL redirected to an unsupported address");

    const arxivFromUrl = normalizeArxivInput(finalUrl);
    if (arxivFromUrl) {
      const fetched = await fetchPaperByInput(arxivFromUrl);
      fetched.identifiers.push({
        type: "url",
        value: finalUrl,
        label: sourceHost(finalUrl),
        url: finalUrl,
      });
      fetched.identifiers = dedupeIdentifiers(fetched.identifiers);
      return fetched;
    }

    const doiFromUrl = normalizePublicationDoi(finalUrl);
    if (doiFromUrl) {
      const fetched = await fetchPaperFromCrossref(doiFromUrl, storageId);
      fetched.identifiers.push({
        type: "url",
        value: finalUrl,
        label: sourceHost(finalUrl),
        url: finalUrl,
      });
      fetched.identifiers = dedupeIdentifiers(fetched.identifiers);
      return fetched;
    }

    const redirectedAlternativeId = crossrefAlternativeIdFromUrl(finalUrl);
    if (redirectedAlternativeId) {
      try {
        const fetched = await fetchPaperFromCrossrefAlternativeId(redirectedAlternativeId, storageId);
        fetched.identifiers.push({
          type: "url",
          value: finalUrl,
          label: sourceHost(finalUrl),
          url: finalUrl,
        });
        fetched.identifiers = dedupeIdentifiers(fetched.identifiers);
        return fetched;
      } catch (error) {
        console.warn("Crossref redirect alternative-id lookup failed", error);
      }
    }

    const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
    const disposition = response.headers.get("content-disposition") ?? "";
    const doiFromHeaders = normalizePublicationDoi(disposition);
    if (doiFromHeaders) {
      const fetched = await fetchPaperFromCrossref(doiFromHeaders, storageId);
      fetched.identifiers.push({
        type: "url",
        value: finalUrl,
        label: sourceHost(finalUrl),
        url: finalUrl,
      });
      fetched.identifiers = dedupeIdentifiers(fetched.identifiers);
      return fetched;
    }

    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      if (contentType.includes("application/pdf")) {
        throw new Error("This is a direct PDF link without a resolvable DOI or arXiv ID. Paste the article page or its DOI instead.");
      }
      throw new Error("Paper URL did not return a readable HTML page");
    }

    const contentLength = Number(response.headers.get("content-length") ?? "0");
    if (contentLength > 3_000_000) throw new Error("Paper page is too large to inspect");

    const html = await response.text();
    const structured = extractScholarlyJsonLd(html);

    const doi =
      normalizePublicationDoi(metaContent(html, "citation_doi")) ||
      normalizePublicationDoi(metaContent(html, "dc.identifier")) ||
      normalizePublicationDoi(metaContent(html, "DC.Identifier")) ||
      normalizePublicationDoi(metaContent(html, "prism.doi")) ||
      normalizePublicationDoi(metaContent(html, "bepress_citation_doi")) ||
      normalizePublicationDoi(structured?.doi ?? "") ||
      findDoiInHtml(html);

    if (doi) {
      try {
        const crossref = await fetchPaperFromCrossref(doi, storageId);
        crossref.identifiers.push({
          type: "url",
          value: finalUrl,
          label: sourceHost(finalUrl),
          url: finalUrl,
        });
        if (sourceUrl !== finalUrl) {
          crossref.identifiers.push({
            type: "url",
            value: sourceUrl,
            label: sourceHost(sourceUrl),
            url: sourceUrl,
          });
        }
        crossref.identifiers = dedupeIdentifiers(crossref.identifiers);
        return crossref;
      } catch (error) {
        console.warn("Crossref lookup from paper URL failed; using page metadata", error);
      }
    }

    const arxivMeta =
      normalizeArxivInput(metaContent(html, "citation_arxiv_id")) ||
      findArxivInHtml(html);
    if (arxivMeta) {
      try {
        const fetched = await fetchPaperByInput(arxivMeta);
        fetched.identifiers.push({
          type: "url",
          value: finalUrl,
          label: sourceHost(finalUrl),
          url: finalUrl,
        });
        fetched.identifiers = dedupeIdentifiers(fetched.identifiers);
        return fetched;
      } catch (error) {
        console.warn("arXiv lookup from paper URL failed; using page metadata", error);
      }
    }

    const title =
      metaContent(html, "citation_title") ||
      structured?.title ||
      metaPropertyContent(html, "og:title") ||
      cleanHtmlText(extractHtmlTitle(html));
    const authors = (
      metaContents(html, "citation_author").length
        ? metaContents(html, "citation_author")
        : structured?.authors ?? []
    ).map(normalizeAuthorName).filter(Boolean);
    const abstract =
      metaContent(html, "citation_abstract") ||
      structured?.abstract ||
      metaContent(html, "description") ||
      metaPropertyContent(html, "og:description");
    const published =
      metaContent(html, "citation_publication_date") ||
      metaContent(html, "citation_date") ||
      structured?.published ||
      null;

    if (!title) throw new Error("Could not find paper metadata at this URL");

    try {
      const crossref = await fetchPaperFromCrossrefSearch(title, storageId, finalUrl, authors);
      if (crossref) return crossref;
    } catch (error) {
      console.warn("Crossref title lookup failed; keeping page metadata", error);
    }

    const identifiers: PaperIdentifier[] = [{
      type: "url",
      value: finalUrl,
      label: sourceHost(finalUrl),
      url: finalUrl,
    }];

    try {
      const arxiv = await findArxivByTitleAndAuthors(title, authors);
      if (arxiv) identifiers.push(arxiv);
    } catch (error) {
      console.warn("Could not resolve page metadata to arXiv", error);
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
      identifiers: dedupeIdentifiers(identifiers),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchPaperFromGoogleScholarUrl(sourceUrl: string, storageId: string): Promise<FetchedPaper> {
  const url = new URL(sourceUrl);
  const nested = scholarTargetUrl(url);
  if (nested && nested !== sourceUrl) {
    return fetchPaperFromUrl(nested, storageId);
  }

  const metadata = scholarMetadataFromUrl(url);
  if (metadata.title) {
    const resolved = await resolveScholarMetadata(
      metadata.title,
      metadata.authors,
      storageId,
      sourceUrl,
    );
    if (resolved) return resolved;
  }

  const query = cleanScholarQuery(url.searchParams.get("q") ?? "");
  if (query) {
    const direct = normalizePaperInput(query);
    if (direct && !direct.startsWith("url:")) {
      return addPaperSourceIdentifier(await fetchPaperByInput(direct), sourceUrl);
    }
  }

  const scholarFetchUrl = canonicalScholarFetchUrl(url);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);

  try {
    const response = await fetch(scholarFetchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.8",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    if (response.ok) {
      const html = await response.text();
      const result = firstGoogleScholarResult(html);
      if (result?.url) {
        try {
          return addPaperSourceIdentifier(await fetchPaperFromUrl(result.url, storageId), sourceUrl);
        } catch (error) {
          console.warn("Scholar result target lookup failed", error);
        }
      }
      if (result?.title) {
        const resolved = await resolveScholarMetadata(
          result.title,
          result.authors,
          storageId,
          sourceUrl,
        );
        if (resolved) return resolved;
      }
    }
  } catch (error) {
    console.warn("Google Scholar page lookup failed", error);
  } finally {
    clearTimeout(timeout);
  }

  const citationId = scholarCitationId(url);
  if (citationId) {
    try {
      const profileTitle = await fetchScholarProfileCitationTitle(citationId);
      if (profileTitle) {
        const resolved = await resolveScholarMetadata(profileTitle, [], storageId, sourceUrl);
        if (resolved) return resolved;
      }
    } catch (error) {
      console.warn("Google Scholar profile fallback failed", error);
    }
  }

  if (query) {
    const crossref = await fetchPaperFromCrossrefSearch(query, storageId, sourceUrl);
    if (crossref) return crossref;
  }

  throw new Error(
    "Could not resolve this Google Scholar link to a paper. Paste a Scholar lookup/result link with a title, or the paper DOI, arXiv link, or publisher page.",
  );
}

function scholarCitationId(url: URL): string | null {
  const value = decodeURIComponentSafe(url.searchParams.get("citation_for_view") ?? "").trim();
  return /^[A-Za-z0-9_-]+:[A-Za-z0-9_-]+$/.test(value) ? value : null;
}

function canonicalScholarFetchUrl(url: URL): string {
  const citationId = scholarCitationId(url);
  if (!citationId) return url.toString();

  const canonical = new URL("https://scholar.google.com/citations");
  canonical.searchParams.set("view_op", "view_citation");
  canonical.searchParams.set("hl", "en");
  canonical.searchParams.set("citation_for_view", citationId);
  return canonical.toString();
}

async function fetchScholarProfileCitationTitle(citationId: string): Promise<string | null> {
  const authorId = citationId.split(":", 1)[0];
  if (!authorId) return null;

  const profileUrl = new URL("https://scholar.google.com/citations");
  profileUrl.searchParams.set("user", authorId);
  profileUrl.searchParams.set("hl", "en");
  profileUrl.searchParams.set("pagesize", "100");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(profileUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.8",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    if (!response.ok) return null;

    const html = await response.text();
    for (const match of html.matchAll(
      /<a[^>]+class=["'][^"']*gsc_a_at[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    )) {
      const href = decodeHtmlEntities(match[1]);
      let candidate: URL;
      try {
        candidate = new URL(href, "https://scholar.google.com");
      } catch {
        continue;
      }
      if (scholarCitationId(candidate) !== citationId) continue;

      const title = cleanHtmlText(match[2]).trim();
      if (title) return title;
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function scholarTargetUrl(url: URL): string | null {
  const candidates = [
    url.searchParams.get("url"),
    url.pathname.includes("scholar_url") ? url.searchParams.get("q") : null,
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    const decoded = decodeURIComponentSafe(candidate).trim();
    const normalized = normalizePaperUrl(decoded);
    if (normalized && !isGoogleScholarUrl(normalized)) return normalized;
  }

  return null;
}

function scholarMetadataFromUrl(url: URL): { title: string; authors: string[] } {
  const title = [
    url.searchParams.get("title"),
    url.searchParams.get("citation_title"),
    url.searchParams.get("as_epq"),
  ]
    .map((value) => cleanScholarQuery(value ?? ""))
    .find(Boolean) ?? "";

  const authors = [
    ...url.searchParams.getAll("author"),
    ...url.searchParams.getAll("citation_author"),
    url.searchParams.get("as_sauthors") ?? "",
  ]
    .map((value) => decodeURIComponentSafe(value).replace(/\s+/g, " ").trim())
    .filter(Boolean);

  return { title, authors };
}

async function resolveScholarMetadata(
  title: string,
  authors: string[],
  storageId: string,
  sourceUrl: string,
): Promise<FetchedPaper | null> {
  const direct = normalizePaperInput(title);
  if (direct && !direct.startsWith("url:")) {
    try {
      return addPaperSourceIdentifier(await fetchPaperByInput(direct), sourceUrl);
    } catch (error) {
      console.warn("Direct Scholar metadata lookup failed", error);
    }
  }

  try {
    const crossref = await fetchPaperFromCrossrefSearch(title, storageId, sourceUrl, authors);
    if (crossref) return crossref;
  } catch (error) {
    console.warn("Crossref Scholar metadata lookup failed", error);
  }

  try {
    const arxiv = await findArxivByTitleAndAuthors(title, authors);
    if (arxiv) {
      return addPaperSourceIdentifier(await fetchPaperByInput(arxiv.value), sourceUrl);
    }
  } catch (error) {
    console.warn("arXiv Scholar metadata lookup failed", error);
  }

  return null;
}

function addPaperSourceIdentifier(fetched: FetchedPaper, sourceUrl: string): FetchedPaper {
  fetched.identifiers.push({
    type: "url",
    value: sourceUrl,
    label: sourceHost(sourceUrl),
    url: sourceUrl,
  });
  fetched.identifiers = dedupeIdentifiers(fetched.identifiers);
  return fetched;
}

function cleanScholarQuery(raw: string): string {
  return decodeURIComponentSafe(raw)
    .replace(/^allintitle:\s*/i, "")
    .replace(/^intitle:\s*/i, "")
    .replace(/^["']|["']$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function firstGoogleScholarResult(
  html: string,
): { title: string; url: string | null; authors: string[] } | null {
  const citationTitle = cleanHtmlText(metaContent(html, "citation_title"));
  const citationAuthors = metaContents(html, "citation_author")
    .map(normalizeAuthorName)
    .filter(Boolean);
  if (citationTitle) {
    const citationUrl =
      normalizePaperUrl(metaContent(html, "citation_public_url")) ||
      normalizePaperUrl(metaContent(html, "citation_pdf_url"));
    return { title: citationTitle, url: citationUrl, authors: citationAuthors };
  }

  const detail = html.match(
    /<[^>]+(?:id=["']gsc_oci_title["']|class=["'][^"']*gsc_oci_title_link[^"']*["'])[^>]*>([\s\S]*?)<\/[^>]+>/i,
  )?.[0];
  if (detail) {
    const anchor = detail.match(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
    const title = cleanHtmlText(anchor?.[2] ?? detail).trim();
    const target = anchor?.[1] ? normalizePaperUrl(decodeHtmlEntities(anchor[1])) : null;
    if (title) return { title, url: target, authors: citationAuthors };
  }

  const block = html.match(/<h3[^>]*class=["'][^"']*gs_rt[^"']*["'][^>]*>([\s\S]*?)<\/h3>/i)?.[1];
  if (!block) return null;

  const anchor = block.match(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
  const title = cleanHtmlText(anchor?.[2] ?? block).replace(/^\[[^\]]+\]\s*/, "").trim();
  const target = anchor?.[1] ? normalizePaperUrl(decodeHtmlEntities(anchor[1])) : null;
  return title ? { title, url: target, authors: [] } : null;
}

async function fetchPaperFromCrossrefAlternativeId(
  alternativeId: string,
  storageId: string,
): Promise<FetchedPaper> {
  const endpoint = new URL("https://api.crossref.org/works");
  endpoint.searchParams.set("filter", `alternative-id:${alternativeId}`);
  endpoint.searchParams.set("rows", "3");

  const response = await fetch(endpoint, {
    headers: {
      "User-Agent": "trails/0.1",
      Accept: "application/json",
    },
  });
  if (!response.ok) throw new Error(`Crossref returned HTTP ${response.status}`);

  const payload = await response.json() as {
    message?: { items?: Array<{ DOI?: string }> };
  };
  const doi = normalizePublicationDoi(payload.message?.items?.[0]?.DOI ?? "");
  if (!doi) throw new Error(`No Crossref paper found for alternative ID ${alternativeId}`);
  return fetchPaperFromCrossref(doi, storageId);
}

async function fetchPaperFromCrossrefSearch(
  query: string,
  storageId: string,
  sourceUrl?: string,
  expectedAuthors: string[] = [],
): Promise<FetchedPaper | null> {
  const cleaned = cleanHtmlText(query).replace(/\s+/g, " ").trim();
  if (cleaned.length < 6) return null;

  const endpoint = new URL("https://api.crossref.org/works");
  endpoint.searchParams.set("query.bibliographic", cleaned);
  endpoint.searchParams.set("rows", "5");

  const response = await fetch(endpoint, {
    headers: {
      "User-Agent": "trails/0.1",
      Accept: "application/json",
    },
  });
  if (!response.ok) return null;

  const payload = await response.json() as {
    message?: {
      items?: Array<{
        DOI?: string;
        title?: string[];
        author?: Array<{ given?: string; family?: string; name?: string }>;
      }>;
    };
  };

  let best: { doi: string; score: number } | null = null;
  for (const item of payload.message?.items ?? []) {
    const doi = normalizePublicationDoi(item.DOI ?? "");
    const title = cleanHtmlText(item.title?.[0] ?? "");
    if (!doi || !title) continue;

    let score = bibliographicTitleScore(cleaned, title);
    if (expectedAuthors.length && item.author?.length) {
      const candidateAuthors = item.author
        .map((author) => author.name ?? [author.given, author.family].filter(Boolean).join(" "))
        .map(authorFingerprint)
        .filter(Boolean);
      const expected = expectedAuthors.map(authorFingerprint).filter(Boolean);
      const candidateSet = new Set(candidateAuthors);
      const overlap = expected.filter((author) => candidateSet.has(author)).length;
      if (overlap) score += Math.min(0.2, overlap * 0.1);
    }

    if (!best || score > best.score) best = { doi, score };
  }

  if (!best || best.score < 0.62) return null;

  const fetched = await fetchPaperFromCrossref(best.doi, storageId);
  if (sourceUrl) {
    fetched.identifiers.push({
      type: "url",
      value: sourceUrl,
      label: sourceHost(sourceUrl),
      url: sourceUrl,
    });
    fetched.identifiers = dedupeIdentifiers(fetched.identifiers);
  }
  return fetched;
}

function bibliographicTitleScore(query: string, title: string): number {
  const queryFingerprint = titleFingerprint(query);
  const titleValue = titleFingerprint(title);
  if (queryFingerprint === titleValue) return 1;
  if (queryFingerprint.includes(titleValue) || titleValue.includes(queryFingerprint)) return 0.94;

  const queryTokens = new Set(bibliographicTokens(query));
  const titleTokens = bibliographicTokens(title);
  if (!titleTokens.length) return 0;
  const overlap = titleTokens.filter((token) => queryTokens.has(token)).length;
  return overlap / titleTokens.length;
}

function bibliographicTokens(value: string): string[] {
  const stop = new Set(["the", "and", "for", "with", "from", "into", "using", "via", "its", "their", "that", "this"]);
  return decodeHtmlEntities(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .match(/[a-z0-9]+/g)
    ?.filter((token) => token.length > 2 && !stop.has(token)) ?? [];
}

function crossrefAlternativeIdFromUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    if (host.includes("sciencedirect.com") || host.includes("elsevier.com")) {
      return url.pathname.match(/\/pii\/([A-Za-z0-9]+)/i)?.[1] ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

function findDoiInHtml(html: string): string | null {
  const candidates = [
    ...html.matchAll(/(?:doi\.org\/|doi:\s*)(10\.\d{4,9}\/[^\s"'<>\\]+)/gi),
    ...html.matchAll(/["']doi["']\s*:\s*["'](10\.\d{4,9}\/[^"']+)["']/gi),
  ];
  for (const match of candidates) {
    const doi = normalizePublicationDoi(match[1] ?? match[0]);
    if (doi) return doi;
  }
  return null;
}

function findArxivInHtml(html: string): string | null {
  const match = html.match(/(?:arxiv\.org\/(?:abs|pdf|html)\/|arXiv:\s*)([A-Za-z0-9.\/-]+(?:v\d+)?)/i);
  return match ? normalizeArxivInput(match[1]) : null;
}

function extractScholarlyJsonLd(
  html: string,
): { title: string; authors: string[]; abstract: string; published: string | null; doi: string } | null {
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(decodeHtmlEntities(match[1]).trim());
      const stack: unknown[] = Array.isArray(parsed) ? [...parsed] : [parsed];

      while (stack.length) {
        const node = stack.shift();
        if (!node || typeof node !== "object") continue;
        const record = node as Record<string, unknown>;
        const type = Array.isArray(record["@type"]) ? record["@type"].join(" ") : String(record["@type"] ?? "");
        if (/ScholarlyArticle|Article/i.test(type)) {
          const authorRaw = Array.isArray(record.author) ? record.author : record.author ? [record.author] : [];
          const authors = authorRaw.map((author) => {
            if (typeof author === "string") return author;
            if (author && typeof author === "object") {
              const item = author as Record<string, unknown>;
              return String(item.name ?? [item.givenName, item.familyName].filter(Boolean).join(" "));
            }
            return "";
          }).filter(Boolean);

          const identifier = Array.isArray(record.identifier) ? record.identifier : [record.identifier];
          const doi = identifier
            .map((item) => {
              if (typeof item === "string") return normalizePublicationDoi(item);
              if (item && typeof item === "object") {
                const obj = item as Record<string, unknown>;
                return normalizePublicationDoi(String(obj.value ?? obj["@id"] ?? ""));
              }
              return null;
            })
            .find(Boolean) ?? "";

          return {
            title: cleanHtmlText(String(record.headline ?? record.name ?? "")),
            authors,
            abstract: cleanHtmlText(String(record.abstract ?? record.description ?? "")),
            published: record.datePublished ? String(record.datePublished) : null,
            doi,
          };
        }

        if (Array.isArray(record["@graph"])) stack.push(...record["@graph"]);
      }
    } catch {
      // Ignore malformed JSON-LD and continue with meta tags.
    }
  }
  return null;
}

function isGoogleScholarUrl(raw: string): boolean {
  try {
    const host = new URL(raw).hostname.toLowerCase();
    return host === "scholar.google.com" || host.endsWith(".scholar.google.com") ||
      /^scholar\.google\.[a-z.]+$/.test(host);
  } catch {
    return false;
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
  const escaped = name.replace(/[.*+?^$()|[\]{}]/g, "\$&");
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([\\s\\S]*?)["'][^>]*>`, "gi"),
    new RegExp(`<meta[^>]+content=["']([\\s\\S]*?)["'][^>]+name=["']${escaped}["'][^>]*>`, "gi"),
  ];

  const values: string[] = [];
  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const value = decodeHtmlEntities(match[1]).trim();
      if (value && !values.includes(value)) values.push(value);
    }
  }
  return values;
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
  let value = extractPastedPaperValue(raw);
  if (!value) return null;

  value = unwrapKnownRedirectUrl(value);

  // bioRxiv/medRxiv URLs often contain a DOI plus version/PDF suffixes in the
  // path. Recognize them before generic DOI extraction so
  // "...735472v1.full.pdf" is not mistaken for the DOI itself.
  const bioRxiv = bioRxivPaperFromUrl(value);
  if (bioRxiv) {
    return `url:${encodeURIComponent(value)}`;
  }

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

function extractPastedPaperValue(raw: string): string {
  let value = raw.trim();
  if (!value) return "";

  const markdown = value.match(/^\[[^\]]*\]\((https?:\/\/[^\s)]+)\)$/i);
  if (markdown) value = markdown[1];

  const angle = value.match(/^<\s*(https?:\/\/[^>]+)\s*>$/i);
  if (angle) value = angle[1];

  const embeddedUrl = value.match(/https?:\/\/[^\s<>"']+/i)?.[0];
  if (embeddedUrl && value !== embeddedUrl && !normalizeDoiInput(value)) {
    value = embeddedUrl;
  }

  if (/^(?:www\.)?(?:arxiv\.org|doi\.org|dx\.doi\.org|scholar\.google\.[a-z.]+)\//i.test(value)) {
    value = `https://${value.replace(/^www\./i, "www.")}`;
  }

  return value.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
}

function unwrapKnownRedirectUrl(raw: string): string {
  let current = raw;

  for (let depth = 0; depth < 3; depth += 1) {
    let url: URL;
    try {
      url = new URL(current);
    } catch {
      return current;
    }

    const host = url.hostname.toLowerCase();
    let candidate: string | null = null;

    if (isGoogleScholarUrl(current) && url.pathname.includes("scholar_url")) {
      candidate = url.searchParams.get("url") ?? url.searchParams.get("q");
    } else if (
      (host === "google.com" || host === "www.google.com" || host.startsWith("www.google.")) &&
      url.pathname === "/url"
    ) {
      candidate = url.searchParams.get("q") ?? url.searchParams.get("url");
    }

    if (!candidate) return current;
    const decoded = decodeURIComponentSafe(candidate).trim();
    const normalized = normalizePaperUrl(decoded);
    if (!normalized || normalized === current) return current;
    current = normalized;
  }

  return current;
}

function normalizeArxivInput(raw: string): string | null {
  let value = decodeURIComponentSafe(raw.trim());
  if (!value) return null;

  value = value.split(/[?#]/, 1)[0];
  value = value.replace(/^https?:\/\/(?:www\.)?(?:export\.)?arxiv\.org\/(?:abs|pdf|html|format)\//i, "");
  value = value.replace(/^https?:\/\/ar5iv\.labs\.arxiv\.org\/html\//i, "");
  value = value.replace(/^arXiv:/i, "");
  value = value.replace(/\.pdf$/i, "");
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
  if (direct) return direct.replace(/[\s.,;]+$/, "").toLowerCase();

  const embedded = value.match(/10\.\d{4,9}\/[^\s"'<>?#]+/i)?.[0];
  return embedded ? embedded.replace(/[\s.,;]+$/, "").toLowerCase() : null;
}

function arxivIdFromDoi(doi: string): string | null {
  const match = doi.match(/^10\.48550\/arxiv\.(.+)$/i);
  return match ? normalizeArxivInput(match[1]) : null;
}

function normalizePaperUrl(raw: string): string | null {
  try {
    let value = raw.trim();
    if (!/^https?:\/\//i.test(value) && /^(?:www\.)?[A-Za-z0-9.-]+\.[A-Za-z]{2,}\//.test(value)) {
      value = `https://${value}`;
    }

    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    url.hash = "";

    const trackingKeys: string[] = [];
    url.searchParams.forEach((_value, key) => {
      if (/^(?:utm_.+|gclid|fbclid|mc_cid|mc_eid)$/i.test(key)) trackingKeys.push(key);
    });
    for (const key of trackingKeys) url.searchParams.delete(key);

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
    <img class="brand-mark" src="/trails-logo.svg?v=3" alt="" aria-hidden="true">
    <span>trails</span>
  </a>`;
}

function renderIdentity(user: User | null): string {
  const themeToggle = `<button class="theme-toggle" type="button" data-theme-toggle aria-label="Switch color theme"></button>`;
  const chatGptLink = `<a class="identity-link" href="/chatgpt">ChatGPT</a>`;

  if (!user) {
    return `<div class="identity">
      ${chatGptLink}
      <a class="identity-link" href="/auth/orcid?next=/">Sign in with ORCID</a>
      ${themeToggle}
    </div>`;
  }

  return `<div class="identity">
    ${chatGptLink}
    <a href="https://orcid.org/${escapeAttr(user.orcid)}" target="_blank" rel="noopener noreferrer">${escapeHtml(user.display_name)}</a>
    <form action="/logout" method="post"><button class="text-button" type="submit">sign out</button></form>
    ${themeToggle}
  </div>`;
}

function themeScript(): Response {
  const source = `
(() => {
  const root = document.documentElement;
  const key = "trails-theme";
  const media = window.matchMedia("(prefers-color-scheme: dark)");

  const storedTheme = () => {
    try {
      const value = window.localStorage.getItem(key);
      return value === "light" || value === "dark" ? value : null;
    } catch {
      return null;
    }
  };

  const systemTheme = () => media.matches ? "dark" : "light";
  const activeTheme = () => root.dataset.theme || systemTheme();

  const updateChrome = () => {
    const active = activeTheme();
    root.style.colorScheme = active;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", active === "dark" ? "#1d1e1c" : "#f7f4ed");

    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const next = active === "dark" ? "light" : "dark";
      button.innerHTML = active === "dark"
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 15.2A8.5 8.5 0 0 1 8.8 3.8 8.5 8.5 0 1 0 20.2 15.2Z"></path></svg>';
      button.setAttribute("aria-label", "Switch to " + next + " mode");
      button.setAttribute("title", "Switch to " + next + " mode");
    });
  };

  const saved = storedTheme();
  if (saved) root.dataset.theme = saved;
  updateChrome();

  const bind = () => {
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      if (button.dataset.themeBound === "true") return;
      button.dataset.themeBound = "true";
      button.addEventListener("click", () => {
        const next = activeTheme() === "dark" ? "light" : "dark";
        root.dataset.theme = next;
        try {
          window.localStorage.setItem(key, next);
        } catch {
          // Theme still applies for the current page if storage is unavailable.
        }
        updateChrome();
      });
    });
    updateChrome();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind, { once: true });
  } else {
    bind();
  }

  const onSystemThemeChange = () => {
    if (!storedTheme()) {
      delete root.dataset.theme;
      updateChrome();
    }
  };
  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", onSystemThemeChange);
  }
})();
`;

  return new Response(source, {
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function htmlPage(title: string, body: string, status = 200): Response {
  // The editor alone needs KaTeX. Other pages should not download it.
  const mathAssets = body.includes('data-trail-live')
    ? `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.18.7/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.18.7/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.18.7/dist/contrib/auto-render.min.js"></script>`
    : "";
  return new Response(
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta name="theme-color" content="#f7f4ed">
  <script src="/theme.js"></script>
  ${mathAssets}
  <link rel="icon" href="/trails-logo.svg?v=3" type="image/svg+xml">
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
      --field: #fbf9f3;
      --field-muted: #ece7dc;
      --field-focus: #f3ede3;
      --button-ink: #fffaf5;
      --soft: #8a867e;
      --body-muted: #625f58;
      --body-soft: #59564f;
      --signin: #5f5b54;
      --notice-bg: #e3eaf0;
      --notice-ink: #3d5569;

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

    :root[data-theme="dark"] {
      --paper: #1d1e1c;
      --ink: #e7e2d8;
      --annotation: #7e9fbd;
      --stone: #76756f;
      --muted: #aaa59b;
      --wash: #292a26;
      --surface: rgba(255, 255, 255, .035);
      --field: #252622;
      --field-muted: #292a26;
      --field-focus: #30312c;
      --button-ink: #f7f4ed;
      --soft: #969289;
      --body-muted: #c5c0b6;
      --body-soft: #bbb6ac;
      --signin: #b9b4aa;
      --notice-bg: #26333e;
      --notice-ink: #adc4d7;
    }
    :root[data-theme="dark"] .brand-mark {
      filter: brightness(1.75) saturate(.72);
    }
    :root[data-theme="light"] .brand-mark {
      filter: none;
    }

    @media (prefers-color-scheme: dark) {
      :root:not([data-theme]) {
        --paper: #1d1e1c;
        --ink: #e7e2d8;
        --annotation: #7e9fbd;
        --stone: #76756f;
        --muted: #aaa59b;
        --wash: #292a26;
        --surface: rgba(255, 255, 255, .035);
        --field: #252622;
        --field-muted: #292a26;
        --field-focus: #30312c;
        --button-ink: #f7f4ed;
        --soft: #969289;
        --body-muted: #c5c0b6;
        --body-soft: #bbb6ac;
        --signin: #b9b4aa;
        --notice-bg: #26333e;
        --notice-ink: #adc4d7;
      }

      :root:not([data-theme]) .brand-mark {
        filter: brightness(1.75) saturate(.72);
      }
    }

    * { box-sizing: border-box; }
    body { margin: 0; background: var(--paper); }
    a { color: inherit; text-decoration: none; }
    a:hover { color: var(--annotation); }
    button, input, textarea { font: inherit; }
    .trail-page input,
    .trail-page textarea {
      caret-color: transparent;
    }
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
    .home-trails-link {
      margin-top: 16px;
      max-width: 640px;
      font-size: .8rem;
      font-weight: 520;
    }
    .home-trails-link a {
      color: var(--annotation);
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
      background: var(--field);
      color: var(--ink);
      padding: 13px 14px;
      border-radius: var(--radius-sm);
      font-family: var(--font-main);
    }
    .lookup input {
      min-width: 0;
      background: var(--field-muted);
      padding: 13px 14px;
    }
    input:focus-visible,
    textarea:focus-visible {
      background: var(--field-focus);
    }
    textarea { resize: vertical; }

    button,
    .button-link {
      border: 0;
      background: var(--annotation);
      color: var(--button-ink);
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
      color: var(--button-ink);
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
      color: var(--soft);
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
      color: var(--body-muted);
      font-size: .98rem;
      font-weight: 520;
      line-height: 1.55;
    }

    .paper-authors { margin: 6px 0 0; max-width: 720px; }
    .paper-authors summary {
      color: var(--annotation); cursor: pointer; font-size: .78rem;
      font-weight: 550; list-style: none;
    }
    .paper-authors summary::-webkit-details-marker { display: none; }
    .paper-authors[open] summary::after { content: " −"; }
    .paper-authors .authors { margin: 10px 0 0; font-size: .87rem; }
    .abstract-disclosure {
      max-width: 720px;
      margin-top: 20px;
      color: var(--body-soft);
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

    .paper-trail-actions {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-top: 14px;
      color: var(--muted);
      font-size: .8rem;
    }
    .paper-trail-actions form { margin: 0; }
    .trail-add-button {
      color: var(--annotation);
      font-size: .8rem;
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
      color: var(--signin);
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
      color: var(--soft);
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
      color: var(--soft);
      font-size: .74rem;
      font-weight: 500;
    }
    .comment-actions a { text-decoration: none; }
    .replies { margin-top: 22px; }

    .paper-reference-count, .paper-reference-confirm {
      font-size: .82rem; color: var(--muted); margin: 0 0 18px;
    }
    .paper-reference-confirm { color: var(--annotation); }
    .paper-references ol { list-style: none; margin: 0; padding: 0; }
    .paper-reference { padding: 14px 0 18px; border-bottom: 1px solid var(--wash); }
    .paper-reference-text { display: flex; flex-wrap: wrap; align-items: baseline; gap: 10px; }
    .paper-reference-text a { color: var(--ink); line-height: 1.35; text-decoration: none; }
    .paper-reference-text a:hover { color: var(--annotation); }
    .paper-reference-text span { color: var(--muted); font-size: .8rem; }
    .paper-reference-add { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    .paper-reference-add input {
      flex: 1 1 190px; min-width: 0; padding: 6px 8px;
      background: var(--field-muted); border: none; border-radius: 3px;
      color: var(--ink); font: inherit; font-size: .81rem;
    }
    .paper-reference-add button {
      padding: 6px 11px; border-radius: 3px;
      background: var(--annotation); color: var(--button-ink);
      font-size: .78rem; font-weight: 600; white-space: nowrap;
    }
    .paper-reference-add button:hover { filter: brightness(.94); }

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
    .theme-toggle {
      width: 28px;
      height: 28px;
      display: grid;
      place-items: center;
      padding: 0;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: var(--muted);
      line-height: 1;
    }
    .theme-toggle svg {
      width: 17px;
      height: 17px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.7;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .theme-toggle:hover,
    .theme-toggle:focus-visible {
      color: var(--annotation);
      background: transparent;
      filter: none;
      outline: none;
    }

    .text-button {
      background: none;
      color: var(--soft);
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
      margin-top: 28px;
      padding: 11px 13px;
      background: var(--notice-bg);
      border-radius: 2px;
      color: var(--notice-ink);
      font-size: .9rem;
    }

    .utility-page {
      padding: 15vh 0 80px;
      max-width: 720px;
    }
    .policy-copy {
      max-width: 680px;
      line-height: 1.65;
    }
    .policy-copy p + p {
      margin-top: 1rem;
    }
    .chatgpt-page {
      max-width: 720px;
      padding: 9vh 0 100px;
    }
    .chatgpt-page h1 {
      max-width: 660px;
      margin: 8px 0 18px;
      font-size: clamp(2rem, 4vw, 3rem);
      line-height: 1.12;
      font-weight: 500;
      letter-spacing: -.025em;
    }
    .chatgpt-page p {
      max-width: 650px;
      line-height: 1.65;
    }
    .chatgpt-lead {
      font-size: 1.06rem;
    }
    .chatgpt-status {
      margin: 28px 0 0;
      color: var(--body-muted);
      font-size: .88rem;
    }
    .chatgpt-section {
      margin-top: 38px;
    }
    .chatgpt-section h2 {
      margin: 0 0 12px;
      font-size: 1.18rem;
      line-height: 1.3;
      font-weight: 620;
    }
    .chatgpt-section ol,
    .chatgpt-section ul {
      padding-left: 24px;
      max-width: 620px;
      margin: 0;
    }
    .chatgpt-section li + li { margin-top: 9px; }
    .chatgpt-examples { color: var(--body-muted); }
    .chatgpt-limitation {
      margin-top: 38px;
      color: var(--body-muted);
      font-size: .88rem;
    }
    .chatgpt-testing {
      margin-top: 30px;
      color: var(--body-muted);
      font-size: .84rem;
    }
    .chatgpt-testing summary {
      cursor: pointer;
      color: var(--annotation);
    }
    .chatgpt-testing p { margin: 12px 0; }
    .chatgpt-testing code {
      overflow-wrap: anywhere;
      color: var(--ink);
      font-size: .8rem;
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

    .trail-page {
      width: min(980px, calc(100% - 40px));
      max-width: 980px;
      padding: 42px 0 96px;
    }
    .trail-layout {
      display: grid;
      grid-template-columns: 150px minmax(0, 1fr);
      gap: 32px;
      align-items: start;
    }
    .trail-main {
      --trail-section-gap: 18px;
      min-width: 0;
      max-width: none;
    }
    .trail-heading {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 28px;
      align-items: baseline;
      padding-left: 20px;
    }
    .trail-title-input {
      min-width: 0;
      width: 100%;
      height: 1.5em;
      min-height: 0;
      padding: .08em 0 .18em;
      overflow: hidden;
      border: 0;
      border-radius: 0;
      background: transparent;
      color: var(--ink);
      font-size: clamp(2rem, 4vw, 2.8rem);
      font-weight: 500;
      line-height: 1.14;
      letter-spacing: -.025em;
      appearance: none;
    }
    .trail-title-input:focus-visible {
      outline: none;
      background: transparent;
      box-shadow: none;
    }
    .trail-static-caret {
      position: fixed;
      z-index: 9999;
      width: 3px;
      height: 18px;
      border-radius: 2px;
      background: var(--annotation);
      pointer-events: none;
    }
    .trail-heading-meta {
      display: flex;
      align-items: baseline;
      gap: 14px;
      white-space: nowrap;
    }
    .trail-save-state {
      min-width: 0;
      color: var(--soft);
      font-size: .68rem;
      opacity: .85;
    }
    .trail-save-state[data-state="error"] {
      color: var(--notice-ink);
    }
    .trail-sidebar {
      position: sticky;
      top: 28px;
      width: 150px;
      max-width: 150px;
      min-width: 150px;
      padding-top: 5px;
      overflow: hidden;
    }
    .trail-sidebar-user {
      margin-bottom: 14px;
      color: var(--muted);
      font-size: .78rem;
      font-weight: 560;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .trail-new-form {
      margin: 0 0 16px;
    }
    .trail-new-form .text-button {
      color: var(--muted);
      font-size: .73rem;
      font-weight: 560;
    }
    .trail-new-form .text-button:hover,
    .trail-new-form .text-button:focus-visible {
      color: var(--annotation);
      outline: none;
    }
    .trail-list {
      display: grid;
      gap: 1px;
    }
    .trail-list form { margin: 0; }
    .trail-list-button {
      display: block;
      width: 100%;
      padding: 5px 0;
      border: 0;
      border-radius: 0;
      background: transparent;
      color: var(--soft);
      font-size: .75rem;
      font-weight: 500;
      line-height: 1.35;
      text-align: left;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .trail-list-button:hover {
      color: var(--annotation);
      filter: none;
    }
    .trail-list-button.active {
      color: var(--ink);
      font-weight: 640;
      filter: none;
    }
    .trail-sidebar-empty,
    .trail-user-form p {
      margin: 8px 0 0;
      color: var(--soft);
      font-size: .66rem;
      line-height: 1.4;
    }
    .trail-user-form {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 6px;
      align-items: center;
    }
    .trail-user-form input,
    .trail-user-switch input {
      min-width: 0;
      padding: 8px 9px;
      background: var(--field-muted);
      border-radius: 3px;
      font-size: .75rem;
    }
    .trail-user-submit {
      width: 32px;
      height: 32px;
      display: grid;
      place-items: center;
      padding: 0;
      border: 0;
      border-radius: 3px;
      background: var(--annotation);
      color: var(--button-ink);
      font-size: 1rem;
      font-weight: 650;
      line-height: 1;
    }
    .trail-user-submit:hover,
    .trail-user-submit:focus-visible {
      color: var(--button-ink);
      filter: brightness(.96);
      outline: none;
    }
    .trail-user-form p {
      grid-column: 1 / -1;
    }
    .trail-user-switch {
      margin-top: 22px;
      color: var(--soft);
      font-size: .67rem;
    }
    .trail-user-switch summary {
      cursor: pointer;
      list-style: none;
    }
    .trail-user-switch summary::-webkit-details-marker { display: none; }
    .trail-user-switch form {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 6px;
      margin-top: 8px;
    }

    .trail-description {
      margin: var(--trail-section-gap) 0 0 20px;
      padding-bottom: 0;
    }
    .trail-endpoint-label {
      padding-top: 10px;
      color: var(--muted);
      font-size: .76rem;
    }
    .trail-description textarea {
      display: block;
      width: 100%;
      min-height: 68px;
      padding: 8px 10px;
      border: 0;
      border-radius: 3px;
      background: transparent;
      color: var(--body-muted);
      font-size: .96rem;
      line-height: 1.58;
      resize: vertical;
      transition: background 110ms ease, color 110ms ease;
    }
    .trail-description textarea:hover {
      background: color-mix(in srgb, var(--field-muted) 58%, transparent);
    }
    .trail-description textarea:focus-visible {
      outline: none;
      background: var(--field-muted);
      color: var(--ink);
    }

    .trail-graph {
      position: relative;
      display: grid;
      grid-template-columns: 68px minmax(0, 1fr);
      column-gap: 16px;
      align-items: start;
      margin-top: var(--trail-section-gap);
      min-width: 0;
    }
    .trail-map {
      position: relative;
      min-height: 150px;
      width: 68px;
      z-index: 1;
    }
    .trail-map-svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    .trail-map-branch {
      cursor: pointer;
      transition: color 110ms ease;
    }
    .trail-map-path-active {
      color: var(--annotation);
    }
    .trail-map-path-muted {
      color: var(--stone);
    }
    .trail-map-path-muted:hover {
      color: var(--muted);
    }
    .trail-map-hit {
      fill: none;
      stroke: transparent;
      stroke-width: 20;
      stroke-linecap: round;
      stroke-linejoin: round;
      pointer-events: stroke;
      cursor: pointer;
    }
    .trail-map-insert-hit {
      fill: none;
      stroke: transparent;
      stroke-width: 16;
      pointer-events: stroke;
      cursor: copy;
    }
    .trail-map-brush-main {
      fill: currentColor;
      stroke: none;
      pointer-events: none;
    }
    .trail-map-brush-node {
      fill: currentColor;
      stroke: none;
      cursor: pointer;
      pointer-events: all;
    }
    .trail-map-brush-node:hover {
      stroke: currentColor;
      stroke-width: 3;
      vector-effect: non-scaling-stroke;
    }
    .trail-path-workspace {
      min-width: 0;
      max-width: 760px;
    }
    .trail-path-panel[hidden] {
      display: none !important;
    }
    .trail-content-path {
      margin-top: 0;
    }
    .trail-branch-empty {
      margin-left: 0;
      font-size: .82rem;
    }

    .trail-path {
      position: relative;
      margin-top: 2px;
    }
    .trail-step {
      --trail-kind-gutter: 52px;
      --trail-kind-gap: 14px;
      position: relative;
      z-index: 1;
      margin: 0;
    }
    .trail-step-summary {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: minmax(0, 1fr) var(--trail-kind-gutter);
      column-gap: var(--trail-kind-gap);
      align-items: baseline;
      min-height: 44px;
      padding: 7px 0 3px;
    }
    .trail-step-line {
      min-width: 0;
      display: block;
      overflow: hidden;
    }
    .trail-step-detail[hidden],
    .trail-rich-source[hidden],
    .trail-rich-preview[hidden] {
      display: none !important;
    }
    .trail-rich-preview {
      cursor: text;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    .trail-rich-preview:focus-visible { outline: none; }
    .trail-rich-preview .katex-display {
      overflow-x: auto;
      overflow-y: hidden;
      max-width: 100%;
      margin: 8px 0;
    }
    .trail-rich-figure {
      margin: 10px 0;
      max-width: 100%;
      white-space: normal;
    }
    .trail-rich-figure img {
      display: block;
      max-width: 100%;
      max-height: 340px;
      width: auto;
      height: auto;
      object-fit: contain;
    }
    .trail-rich-figure figcaption {
      margin-top: 5px;
      color: var(--soft);
      font-size: .78rem;
    }
    .trail-step-title-input {
      min-width: 0;
      width: 100%;
      margin: 0;
      padding: 2px 0;
      border: 0;
      border-radius: 0;
      background: transparent;
      color: var(--ink);
      font-size: .98rem;
      font-weight: 610;
      line-height: 1.35;
      text-align: left;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    .trail-step-title-input {
      display: block;
      min-height: 1.35em;
      overflow: hidden;
      resize: none;
      cursor: text;
    }
    .trail-step-title-display {
      display: block;
      min-width: 0;
      min-height: 1.35em;
      padding: 2px 0;
      color: var(--ink);
      font-size: .98rem;
      font-weight: 610;
      line-height: 1.35;
      text-align: left;
    }
    .trail-step-title-input:focus-visible {
      outline: none;
      background: transparent;
      box-shadow: none;
    }
    .trail-step-kind {
      width: var(--trail-kind-gutter);
      color: var(--soft);
      font-size: .62rem;
      font-weight: 520;
      line-height: 1.35;
      letter-spacing: .035em;
      text-align: right;
      white-space: nowrap;
    }
    a.trail-step-kind:hover,
    a.trail-step-kind:focus-visible {
      color: var(--annotation);
      outline: none;
    }
    .trail-step-body {
      position: relative;
      z-index: 1;
      display: block;
      width: calc(100% - var(--trail-kind-gutter) - var(--trail-kind-gap));
      min-height: 26px;
      margin: -2px 0 10px 0;
      padding: 5px 7px 6px;
      overflow: hidden;
      resize: none;
      border: 0;
      border-radius: 3px;
      background: transparent;
      color: var(--muted);
      font-size: .86rem;
      line-height: 1.5;
    }
    .trail-step-body::placeholder {
      color: var(--soft);
    }
    .trail-step-body:focus-visible {
      outline: none;
      background: color-mix(in srgb, var(--field-muted) 62%, transparent);
      color: var(--ink);
    }
    .trail-step-detail {
      position: relative;
      z-index: 1;
      width: calc(100% - var(--trail-kind-gutter) - var(--trail-kind-gap));
      margin: -2px 0 0 0;
      padding: 0 0 10px;
      max-width: 680px;
    }
    .trail-node-detail {
      display: block;
      width: 100%;
      min-height: 58px;
      padding: 7px 8px;
      overflow: hidden;
      resize: none;
      border: 0;
      border-radius: 4px;
      background: var(--field-muted);
      color: var(--body-muted);
      font-size: .82rem;
      line-height: 1.48;
    }
    .trail-node-detail::placeholder {
      color: var(--soft);
    }
    .trail-node-detail:focus-visible {
      outline: none;
      background: var(--field-focus);
      color: var(--ink);
    }
    .trail-step-footer {
      display: flex;
      justify-content: flex-end;
      min-height: 24px;
      margin-top: 5px;
    }
    .trail-step-actions {
      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
      gap: 2px;
      margin-left: auto;
      color: var(--soft);
    }
    .trail-step-actions form {
      display: contents;
      margin: 0;
    }
    .trail-action-icon {
      width: 26px;
      height: 24px;
      display: grid;
      place-items: center;
      padding: 0;
      border: 0;
      border-radius: 0;
      background: transparent;
      color: var(--soft);
      line-height: 1;
    }
    .trail-action-icon svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.55;
      stroke-linecap: round;
      stroke-linejoin: round;
      pointer-events: none;
    }
    .trail-action-icon:hover,
    .trail-action-icon:focus-visible {
      color: var(--annotation);
      background: transparent;
      filter: none;
      outline: none;
    }

    .trail-empty {
      margin: 8px 0 30px 20px;
      color: var(--muted);
      font-size: .88rem;
    }

    .trail-insert-form {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: flex-start;
      margin: 12px 0 12px 0;
    }
    .trail-insert-form textarea {
      flex: 1 1 210px;
      min-width: 0;
      min-height: 40px;
      padding: 9px 11px;
      border: none;
      border-radius: 4px;
      resize: none;
      background: var(--field-muted);
      color: var(--ink);
      font: inherit;
      font-size: .84rem;
    }
    .trail-insert-form button {
      min-height: 40px;
      padding: 8px 11px;
      color: var(--annotation);
      font: inherit;
      font-size: .78rem;
    }
    .trail-insert-form [type="submit"] {
      background: var(--annotation);
      color: var(--button-ink);
      border-radius: 3px;
    }
    .trail-insert-form [data-insert-cancel] {
      background: transparent;
      color: var(--annotation);
    }

    .trail-mark-add {
      margin: 28px 0 0 30px;
      padding-top: 0;
    }
    .trail-mark-add {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
      align-items: start;
    }
    .trail-mark-context {
      grid-column: 1 / -1;
      color: var(--soft);
      font-size: .64rem;
      font-weight: 540;
      line-height: 1;
    }
    .trail-mark-add textarea {
      height: 40px;
      min-height: 40px;
      padding: 9px 11px;
      overflow: hidden;
      background: var(--field-muted);
      border-radius: 4px;
      color: var(--ink);
      font-size: .84rem;
      line-height: 1.45;
      resize: none;
    }
    .trail-mark-add textarea::placeholder {
      color: var(--soft);
    }
    .trail-mark-add textarea:focus-visible {
      outline: none;
      background: var(--field-focus);
    }
    .trail-mark-add button {
      min-height: 40px;
      padding: 9px 15px;
      background: var(--annotation);
      color: var(--button-ink);
      font-size: .78rem;
      font-weight: 600;
    }
    .trail-mark-add button:hover {
      color: var(--button-ink);
      filter: brightness(.96);
    }

    .trail-connect-page {
      max-width: 720px;
      padding: 48px 0 90px;
    }
    .trail-connect-page h1 {
      margin: 8px 0 12px;
      font-size: clamp(2rem, 4vw, 2.8rem);
      line-height: 1.08;
      letter-spacing: -.025em;
    }
    .trail-endpoint-label {
      display: block;
      margin-top: 30px;
      padding: 0;
    }
    .trail-endpoint {
      margin-top: 7px;
      background: var(--field-muted);
      font-size: .82rem;
    }
    .trail-connect-help {
      max-width: 620px;
      margin-top: 16px;
      color: var(--body-muted);
      font-size: .9rem;
      line-height: 1.55;
    }

    @media (hover: none) {
      .trail-step[open] .trail-step-actions {
        opacity: 1;
      }
    }

    @media (max-width: 820px) {
      .trail-graph {
        grid-template-columns: 60px minmax(0, 1fr);
        column-gap: 12px;
      }
      .trail-map {
        width: 60px;
      }
    }

    @media (max-width: 820px) {
      .trail-layout {
        grid-template-columns: 1fr;
        gap: 28px;
      }
      .trail-sidebar {
        position: static;
        width: min(100%, 320px);
        max-width: 320px;
        min-width: 0;
        padding-top: 0;
        padding-bottom: 8px;
      }
      .trail-list {
        max-width: 320px;
      }
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
      .trail-heading {
        grid-template-columns: 1fr;
        gap: 10px;
        align-items: flex-start;
      }
      .trail-heading-meta {
        justify-content: space-between;
      }
      .trail-description {
        margin-top: var(--trail-section-gap);
      }
      .trail-graph {
        grid-template-columns: 44px minmax(0, 1fr);
        gap: 10px;
      }
      .trail-map {
        width: 44px;
      }
      .trail-mark-add {
        grid-template-columns: 1fr;
      }
      .trail-mark-add button {
        justify-self: start;
      }
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
        "Content-Security-Policy": "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src https://fonts.gstatic.com https://cdn.jsdelivr.net; img-src 'self' https:; form-action 'self' https://orcid.org; frame-ancestors 'none'; base-uri 'none'",
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

function randomTrailKey(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
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
