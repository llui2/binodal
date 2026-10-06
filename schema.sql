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

CREATE TABLE IF NOT EXISTS trail_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trail_user_sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES trail_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS trail_owners (
  trail_id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trail_id) REFERENCES trails(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES trail_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_trail_owners_user
  ON trail_owners(user_id, created_at);

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

DROP INDEX IF EXISTS idx_trail_items_source;

CREATE UNIQUE INDEX IF NOT EXISTS idx_trail_items_source
  ON trail_items(trail_id, source_ref);


CREATE TABLE IF NOT EXISTS trail_contexts (
  trail_id TEXT PRIMARY KEY,
  question TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trail_id) REFERENCES trails(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS trail_metadata (
  trail_id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trail_id) REFERENCES trails(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS trail_integrations (
  token TEXT PRIMARY KEY,
  trail_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trail_id) REFERENCES trails(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_trail_integrations_trail
  ON trail_integrations(trail_id);


CREATE TABLE IF NOT EXISTS trail_branches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trail_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'branch',
  parent_item_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trail_id) REFERENCES trails(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_item_id) REFERENCES trail_items(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_trail_branches_trail_parent
  ON trail_branches(trail_id, parent_item_id, id);

-- Placements separate reusable trail items from the path(s) that display them.
-- branch_id = 0 is the main path; positive values refer to trail_branches.id.
CREATE TABLE IF NOT EXISTS trail_item_placements (
  trail_id TEXT NOT NULL,
  item_id INTEGER NOT NULL,
  branch_id INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (item_id, branch_id),
  FOREIGN KEY (trail_id) REFERENCES trails(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES trail_items(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_trail_item_placements_path
  ON trail_item_placements(trail_id, branch_id, position, item_id);

CREATE TABLE IF NOT EXISTS trail_schema_migrations (
  name TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Existing linear trails become the main path exactly once.
INSERT OR IGNORE INTO trail_item_placements (trail_id, item_id, branch_id, position)
SELECT trail_id, id, 0, position
  FROM trail_items
 WHERE NOT EXISTS (
   SELECT 1 FROM trail_schema_migrations WHERE name = 'trail-placements-v1'
 );

INSERT OR IGNORE INTO trail_schema_migrations (name)
VALUES ('trail-placements-v1');

CREATE TRIGGER IF NOT EXISTS trail_branch_delete_placements
AFTER DELETE ON trail_branches
BEGIN
  DELETE FROM trail_item_placements
   WHERE trail_id = OLD.trail_id
     AND branch_id = OLD.id;
END;
