# Proxmox

`self-host/proxmox/install.sh`, run as root in the Proxmox host's shell (or over `ssh root@<host>`),
makes one unprivileged Debian 13 LXC with Docker, runs the image there on its own data mount, waits
for healthy and prints both URLs. Its settings are in `self-host/README.md`, "On Proxmox, in one
line". It refuses a container id that is taken and acts on no other container or VM. This is the
proven path.

## Read the host first

Read only; change nothing yet.

- `pct list` and `qm list`: pick a `CTID` neither uses.
- A free LAN address (`ping -c1 -W1 <ip>` gets no answer and no `pct config` names it) with its
  prefix, and the gateway (`ip route | awk '/default/ {print $3}'`). Or `IP=dhcp`.
- `pvesm status`: the root disk goes on LVM-thin or a directory storage (`local-lvm`); a ZFS root is
  untested. For the data, a new volume (`DATA_STORAGE`, `DATA_GB`) or a ZFS dataset made for it:
  `zfs create -o quota=8G <pool>/slashslash`, then `DATA_PATH=/<pool>/slashslash`.
- Save every `pct config` and `qm config`, and `/etc/pve/storage.cfg`, to diff after the install.

## Install

Dry run first: it prints every command that would change something and changes nothing.

```sh
url=https://raw.githubusercontent.com/slashsuite/slashslash/main/self-host/proxmox/install.sh
DRY_RUN=1 CTID=<id> IP=<ip/prefix> GATEWAY=<gw> DATA_PATH=<dir> GITHUB_CLIENT_ID=x GITHUB_CLIENT_SECRET=x \
  bash -c "$(curl -fsSL $url)"
```

Check the `pct create` line names only the new id, the right storage and the right data mount.

The real run takes the GitHub secret, which only the person holds, so **the person runs it, in their
own terminal**. On the host, the script asks for anything missing itself: the line in
`self-host/README.md`, "On Proxmox, in one line". From another machine over ssh, they read the values without echoing them and send them on
stdin, so no process list shows them:

```sh
url=https://raw.githubusercontent.com/slashsuite/slashslash/main/self-host/proxmox/install.sh
read -r CLIENT_ID; read -rs CLIENT_SECRET
printf '%s\n%s\n' "$CLIENT_ID" "$CLIENT_SECRET" | ssh root@<host> '
  read -r GITHUB_CLIENT_ID; read -r GITHUB_CLIENT_SECRET; export GITHUB_CLIENT_ID GITHUB_CLIENT_SECRET
  export CTID=<id> IP=<ip/prefix> GATEWAY=<gw> DATA_PATH=<dir> VERSION=<version>
  bash -c "$(curl -fsSL '"$url"')" </dev/null'
```

Done when they report it ended with `healthy`, a `slashslash version` line and both URLs. Then diff the saved
configs: the new container's section is the only change, and `storage.cfg` is identical.

## For the checks

- Inside the container: `pct exec <id> -- docker exec slashslash slashslash <command>`.
- Restart: `pct reboot <id>`.

## Upgrade and remove

```sh
url=https://raw.githubusercontent.com/slashsuite/slashslash/main/self-host/proxmox/install.sh
bash -c "$(curl -fsSL $url)" _ --upgrade <id> [VERSION]     # default latest; prints old and new version and the upgrade backup
bash -c "$(curl -fsSL $url)" _ --uninstall <id> [--purge]
```

Uninstall keeps the data; `--purge` deletes a data volume, and a host folder (`DATA_PATH`) is never
deleted. Both act only on a container tagged `slashslash`.
