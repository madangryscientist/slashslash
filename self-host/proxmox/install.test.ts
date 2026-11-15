/**
 * install.sh's argument handling and the commands its dry run prints, against stand-ins for the
 * Proxmox tools (pct, qm, pveam, pvesh, ping). The stand-ins answer the read-only checks and log
 * any call that would change something, so a dry run is shown to change nothing.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SCRIPT = join(import.meta.dir, "install.sh");
const SECRET = "s3cret-value-never-printed";

let dir: string;
let bin: string;
let log: string;
let dataPath: string;
let lxcDir: string;

// One stand-in for every host tool; $0's name picks the behaviour. FAKE_CTS lists the existing
// containers, FAKE_OURS the ones carrying the slashslash tag, FAKE_VMS the existing VMs.
const STUB = `#!/usr/bin/env bash
tool="$(basename "$0")"
has() { case " $1 " in *" $2 "*) return 0 ;; esac; return 1; }
case "$tool" in
  pct)
    case "$1" in
      status)
        has "$FAKE_CTS" "$2" || { echo "no such ct" >&2; exit 2; }
        if grep -qx "pct stop $2" "$FAKE_LOG" && [ -z "$FAKE_STOP_FAILS" ]; then echo "status: stopped"; else echo "status: running"; fi
        exit 0 ;;
      config)
        has "$FAKE_CTS" "$2" || exit 2
        # A config file written by the test stands for the real one.
        [ -f "$PVE_LXC_DIR/$2.conf" ] && { cat "$PVE_LXC_DIR/$2.conf"; exit 0; }
        echo "hostname: slashslash"
        has "$FAKE_OURS" "$2" && echo "tags: slashslash"
        echo "net0: name=eth0,bridge=vmbr0,gw=192.168.0.1,ip=192.168.0.40/24,type=veth"
        [ -n "$FAKE_MP0" ] && echo "mp0: $FAKE_MP0"
        exit 0 ;;
      exec)
        case "$*" in
          *"slashslash version"*) echo "\${FAKE_OLD_VERSION:-0.1.0}" ;;
          *"ls -1"*) echo "upgrade-20261115T100000Z-0.1.0.tgz" ;;
        esac
        exit 0 ;;
      destroy)
        echo "pct $*" >>"$FAKE_LOG"
        # What the config held when destroy ran: the volume must be gone from it by then.
        [ -f "$PVE_LXC_DIR/$2.conf" ] && sed 's/^/  conf: /' "$PVE_LXC_DIR/$2.conf" >>"$FAKE_LOG"
        exit 0 ;;
      *) echo "pct $*" >>"$FAKE_LOG"; exit 0 ;;
    esac ;;
  qm) has "$FAKE_VMS" "$2" && exit 0; exit 2 ;;
  pveam)
    case "$1" in
      list) echo "NAME SIZE"; [ -z "$FAKE_NO_TEMPLATE" ] && echo "local:vztmpl/debian-13-standard_13.6-1_amd64.tar.zst 123MB"; exit 0 ;;
      available) echo "system          debian-13-standard_13.6-1_amd64.tar.zst"; exit 0 ;;
      *) echo "pveam $*" >>"$FAKE_LOG"; exit 0 ;;
    esac ;;
  pvesh) echo 150 ;;
  ping) [ -n "$FAKE_PING_UP" ] && exit 0; exit 1 ;;
esac
`;

beforeAll(() => {
  dir = mkdtempSync(join(process.env.TMPDIR ?? tmpdir(), "slashslash-proxmox-"));
  bin = join(dir, "bin");
  log = join(dir, "calls.log");
  dataPath = join(dir, "tank-slashslash");
  mkdirSync(bin);
  mkdirSync(dataPath);
  lxcDir = join(dir, "lxc");
  mkdirSync(lxcDir);
  for (const tool of ["pct", "qm", "pveam", "pvesh", "ping"]) {
    writeFileSync(join(bin, tool), STUB);
    chmodSync(join(bin, tool), 0o755);
  }
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

type Run = { code: number; out: string; err: string; calls: string };

function sh(args: string[], env: Record<string, string> = {}): Run {
  writeFileSync(log, "");
  const p = Bun.spawnSync(["bash", SCRIPT, ...args], {
    env: {
      PATH: `${bin}:${process.env.PATH}`,
      DRY_RUN: "1",
      FAKE_LOG: log,
      PVE_LXC_DIR: lxcDir,
      FAKE_CTS: "100 139",
      FAKE_OURS: "",
      FAKE_VMS: "101",
      FAKE_MP0: "",
      FAKE_NO_TEMPLATE: "",
      FAKE_PING_UP: "",
      FAKE_STOP_FAILS: "",
      ...env,
    },
    stdin: "ignore",
  });
  return {
    code: p.exitCode,
    out: p.stdout.toString(),
    err: p.stderr.toString(),
    calls: readFileSync(log, "utf8"),
  };
}

const INSTALL = {
  CTID: "140",
  IP: "192.168.0.40/24",
  GATEWAY: "192.168.0.1",
  GITHUB_CLIENT_ID: "Iv1.abc",
  GITHUB_CLIENT_SECRET: SECRET,
};

describe("arguments", () => {
  test("--help prints the usage and exits 0", () => {
    const r = sh(["--help"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("--upgrade CTID [VERSION]");
  });

  test.each([
    [["--bogus"]],
    [["--upgrade"]],
    [["--upgrade", "140", "0.1.1", "extra"]],
    [["--uninstall"]],
    [["--uninstall", "140", "--force"]],
  ])("%j is a usage error (exit 2)", (args) => {
    const r = sh(args);
    expect(r.code).toBe(2);
    expect(r.err).toContain("Usage:");
  });

  test("a CTID that is not a number is refused", () => {
    const r = sh(["--upgrade", "abc"]);
    expect(r.code).toBe(1);
    expect(r.err).toContain("CTID must be a number");
  });

  test("a version that is not an image tag is refused", () => {
    const r = sh([], { ...INSTALL, VERSION: "0.1.1;rm -rf /" });
    expect(r.code).toBe(1);
    expect(r.err).toContain("VERSION must be an image tag");
  });
});

describe("install", () => {
  test("prints the pct lines for a ZFS dataset as data, and changes nothing", () => {
    const r = sh([], { ...INSTALL, DATA_PATH: dataPath, VERSION: "0.1.0" });
    expect(r.err).toBe("");
    expect(r.code).toBe(0);
    expect(r.calls).toBe("");
    expect(r.out).toContain(`+ chown 101654:101654 ${dataPath}`);
    expect(r.out).toContain(
      "+ pct create 140 local:vztmpl/debian-13-standard_13.6-1_amd64.tar.zst --hostname slashslash --cores 2 --memory 2048 --swap 512 --rootfs local-lvm:8",
    );
    expect(r.out).toContain(`--mp0 ${dataPath},mp=/var/lib/slashslash`);
    expect(r.out).toContain("--net0 name=eth0,bridge=vmbr0,ip=192.168.0.40/24,gw=192.168.0.1");
    expect(r.out).toContain("--unprivileged 1 --features nesting=1,keyctl=1 --onboot 1");
    expect(r.out).toContain("--tags slashslash");
    expect(r.out).toContain("+ pct start 140");
    // A host directory is owned from the host; nothing chowns it again inside.
    expect(r.out).not.toContain("chown 1654:1654");
    expect(r.out).toContain("apt-get install -y -qq docker.io");
    expect(r.out).toContain("/etc/slashslash/.env' < (GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET)");
    expect(r.out).toContain("docker pull -q ghcr.io/madangryscientist/slashslash:0.1.0");
    expect(r.out).toContain(
      "docker run -d --name slashslash --restart unless-stopped -p 3000:3000 -p 8080:8080 --env-file /etc/slashslash/.env -v /var/lib/slashslash:/data ghcr.io/madangryscientist/slashslash:0.1.0",
    );
    expect(r.out).toContain("PixelSlash:  http://192.168.0.40:3000");
    expect(r.out).toContain("ToggleSlash: http://192.168.0.40:8080");
    expect(r.out).toContain(
      "pct exec 140 -- docker exec slashslash slashslash secret toggleslash-admin-token",
    );
  });

  test("the default data mount is a volume, owned from inside the container", () => {
    const r = sh([], { ...INSTALL });
    expect(r.code).toBe(0);
    expect(r.out).toContain("--mp0 local-lvm:8,mp=/var/lib/slashslash");
    expect(r.out).toContain("chown 1654:1654 /var/lib/slashslash");
    expect(r.out).not.toContain("+ chown 101654");
    expect(r.out).toContain("slashslash:latest");
  });

  test("DATA_STORAGE, DATA_GB, BRIDGE and dhcp shape the lines", () => {
    const r = sh([], {
      ...INSTALL,
      IP: "dhcp",
      GATEWAY: "",
      BRIDGE: "vmbr1",
      DATA_STORAGE: "tank-zfs",
      DATA_GB: "20",
    });
    expect(r.code).toBe(0);
    expect(r.out).toContain("--mp0 tank-zfs:20,mp=/var/lib/slashslash");
    expect(r.out).toContain("--net0 name=eth0,bridge=vmbr1,ip=dhcp ");
  });

  test("a missing template is downloaded", () => {
    const r = sh([], { ...INSTALL, FAKE_NO_TEMPLATE: "1" });
    expect(r.code).toBe(0);
    expect(r.out).toContain("+ pveam download local debian-13-standard_13.6-1_amd64.tar.zst");
  });

  test.each([
    ["an existing container", { CTID: "139" }, "container 139 already exists"],
    ["an existing VM", { CTID: "101" }, "VM 101 already exists"],
    ["an address that answers", { FAKE_PING_UP: "1" }, "already answers a ping"],
    ["a static IP with no gateway", { GATEWAY: "" }, "GATEWAY is required"],
    ["a malformed IP", { IP: "192.168.0.40" }, "IP must be dhcp or a CIDR"],
    ["no client id", { GITHUB_CLIENT_ID: "" }, "GITHUB_CLIENT_ID is required"],
    ["no client secret", { GITHUB_CLIENT_SECRET: "" }, "GITHUB_CLIENT_SECRET is required"],
    ["a DATA_PATH that is not there", { DATA_PATH: "/no/such/dir" }, "is not a directory"],
    ["DATA_PATH and DATA_VOLUME both", { DATA_PATH: "/x", DATA_VOLUME: "y" }, "not both"],
    ["a DATA_PATH with someone else's files", { DATA_PATH: "NONEMPTY" }, "is not empty and not owned by UID 101654"],
    ["a DATA_PATH another container mounts", { DATA_PATH: "MOUNTED" }, "is already mounted by 139.conf"],
  ])("refuses %s", (_name, env, message) => {
    const path = { NONEMPTY: join(dir, "nonempty"), MOUNTED: join(dir, "mounted") }[env.DATA_PATH ?? ""];
    if (path) {
      mkdirSync(path, { recursive: true });
      if (env.DATA_PATH === "NONEMPTY") writeFileSync(join(path, "theirs.txt"), "");
      else writeFileSync(join(lxcDir, "139.conf"), `mp0: ${path},mp=/srv\n`);
    }
    const r = sh([], { ...INSTALL, ...env, ...(path ? { DATA_PATH: path } : {}) });
    rmSync(join(lxcDir, "139.conf"), { force: true });
    expect(r.code).toBe(1);
    expect(r.err).toContain(message);
    expect(r.out).not.toContain("pct create");
    expect(r.calls).toBe("");
  });
});

describe("upgrade", () => {
  test("pulls the new version and recreates the container on the same data", () => {
    const r = sh(["--upgrade", "140", "0.1.1"], { FAKE_CTS: "139 140", FAKE_OURS: "140" });
    expect(r.err).toBe("");
    expect(r.code).toBe(0);
    expect(r.calls).toBe("");
    expect(r.out).toContain("== upgrade 140 from 0.1.0 to 0.1.1");
    expect(r.out).toContain("docker pull -q ghcr.io/madangryscientist/slashslash:0.1.1");
    expect(r.out).toContain("docker rm -f slashslash");
    expect(r.out).toContain(
      "--env-file /etc/slashslash/.env -v /var/lib/slashslash:/data ghcr.io/madangryscientist/slashslash:0.1.1",
    );
    expect(r.out).toContain("+ pct set 140 --description");
    expect(r.out).toContain("upgrade backup: upgrade-20261115T100000Z-0.1.0.tgz");
    expect(r.out).toContain("PixelSlash:  http://192.168.0.40:3000");
    expect(r.out).not.toContain("pct create");
  });

  test("the version defaults to latest", () => {
    const r = sh(["--upgrade", "140"], { FAKE_CTS: "140", FAKE_OURS: "140" });
    expect(r.code).toBe(0);
    expect(r.out).toContain("slashslash:latest");
  });

  test("the same version again says no upgrade backup was written", () => {
    const r = sh(["--upgrade", "140", "0.1.0"], { FAKE_CTS: "140", FAKE_OURS: "140" });
    expect(r.code).toBe(0);
    expect(r.out).toContain("same version, so no upgrade backup was written");
    expect(r.out).not.toContain("upgrade backup:");
  });

  test("refuses a container this script did not make", () => {
    const r = sh(["--upgrade", "139", "0.1.1"]);
    expect(r.code).toBe(1);
    expect(r.err).toContain("container 139 was not made by this script");
    expect(r.out).not.toContain("docker");
  });

  test("refuses a container that is not there", () => {
    const r = sh(["--upgrade", "140"]);
    expect(r.code).toBe(1);
    expect(r.err).toContain("no container 140");
  });
});

describe("uninstall", () => {
  const ours = { FAKE_CTS: "139 140", FAKE_OURS: "140" };

  test("keeps a volume: it leaves the config before the container goes", () => {
    const r = sh(["--uninstall", "140"], {
      ...ours,
      FAKE_MP0: "local-lvm:vm-140-disk-1,mp=/var/lib/slashslash,size=8G",
    });
    expect(r.err).toBe("");
    expect(r.code).toBe(0);
    expect(r.calls).toBe("");
    const lines = r.out.split("\n");
    const detach = lines.findIndex((l) => l === `+ remove the mp0 line from ${lxcDir}/140.conf`);
    const stop = lines.findIndex((l) => l === "+ pct stop 140");
    const destroy = lines.findIndex((l) => l === "+ pct destroy 140 --purge 1 --destroy-unreferenced-disks 0");
    expect(stop).toBeGreaterThan(-1);
    expect(detach).toBeGreaterThan(stop);
    expect(destroy).toBeGreaterThan(detach);
    expect(r.out).toContain("DATA_VOLUME=local-lvm:vm-140-disk-1");
  });

  test("for real, it stops, then the volume leaves the config, then it destroys", () => {
    const conf = join(lxcDir, "140.conf");
    writeFileSync(
      conf,
      "hostname: slashslash\nmp0: local-lvm:vm-140-disk-1,mp=/var/lib/slashslash,size=8G\ntags: slashslash\n",
    );
    const r = sh(["--uninstall", "140"], { ...ours, DRY_RUN: "0" });
    const left = readFileSync(conf, "utf8");
    rmSync(conf);
    expect(r.err).toBe("");
    expect(r.code).toBe(0);
    expect(left).toBe("hostname: slashslash\ntags: slashslash\n");
    expect(r.calls).toBe(
      "pct stop 140\npct destroy 140 --purge 1 --destroy-unreferenced-disks 0\n  conf: hostname: slashslash\n  conf: tags: slashslash\n",
    );
    expect(r.out).toContain("still filed under id 140");
  });

  test("for real, a container that does not stop is left as it was", () => {
    const conf = join(lxcDir, "140.conf");
    const before = "mp0: local-lvm:vm-140-disk-1,mp=/var/lib/slashslash\ntags: slashslash\n";
    writeFileSync(conf, before);
    const r = sh(["--uninstall", "140"], { ...ours, DRY_RUN: "0", FAKE_STOP_FAILS: "1" });
    const left = readFileSync(conf, "utf8");
    rmSync(conf);
    expect(r.code).toBe(1);
    expect(r.err).toContain("did not stop; nothing was changed");
    expect(left).toBe(before);
    expect(r.calls).toBe("pct stop 140\n");
  });

  test("refuses to keep a volume that snapshots still hold", () => {
    const conf = join(lxcDir, "140.conf");
    writeFileSync(conf, "mp0: local-lvm:vm-140-disk-1,mp=/var/lib/slashslash\ntags: slashslash\n[before]\nmp0: local-lvm:vm-140-disk-1,mp=/var/lib/slashslash\n");
    const r = sh(["--uninstall", "140"], ours);
    rmSync(conf);
    expect(r.code).toBe(1);
    expect(r.err).toContain("has snapshots");
    expect(r.out).not.toContain("destroy");
  });

  test("keeps a host directory without touching the config", () => {
    const r = sh(["--uninstall", "140"], { ...ours, FAKE_MP0: "/tank/slashslash,mp=/var/lib/slashslash" });
    expect(r.code).toBe(0);
    expect(r.out).not.toContain("remove the mp0 line");
    expect(r.out).toContain("+ pct destroy 140 --purge 1 --destroy-unreferenced-disks 0");
    expect(r.out).toContain("Data kept at /tank/slashslash.");
  });

  test("--purge destroys the container with its volumes", () => {
    const r = sh(["--uninstall", "140", "--purge"], {
      ...ours,
      FAKE_MP0: "local-lvm:vm-140-disk-1,mp=/var/lib/slashslash,size=8G",
    });
    expect(r.code).toBe(0);
    expect(r.calls).toBe("");
    expect(r.out).toContain("+ pct stop 140");
    expect(r.out).toContain("+ pct destroy 140 --purge 1");
    expect(r.out).not.toContain("remove the mp0 line");
  });

  test("--purge never deletes a host directory", () => {
    const r = sh(["--uninstall", "140", "--purge"], {
      ...ours,
      FAKE_MP0: "/tank/slashslash,mp=/var/lib/slashslash",
    });
    expect(r.code).toBe(0);
    expect(r.out).not.toContain("rm ");
    expect(r.out).toContain("/tank/slashslash is a host directory and was not deleted");
  });

  test("refuses a container this script did not make", () => {
    const r = sh(["--uninstall", "139", "--purge"]);
    expect(r.code).toBe(1);
    expect(r.err).toContain("container 139 was not made by this script");
    expect(r.out).not.toContain("destroy");
  });
});

test("ShellCheck finds nothing", () => {
  // The distro's shellcheck when it works (CI's runner has one), else the pinned PyPI build.
  const local = Bun.spawnSync(["shellcheck", "--version"], { stderr: "ignore", stdout: "ignore" });
  const cmd =
    local.exitCode === 0
      ? ["shellcheck", SCRIPT]
      : ["uvx", "--from", "shellcheck-py==0.11.0.1", "shellcheck", SCRIPT];
  const p = Bun.spawnSync(cmd);
  expect(p.stdout.toString() + p.stderr.toString()).toBe("");
  expect(p.exitCode).toBe(0);
}, 60_000);
