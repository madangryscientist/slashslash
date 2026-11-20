/**
 * install.sh's --upgrade and --uninstall, dry and for real, against stand-ins for the Proxmox tools
 * (harness.ts).
 */
import { describe, expect, test } from "bun:test";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { useHarness } from "./harness.ts";

const h = useHarness();

describe("upgrade", () => {
  test("pulls the new version and recreates the container on the same data", () => {
    const r = h.sh(["--upgrade", "140", "0.1.1"], { FAKE_CTS: "139 140", FAKE_OURS: "140" });
    expect(r.err).toBe("");
    expect(r.code).toBe(0);
    expect(r.calls).toBe("");
    expect(r.out).toContain("== upgrade 140 from 0.1.0 to 0.1.1");
    expect(r.out).toContain("docker pull -q ghcr.io/slashsuite/slashslash:0.1.1");
    expect(r.out).toContain("docker rm -f slashslash");
    expect(r.out).toContain(
      "--env-file /etc/slashslash/.env -v /var/lib/slashslash:/data ghcr.io/slashsuite/slashslash:0.1.1",
    );
    expect(r.out).toContain("+ pct set 140 --description");
    expect(r.out).toContain("upgrade backup: upgrade-20261115T100000Z-0.1.0.tgz");
    expect(r.out).toContain("PixelSlash:  http://192.168.0.40:3000");
    expect(r.out).not.toContain("pct create");
  });

  test("the version defaults to latest", () => {
    const r = h.sh(["--upgrade", "140"], { FAKE_CTS: "140", FAKE_OURS: "140" });
    expect(r.code).toBe(0);
    expect(r.out).toContain("slashslash:latest");
  });

  test("the same version again says no upgrade backup was written", () => {
    const r = h.sh(["--upgrade", "140", "0.1.0"], { FAKE_CTS: "140", FAKE_OURS: "140" });
    expect(r.code).toBe(0);
    expect(r.out).toContain("same version, so no upgrade backup was written");
    expect(r.out).not.toContain("upgrade backup:");
  });

  test("refuses a container this script did not make", () => {
    const r = h.sh(["--upgrade", "139", "0.1.1"]);
    expect(r.code).toBe(1);
    expect(r.err).toContain("container 139 was not made by this script");
    expect(r.out).not.toContain("docker");
  });

  test("refuses a container that is not there", () => {
    const r = h.sh(["--upgrade", "140"]);
    expect(r.code).toBe(1);
    expect(r.err).toContain("no container 140");
  });
});

describe("uninstall", () => {
  const ours = { FAKE_CTS: "139 140", FAKE_OURS: "140" };

  test("keeps a volume: it leaves the config before the container goes", () => {
    const r = h.sh(["--uninstall", "140"], {
      ...ours,
      FAKE_MP0: "local-lvm:vm-140-disk-1,mp=/var/lib/slashslash,size=8G",
    });
    expect(r.err).toBe("");
    expect(r.code).toBe(0);
    expect(r.calls).toBe("");
    const lines = r.out.split("\n");
    const detach = lines.findIndex((l) => l === `+ remove the mp0 line from ${h.lxcDir}/140.conf`);
    const stop = lines.findIndex((l) => l === "+ pct stop 140");
    const destroy = lines.findIndex((l) => l === "+ pct destroy 140 --purge 1 --destroy-unreferenced-disks 0");
    expect(stop).toBeGreaterThan(-1);
    expect(detach).toBeGreaterThan(stop);
    expect(destroy).toBeGreaterThan(detach);
    expect(r.out).toContain("DATA_VOLUME=local-lvm:vm-140-disk-1");
  });

  test("for real, it stops, then the volume leaves the config, then it destroys", () => {
    const conf = join(h.lxcDir, "140.conf");
    writeFileSync(
      conf,
      "hostname: slashslash\nmp0: local-lvm:vm-140-disk-1,mp=/var/lib/slashslash,size=8G\ntags: slashslash\n",
    );
    const r = h.sh(["--uninstall", "140"], { ...ours, DRY_RUN: "0" });
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
    const conf = join(h.lxcDir, "140.conf");
    const before = "mp0: local-lvm:vm-140-disk-1,mp=/var/lib/slashslash\ntags: slashslash\n";
    writeFileSync(conf, before);
    const r = h.sh(["--uninstall", "140"], { ...ours, DRY_RUN: "0", FAKE_STOP_FAILS: "1" });
    const left = readFileSync(conf, "utf8");
    rmSync(conf);
    expect(r.code).toBe(1);
    expect(r.err).toContain("did not stop; nothing was changed");
    expect(left).toBe(before);
    expect(r.calls).toBe("pct stop 140\n");
  });

  test("refuses to keep a volume that snapshots still hold", () => {
    const conf = join(h.lxcDir, "140.conf");
    writeFileSync(conf, "mp0: local-lvm:vm-140-disk-1,mp=/var/lib/slashslash\ntags: slashslash\n[before]\nmp0: local-lvm:vm-140-disk-1,mp=/var/lib/slashslash\n");
    const r = h.sh(["--uninstall", "140"], ours);
    rmSync(conf);
    expect(r.code).toBe(1);
    expect(r.err).toContain("has snapshots");
    expect(r.out).not.toContain("destroy");
  });

  test("keeps a host directory without touching the config", () => {
    const r = h.sh(["--uninstall", "140"], { ...ours, FAKE_MP0: "/tank/slashslash,mp=/var/lib/slashslash" });
    expect(r.code).toBe(0);
    expect(r.out).not.toContain("remove the mp0 line");
    expect(r.out).toContain("+ pct destroy 140 --purge 1 --destroy-unreferenced-disks 0");
    expect(r.out).toContain("Data kept at /tank/slashslash.");
  });

  test("--purge destroys the container with its volumes", () => {
    const r = h.sh(["--uninstall", "140", "--purge"], {
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
    const r = h.sh(["--uninstall", "140", "--purge"], {
      ...ours,
      FAKE_MP0: "/tank/slashslash,mp=/var/lib/slashslash",
    });
    expect(r.code).toBe(0);
    expect(r.out).not.toContain("rm ");
    expect(r.out).toContain("/tank/slashslash is a host directory and was not deleted");
  });

  test("refuses a container this script did not make", () => {
    const r = h.sh(["--uninstall", "139", "--purge"]);
    expect(r.code).toBe(1);
    expect(r.err).toContain("container 139 was not made by this script");
    expect(r.out).not.toContain("destroy");
  });
});
