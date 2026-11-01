// One command from a clean main branch to a verified live site:
//
//   npm run release                 # snapshot, package, deploy, verify, IndexNow, push
//   npm run release -- --dry-run    # preflight, snapshot preview and package only
//   npm run release -- --test       # also run the full Playwright suite before packaging
//
// Steps, stopping at the first failure:
//   1. Preflight: on main, no uncommitted tracked changes, not behind the remote.
//   2. Refresh the /systems snapshot from home-serve and commit it when the numbers changed.
//   3. Optional: typecheck and the end-to-end suite.
//   4. Package with `npm run release:package` (clean `npm ci` + build in a scratch copy).
//   5. Upload the package and the deploy helpers to the static host and activate it with
//      deploy/deploy-release.py, which checks every route and swaps back on any failure.
//   6. Prune old releases, check the public site, submit the sitemap to IndexNow.
//   7. Push main so the remote matches what is live.
//
// Settings (environment): RELEASE_HOST (ssh target, default root@100.98.6.14, the japan-gateway
// Tailscale address), RELEASE_ROOT (default /srv/ljj-world), SITE_ORIGIN (default https://ljj.world),
// SNAPSHOT_HOST (see scripts/snapshot-server.mjs). Flags: --dry-run, --test, --skip-snapshot,
// --skip-indexnow, --no-push. The npm script sets NODE_USE_ENV_PROXY=1 so fetch honours
// HTTPS_PROXY on machines (like home-serve) that reach the internet through a local proxy.
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

const fail = (error) => {
  console.error(`\nrelease stopped: ${error?.message ?? error}`);
  process.exit(1);
};
process.on("uncaughtException", fail);
process.on("unhandledRejection", fail);

const root = path.resolve(import.meta.dirname, "..");
const flags = new Set(process.argv.slice(2));
const known = new Set(["--dry-run", "--test", "--skip-snapshot", "--skip-indexnow", "--no-push"]);
for (const flag of flags) if (!known.has(flag)) throw new Error(`Unknown flag ${flag}; expected one of ${[...known].join(", ")}`);
const dryRun = flags.has("--dry-run");
const releaseHost = process.env.RELEASE_HOST ?? "root@100.98.6.14";
const releaseRoot = process.env.RELEASE_ROOT ?? "/srv/ljj-world";
const origin = (process.env.SITE_ORIGIN ?? "https://ljj.world").replace(/\/$/, "");
const sshOptions = ["-o", "BatchMode=yes", "-o", "ConnectTimeout=15", "-o", "ServerAliveInterval=20"];

const step = (title) => console.log(`\n== ${title}`);
const capture = (command, args, options = {}) => execFileSync(command, args, { cwd: root, encoding: "utf8", ...options }).trim();
const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", ...options });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} exited with ${result.status ?? result.signal}`);
};
// Runs a command with its output shown live and returns what it printed.
const runAndCapture = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { cwd: root, stdio: ["ignore", "pipe", "inherit"] });
  let output = "";
  child.stdout.on("data", (chunk) => {
    output += chunk;
    process.stdout.write(chunk);
  });
  child.on("error", reject);
  child.on("close", (code) => (code === 0 ? resolve(output) : reject(new Error(`${command} ${args.join(" ")} exited with ${code}`))));
});
const git = (...args) => capture("git", args);
const remote = (script) => capture("ssh", [...sshOptions, releaseHost, script]);
const quote = (value) => `'${String(value).replace(/'/g, "'\\''")}'`;

step("Preflight");
const branch = git("branch", "--show-current");
if (branch !== "main") throw new Error(`Release from main, not ${branch || "a detached HEAD"}`);
const dirty = git("status", "--porcelain", "--untracked-files=no");
if (dirty) throw new Error(`Commit or stash tracked changes first:\n${dirty}`);
const upstream = git("rev-parse", "--abbrev-ref", "main@{upstream}");
const [remoteName] = upstream.split("/");
run("git", ["fetch", "--quiet", remoteName]);
const [behind, ahead] = git("rev-list", "--left-right", "--count", `${upstream}...main`).split(/\s+/).map(Number);
if (behind) throw new Error(`main is ${behind} commit(s) behind ${upstream}; pull first`);
console.log(`main at ${git("rev-parse", "--short", "HEAD")}, ${ahead} commit(s) ahead of ${upstream}`);
const previous = dryRun ? null : remote(`readlink ${quote(`${releaseRoot}/current`)}`);
if (previous) console.log(`live release: ${previous}`);

