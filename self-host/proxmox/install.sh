#!/usr/bin/env bash
# The Slash tools in one Proxmox LXC: run once in the Proxmox host's shell, as root.
#
#   bash -c "$(curl -fsSL https://raw.githubusercontent.com/slashsuite/slashslash/main/self-host/proxmox/install.sh)"
#
# It makes one unprivileged Debian 13 container with Docker in it, runs the slashslash image there
# on a data mount of its own, waits for it to be healthy and prints both addresses. It touches no
# other container or VM and never edits the host's storage config.
#
#   install.sh                          install (asks for what is missing when run in a terminal)
#   install.sh --upgrade CTID [VERSION] move CTID to VERSION (default latest), same data and settings
#   install.sh --uninstall CTID         remove the container, keep its data
#   install.sh --uninstall CTID --purge remove the container and its data volume
#
# Settings come from the environment (see usage below). DRY_RUN=1 prints every command that would
# change something and runs only the read-only checks.
set -euo pipefail

IMAGE="ghcr.io/slashsuite/slashslash"
TAG="slashslash"
MOUNT="/var/lib/slashslash"
# The image runs as UID 1654. In an unprivileged CT that is host UID 101654.
APP_UID=1654
HOST_APP_UID=$((100000 + APP_UID))
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-300}"
# Where Proxmox keeps container configs; the test points it at a folder of its own.
LXC_DIR="${PVE_LXC_DIR:-/etc/pve/lxc}"
DRY_RUN="${DRY_RUN:-0}"

