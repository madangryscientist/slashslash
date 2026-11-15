# Another platform

Anything that runs an OCI image works if it can give the container what it needs. Ask the person
how their platform does each item below, map it, and say which ones it cannot do before installing.

| The image needs | Why |
| --- | --- |
| linux/amd64 | The image is built for amd64 only |
| One instance at a time | Both tools keep SQLite on the volume; two instances on it corrupt it |
| A persistent volume at `/data`, writable by UID 1654 | Everything lives there; an unwritable `/data` stops the container with one line naming the path |
| `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` as environment, from the platform's secret store | PixelSlash's sign-in |
| Ports 3000 (PixelSlash) and 8080 (ToggleSlash) reachable, or 8000 with `SLASHSLASH_DOMAIN` | README "Settings" |
| A writable `/run` and `/tmp` | The supervisor and the tools write there |
| A health check: HTTP GET `:8080/health` and `:3000/`, with about two minutes to start | The image's Docker health check does not carry over to most platforms |

It needs no root, no capability and no privilege escalation, so a locked-down runtime is fine.

Then write the platform's equivalent of the `docker run` in [docker.md](docker.md), keeping each
row above, and run it. Done when the platform reports the instance healthy, then SKILL.md step 5.
For the checks, find the platform's way to run `slashslash <command>` inside the container and to
restart it.
