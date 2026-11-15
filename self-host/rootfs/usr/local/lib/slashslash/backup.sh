# Sourced by the slashslash command and by init-data: the one archive format, how two versions
# compare, and how old backups are pruned. Nothing here stops or starts a service; whoever calls
# slashslash_archive makes sure neither product is writing.
#
# An archive is a gzip tar of the volume's state, relative to /data, plus a `version` file holding
# the version of slashslash whose data it is:
#
#   version  .slashslash-version  pixelslash/  toggleslash/  secrets/  caddy/
#
# PixelSlash's tmp/ is left out. backups/ and restore-*/ are never in one.

SLASHSLASH_STATE="pixelslash toggleslash secrets caddy"

# A UTC date and time that sorts as text: 20261115T101500Z.
slashslash_stamp() { date -u +%Y%m%dT%H%M%SZ; }

# Succeeds when $1 is a version this image can read: X.Y.Z with an optional -suffix.
slashslash_is_version() {
  printf '%s\n' "$1" | grep -Eqx '[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?'
}

# Prints -1, 0 or 1 as version $1 is older than, the same as or newer than $2. X.Y.Z compares as
# numbers; a pre-release (-dev, -edge.<sha7>) sorts before its own release, and any two
# pre-releases of the same X.Y.Z count as equal.
slashslash_version_cmp() {
  awk -v a="$1" -v b="$2" 'BEGIN {
    pa = index(a, "-") > 0; pb = index(b, "-") > 0
    sub(/-.*/, "", a); sub(/-.*/, "", b)
    split(a, x, "."); split(b, y, ".")
    for (i = 1; i <= 3; i++) {
      if (x[i] + 0 < y[i] + 0) { print -1; exit }
      if (x[i] + 0 > y[i] + 0) { print 1; exit }
    }
    if (pa && !pb) print -1; else if (pb && !pa) print 1; else print 0
  }'
}

# slashslash_archive <file> <version>: writes the archive to <file>, through <file>.partial so a
# failed run never leaves a file that looks whole.
slashslash_archive() {
  local out="$1" label extra=""
  label="$(mktemp -d)" || return 1
  printf '%s\n' "$2" > "$label/version"
  [ -e /data/.slashslash-version ] && extra=".slashslash-version"
  # shellcheck disable=SC2086 # the folder names are a fixed, space-separated list
  if tar -czf "$out.partial" --anchored --exclude=pixelslash/tmp \
      -C "$label" version -C /data $extra $SLASHSLASH_STATE \
    && mv "$out.partial" "$out"; then
    rm -rf "$label"
    return 0
  fi
  rm -rf "$label" "$out.partial"
  return 1
}

# slashslash_prune <dir> <prefix> <keep>: removes all but the newest <keep> entries named
# <prefix>* in <dir>. Names carry a stamp right after the prefix, so newest is last by name.
slashslash_prune() {
  [ -d "$1" ] || return 0
  find "$1" -mindepth 1 -maxdepth 1 -name "$2*" ! -name '*.partial' | sort | head -n "-$3" | while read -r old; do
    rm -rf "$old"
  done
}