usage() {
  cat <<'EOF'
Usage:
  install.sh                           install the Slash tools in a new LXC
  install.sh --upgrade CTID [VERSION]  upgrade that LXC to VERSION (default latest)
  install.sh --uninstall CTID [--purge]
                                       remove that LXC; --purge also deletes its data volume

Install settings (environment; asked for in a terminal when missing):
  CTID                  container id (default: the next free id)
  IP                    address as CIDR (192.168.0.40/24) or dhcp (default dhcp)
  GATEWAY               gateway, required with a CIDR address
  BRIDGE                network bridge (default vmbr0)
  STORAGE               storage for the container's root disk (default local-lvm)
  DATA_STORAGE, DATA_GB storage and size in GB of the data volume (default STORAGE, 8)
  DATA_PATH             a host directory (a ZFS dataset's mountpoint) to use for data instead
  DATA_VOLUME           a volume kept by --uninstall, to use again under the same CTID
  GITHUB_CLIENT_ID      the GitHub OAuth app for PixelSlash's sign-in
  GITHUB_CLIENT_SECRET
  VERSION               image version (default latest)
  CT_HOSTNAME           container host name (default slashslash)
  DRY_RUN=1             print what would change and change nothing
EOF
}

die() { printf 'install.sh: %s\n' "$*" >&2; exit 1; }
step() { printf '\n== %s\n' "$*"; }
# A command that changes something: printed in a dry run, run otherwise.
run() {
  [ "$DRY_RUN" = 1 ] || { "$@"; return; }
  local arg line='+'
  for arg in "$@"; do
    if [[ "$arg" =~ ^[A-Za-z0-9_./:=,@%+-]+$ ]]; then line+=" $arg"; else line+=" '${arg//\'/\'\\\'\'}'"; fi
  done
  printf '%s\n' "$line"
}
# A script run inside the container, as root.
in_ct() { run pct exec "$CTID" -- env LC_ALL=C.UTF-8 bash -ec "$1" </dev/null; }
# The same, but read-only: it runs in a dry run too.
ask_ct() { pct exec "$CTID" -- env LC_ALL=C.UTF-8 bash -ec "$1" </dev/null; }

ct_exists() { pct status "$1" >/dev/null 2>&1; }
vm_exists() { qm status "$1" >/dev/null 2>&1; }
# Only a container this script made carries the tag, so --upgrade and --uninstall act on no other.
require_ours() {
  ct_exists "$1" || die "no container $1"
  # Read whole before matching: with pipefail, grep -q quitting early can fail the pipe on SIGPIPE.
  local conf
  conf="$(pct config "$1")"
  grep -Eq "^tags:.*(^|[ ;,])$TAG([ ;,]|$)" <<<"$conf" ||
    die "REFUSING: container $1 was not made by this script (no '$TAG' tag)"
}

valid_ctid() { [[ "$1" =~ ^[1-9][0-9]{2,8}$ ]] || die "CTID must be a number of 100 or more, got '$1'"; }
valid_version() { [[ "$1" =~ ^[A-Za-z0-9][A-Za-z0-9_.-]*$ ]] || die "VERSION must be an image tag (latest, 0.1.1), got '$1'"; }

# whiptail asks for a value only when there is a terminal and the variable is empty.
can_ask() { [ -t 0 ] && [ -t 1 ] && command -v whiptail >/dev/null; }
ask() { # name, prompt, default, [password]
  local name="$1" prompt="$2" default="$3" kind="--inputbox" value
  [ -n "${!name:-}" ] && return 0
  if can_ask; then
    [ "${4:-}" = password ] && kind="--passwordbox"
    value="$(whiptail --title "Slash tools" "$kind" "$prompt" 10 70 "$default" 3>&1 1>&2 2>&3)" ||
      die "cancelled"
    printf -v "$name" '%s' "$value"
  else
    printf -v "$name" '%s' "$default"
  fi
}

docker_run() { # version
  in_ct "docker run -d --name slashslash --restart unless-stopped -p 3000:3000 -p 8080:8080 \
--env-file /etc/slashslash/.env -v $MOUNT:/data $IMAGE:$1 >/dev/null"
}

wait_healthy() {
  [ "$DRY_RUN" = 1 ] && { echo "(dry run: would wait up to ${HEALTH_TIMEOUT}s for healthy)"; return 0; }
  local status='' waited=0
  while [ "$waited" -lt "$HEALTH_TIMEOUT" ]; do
    status="$(ask_ct "docker inspect -f '{{.State.Health.Status}}' slashslash 2>/dev/null" || true)"
    [ "$status" = healthy ] && { echo "healthy"; return 0; }
    sleep 5; waited=$((waited + 5))
  done
  ask_ct 'docker logs --tail 40 slashslash' >&2 || true
  die "slashslash was not healthy after ${HEALTH_TIMEOUT}s (last: ${status:-no status}); the logs are above"
}

image_version() {
  # A dry run starts nothing, so the new version is the one asked for.
  [ "$DRY_RUN" = 1 ] && [ "${1:-}" = new ] && { echo "$VERSION"; return 0; }
  ask_ct 'docker exec slashslash slashslash version 2>/dev/null' || echo unknown
}

description() { # version
  printf 'Slash tools: PixelSlash on :3000, ToggleSlash on :8080, image %s:%s, data at %s. Made by slashslash self-host/proxmox/install.sh.' \
    "$IMAGE" "$1" "$MOUNT"
}

print_urls() {
  local ip="${IP%/*}"
  if [ "$IP" = dhcp ]; then
    ip="$(ask_ct "hostname -I | cut -d' ' -f1" 2>/dev/null || true)"
    ip="${ip:-<container address>}"
  fi
  cat <<EOF

PixelSlash:  http://$ip:3000
ToggleSlash: http://$ip:8080
The ToggleSlash admin token:
  pct exec $CTID -- docker exec slashslash slashslash secret toggleslash-admin-token
EOF
}

do_install() {
  command -v pct >/dev/null || die "pct not found: run this in the Proxmox host's shell"

  ask CTID "Container id" "$(pvesh get /cluster/nextid 2>/dev/null || echo)"
  ask IP "Address as CIDR (192.168.0.40/24) or dhcp" dhcp
  [ "$IP" = dhcp ] || ask GATEWAY "Gateway" ""
  ask GITHUB_CLIENT_ID "GitHub OAuth app client id" ""
  ask GITHUB_CLIENT_SECRET "GitHub OAuth app client secret" "" password
  BRIDGE="${BRIDGE:-vmbr0}"
  STORAGE="${STORAGE:-local-lvm}"
  DATA_STORAGE="${DATA_STORAGE:-$STORAGE}"
  DATA_GB="${DATA_GB:-8}"
  VERSION="${VERSION:-latest}"
  CT_HOSTNAME="${CT_HOSTNAME:-slashslash}"

  [ -n "$CTID" ] || die "CTID is not set and the next free id could not be read"
  valid_ctid "$CTID"
  valid_version "$VERSION"
  [ -n "$GITHUB_CLIENT_ID" ] || die "GITHUB_CLIENT_ID is required"
  [ -n "$GITHUB_CLIENT_SECRET" ] || die "GITHUB_CLIENT_SECRET is required"
  case "$GITHUB_CLIENT_ID$GITHUB_CLIENT_SECRET" in *$'\n'* | *$'\r'*) die "the GitHub values must be one line each" ;; esac
  if [ "$IP" != dhcp ]; then
    [[ "$IP" =~ ^[0-9]{1,3}(\.[0-9]{1,3}){3}/[0-9]{1,2}$ ]] || die "IP must be dhcp or a CIDR like 192.168.0.40/24, got '$IP'"
    [ -n "${GATEWAY:-}" ] || die "GATEWAY is required with a static IP"
  fi
  [[ "$DATA_GB" =~ ^[1-9][0-9]*$ ]] || die "DATA_GB must be a whole number of GB, got '$DATA_GB'"
  [ -z "${DATA_PATH:-}" ] || [ -z "${DATA_VOLUME:-}" ] || die "set DATA_PATH or DATA_VOLUME, not both"

  step "preflight"
  ct_exists "$CTID" && die "REFUSING: container $CTID already exists; pick another CTID"
  vm_exists "$CTID" && die "REFUSING: VM $CTID already exists; pick another CTID"
  if [ "$IP" != dhcp ] && ping -c1 -W1 "${IP%/*}" >/dev/null 2>&1; then
    die "REFUSING: ${IP%/*} already answers a ping; pick a free address"
  fi
  local mp0 own_inside=1
  if [ -n "${DATA_PATH:-}" ]; then
    DATA_PATH="${DATA_PATH%/}"
    [ -d "$DATA_PATH" ] || die "DATA_PATH $DATA_PATH is not a directory on this host"
    # It is chowned to the image's user, so it must be ours: empty, or slashslash data already.
    if [ -n "$(ls -A "$DATA_PATH")" ] && [ "$(stat -c %u "$DATA_PATH")" != "$HOST_APP_UID" ]; then
      die "REFUSING: DATA_PATH $DATA_PATH is not empty and not owned by UID $HOST_APP_UID; give it a folder of its own"
    fi
    local other
    other="$(grep -lsF -- " $DATA_PATH," "$LXC_DIR"/*.conf | head -n1 || true)"
    [ -z "$other" ] || die "REFUSING: DATA_PATH $DATA_PATH is already mounted by ${other##*/}"
    mp0="$DATA_PATH,mp=$MOUNT"
    own_inside=0
  elif [ -n "${DATA_VOLUME:-}" ]; then
    mp0="$DATA_VOLUME,mp=$MOUNT"
  else
    mp0="$DATA_STORAGE:$DATA_GB,mp=$MOUNT"
  fi

  step "template"
  local template
  template="$(pveam list local 2>/dev/null | awk '{print $1}' | grep -E '/debian-13-standard_.*\.tar\.zst$' | sort -V | tail -n1 || true)"
  if [ -z "$template" ]; then
    run pveam update >/dev/null
    local name
    name="$(pveam available --section system | awk '{print $2}' | grep -E '^debian-13-standard_.*\.tar\.zst$' | sort -V | tail -n1 || true)"
    [ -n "$name" ] || die "no debian-13-standard template on offer from pveam"
    run pveam download local "$name"
    template="local:vztmpl/$name"
  fi
  echo "$template"

  step "container $CTID"
  if [ "$own_inside" = 0 ]; then run chown "$HOST_APP_UID:$HOST_APP_UID" "$DATA_PATH"; fi
  local net="name=eth0,bridge=$BRIDGE,ip=$IP"
  [ "$IP" = dhcp ] || net="$net,gw=$GATEWAY"
  # nesting and keyctl: Docker in an unprivileged LXC needs both.
  run pct create "$CTID" "$template" \
    --hostname "$CT_HOSTNAME" \
    --cores 2 --memory 2048 --swap 512 \
    --rootfs "$STORAGE:8" \
    --mp0 "$mp0" \
    --net0 "$net" \
    --unprivileged 1 \
    --features nesting=1,keyctl=1 \
    --onboot 1 \
    --timezone host \
    --tags "$TAG" \
    --description "$(description "$VERSION")"
  run pct start "$CTID"
  if [ "$DRY_RUN" != 1 ]; then
    local tries=0
    until ask_ct 'getent hosts deb.debian.org >/dev/null'; do
      tries=$((tries + 1)); [ "$tries" -lt 30 ] || die "container $CTID has no network after 60s"; sleep 2
    done
  fi
  if [ "$own_inside" = 1 ]; then in_ct "chown $APP_UID:$APP_UID $MOUNT"; fi

  step "Docker"
  in_ct 'export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq docker.io >/dev/null
systemctl enable --now docker >/dev/null 2>&1'

  step "settings (/etc/slashslash/.env, mode 0600)"
  # The secret goes in on stdin, never as an argument, so no process list or log shows it.
  if [ "$DRY_RUN" = 1 ]; then
    echo "+ pct exec $CTID -- sh -c 'umask 077; mkdir -p /etc/slashslash; cat > /etc/slashslash/.env' < (GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET)"
  else
    printf 'GITHUB_CLIENT_ID=%s\nGITHUB_CLIENT_SECRET=%s\n' "$GITHUB_CLIENT_ID" "$GITHUB_CLIENT_SECRET" |
      pct exec "$CTID" -- sh -c 'umask 077; mkdir -p /etc/slashslash; cat > /etc/slashslash/.env'
  fi

  step "slashslash $VERSION"
  in_ct "docker pull -q $IMAGE:$VERSION"
  docker_run "$VERSION"
  wait_healthy
  local now
  now="$(image_version new)"
  [ "$VERSION" = "$now" ] || run pct set "$CTID" --description "$(description "$now")"
  echo "slashslash version $now"
  print_urls
}

