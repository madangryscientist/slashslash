---
name: self-host
description: Walk someone through running their own Slash tools instance (PixelSlash and ToggleSlash, the self-host image), on whatever they run: Proxmox, a Docker host, Docker Compose, Kubernetes or another platform. Use when someone wants to self-host the Slash tools, upgrade or remove an instance, or put one behind HTTPS.
---

# Self-host the Slash tools

One image, `ghcr.io/slashsuite/slashslash`, runs both tools: PixelSlash on port 3000,
ToggleSlash on 8080, everything on one volume at `/data`, as UID 1654, never root.
`self-host/README.md` is the source for its settings, data layout, backups and versions; read the
parts a step names instead of guessing.

The person owns the machine and the GitHub account. You run the commands they let you run; they make
the GitHub OAuth app, sign in, and run any command that takes the client secret themselves. Secrets reach the instance through stdin, a 0600 env file or the
platform's secret store, never a command line, a chat message or the repo.

## 1. Ask what they run

Ask the person, one question at a time:

1. **Where it will run.** Proxmox, a Linux host with Docker, Docker Compose, Kubernetes, or something
   else (name it).
2. **How they will reach it.** On their LAN only, or over HTTPS from anywhere (and whether they
   already have a proxy, tunnel or ingress for that).
3. **Where the data lives.** The platform's default (a Docker volume, a Proxmox volume, the cluster's
   default storage class), or somewhere they choose (a ZFS dataset, a host folder, a named class).
4. **Which version.** `latest`, or a pinned `X.Y.Z` (the README's "Versions" table).

Done when all four have an answer. Then open the platform's file and follow it alongside the steps
below:

| They run | Read |
| --- | --- |
| Proxmox | [proxmox.md](proxmox.md) |
| Docker or Docker Compose | [docker.md](docker.md) |
| Kubernetes | [kubernetes.md](kubernetes.md) |
| Anything else | [other.md](other.md) |

## 2. Settle the address

Write down the PixelSlash base URL people will use: `http://<host>:3000` on a LAN, or
`https://<name>` behind a proxy. ToggleSlash is the same host on 8080, or a second name. The GitHub
callback is derived from it, so settle it before step 3. Done when the base URL is written down.

## 3. The GitHub OAuth app (the person makes it)

Ask the person to create one at <https://github.com/settings/applications/new>:

- Homepage: the base URL. Callback: `<base URL>/auth/github/callback`.
- **Behind an HTTPS proxy, also add the `http://` form of the callback** as a second redirect URI.
  PixelSlash builds the callback from the plain-HTTP request it receives, and GitHub refuses one the
  app does not list ("The redirect_uri is not associated with this application").
- Generate a client secret, and keep it until the platform file asks for it.

Done when the app lists its callback(s) and the person holds the client id and secret.

## 4. Install

Follow the platform file. Done when its own done line holds: the instance reports healthy.

## 5. Prove it works

Run each check from a machine that can reach the instance:

- PixelSlash answers: `curl -s -o /dev/null -w '%{http_code}\n' <base URL>/` is 200 (or a redirect
  to the proxy's login).
- ToggleSlash answers: `/health` on port 8080 is 200.
- The ToggleSlash admin token creates a project. Read the token with `slashslash secret
  toggleslash-admin-token` inside the container (the platform file says how to get there), keep it in
  a shell variable, never print it, then:
  ```sh
  curl -s -w ' %{http_code}\n' -X POST -H "Authorization: Bearer $TOKEN" \
    -H 'content-type: application/json' -d '{"key":"first","name":"First"}' <toggleslash URL>/api/v1/projects
  ```
  answers 201.
- The person opens PixelSlash, signs in with GitHub and creates an org.
- Restart the instance the platform's way; both answer again and the org and project are still there.

Done when every check passed, the sign-in by the person's own word.

## Upgrade, back up, remove

- **Upgrade:** run the new tag on the same volume and settings (the platform file has the command).
  The first start of a new version writes `/data/backups/upgrade-*.tgz` before either tool touches
  the data, so a rollback is the old tag plus `slashslash restore` of that file (README, "Backup,
  restore and rollback"). Rerun step 5 after.
- **Back up:** `slashslash backup` inside the container, then copy the file off the machine.
- **Remove:** the platform file says how, and which part keeps the data.

## HTTPS

The image serves plain HTTP; HTTPS comes from what sits in front: a reverse proxy (Caddy, nginx,
Traefik), a Kubernetes ingress, or a tunnel. With a Cloudflare tunnel:

1. Add a public hostname for PixelSlash pointing at `http://<host>:3000`, and one for ToggleSlash at
   `http://<host>:8080`.
2. Optionally put Cloudflare Access in front of both. Calls with the admin token or SDK keys then
   need an Access service token, or use the LAN address.
3. `curl -sI https://<name>/` answers 200 or a redirect to the login; then step 5.

With one domain and one port instead, the image can serve `pixelslash.<domain>` and
`toggleslash.<domain>` itself on port 8000 (`SLASHSLASH_DOMAIN`, README "Settings"); the proxy then
forwards both names to that port.
