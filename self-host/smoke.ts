/**
 * The self-host image's smoke test (`bunx moon run self-host:smoke`): builds the image, then runs it
 * the way a person would, under the limits of Kubernetes' restricted policy (no new privileges, no
 * capabilities), and checks what README.md promises:
 *
 * - both products answer through Caddy and Docker reports the container healthy;
 * - nothing runs as root, and the image's user is `app`;
 * - the generated ToggleSlash admin token creates a project, and the project survives a restart;
 * - each product comes back after `kill -9` with no ERR_ADDRESS_IN_USE, and the other product keeps
 *   its pid;
 * - every log line carries its service's name and none carries the token;
 * - the container writes nowhere outside /run, /tmp, /home/app and /data;
 * - a /data that UID 1654 cannot write stops the container with one line naming the path and UID;
 * - `slashslash version` and the version label are the version it was built with, and every
 *   licence the image owes is under /usr/share/licenses/slashslash.
 *
 * The GitHub values are dummies, as PixelSlash's own e2e build uses: never a real secret. It also
 * prints the container's memory. Set SMOKE_IMAGE to test an image that is
 * already built instead of building one, and SMOKE_VERSION to the version it was built with (default
 * self-host/VERSION plus `-dev`, which is also what it builds).
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build, readVersion } from "./build.ts";

const IMAGE = process.env["SMOKE_IMAGE"] || "slashslash:smoke";
const VERSION = process.env["SMOKE_VERSION"] || `${readVersion()}-dev`;
const LICENCES = ["pixelslash", "toggleslash", "caddy", "s6-overlay", "dotnet", "bun"];
const NAME = `slashslash-smoke-${process.pid}`;
const VOLUME = `${NAME}-data`;
const DUMMY_GITHUB = ["-e", "GITHUB_CLIENT_ID=smoke-not-real", "-e", "GITHUB_CLIENT_SECRET=smoke-not-real"];
const LIMITS = ["--security-opt", "no-new-privileges", "--cap-drop", "ALL"];

function docker(args: string[], allowFailure = false): string {
  const result = Bun.spawnSync(["docker", ...args], { stdout: "pipe", stderr: "pipe" });
  const out = result.stdout.toString() + result.stderr.toString();
  if (result.exitCode !== 0 && !allowFailure)
    throw new Error(`docker ${args.join(" ")} exited ${result.exitCode}:\n${out}`);
  return out.trim();
}

function check(ok: boolean, what: string, detail = ""): void {
  if (!ok) throw new Error(`FAILED: ${what}${detail ? `\n${detail}` : ""}`);
  console.log(`ok: ${what}`);
}

async function waitFor(what: string, test: () => boolean | Promise<boolean>, seconds: number): Promise<void> {
  const until = Date.now() + seconds * 1000;
  while (Date.now() < until) {
    if (await test()) return;
    await Bun.sleep(1000);
  }
  throw new Error(`FAILED: ${what} within ${seconds} s\n${docker(["logs", "--tail", "40", NAME], true)}`);
}

const health = () => docker(["inspect", "-f", "{{.State.Health.Status}}", NAME], true);
const hostPort = (port: number) => docker(["port", NAME, `${port}/tcp`]).split("\n")[0]!.replace("0.0.0.0", "127.0.0.1");

/** The pid of the first process whose command line contains `needle`. */
function pidOf(needle: string): number | null {
  const line = docker(["exec", NAME, "ps", "-eo", "pid=,args="])
    .split("\n")
    .find((l) => l.includes(needle) && !l.includes("ps -eo"));
  return line ? Number(line.trim().split(/\s+/)[0]) : null;
}

async function healthyOnFrontDoor(): Promise<boolean> {
  try {
    const ps = await fetch(`http://${hostPort(3000)}/`, { signal: AbortSignal.timeout(3000) });
    const ts = await fetch(`http://${hostPort(8080)}/health`, { signal: AbortSignal.timeout(3000) });
    return ps.status < 500 && ts.status === 200;
  } catch {
    return false;
  }
}

