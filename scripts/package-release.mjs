import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { chmod, lstat, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const releaseId = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
const output = path.join(root, "tmp/release-packages", releaseId);
const source = path.join(output, "source");
const roots = new Set(["src", "public", "tests", "scripts", "deploy", "docs", ".github"]);
const rootFiles = new Set(["package.json", "package-lock.json", "index.html", "vite.config.ts", "playwright.config.ts", "tsconfig.json", "tsconfig.app.json", "tsconfig.node.json", ".gitignore", ".gitattributes", "README.md", "README.zh-CN.md", "CONTRIBUTING.md", "SECURITY.md", "ASSET_LICENSE.md", "THIRD_PARTY_NOTICES.md", "LICENSE"]);
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const git = args => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const candidates = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { cwd: root, encoding: "utf8" }).split("\0").filter(Boolean);
const files = [...new Set(candidates)].filter(filename => roots.has(filename.split("/")[0]) || rootFiles.has(filename)).sort();
const sourceFiles = [];
await mkdir(source, { recursive: true });

for (const filename of files) {
  if (/(^|\/)\.env(?:\.|$)|\.(?:pem|key|log|tsbuildinfo)$/.test(filename)) throw new Error(`Excluded sensitive/generated source: ${filename}`);
  const input = path.join(root, filename);
  const metadata = await lstat(input).catch(error => { if (error.code === "ENOENT") return null; throw error; });
  if (!metadata) continue;
  if (!metadata.isFile()) throw new Error(`Source must be a regular file: ${filename}`);
  const bytes = await readFile(input);
  const target = path.join(source, filename);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes);
  await chmod(target, metadata.mode & 0o777);
  sourceFiles.push({ path: filename, bytes: bytes.length, sha256: digest(bytes) });
}

for (const filename of ["src/blog.ts", "src/components/BlogPages.tsx", "src/assets/optimizedCovers.ts", "package-lock.json"]) {
  if (!sourceFiles.some(file => file.path === filename)) throw new Error(`Missing release source: ${filename}`);
}
const sourceManifest = { releaseId, gitHead: git(["rev-parse", "HEAD"]), includesWorkingTree: true, node: process.version, npm: execFileSync("npm", ["--version"], { encoding: "utf8" }).trim(), files: sourceFiles };
await writeFile(path.join(source, "SOURCE-MANIFEST.json"), `${JSON.stringify(sourceManifest, null, 2)}\n`);
execFileSync("tar", ["-czf", path.join(output, "source.tar.gz"), "-C", source, "--null", "-T", "-"], { input: [...sourceFiles.map(file => file.path), "SOURCE-MANIFEST.json"].join("\0") + "\0" });
execFileSync("npm", ["ci", "--no-audit", "--no-fund"], { cwd: source, stdio: "inherit" });
execFileSync("npm", ["run", "build"], { cwd: source, stdio: "inherit" });

async function inventory(directory, prefix = "") {
  const entries = [];
  for (const item of (await readdir(path.join(directory, prefix), { withFileTypes: true })).sort((first, second) => first.name.localeCompare(second.name))) {
    const relative = path.posix.join(prefix, item.name);
    if (item.isDirectory()) entries.push(...await inventory(directory, relative));
    else if (item.isFile()) {
      const bytes = await readFile(path.join(directory, relative));
      entries.push({ path: relative, bytes: bytes.length, sha256: digest(bytes) });
    } else throw new Error(`Non-regular artifact: ${relative}`);
  }
  return entries;
}

const artifactFiles = await inventory(path.join(source, "dist"));
for (const file of artifactFiles) {
  if (/\.map$|(^|\/)\.env|\.(?:key|pem)$/.test(file.path)) throw new Error(`Unexpected artifact: ${file.path}`);
}
execFileSync("tar", ["-czf", path.join(output, "site.tar.gz"), "-C", path.join(source, "dist"), "."]);
const manifest = { ...sourceManifest, sourceFiles: sourceManifest.files, files: artifactFiles };
await writeFile(path.join(output, "release-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
const checksums = [];
for (const filename of ["source.tar.gz", "site.tar.gz", "release-manifest.json"]) checksums.push(`${digest(await readFile(path.join(output, filename)))}  ${filename}`);
await writeFile(path.join(output, "SHA256SUMS"), `${checksums.join("\n")}\n`);
console.log(`RELEASE_PACKAGE=${output}`);
