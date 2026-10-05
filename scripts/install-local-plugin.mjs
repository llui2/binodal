import { cp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const source = join(repoRoot, "plugins", "trails-local");
const home = homedir();
const marketplaceRoot = join(home, ".agents", "plugins");
const destination = join(marketplaceRoot, "trails-local");
const marketplacePath = join(marketplaceRoot, "marketplace.json");

await mkdir(dirname(destination), { recursive: true });
await rm(destination, { recursive: true, force: true });
await cp(source, destination, { recursive: true });

await mkdir(dirname(marketplacePath), { recursive: true });

let marketplace = {
  name: "personal-local",
  interface: { displayName: "Personal Local Plugins" },
  plugins: [],
};

try {
  marketplace = JSON.parse(await readFile(marketplacePath, "utf8"));
  if (!Array.isArray(marketplace.plugins)) marketplace.plugins = [];
} catch {
  // First local marketplace.
}

marketplace.plugins = marketplace.plugins.filter((plugin) => plugin?.name !== "trails-local");
marketplace.plugins.push({
  name: "trails-local",
  source: {
    source: "local",
    path: "./trails-local",
  },
  policy: {
    installation: "AVAILABLE",
    authentication: "ON_INSTALL",
  },
  category: "Productivity",
});

await writeFile(marketplacePath, JSON.stringify(marketplace, null, 2) + "\n", "utf8");

console.log("Installed Trails Local.");
console.log("Plugin:", destination);
console.log("Marketplace:", marketplacePath);
console.log("Now fully quit and reopen ChatGPT Desktop.");
