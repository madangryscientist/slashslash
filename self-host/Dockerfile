# syntax=docker/dockerfile:1.7
#
# Every Slash server in one image: PixelSlash and ToggleSlash behind Caddy, supervised by
# s6-overlay, all as the one non-root user `app` (UID and GID 1654), with every byte of state on one
# volume at /data. See README.md.
#
# The products are not rebuilt here. Each is its own repo's self-host image, built from a pinned
# commit (pins/*.sha) and handed in as a named build context; `bun self-host/build.ts` does all of
# it. The build context is the repo root (for LICENSE and NOTICE); Dockerfile.dockerignore keeps it
# to those and self-host/.
#
#   pixelslash       PixelSlash's docker/self-host/Dockerfile image
#   toggleslash      ToggleSlash's apps/server/Dockerfile image
#   pixelslash-src   PixelSlash's repo at the pin (its LICENSE and NOTICE)
#   toggleslash-src  ToggleSlash's repo at the pin (its LICENSE and NOTICE)

ARG PIXELSLASH_REVISION
ARG TOGGLESLASH_REVISION

FROM pixelslash AS pixelslash
FROM toggleslash AS toggleslash
FROM pixelslash-src AS pixelslash-src
FROM toggleslash-src AS toggleslash-src

# Caddy's binary without its file capability (cap_net_bind_service): it binds no low port here, and
# nothing in the image may gain privilege. s6-overlay unpacked from its release tarballs, checked.
FROM caddy:2.11.9@sha256:4e2425f6009577e7c651010f16679c28f7d12df3e7b1914f941a7a3370746b3c AS tools
ARG S6=3.2.1.0
ADD --checksum=sha256:42e038a9a00fc0fef70bf0bc42f625a9c14f8ecdfe77d4ad93281edf717e10c5 \
    https://github.com/just-containers/s6-overlay/releases/download/v${S6}/s6-overlay-noarch.tar.xz /tmp/
ADD --checksum=sha256:8bcbc2cada58426f976b159dcc4e06cbb1454d5f39252b3bb0c778ccf71c9435 \
    https://github.com/just-containers/s6-overlay/releases/download/v${S6}/s6-overlay-x86_64.tar.xz /tmp/
RUN apk add --no-cache libcap xz \
 && setcap -r /usr/bin/caddy \
 && test -z "$(getcap /usr/bin/caddy)" \
 && mkdir /s6 \
 && tar -C /s6 -Jxpf /tmp/s6-overlay-noarch.tar.xz \
 && tar -C /s6 -Jxpf /tmp/s6-overlay-x86_64.tar.xz

# The ToggleSlash runtime stage is the base: aspnet 10.0.14 on Ubuntu 24.04, whose `app` user (1654)
# is the one user everything runs as.
FROM toggleslash
ARG PIXELSLASH_REVISION
ARG TOGGLESLASH_REVISION
USER root
COPY --from=tools /s6/ /
COPY --from=tools /usr/bin/caddy /usr/local/bin/caddy
COPY --from=pixelslash /usr/local/bin/bun /usr/local/bin/bun
COPY --from=pixelslash /opt/pixelslash /opt/pixelslash
COPY self-host/rootfs/ /
COPY self-host/Caddyfile self-host/domain.caddy /etc/caddy/
COPY LICENSE NOTICE /usr/share/licenses/slashslash/
COPY --from=pixelslash-src LICENSE NOTICE /usr/share/licenses/slashslash/pixelslash/
COPY --from=toggleslash-src LICENSE NOTICE /usr/share/licenses/slashslash/toggleslash/

# /data and its folders, /run (s6 and Caddy write there) and HOME belong to `app` in the image, so a
# Docker named volume starts owned right and nothing needs root, a chown or a tmpfs at start. No file
# keeps a setuid or setgid bit (s6-overlay-suexec included: as `app` it runs preinit unprivileged).
RUN mkdir -p /data/pixelslash /data/toggleslash /data/secrets /data/caddy \
 && chmod 700 /data/secrets \
 && chown -R 1654:1654 /data /run /home/app \
 && find / -xdev -type f -perm /6000 -exec chmod ug-s {} + \
 && test -z "$(find / -xdev -type f -perm /6000)"

ENV HOME=/home/app \
    PIXELSLASH_PORT=3000 \
    TOGGLESLASH_PORT=8080 \
    SLASHSLASH_PORT=8000 \
    TOGGLESLASH_DB_PATH=/data/toggleslash/toggleslash.db \
    S6_BEHAVIOUR_IF_STAGE2_FAILS=2 \
    S6_CMD_WAIT_FOR_SERVICES_MAXTIME=0 \
    S6_VERBOSITY=1

LABEL org.opencontainers.image.title="slashslash" \
      org.opencontainers.image.description="PixelSlash and ToggleSlash in one image" \
      org.opencontainers.image.source="https://github.com/madangryscientist/slashslash" \
      org.opencontainers.image.licenses="MIT AND Elastic-2.0" \
      build.slashslash.pixelslash.revision="${PIXELSLASH_REVISION}" \
      build.slashslash.toggleslash.revision="${TOGGLESLASH_REVISION}"

USER app
WORKDIR /home/app
VOLUME /data
EXPOSE 3000 8080 8000
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --start-interval=2s \
  CMD ["/usr/local/bin/healthcheck"]
ENTRYPOINT ["/init"]
