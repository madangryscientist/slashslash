/**
 * Checks the Helm chart in self-host/chart without a cluster, or publishes it.
 *
 *   bun self-host/chart.ts            # every check below; fails on the first that does not pass
 *   bun self-host/chart.ts --write    # re-render chart/slashslash.yaml, then check
 *   bun self-host/chart.ts publish    # package and push to oci://ghcr.io/slashsuite/charts
 *
 * The checks: Chart.yaml's version and appVersion equal self-host/VERSION; `helm lint`; `helm
 * template` with the defaults and with every optional part on; `kubeconform -strict` on both; the
 * committed chart/slashslash.yaml is what the chart renders now; and every pod in both renders meets
 * the restricted Pod Security Standard, with the fields the image needs.
 *
 * helm and kubeconform are downloaded at pinned versions, checked against their SHA-256, and kept
 * under $TMPDIR, so nothing needs installing first.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { readVersion } from "./build.ts";

const HERE = import.meta.dir;
const CHART = join(HERE, "chart");
const RENDERED = join(CHART, "slashslash.yaml");
const KUBERNETES = "1.34.0";

const TOOLS = {
  helm: {
    version: "4.3.1",
    url: (v: string) => `https://get.helm.sh/helm-v${v}-linux-amd64.tar.gz`,
    sha256: "0403a88ae20913d11b10a2467b50087721fea7581736da6b9d3992f5357fe54b",
    member: "linux-amd64/helm",
  },
  kubeconform: {
    version: "0.8.0",
    url: (v: string) => `https://github.com/yannh/kubeconform/releases/download/v${v}/kubeconform-linux-amd64.tar.gz`,
    sha256: "9bc2bffbf71f261128533edaf912153948b7ff238f9a531ae6d34466ec287883",
    member: "kubeconform",
  },
};

function run(cmd: string[], stdin?: string): string {
  const result = Bun.spawnSync(cmd, { stdin: stdin === undefined ? "ignore" : Buffer.from(stdin), stdout: "pipe", stderr: "pipe" });
  const out = result.stdout.toString() + result.stderr.toString();
  if (result.exitCode !== 0) throw new Error(`${cmd.join(" ")} exited ${result.exitCode}:\n${out}`);
  return result.stdout.toString();
}

async function tool(name: keyof typeof TOOLS): Promise<string> {
  const { version, url, sha256, member } = TOOLS[name];
  const dir = join(process.env["TMPDIR"] || tmpdir(), "slashslash-chart-tools", `${name}-${version}`);
  const bin = join(dir, name);
  if (existsSync(bin)) return bin;
  const response = await fetch(url(version));
  if (!response.ok) throw new Error(`${url(version)}: HTTP ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const got = new Bun.CryptoHasher("sha256").update(bytes).digest("hex");
  if (got !== sha256) throw new Error(`${name} ${version}: SHA-256 is ${got}, expected ${sha256}`);
  mkdirSync(dirname(dir), { recursive: true });
  const work = mkdtempSync(join(dirname(dir), `${name}-`));
  try {
    writeFileSync(join(work, "download.tar.gz"), bytes);
    run(["tar", "-xzf", join(work, "download.tar.gz"), "-C", work, member]);
    mkdirSync(dir, { recursive: true });
    renameSync(join(work, member), bin);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
  return bin;
}

const DEFAULTS = ["--namespace", "slashslash", "--set", "existingSecret=slashslash-github"];
const EVERYTHING = [
  "--namespace", "slashslash",
  "--set", "github.clientId=example-id",
  "--set", "github.clientSecret=example-secret",
  "--set", "toggleslash.adminToken=example-token",
  "--set", "ingress.enabled=true",
  "--set", "ingress.host=example.com",
  "--set", "ingress.className=nginx",
  "--set", "ingress.tls.enabled=true",
  "--set", "ingress.annotations.example\\.com/note=checked",
  "--set", "persistence.storageClassName=fast",
  "--set", "resources.requests.memory=1Gi",
];

type Doc = Record<string, unknown>;
const isDoc = (x: unknown): x is Doc => typeof x === "object" && x !== null && !Array.isArray(x);
/** `x` when it is an object, else an empty one, so a missing field reads as absent. */
const obj = (x: unknown): Doc => (isDoc(x) ? x : {});
/** `x` when it is a list, else an empty one. */
const list = (x: unknown): unknown[] => (Array.isArray(x) ? x : []);
/** The objects in `x` when it is a list, else none. */
const docList = (x: unknown): Doc[] => list(x).filter(isDoc);
/** `doc.a.b.c`, or undefined where any step is missing. */
const at = (doc: unknown, ...path: string[]): unknown => path.reduce<unknown>((cur, key) => obj(cur)[key], doc);

