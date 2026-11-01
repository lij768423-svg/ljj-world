// The /systems page's numbers, read from the snapshot that scripts/snapshot-server.mjs takes
// on home-serve. Edit the copy around them here, not the numbers.
import snapshot from "./serverSnapshot.json" with { type: "json" };

const terabytes = (value: number) => `${Number.isInteger(value) ? value : value.toFixed(1)} TB`;
const [primaryGpu, secondaryGpu] = snapshot.gpus;

export const serverSnapshot = {
  capturedAt: snapshot.capturedAt,
  host: snapshot.host,
  cpuModel: snapshot.cpu.model,
  cpuCores: snapshot.cpu.cores,
  cpuThreads: snapshot.cpu.threads,
  memory: `${snapshot.memoryGiB} GiB`,
  nvme: terabytes(snapshot.nvme.totalTB),
  primaryGpu,
  secondaryGpu,
  /** "595.99.02" → "595.99" */
  driver: snapshot.nvidiaDriver ? snapshot.nvidiaDriver.split(".").slice(0, 2).join(".") : "",
  dockerMajor: snapshot.docker.version.split(".")[0],
  runningContainers: snapshot.docker.runningContainers,
  composeProjects: snapshot.docker.composeProjects,
} as const;