if (!flags.has("--skip-snapshot")) {
  step("Server snapshot");
  run("node", ["scripts/snapshot-server.mjs", ...(dryRun ? ["--dry-run"] : [])]);
  if (!dryRun && git("status", "--porcelain", "--", "src/data/serverSnapshot.json")) {
    run("git", ["commit", "--quiet", "-m", "Refresh the server snapshot", "--", "src/data/serverSnapshot.json"]);
    console.log(`committed ${git("rev-parse", "--short", "HEAD")} Refresh the server snapshot`);
  }
}

if (flags.has("--test")) {
  step("Typecheck and end-to-end tests");
  run("npm", ["run", "typecheck"]);
  run("npm", ["run", "build"]);
  run("npm", ["run", "test:e2e"]);
}

step("Package");
const packageOutput = await runAndCapture("npm", ["run", "--silent", "release:package"]);
const packageDir = /RELEASE_PACKAGE=(.+)$/m.exec(packageOutput)?.[1]?.trim();
if (!packageDir) throw new Error(`release:package did not report a package:\n${packageOutput.slice(-2000)}`);
const releaseId = path.basename(packageDir);
const manifestHash = createHash("sha256").update(readFileSync(path.join(packageDir, "release-manifest.json"))).digest("hex");
console.log(`package ${releaseId} (manifest ${manifestHash.slice(0, 12)})`);

if (dryRun) {
  console.log(`\nDry run: stopped before upload. Package: ${packageDir}`);
  process.exit(0);
}

step(`Upload to ${releaseHost}`);
const remotePackage = `${releaseRoot}/deployments/${releaseId}`;
remote(`mkdir -p ${quote(remotePackage)}`);
const uploads = [
  ...["SHA256SUMS", "release-manifest.json", "site.tar.gz", "source.tar.gz"].map((name) => path.join(packageDir, name)),
  ...["retain-assets.py", "deploy-release.py", "prune-releases.py"].map((name) => path.join(root, "deploy", name)),
];
run("scp", ["-q", ...sshOptions, ...uploads, `${releaseHost}:${remotePackage}/`]);

step("Activate");
// deploy-release.py refuses to run if the live release changed since preflight, verifies the
// package, swaps `current`, checks every route through the local origin and swaps back on failure.
run("ssh", [...sshOptions, releaseHost, [
  `cd ${quote(remotePackage)}`,
  "sha256sum -c --quiet SHA256SUMS",
  `python3 deploy-release.py ${quote(releaseId)} ${quote(previous)} ${quote(manifestHash)} --root ${quote(releaseRoot)} --origin ${quote(origin)}`,
].join(" && ")]);
const pruned = JSON.parse(remote(`python3 ${quote(`${remotePackage}/prune-releases.py`)} --root ${quote(releaseRoot)} --keep 3 --apply`));
console.log(`live release: releases/${releaseId}; pruned ${pruned.deleteReleases?.length ?? 0} old release(s)`);

step("Public check");
const probes = [
  ["/", 200, "<title>"],
  ["/en/", 200, '<html lang="en">'],
  ["/blog", 200, "<title>"],
  ["/sitemap.xml", 200, "<urlset"],
  [`/release-check-${releaseId}`, 404, 'name="robots" content="noindex"'],
];
for (const [route, status, marker] of probes) {
  const response = await fetch(`${origin}${route}`, { redirect: "manual", headers: { "Cache-Control": "no-cache" } });
  const body = await response.text();
  if (response.status !== status || !body.includes(marker)) throw new Error(`${route}: expected ${status} with ${marker}, got ${response.status}`);
  console.log(`${String(response.status).padEnd(4)}${route}`);
}

if (!flags.has("--skip-indexnow")) {
  step("IndexNow");
  run("node", ["--disable-warning=UNDICI-EHPA", "scripts/submit-indexnow.mjs"], { env: { ...process.env, NODE_USE_ENV_PROXY: "1", SITE_ORIGIN: origin } });
}

if (!flags.has("--no-push")) {
  step(`Push to ${remoteName}`);
  // The site is already live at this point, so a failed push is reported, not fatal.
  const pushed = spawnSync("git", ["push", "--quiet", remoteName, "main"], { cwd: root, stdio: "inherit" });
  if (pushed.status === 0) console.log(`${upstream} now at ${git("rev-parse", "--short", "HEAD")}`);
  else console.warn(`warning: push to ${remoteName} failed; the live site runs ${git("rev-parse", "--short", "HEAD")}, push it by hand`);
}

console.log(`\nReleased ${releaseId} to ${origin}`);