/** Every document in a multi-document YAML stream (Bun returns a lone document unwrapped). */
function parse(yaml: string): Doc[] {
  const parsed: unknown = Bun.YAML.parse(yaml);
  return Array.isArray(parsed) ? docList(parsed) : docList([parsed]);
}

const ALLOWED_VOLUMES = ["configMap", "csi", "downwardAPI", "emptyDir", "ephemeral", "persistentVolumeClaim", "projected", "secret"];
const WRITABLE_PATHS = ["/data", "/run", "/tmp", "/home/app"];
// s6-overlay refuses the root-owned emptyDir at /run without it (the image smoke runs it so).
const S6_WRITABLE_RUN = "S6_YES_I_WANT_A_WORLD_WRITABLE_RUN_BECAUSE_KUBERNETES";

/** The pod-level fields: no host namespaces, UID and GID 1654, non-root, RuntimeDefault seccomp, no sysctls. */
function podProblems(spec: Doc): string[] {
  const pod = obj(spec["securityContext"]);
  const problems = ["hostNetwork", "hostPID", "hostIPC"].filter((key) => Boolean(spec[key])).map((key) => `${key} is set`);
  if (pod["runAsNonRoot"] !== true) problems.push("pod securityContext.runAsNonRoot is not true");
  for (const key of ["runAsUser", "runAsGroup", "fsGroup"]) if (pod[key] !== 1654) problems.push(`pod securityContext.${key} is not 1654`);
  if (at(pod, "seccompProfile", "type") !== "RuntimeDefault") problems.push("pod seccompProfile is not RuntimeDefault");
  if (list(pod["sysctls"]).length > 0) problems.push("pod sets sysctls");
  return problems;
}

function volumeProblems(spec: Doc): string[] {
  return docList(spec["volumes"]).flatMap((volume) => {
    const types = Object.keys(volume).filter((k) => k !== "name");
    return types.every((t) => ALLOWED_VOLUMES.includes(t)) ? [] : [`volume ${String(volume["name"])} is ${types.join(",")}`];
  });
}

/** A container's securityContext: unprivileged, no escalation, capabilities dropped, read-only root. */
function containerSecurityProblems(container: Doc): string[] {
  const sc = obj(container["securityContext"]);
  const seccomp = at(sc, "seccompProfile", "type");
  const procMount = sc["procMount"];
  const checks: [boolean, string][] = [
    [Boolean(sc["privileged"]), "privileged"],
    [sc["allowPrivilegeEscalation"] !== false, "allowPrivilegeEscalation is not false"],
    [!list(at(sc, "capabilities", "drop")).includes("ALL"), "capabilities.drop does not hold ALL"],
    [list(at(sc, "capabilities", "add")).some((cap) => cap !== "NET_BIND_SERVICE"), "adds a capability"],
    [sc["runAsNonRoot"] === false || sc["runAsUser"] === 0, "runs as root"],
    [Boolean(sc["seccompProfile"]) && seccomp !== "RuntimeDefault", "seccompProfile is not RuntimeDefault"],
    [sc["readOnlyRootFilesystem"] !== true, "readOnlyRootFilesystem is not true"],
    [Boolean(procMount) && procMount !== "Default", "procMount is not Default"],
  ];
  return checks.filter(([bad]) => bad).map(([, what]) => what);
}

/** A container's ports, writable mounts and the supervisor's switch for the emptyDir at /run. */
function containerMountProblems(container: Doc): string[] {
  const mounts = new Set(docList(container["volumeMounts"]).map((m) => m["mountPath"]));
  return [
    ...(docList(container["ports"]).some((p) => p["hostPort"]) ? ["sets a hostPort"] : []),
    ...WRITABLE_PATHS.filter((path) => !mounts.has(path)).map((path) => `nothing mounted at ${path}`),
    ...(docList(container["env"]).some((e) => e["name"] === S6_WRITABLE_RUN && e["value"] === "1") ? [] : [`does not set ${S6_WRITABLE_RUN}=1`]),
  ];
}

function containerProblems(container: Doc): string[] {
  return [...containerSecurityProblems(container), ...containerMountProblems(container)].map(
    (what) => `container ${String(container["name"])}: ${what}`,
  );
}

/**
 * The restricted Pod Security Standard (kubernetes.io/docs/concepts/security/pod-security-standards),
 * plus what this image needs to run under it: UID and GID 1654, a read-only root with its four
 * writable paths mounted, and the supervisor's switch that accepts the emptyDir at /run.
 */
