/**
 * The shared setup for install.sh's tests: stand-ins for the Proxmox tools (pct, qm, pveam, pvesh,
 * ping) in a temporary directory, and `sh`, which runs the script against them. The stand-ins answer
 * the read-only checks and log any call that would change something, so a dry run is shown to change
 * nothing.
 */
import { afterAll, beforeAll } from "bun:test";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const SCRIPT = join(import.meta.dir, "install.sh");
const SECRET = "s3cret-value-never-printed";

export const INSTALL = {
  CTID: "140",
  IP: "192.168.0.40/24",
  GATEWAY: "192.168.0.1",
  GITHUB_CLIENT_ID: "Iv1.abc",
  GITHUB_CLIENT_SECRET: SECRET,
};

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

export type Run = { code: number; out: string; err: string; calls: string };

/** The temporary directory a test file works in, filled in before its first test runs. */
export type Harness = {
  dir: string;
  dataPath: string;
  lxcDir: string;
  sh: (args: string[], env?: Record<string, string>) => Run;
};

/** Sets up the stand-ins before the calling file's tests and removes them after. */
export function useHarness(): Harness {
  let bin = "";
  let log = "";
  const h: Harness = { dir: "", dataPath: "", lxcDir: "", sh };

  function sh(args: string[], env: Record<string, string> = {}): Run {
    writeFileSync(log, "");
    const p = Bun.spawnSync(["bash", SCRIPT, ...args], {
      env: {
        PATH: `${bin}:${process.env["PATH"]}`,
        DRY_RUN: "1",
        FAKE_LOG: log,
        PVE_LXC_DIR: h.lxcDir,
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

  beforeAll(() => {
    h.dir = mkdtempSync(join(process.env["TMPDIR"] ?? tmpdir(), "slashslash-proxmox-"));
    bin = join(h.dir, "bin");
    log = join(h.dir, "calls.log");
    h.dataPath = join(h.dir, "tank-slashslash");
    mkdirSync(bin);
    mkdirSync(h.dataPath);
    h.lxcDir = join(h.dir, "lxc");
    mkdirSync(h.lxcDir);
    for (const tool of ["pct", "qm", "pveam", "pvesh", "ping"]) {
      writeFileSync(join(bin, tool), STUB);
      chmodSync(join(bin, tool), 0o755);
    }
  });
  afterAll(() => rmSync(h.dir, { recursive: true, force: true }));
  return h;
}
