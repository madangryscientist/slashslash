# The Slash tools on your own server

One image runs PixelSlash and ToggleSlash together: one container, one volume, two GitHub values.

```sh
docker run -d --name slashslash --restart unless-stopped \
  -p 3000:3000 -p 8080:8080 \
  -e GITHUB_CLIENT_ID=<id> -e GITHUB_CLIENT_SECRET=<secret> \
  -v slashslash-data:/data \
  slashslash:dev
```

- PixelSlash is on `http://<your server>:3000`, ToggleSlash on `http://<your server>:8080`.
- The GitHub values are a GitHub OAuth app's, for PixelSlash's sign-in. Its callback is
  `http://<your server>:3000/auth/github/callback`.
- The ToggleSlash admin token is made on the first start and kept on the volume. Read it with
  `docker exec slashslash slashslash secret toggleslash-admin-token`. It never goes to the logs.
- `docker exec slashslash slashslash status` shows each service and whether each tool answers.

The image is not published yet; build it with `bun self-host/build.ts` (below). amd64 only.

## Settings

Everything is the container's environment.

| Name | Default | What it does |
| --- | --- | --- |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | none, required | PixelSlash's GitHub sign-in |
| `TOGGLESLASH_ADMIN_TOKEN` | generated once | Set it to use your own token instead of the generated one |
| `PIXELSLASH_PORT` | `3000` | The port PixelSlash answers on inside the container |
| `TOGGLESLASH_PORT` | `8080` | The port ToggleSlash answers on inside the container |
| `SLASHSLASH_DOMAIN` | unset | With a domain, `pixelslash.<domain>` and `toggleslash.<domain>` also answer on one port |
| `SLASHSLASH_PORT` | `8000` | That one port, used only with `SLASHSLASH_DOMAIN` |

Any other setting either product reads (see each product's own docs) passes straight through.

Each tool has its own port, or its own host name with a domain, never a path. The host names are
plain HTTP on `SLASHSLASH_PORT`; map it to the host's port 80 (`-p 80:8000`) or put your own proxy
in front. The container cannot bind port 80 itself, since it holds no privilege at all (below).

## Data

Everything lives on the one volume at `/data`:

| Path | What |
| --- | --- |
| `/data/pixelslash` | PixelSlash's database, shots and its own generated secrets |
| `/data/toggleslash/toggleslash.db` | ToggleSlash's SQLite database |
| `/data/secrets` | Secrets for you to read: today `toggleslash-admin-token` (mode 0700) |
| `/data/caddy` | The front door's own state |

Back up the volume and you have backed up everything.

## It runs as one user, never root

Every process in the container runs as `app` (UID and GID 1654): the supervisor, both tools and the
front door. Nothing starts as root, nothing changes an owner at start, no file has a setuid bit and
no binary carries a capability, so it runs under `--security-opt no-new-privileges --cap-drop ALL`
and Kubernetes' restricted policy.

A Docker named volume (as above) starts owned by 1654, so it just works. A folder from the host
(`-v /srv/slashslash:/data`) must be writable by UID 1654 first:

```sh
sudo chown -R 1654:1654 /srv/slashslash
```

If it is not, the container stops at once with one line naming the path and the UID. On Kubernetes,
set `fsGroup: 1654`, and mount an `emptyDir` at `/run` if the root filesystem is read-only.

## How it is built

- The two tools are not rebuilt here. Each is its own repo's self-host image, built from the commit
  in `pins/pixelslash.sha` and `pins/toggleslash.sha`. Those pins move only by hand. The PixelSlash
  pin here is separate from the site's `apps/site/pixelslash.sha`, which a bot moves hourly.
- `Dockerfile` copies PixelSlash (`/opt/pixelslash` and Bun) and Caddy onto the ToggleSlash runtime
  image (aspnet 10 on Ubuntu 24.04), adds s6-overlay as the supervisor, and labels the image with
  each pin (`build.slashslash.<product>.revision`). The licences (the tools', Caddy's and s6-overlay's) are in
  `/usr/share/licenses/slashslash`.
- `rootfs/` holds the supervisor's services: `init-data` (makes the folders and the token, every
  start), `pixelslash`, `toggleslash` and `caddy`, each with a logger that puts the service's name
  in front of every line it writes (`[pixelslash] ...`). It also holds the `slashslash` command and
  the health check, which asks both tools through the front door.
- When a tool dies hard, its `finish` script kills what is left of that tool's process group, so a
  child it left behind (PixelSlash's workerd and diff worker hold their ports) cannot block the
  restart. The other tool is not touched.

```sh
bun self-host/build.ts            # builds slashslash:dev, and any product image a pin needs
bunx moon run self-host:smoke     # builds and checks it end to end
```

The smoke test runs the image under the restricted limits and checks that both tools answer, that
nothing runs as root, that the token creates a project that survives a restart, that each tool
comes back from `kill -9` without the other noticing, that every log line is labelled and none
holds the token, that nothing is written outside `/run`, `/tmp`, `/home/app` and `/data`, and that
an unwritable `/data` stops the container with its one line. CI runs it on every change here
(`.github/workflows/self-host.yml`).