function restrictedProblems(docs: Doc[]): string[] {
  const pods = docs.flatMap((d) => {
    const spec = at(d, "spec", "template", "spec");
    return isDoc(spec) ? [{ name: `${String(d["kind"])}/${String(at(d, "metadata", "name"))}`, spec }] : [];
  });
  if (pods.length === 0) return ["no pod template in the render"];
  return pods.flatMap(({ name, spec }) =>
    [
      ...podProblems(spec),
      ...volumeProblems(spec),
      ...[...docList(spec["initContainers"]), ...docList(spec["containers"])].flatMap(containerProblems),
    ].map((what) => `${name}: ${what}`),
  );
}

function versionProblems(): string[] {
  const version = readVersion();
  const chart = obj(Bun.YAML.parse(readFileSync(join(CHART, "Chart.yaml"), "utf8")));
  return (["version", "appVersion"] as const)
    .filter((key) => String(chart[key]) !== version)
    .map((key) => `Chart.yaml ${key} is ${String(chart[key])}, but self-host/VERSION is ${version}`);
}

/** The kinds a render holds, sorted and comma-joined. */
const kinds = (yaml: string) =>
  parse(yaml)
    .map((d) => String(d["kind"]))
    .toSorted((a, b) => a.localeCompare(b))
    .join(",");
/** Whether a render's Secret carries the ToggleSlash admin token. */
const token = (yaml: string) => parse(yaml).some((d) => d["kind"] === "Secret" && "TOGGLESLASH_ADMIN_TOKEN" in obj(d["stringData"]));

function check(ok: boolean, what: string, detail = ""): void {
  if (!ok) {
    console.error(`FAILED: ${what}${detail ? `\n${detail}` : ""}`);
    process.exit(1);
  }
  console.log(`ok: ${what}`);
}

async function main(): Promise<void> {
  const helm = await tool("helm");

  if (process.argv[2] === "publish") {
    const version = readVersion();
    check(versionProblems().length === 0, `the chart is version ${version}`, versionProblems().join("\n"));
    const out = mkdtempSync(join(process.env["TMPDIR"] || tmpdir(), "slashslash-chart-"));
    const actor = process.env["GITHUB_ACTOR"];
    if (!actor) throw new Error("GITHUB_ACTOR is not set: publish logs in to ghcr.io as that user");
    run([helm, "registry", "login", "ghcr.io", "--username", actor, "--password-stdin"], process.env["GH_TOKEN"]);
    run([helm, "package", CHART, "--destination", out]);
    console.log(run([helm, "push", join(out, `slashslash-${version}.tgz`), "oci://ghcr.io/slashsuite/charts"]));
    return;
  }

  const kubeconform = await tool("kubeconform");
  const problems = versionProblems();
  check(problems.length === 0, "Chart.yaml version and appVersion equal self-host/VERSION", problems.join("\n"));

  run([helm, "lint", "--strict", CHART, ...DEFAULTS]);
  run([helm, "lint", "--strict", CHART, ...EVERYTHING]);
  check(true, "helm lint --strict, with the defaults and with every optional part on");

  const renders = {
    "the defaults with an existingSecret": run([helm, "template", "slashslash", CHART, ...DEFAULTS]),
    "every optional part on": run([helm, "template", "slashslash", CHART, ...EVERYTHING]),
  };
  check(kinds(renders["the defaults with an existingSecret"]) === "Service,StatefulSet", "the defaults render a Service and a StatefulSet, and no Secret");
  check(kinds(renders["every optional part on"]) === "Ingress,Secret,Service,StatefulSet", "every optional part renders an Ingress and a Secret too");
  const noToken = run([helm, "template", "slashslash", CHART, "--set", "github.clientId=a", "--set", "github.clientSecret=b"]);
  check(token(renders["every optional part on"]) && !token(noToken), "the admin token key is in the Secret only when it is set");

  for (const [what, yaml] of Object.entries(renders)) {
    const out = run([kubeconform, "-strict", "-summary", "-kubernetes-version", KUBERNETES, "-"], yaml);
    check(true, `kubeconform -strict (Kubernetes ${KUBERNETES}), ${what}: ${out.trim()}`);
    const restricted = restrictedProblems(parse(yaml));
    check(restricted.length === 0, `the pod meets the restricted standard, ${what}`, restricted.join("\n"));
  }

  const header =
    "# Rendered from self-host/chart for installs without Helm: `bun self-host/chart.ts --write`.\n" +
    "# It expects the namespace slashslash and a Secret slashslash-github (see chart/README.md).\n";
  const rendered = header + renders["the defaults with an existingSecret"];
  if (process.argv.includes("--write")) writeFileSync(RENDERED, rendered);
  check(
    existsSync(RENDERED) && readFileSync(RENDERED, "utf8") === rendered,
    "self-host/chart/slashslash.yaml is what the chart renders now",
    "It is stale: run `bun self-host/chart.ts --write` and commit it.",
  );
}

if (import.meta.main) await main();
