# Docker or Docker Compose

Any Linux amd64 host with Docker. The image is amd64 only.

## Settings file

Write the GitHub values to a file only the owner reads, never on a command line:

```sh
sudo install -d -m 0700 /etc/slashslash
sudo sh -c 'umask 077; cat > /etc/slashslash/.env'   # then type or paste the two lines, then Ctrl-D
# GITHUB_CLIENT_ID=<id>
# GITHUB_CLIENT_SECRET=<secret>
```

Other settings (ports, `SLASHSLASH_DOMAIN`) go in the same file; README "Settings" lists them.

## Data

A named volume (`slashslash-data`) starts owned by UID 1654 and just works. A host folder must be
writable by UID 1654 first: `sudo chown -R 1654:1654 <dir>`. If it is not, the container stops at
once with one line naming the path.

## Install with `docker run`

```sh
docker run -d --name slashslash --restart unless-stopped \
  -p 3000:3000 -p 8080:8080 \
  --env-file /etc/slashslash/.env \
  -v slashslash-data:/data \
  ghcr.io/slashsuite/slashslash:<version>
```

## Install with Compose

```yaml
services:
  slashslash:
    image: ghcr.io/slashsuite/slashslash:<version>
    restart: unless-stopped
    ports: ["3000:3000", "8080:8080"]
    env_file: /etc/slashslash/.env
    volumes: ["slashslash-data:/data"]
volumes:
  slashslash-data:
```

`docker compose up -d`.

Done when `docker inspect -f '{{.State.Health.Status}}' slashslash` (Compose: the container name
`docker compose ps` shows) reads `healthy`. The first start can take a minute or two.

## For the checks

- Inside the container: `docker exec slashslash slashslash <command>`.
- Restart: `docker restart slashslash` (Compose: `docker compose restart`), and once a host reboot.

## Upgrade and remove

- Upgrade: `docker pull` the new tag, `docker rm -f slashslash` and the same `docker run` with the
  new tag. Compose: change the tag, `docker compose up -d`.
- Remove: `docker rm -f slashslash` keeps the volume; `docker volume rm slashslash-data` deletes the
  data. Take a `slashslash backup` and copy it out first.
