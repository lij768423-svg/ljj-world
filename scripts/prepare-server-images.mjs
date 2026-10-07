import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const script = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "prepare-server-images.py");
const result = spawnSync("python3", [script], { stdio: "inherit" });
if (result.status !== 0) process.exit(result.status ?? 1);
