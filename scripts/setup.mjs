import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const DB_NAME = "trails";
const CONFIG = "wrangler.toml";

function run(args, capture = false) {
  return execFileSync("npx", ["wrangler", ...args], {
    encoding: capture ? "utf8" : undefined,
    stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
  });
}

function listDatabases() {
  const raw = run(["d1", "list", "--json"], true);
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : parsed.result ?? [];
}

let db = listDatabases().find((item) => item.name === DB_NAME);

if (!db) {
  run(["d1", "create", DB_NAME]);
  db = listDatabases().find((item) => item.name === DB_NAME);
}

if (!db) {
  throw new Error(`Could not find or create D1 database "${DB_NAME}".`);
}

const databaseId = db.uuid ?? db.id ?? db.database_id;
if (!databaseId) {
  throw new Error(`Could not determine the D1 database ID for "${DB_NAME}".`);
}

let config = readFileSync(CONFIG, "utf8")
  .replace(/\n\[\[d1_databases\]\][\s\S]*?(?=\n\[\[|\n\[[^\[]|$)/g, "")
  .trimEnd();

config += `\n\n[[d1_databases]]\nbinding = "DB"\ndatabase_name = "${DB_NAME}"\ndatabase_id = "${databaseId}"\n`;
writeFileSync(CONFIG, config);

run(["d1", "execute", "DB", "--remote", "--file=./schema.sql", "--yes"]);
run(["deploy"]);