/** `kill -9` one product's main process, then see it come back with a new pid and the other untouched. */
async function killAndRecover(victim: { name: string; needle: string }, other: { name: string; needle: string }) {
  const before = pidOf(victim.needle);
  const otherBefore = pidOf(other.needle);
  check(before !== null && otherBefore !== null, `${victim.name} and ${other.name} are running`);
  docker(["exec", NAME, "kill", "-9", String(before)]);
  await waitFor(
    `${victim.name} back after kill -9`,
    async () => {
      const now = pidOf(victim.needle);
      return now !== null && now !== before && (await healthyOnFrontDoor());
    },
    120,
  );
  // A crash loop shows within seconds; give it the time to show.
  await Bun.sleep(8000);
  const after = pidOf(victim.needle);
  check(after !== null && after !== before, `${victim.name} came back after kill -9 (pid ${before} to ${after})`);
  check(await healthyOnFrontDoor(), `${victim.name} still answers 8 s later`);
  check(pidOf(other.needle) === otherBefore, `${other.name} kept its pid (${otherBefore})`);
  // The orphans are gone, not just joined by new ones: one workerd and one diff sidecar, no more.
  const args = docker(["exec", NAME, "ps", "-eo", "args="]).split("\n");
  const count = (needle: string) => args.filter((a) => a.includes(needle)).length;
  check(count("bin/workerd") === 1 && count("diff-sidecar.ts") === 1, "one workerd and one diff sidecar left");
  check(!docker(["logs", NAME]).includes("ERR_ADDRESS_IN_USE"), `no ERR_ADDRESS_IN_USE in the logs`);
}

const PIXELSLASH = { name: "pixelslash", needle: "deploy/docker/start.ts" };
const TOGGLESLASH = { name: "toggleslash", needle: "ToggleSlash.Server.dll" };

/** Docker's own diff, with what the container may write and the folders above it taken out. */
function writesOutsideAllowed(): string[] {
  const allowed = /^\/(run|tmp|home\/app|data)(\/|$)/;
  const parents = new Set(["/home"]);
  return docker(["diff", NAME])
    .split("\n")
    .filter(Boolean)
    .map((line) => line.slice(2))
    .filter((path) => !allowed.test(path) && !parents.has(path));
}

async function readOnlyDataStops(): Promise<void> {
  // Owned by whoever runs the test and mode 0555: not writable by UID 1654 inside the container.
  const dir = mkdtempSync(join(process.env["TMPDIR"] || tmpdir(), "slashslash-smoke-ro-"));
  Bun.spawnSync(["chmod", "0555", dir]);
  const name = `${NAME}-ro`;
  try {
    docker(["run", "-d", "--name", name, ...LIMITS, ...DUMMY_GITHUB, "-v", `${dir}:/data`, IMAGE]);
    const until = Date.now() + 60_000;
    while (docker(["inspect", "-f", "{{.State.Running}}", name]) === "true" && Date.now() < until) await Bun.sleep(500);
    const state = docker(["inspect", "-f", "{{.State.Running}} {{.State.ExitCode}}", name]);
    const logs = docker(["logs", name]);
    console.log(`  the container said:\n${logs.replace(/^/gm, "  | ")}`);
    check(state.startsWith("false") && !state.endsWith(" 0"), `an unwritable /data stops the container (${state})`);
    check(
      /\/data is not writable by UID 1654/.test(logs),
      "the stop names the path and the UID",
    );
  } finally {
    docker(["rm", "-f", name], true);
    Bun.spawnSync(["chmod", "0755", dir]);
    rmSync(dir, { recursive: true, force: true });
  }
}

