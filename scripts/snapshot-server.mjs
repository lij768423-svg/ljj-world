// Refreshes src/data/serverSnapshot.json, the numbers the /systems page shows (running
// containers, Compose projects, memory, NVMe capacity, GPUs, driver and Docker versions), from
// the server itself instead of hand-typed copy.
//
//   npm run snapshot:server              # over SSH to home-serve (or run it on home-serve)
//   npm run snapshot:server -- --dry-run # print what would change, write nothing
//   SNAPSHOT_HOST=other npm run snapshot:server
//
// It reads only: docker ps / compose ls / version, /proc/meminfo, lsblk, nvidia-smi and lscpu.
// The release script runs it before every build; CI and machines without access keep the
// committed snapshot.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const output = path.join(root, "src", "data", "serverSnapshot.json");
const host = process.env.SNAPSHOT_HOST ?? "home-serve";
const dryRun = process.argv.includes("--dry-run");
const local = host === "local" || os.hostname() === host;

// One shell script, one round trip. Each section is tagged so the output can be split.
const probe = String.raw`
set -e
echo "@containers"; docker ps -q | wc -l
echo "@compose"; docker compose ls --all --quiet | wc -l
echo "@docker"; docker version --format '{{.Server.Version}}'
echo "@meminfo"; grep MemTotal /proc/meminfo
echo "@disks"; lsblk --bytes --nodeps --noheadings --output NAME,SIZE,ROTA,TRAN
echo "@gpus"; nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader,nounits
echo "@cpu"; lscpu
`;

const raw = local
  ? execFileSync("bash", ["-c", probe], { encoding: "utf8" })
  : execFileSync("ssh", ["-o", "ConnectTimeout=10", "-o", "BatchMode=yes", host, "bash -s"], { input: probe, encoding: "utf8" });

const sections = {};
let current = null;
for (const line of raw.split("\n")) {
  if (line.startsWith("@")) {
    current = line.slice(1).trim();
    sections[current] = [];
  } else if (current && line.trim()) {
    sections[current].push(line.trim());
  }
}
const one = (name) => {
  const value = sections[name]?.[0];
  if (!value) throw new Error(`snapshot: no output for ${name}`);
  return value;
};
const integer = (name) => {
  const value = Number.parseInt(one(name), 10);
  if (!Number.isFinite(value)) throw new Error(`snapshot: ${name} is not a number`);
  return value;
};

const memTotalKiB = Number(/MemTotal:\s+(\d+)/.exec(one("meminfo"))?.[1]);
const disks = sections.disks.map((line) => {
  const [name, size, rotational, transport = ""] = line.split(/\s+/);
  return { name, bytes: Number(size), rotational: rotational === "1", transport };
});
const nvme = disks.filter((disk) => disk.transport === "nvme");
const hdd = disks.filter((disk) => disk.rotational && disk.transport === "sata");
const gpus = sections.gpus.map((line) => {
  const [name, memoryMiB, driver] = line.split(",").map((part) => part.trim());
  return {
    name: name.replace(/^NVIDIA\s+(GeForce\s+)?/i, ""),
    memoryGB: Math.round(Number(memoryMiB) / 1024),
    driver,
  };
});
const lscpu = Object.fromEntries(sections.cpu.map((line) => {
  const index = line.indexOf(":");
  return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
}));
const cores = Number(lscpu["Core(s) per socket"]) * Number(lscpu["Socket(s)"] ?? 1);
const threads = Number(lscpu["CPU(s)"]);
const terabytes = (items) => Math.round(items.reduce((sum, disk) => sum + disk.bytes, 0) / 1e11) / 10;

const snapshot = {
  capturedAt: new Date().toISOString().slice(0, 10),
  host,
  cpu: {
    model: lscpu["Model name"].replace(/^AMD\s+/, "").replace(/\s+\d+-Core Processor$/, ""),
    cores,
    threads,
  },
  memoryGiB: Math.floor(memTotalKiB / 1024 / 1024),
  nvme: { count: nvme.length, totalTB: terabytes(nvme) },
  hdd: { count: hdd.length, totalTB: terabytes(hdd) },
  gpus: gpus.map(({ name, memoryGB }) => ({ name, memoryGB })),
  nvidiaDriver: gpus[0]?.driver ?? null,
  docker: {
    version: one("docker"),
    runningContainers: integer("containers"),
    composeProjects: integer("compose"),
  },
};

if (!snapshot.docker.runningContainers || !snapshot.memoryGiB || !snapshot.nvme.count) {
  throw new Error(`snapshot looks wrong, not writing it: ${JSON.stringify(snapshot)}`);
}

const previous = (() => {
  try {
    return JSON.parse(readFileSync(output, "utf8"));
  } catch {
    return null;
  }
})();
// Only the date changed: keep the file as it is so a release does not commit noise.
const { capturedAt: _new, ...next } = snapshot;
const { capturedAt: _old, ...before } = previous ?? {};
if (previous && JSON.stringify(next) === JSON.stringify(before)) {
  console.log(`snapshot: unchanged since ${previous.capturedAt}`);
} else if (dryRun) {
  console.log(`snapshot (dry run, not written): ${JSON.stringify(next)}`);
} else {
  writeFileSync(output, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`snapshot: wrote src/data/serverSnapshot.json (${snapshot.docker.runningContainers} containers, ${snapshot.docker.composeProjects} Compose projects)`);
}
