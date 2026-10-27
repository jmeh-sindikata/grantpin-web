// Assemble the GitHub Pages artifact in _site/:
//   _site/        copy of dist/ (the landing page, untouched)
//   _site/docs/   the built Starlight docs (docs-site/dist)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const landing = path.join(root, "dist");
const docsOut = path.join(root, "docs-site", "dist");
const site = path.join(root, "_site");

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
execFileSync(npm, ["run", "build", "--workspace", "docs-site"], {
  cwd: root,
  stdio: "inherit",
});

if (!fs.existsSync(path.join(docsOut, "index.html"))) {
  throw new Error(`docs build produced no ${docsOut}/index.html`);
}

fs.rmSync(site, { recursive: true, force: true });
fs.cpSync(landing, site, { recursive: true });
fs.cpSync(docsOut, path.join(site, "docs"), { recursive: true });

console.log(`Assembled ${path.relative(root, site)}/ (landing page + docs at /docs/)`);