async function main(): Promise<void> {
  if (!process.env["SMOKE_IMAGE"]) build(IMAGE, VERSION);

  docker(["run", "-d", "--name", NAME, ...LIMITS, ...DUMMY_GITHUB, "-p", "127.0.0.1::3000", "-p", "127.0.0.1::8080",
    "-v", `${VOLUME}:/data`, IMAGE]);
  await waitFor("the container reports healthy", () => health() === "healthy", 180);
  check(await healthyOnFrontDoor(), "PixelSlash / and ToggleSlash /health answer through Caddy");

  check(docker(["inspect", "-f", "{{.Config.User}}", IMAGE]) === "app", "the image's user is app");
  const users = docker(["exec", NAME, "ps", "-eo", "user="]).split("\n").map((u) => u.trim());
  check(users.length > 0 && users.every((u) => u === "app"), "no process runs as root", users.join(" "));
  check(docker(["exec", NAME, "sh", "-c", "find / -xdev -type f -perm /6000 2>/dev/null; true"]) === "", "no setuid or setgid file in the image");

  const reported = docker(["exec", NAME, "slashslash", "version"]);
  check(reported === VERSION, `slashslash version is ${VERSION} (${reported})`);
  const label = docker(["inspect", "-f", '{{index .Config.Labels "org.opencontainers.image.version"}}', IMAGE]);
  check(label === VERSION, `the version label is ${VERSION} (${label})`);
  // Every non-empty file under the folder, as `bun/LICENSE.md`; each product needs at least one.
  const licences = docker(["exec", NAME, "find", "/usr/share/licenses/slashslash", "-type", "f", "-size", "+0c"])
    .split("\n")
    .map((f) => f.replace("/usr/share/licenses/slashslash/", ""));
  const missing = ["LICENSE", "NOTICE", ...LICENCES.map((d) => `${d}/`)].filter(
    (want) => !licences.some((f) => (want.endsWith("/") ? f.startsWith(want) : f === want)),
  );
  check(missing.length === 0, `the licences are there: slashslash, ${LICENCES.join(", ")}`, `missing: ${missing.join(" ")}`);

  const token = docker(["exec", NAME, "slashslash", "secret", "toggleslash-admin-token"]);
  check(/^[0-9a-f]{64}$/.test(token), "the generated admin token is 32 random bytes in hex");
  const created = await fetch(`http://${hostPort(8080)}/api/v1/projects`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ key: "smoke", name: "Smoke" }),
  });
  check(created.status === 201, `the token creates a ToggleSlash project (${created.status})`);

  docker(["restart", NAME]);
  await waitFor("healthy again after docker restart", async () => health() === "healthy" && (await healthyOnFrontDoor()), 180);
  const listed = await fetch(`http://${hostPort(8080)}/api/v1/projects/smoke`, {
    headers: { authorization: `Bearer ${token}` },
  });
  check(listed.status === 200, `the project survived docker restart (${listed.status})`);
  check(docker(["exec", NAME, "slashslash", "secret", "toggleslash-admin-token"]) === token, "the token survived too");

  await killAndRecover(PIXELSLASH, TOGGLESLASH);
  await killAndRecover(TOGGLESLASH, PIXELSLASH);

  const status = docker(["exec", NAME, "slashslash", "status"]);
  console.log(status.replace(/^/gm, "  | "));
  const statusOk =
    ["pixelslash", "toggleslash", "caddy"].every((s) => new RegExp(`^${s} +up \\(pid \\d+`, "m").test(status)) &&
    ["pixelslash", "toggleslash"].every((s) => new RegExp(`^${s} +healthy `, "m").test(status));
  check(statusOk, "slashslash status shows every service up and both products healthy");

  const logs = docker(["logs", NAME]).split("\n").filter(Boolean);
  const unlabelled = logs.filter((l) => !/^\[(init-data|pixelslash|toggleslash|caddy)\] /.test(l));
  check(unlabelled.length === 0, `every log line has its service prefix (${logs.length} lines)`, unlabelled.slice(0, 10).join("\n"));
  check(!logs.some((l) => l.includes(token)), "the admin token is in no log line");

  const outside = writesOutsideAllowed();
  check(outside.length === 0, "nothing written outside /run, /tmp, /home/app and /data", outside.join("\n"));

  console.log(`measured: memory after the run ${docker(["stats", "--no-stream", "--format", "{{.MemUsage}}", NAME])}`);

  await readOnlyDataStops();
  console.log("smoke: all checks passed");
}

try {
  await main();
} catch (error) {
  console.error((error as Error).message);
  process.exitCode = 1;
} finally {
  docker(["rm", "-f", NAME], true);
  docker(["volume", "rm", VOLUME], true);
}
