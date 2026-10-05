PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orcid TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS oauth_states (
  state TEXT PRIMARY KEY,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS papers (
  arxiv_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  authors_json TEXT NOT NULL,
  abstract TEXT NOT NULL,
  published_at TEXT,
  updated_at TEXT,
  fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS paper_identifiers (
  type TEXT NOT NULL,
  value TEXT NOT NULL,
  paper_id TEXT NOT NULL,
  label TEXT,
  url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (type, value),
  FOREIGN KEY (paper_id) REFERENCES papers(arxiv_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_paper_identifiers_paper
  ON paper_identifiers(paper_id);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paper_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  parent_id INTEGER,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  edited_at TEXT,
  FOREIGN KEY (paper_id) REFERENCES papers(arxiv_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_paper_created
  ON comments(paper_id, created_at);

CREATE INDEX IF NOT EXISTS idx_comments_parent
  ON comments(parent_id);

CREATE INDEX IF NOT EXISTS idx_sessions_user
  ON sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_expiry
  ON sessions(expires_at);


CREATE TABLE IF NOT EXISTS trails (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trail_sessions (
  token TEXT PRIMARY KEY,
  trail_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trail_id) REFERENCES trails(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS trail_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trail_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  content TEXT,
  note TEXT,
  source_ref TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trail_id) REFERENCES trails(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_trail_sessions_trail
  ON trail_sessions(trail_id);

CREATE INDEX IF NOT EXISTS idx_trail_items_trail_position
  ON trail_items(trail_id, position, id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_trail_items_source
  ON trail_items(trail_id, source_ref)
  WHERE source_ref IS NOT NULL;
