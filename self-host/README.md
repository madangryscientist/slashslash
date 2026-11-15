# The Slash tools on your own server

One image runs PixelSlash and ToggleSlash together: one container, one volume, two GitHub values.

```sh
docker run -d --name slashslash --restart unless-stopped \
  -p 3000:3000 -p 8080:8080 \
  -e GITHUB_CLIENT_ID=<id> -e GITHUB_CLIENT_SECRET=<secret> \
  -v slashslash-data:/data \
  ghcr.io/madangryscientist/slashslash:latest
```

- PixelSlash is on `http://<your server>:3000`, ToggleSlash on `http://<your server>:8080`.
- The GitHub values are a GitHub OAuth app's, for PixelSlash's sign-in. Its callback is
  `http://<your server>:3000/auth/github/callback`.
- The ToggleSlash admin token is made on the first start and kept on the volume. Read it with
  `docker exec slashslash slashslash secret toggleslash-admin-token`. It never goes to the logs.
- `docker exec slashslash slashslash status` shows each service and whether each tool answers.
- `docker exec slashslash slashslash version` prints the image's version.

amd64 only. To build the image yourself instead, see "How it is built" below.

## Versions

The image is published at `ghcr.io/madangryscientist/slashslash`:

| Tag | What it is |
| --- | --- |
| `latest` | The newest release |
| `0.1.0` (any `X.Y.Z`) | That release. Pin this to choose when you upgrade |
| `edge` | The newest build of main, tested but not released |
| `0.1.0-edge.<sha7>` | One build of main |

To pin a release, put its tag in place of `latest` in the `docker run` above. An upgrade is
`docker pull` of the new tag, then `docker rm -f slashslash` and the same `docker run`: everything
lives on the volume. The version is also on the image as the `org.opencontainers.image.version`
label, next to each tool's commit (`build.slashslash.pixelslash.revision`,
`build.slashslash.toggleslash.revision`).

## Licences

Each part keeps its own licence, and every one is in the image under
`/usr/share/licenses/slashslash`:

- slashslash's own files (the `Dockerfile`, `rootfs/`, the `slashslash` command): MIT.
- PixelSlash and ToggleSlash: Elastic License 2.0 (`pixelslash/`, `toggleslash/`). It allows
  running and sharing the image; it does not allow offering either tool to others as a hosted or
  managed service.
- Caddy: Apache 2.0. s6-overlay: ISC. The .NET runtime: MIT (`dotnet/`).
- Bun: MIT, with JavaScriptCore and WebKit under LGPL 2.1 (`bun/LICENSE.md` says where their source
  is and how to relink).

The names PixelSlash and ToggleSlash are not licensed with the code. An image built from a fork
must not carry them as its name.

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
Ports 3100 and 8180 are taken inside the container (the tools listen there, behind Caddy), so none
of the three port settings may use them.

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
  each pin (`build.slashslash.<product>.revision`) and its version. The licences are in
  `/usr/share/licenses/slashslash` (see Licences above).
- `VERSION` holds the release version. The image says it is that version only when built from a
  release tag; any other build says `<VERSION>-dev`, or `<VERSION>-edge.<sha7>` on main.
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
an unwritable `/data` stops the container with its one line, and that the image reports the
version it was built with and holds every licence. CI runs it on every change here
(`.github/workflows/self-host.yml`), and only the image that passed it is pushed to ghcr.

## Releasing

1. Set `VERSION` to the new `X.Y.Z` and land that on main.
2. Tag that commit `self-host-vX.Y.Z` and push the tag. CI checks the tag matches `VERSION`, builds,
   runs the smoke and pushes `:X.Y.Z` and `:latest`.

The first push from CI creates the package private. Its owner makes it public once, under
the package's settings on github.com (Change visibility); GitHub's API cannot change it.
