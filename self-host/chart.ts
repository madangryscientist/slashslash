/**
 * Checks the Helm chart in self-host/chart without a cluster, or publishes it.
 *
 *   bun self-host/chart.ts            # every check below; fails on the first that does not pass
 *   bun self-host/chart.ts --write    # re-render chart/slashslash.yaml, then check
 *   bun self-host/chart.ts publish    # package and push to oci://ghcr.io/madangryscientist/charts
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

type Doc = Record<string, any>;
/** Every document in a multi-document YAML stream (Bun returns a lone document unwrapped). */
function parse(yaml: string): Doc[] {
  const parsed = Bun.YAML.parse(yaml) as Doc | Doc[];
  return (Array.isArray(parsed) ? parsed : [parsed]).filter(Boolean);
}

/**
 * The restricted Pod Security Standard (kubernetes.io/docs/concepts/security/pod-security-standards),
 * plus what this image needs to run under it: UID and GID 1654 and a read-only root with its four
 * writable paths mounted.
 */
export function restrictedProblems(docs: Doc[]): string[] {
  const problems: string[] = [];
  const pods = docs.filter((d) => d?.spec?.template?.spec).map((d) => ({ name: `${d.kind}/${d.metadata?.name}`, spec: d.spec.template.spec }));
  if (pods.length === 0) problems.push("no pod template in the render");
  const allowedVolumes = ["configMap", "csi", "downwardAPI", "emptyDir", "ephemeral", "persistentVolumeClaim", "projected", "secret"];
  for (const { name, spec } of pods) {
    const pod = spec.securityContext ?? {};
    const say = (what: string) => problems.push(`${name}: ${what}`);
    for (const key of ["hostNetwork", "hostPID", "hostIPC"]) if (spec[key]) say(`${key} is set`);
    if (pod.runAsNonRoot !== true) say("pod securityContext.runAsNonRoot is not true");
    for (const key of ["runAsUser", "runAsGroup", "fsGroup"]) if (pod[key] !== 1654) say(`pod securityContext.${key} is not 1654`);
    if (pod.seccompProfile?.type !== "RuntimeDefault") say("pod seccompProfile is not RuntimeDefault");
    if (pod.sysctls?.length) say("pod sets sysctls");
    for (const volume of spec.volumes ?? []) {
      const types = Object.keys(volume).filter((k) => k !== "name");
      if (!types.every((t) => allowedVolumes.includes(t))) say(`volume ${volume.name} is ${types.join(",")}`);
    }
    const containers = [...(spec.initContainers ?? []), ...(spec.containers ?? [])];
    for (const c of containers) {
      const sc = c.securityContext ?? {};
      const said = (what: string) => say(`container ${c.name}: ${what}`);
      if (sc.privileged) said("privileged");
      if (sc.allowPrivilegeEscalation !== false) said("allowPrivilegeEscalation is not false");
      if (!(sc.capabilities?.drop ?? []).includes("ALL")) said("capabilities.drop does not hold ALL");
      if ((sc.capabilities?.add ?? []).some((cap: string) => cap !== "NET_BIND_SERVICE")) said("adds a capability");
      if (sc.runAsNonRoot === false || sc.runAsUser === 0) said("runs as root");
      if (sc.seccompProfile && sc.seccompProfile.type !== "RuntimeDefault") said("seccompProfile is not RuntimeDefault");
      if (sc.readOnlyRootFilesystem !== true) said("readOnlyRootFilesystem is not true");
      if (sc.procMount && sc.procMount !== "Default") said("procMount is not Default");
      if ((c.ports ?? []).some((p: Doc) => p.hostPort)) said("sets a hostPort");
      const mounts = new Set((c.volumeMounts ?? []).map((m: Doc) => m.mountPath));
      for (const path of ["/data", "/run", "/tmp", "/home/app"]) if (!mounts.has(path)) said(`nothing mounted at ${path}`);
    }
  }
  return problems;
}

function versionProblems(): string[] {
  const version = readVersion();
  const chart = Bun.YAML.parse(readFileSync(join(CHART, "Chart.yaml"), "utf8")) as Doc;
  return (["version", "appVersion"] as const)
    .filter((key) => String(chart[key]) !== version)
    .map((key) => `Chart.yaml ${key} is ${chart[key]}, but self-host/VERSION is ${version}`);
}

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
    run([helm, "registry", "login", "ghcr.io", "--username", process.env["GITHUB_ACTOR"]!, "--password-stdin"], process.env["GH_TOKEN"]);
    run([helm, "package", CHART, "--destination", out]);
    console.log(run([helm, "push", join(out, `slashslash-${version}.tgz`), "oci://ghcr.io/madangryscientist/charts"]));
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
  const kinds = (yaml: string) => parse(yaml).map((d) => d.kind).sort().join(",");
  check(kinds(renders["the defaults with an existingSecret"]) === "Service,StatefulSet", "the defaults render a Service and a StatefulSet, and no Secret");
  check(kinds(renders["every optional part on"]) === "Ingress,Secret,Service,StatefulSet", "every optional part renders an Ingress and a Secret too");
  const token = (yaml: string) => parse(yaml).some((d) => d.kind === "Secret" && "TOGGLESLASH_ADMIN_TOKEN" in (d.stringData ?? {}));
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