do_upgrade() { # ctid version
  CTID="$1"; VERSION="${2:-latest}"
  valid_ctid "$CTID"; valid_version "$VERSION"
  require_ours "$CTID"
  if [[ "$(pct status "$CTID")" != *running* ]]; then
    run pct start "$CTID"
    wait_healthy
  fi
  IP="$(pct config "$CTID" | sed -n 's/^net0:.*ip=\([^,]*\).*/\1/p')"

  local old new
  old="$(image_version)"
  step "upgrade $CTID from $old to $VERSION"
  in_ct "docker pull -q $IMAGE:$VERSION"
  in_ct 'docker rm -f slashslash >/dev/null'
  docker_run "$VERSION"
  wait_healthy
  new="$(image_version new)"
  run pct set "$CTID" --description "$(description "$new")"
  echo "slashslash version: $old -> $new"
  if [ "$old" = "$new" ]; then
    echo "same version, so no upgrade backup was written"
  else
    echo "upgrade backup: $(ask_ct "ls -1t $MOUNT/backups/upgrade-*.tgz 2>/dev/null | head -n1" || true)"
  fi
  print_urls
}

do_uninstall() { # ctid purge
  CTID="$1"
  valid_ctid "$CTID"
  require_ours "$CTID"
  local conf="$LXC_DIR/$CTID.conf" mp0 vol
  mp0="$(pct config "$CTID" | sed -n 's/^mp0: //p')"
  vol="${mp0%%,*}"
  # --purge 1 on pct destroy drops the container from backup, replication and HA jobs, so the next
  # guest given this id inherits none. Volumes go because the config names them, not because of it.
  if [ "$2" = 1 ]; then
    step "remove container $CTID and its data volume"
    run pct stop "$CTID" || true
    run pct destroy "$CTID" --purge 1
    case "$vol" in /*) echo "The data at $vol is a host directory and was not deleted. Remove it yourself if you mean to." ;; esac
    return 0
  fi

  step "remove container $CTID, keep its data"
  run pct stop "$CTID" || true
  # The config is edited only on a stopped container, so a failed stop leaves everything as it was.
  if [ "$DRY_RUN" != 1 ] && [[ "$(pct status "$CTID")" != *stopped* ]]; then
    die "REFUSING: container $CTID did not stop; nothing was changed"
  fi
  case "$vol" in
    "" | /*) ;; # No data mount, or a host directory, which destroying the container never touches.
    *)
      # A volume: pct destroy deletes every volume the config names, so it leaves the config first.
      # A snapshot section would still name it.
      if grep '^\[' "$conf" 2>/dev/null | grep -vx '\[pve:pending\]' >/dev/null; then
        die "REFUSING: container $CTID has snapshots, which still hold $vol; delete them first or use --purge"
      fi
      if [ "$DRY_RUN" = 1 ]; then
        echo "+ remove the mp0 line from $conf"
      else
        local rest
        rest="$(grep -v '^mp0: ' "$conf")"
        printf '%s\n' "$rest" >"$conf"
        [[ "$(pct config "$CTID")" != *"$vol"* ]] ||
          die "REFUSING: $vol is still in container $CTID's config; nothing was destroyed"
      fi
      ;;
  esac
  run pct destroy "$CTID" --purge 1 --destroy-unreferenced-disks 0
  case "$vol" in
    "") ;;
    /*) echo "Data kept at $vol." ;;
    *)
      echo "Data kept on volume $vol, still filed under id $CTID. To use it again: CTID=$CTID DATA_VOLUME=$vol with a new install."
      echo "Until then, a guest given id $CTID and destroyed with 'destroy unreferenced disks' would delete it."
      ;;
  esac
}

main() {
  case "${1:-}" in
    "") do_install ;;
    -h | --help) usage ;;
    --upgrade)
      [ $# -ge 2 ] && [ $# -le 3 ] || { usage >&2; exit 2; }
      do_upgrade "$2" "${3:-latest}" ;;
    --uninstall)
      local purge=0
      [ $# -ge 2 ] && [ $# -le 3 ] || { usage >&2; exit 2; }
      if [ $# = 3 ]; then [ "$3" = --purge ] || { usage >&2; exit 2; }; purge=1; fi
      do_uninstall "$2" "$purge" ;;
    *) usage >&2; exit 2 ;;
  esac
}

main "$@"
