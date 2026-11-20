/**
 * install.sh's argument handling and the commands its install dry run prints, against stand-ins for
 * the Proxmox tools (harness.ts). The upgrade and uninstall runs are in lifecycle.test.ts.
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { INSTALL, SCRIPT, useHarness } from "./harness.ts";

const h = useHarness();

describe("arguments", () => {
  test("--help prints the usage and exits 0", () => {
    const r = h.sh(["--help"]);
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
    const r = h.sh(args);
    expect(r.code).toBe(2);
    expect(r.err).toContain("Usage:");
  });

  test("a CTID that is not a number is refused", () => {
    const r = h.sh(["--upgrade", "abc"]);
    expect(r.code).toBe(1);
    expect(r.err).toContain("CTID must be a number");
  });

  test("a version that is not an image tag is refused", () => {
    const r = h.sh([], { ...INSTALL, VERSION: "0.1.1;rm -rf /" });
    expect(r.code).toBe(1);
    expect(r.err).toContain("VERSION must be an image tag");
  });
});

describe("install", () => {
  test("prints the pct lines for a ZFS dataset as data, and changes nothing", () => {
    const r = h.sh([], { ...INSTALL, DATA_PATH: h.dataPath, VERSION: "0.1.0" });
    expect(r.err).toBe("");
    expect(r.code).toBe(0);
    expect(r.calls).toBe("");
    expect(r.out).toContain(`+ chown 101654:101654 ${h.dataPath}`);
    expect(r.out).toContain(
      "+ pct create 140 local:vztmpl/debian-13-standard_13.6-1_amd64.tar.zst --hostname slashslash --cores 2 --memory 2048 --swap 512 --rootfs local-lvm:8",
    );
    expect(r.out).toContain(`--mp0 ${h.dataPath},mp=/var/lib/slashslash`);
    expect(r.out).toContain("--net0 name=eth0,bridge=vmbr0,ip=192.168.0.40/24,gw=192.168.0.1");
    expect(r.out).toContain("--unprivileged 1 --features nesting=1,keyctl=1 --onboot 1");
    expect(r.out).toContain("--tags slashslash");
    expect(r.out).toContain("+ pct start 140");
    // A host directory is owned from the host; nothing chowns it again inside.
    expect(r.out).not.toContain("chown 1654:1654");
    expect(r.out).toContain("apt-get install -y -qq docker.io");
    expect(r.out).toContain("/etc/slashslash/.env' < (GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET)");
    expect(r.out).toContain("docker pull -q ghcr.io/slashsuite/slashslash:0.1.0");
    expect(r.out).toContain(
      "docker run -d --name slashslash --restart unless-stopped -p 3000:3000 -p 8080:8080 --env-file /etc/slashslash/.env -v /var/lib/slashslash:/data ghcr.io/slashsuite/slashslash:0.1.0",
    );
    expect(r.out).toContain("PixelSlash:  http://192.168.0.40:3000");
    expect(r.out).toContain("ToggleSlash: http://192.168.0.40:8080");
    expect(r.out).toContain(
      "pct exec 140 -- docker exec slashslash slashslash secret toggleslash-admin-token",
    );
  });

  test("the default data mount is a volume, owned from inside the container", () => {
    const r = h.sh([], { ...INSTALL });
    expect(r.code).toBe(0);
    expect(r.out).toContain("--mp0 local-lvm:8,mp=/var/lib/slashslash");
    expect(r.out).toContain("chown 1654:1654 /var/lib/slashslash");
    expect(r.out).not.toContain("+ chown 101654");
    expect(r.out).toContain("slashslash:latest");
  });

  test("DATA_STORAGE, DATA_GB, BRIDGE and dhcp shape the lines", () => {
    const r = h.sh([], {
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
    const r = h.sh([], { ...INSTALL, FAKE_NO_TEMPLATE: "1" });
    expect(r.code).toBe(0);
    expect(r.out).toContain("+ pveam download local debian-13-standard_13.6-1_amd64.tar.zst");
  });

  test.each<[string, Record<string, string>, string]>([
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
    const paths: Record<string, string> = { NONEMPTY: join(h.dir, "nonempty"), MOUNTED: join(h.dir, "mounted") };
    const path = paths[env["DATA_PATH"] ?? ""];
    if (path) {
      mkdirSync(path, { recursive: true });
      if (env["DATA_PATH"] === "NONEMPTY") writeFileSync(join(path, "theirs.txt"), "");
      else writeFileSync(join(h.lxcDir, "139.conf"), `mp0: ${path},mp=/srv\n`);
    }
    const r = h.sh([], { ...INSTALL, ...env, ...(path ? { DATA_PATH: path } : {}) });
    rmSync(join(h.lxcDir, "139.conf"), { force: true });
    expect(r.code).toBe(1);
    expect(r.err).toContain(message);
    expect(r.out).not.toContain("pct create");
    expect(r.calls).toBe("");
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
