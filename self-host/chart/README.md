# The Slash tools on Kubernetes

This Helm chart runs the one self-host image (PixelSlash and ToggleSlash, see
[`self-host/README.md`](../README.md)) as a single pod with one volume.

**Untested on a live cluster.** It is checked with `helm lint`, `helm template` and
`kubeconform -strict`, and its pod against the restricted Pod Security Standard, but it has never
been installed on a real cluster. Watch the first install closely.

## Install

Make the namespace and a Secret with PixelSlash's GitHub sign-in, from stdin so the values never
sit on a command line:

```sh
kubectl create namespace slashslash
kubectl create secret generic slashslash-github -n slashslash --from-env-file=/dev/stdin
# then paste GITHUB_CLIENT_ID=<id> and GITHUB_CLIENT_SECRET=<secret> on two lines, then Ctrl-D
```

Then install the chart:

```sh
helm install slashslash oci://ghcr.io/madangryscientist/charts/slashslash \
  -n slashslash --set existingSecret=slashslash-github
kubectl rollout status statefulset/slashslash -n slashslash
```

Without Helm, apply the rendered manifest instead (it expects the same namespace and Secret):

```sh
kubectl apply -f https://raw.githubusercontent.com/madangryscientist/slashslash/self-host-v<version>/self-host/chart/slashslash.yaml
```

`<version>` is a release (see "Versions" in `self-host/README.md`), so the file names an image that
is already published. Both ways need a release made after the chart was added: 0.1.1 and older
have no chart.

The first start takes up to two minutes (PixelSlash migrates its database before it listens).

## Reaching it

The Service (`slashslash`, ClusterIP) has PixelSlash on port 3000 and ToggleSlash on 8080. From
your own machine:

```sh
kubectl port-forward -n slashslash svc/slashslash 3000:3000 8080:8080
```

The GitHub OAuth app's callback is then `http://localhost:3000/auth/github/callback`.

With `ingress.enabled`, an Ingress sends `pixelslash.<host>` to PixelSlash and `toggleslash.<host>`
to ToggleSlash. **GitHub sign-in over HTTPS needs a fix in PixelSlash first**, a setting for
its public address: today it builds its callback from the plain-HTTP request it receives behind
the Ingress. Until that lands, use plain HTTP on the Ingress (the
callback is then `http://pixelslash.<host>/auth/github/callback`), or `kubectl port-forward`.

ToggleSlash's admin token is made on the first start and kept on the volume:

```sh
kubectl exec -n slashslash slashslash-0 -- slashslash secret toggleslash-admin-token
```

## Values

| Value | Default | What |
| --- | --- | --- |
| `image.repository` | `ghcr.io/madangryscientist/slashslash` | The image |
| `image.tag` | the chart's `appVersion` | The image tag |
| `image.pullPolicy` | `IfNotPresent` | |
| `github.clientId`, `github.clientSecret` | none | PixelSlash's GitHub sign-in, put into a Secret the chart makes. Required unless `existingSecret` is set |
| `toggleslash.adminToken` | unset | Your own ToggleSlash admin token. Unset, the key is left out of the Secret and the image makes its own |
| `existingSecret` | unset | A Secret you made, with `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` and optionally `TOGGLESLASH_ADMIN_TOKEN`. The chart then makes no Secret |
| `persistence.size` | `8Gi` | The volume at `/data`. Fixed at install |
| `persistence.storageClassName` | the cluster's default | Its storage class. Fixed at install |
| `service.type` | `ClusterIP` | `NodePort` or `LoadBalancer` to reach it without an Ingress |
| `ingress.enabled` | `false` | Make an Ingress |
| `ingress.host` | none | `pixelslash.<host>` and `toggleslash.<host>`. Required with the Ingress |
| `ingress.className` | unset | The Ingress class |
| `ingress.annotations` | `{}` | Annotations on the Ingress, such as a cert-manager issuer |
| `ingress.tls.enabled` | `false` | TLS for both host names (see the HTTPS note above) |
| `ingress.tls.secretName` | `<release>-tls` | The certificate's Secret |
| `resources` | `{}` | The container's requests and limits |
| `startupSeconds` | `180` | How long the first start, or an upgrade's backup, may take before the pod is restarted |

Any other setting the image reads (see the Settings table in `self-host/README.md`) can go in the
Secret too.

## How it runs

- **One pod, a StatefulSet of one.** Both tools keep SQLite on the volume, and each database takes
  one writer. With one replica the StatefulSet deletes the old pod before it makes the new one, so
  two pods never share the volume. `replicas` is not a value.
- **Restricted.** The pod runs as UID and GID 1654 with `runAsNonRoot`, `fsGroup: 1654`, the
  runtime's default seccomp profile, no privilege escalation, every capability dropped and a
  read-only root filesystem, with empty folders at `/run`, `/tmp` and `/home/app`, the only places
  besides `/data` the image writes. It passes the `restricted` Pod Security admission level.
- **Health.** A startup probe waits up to `startupSeconds` (180 by default) for PixelSlash; then
  readiness and liveness run the image's own `healthcheck`, which asks both tools through its front
  door.
- **No Service variables.** `enableServiceLinks` is off: the image reads `SLASHSLASH_PORT`, which
  Kubernetes would otherwise set to the Service's address.

## Upgrade, backup and remove

- Upgrade: `helm upgrade slashslash oci://ghcr.io/madangryscientist/charts/slashslash
  -n slashslash --reset-then-reuse-values --version <new>`. The new version backs the volume up
  before either tool migrates (see "Backup, restore and rollback" in `self-host/README.md`).
- Rollback (untested): the same `helm upgrade` with `--version <previous>` (not `helm rollback`,
  which would also put back the old `startupSeconds`, while the older image backs the volume up
  again). If `slashslash-0` stays on the new version, `kubectl delete pod slashslash-0 -n
  slashslash`. Then find the backup taken before the upgrade with `kubectl exec -n slashslash
  slashslash-0 -- ls /data/backups` and `slashslash restore /data/backups/<that file>`.
- Backup: `kubectl exec -n slashslash slashslash-0 -- slashslash backup`, then copy it out with
  `kubectl cp slashslash/slashslash-0:/data/backups/<file> ./<file>`. Both tools are stopped while
  it runs, so it must finish within about a minute, stopping them included (see Limits).
- Remove: `helm uninstall slashslash -n slashslash` keeps the volume claim. Deleting it
  (`kubectl delete pvc data-slashslash-0 -n slashslash`) deletes the data, depending on the storage
  class's reclaim policy.

## Limits

- The volume claim is `data-<release>-0`. Its size and storage class cannot change after install:
  a StatefulSet's claim template is fixed. To grow it, expand the claim itself if the storage class
  allows it.
- The hand-written manifest the self-host guide used to carry was never applied anywhere, so there
  is no migration from its `slashslash-data` claim.
- The startup probe allows `startupSeconds` (180 by default). An upgrade backs up the whole
  volume inside that time, before the tools listen; on a large volume, raise it. Otherwise the
  kubelet restarts the pod mid-backup, each attempt can leave an `upgrade-*.partial` file in
  `/data/backups` that fills the volume, and the pod stops for want of space.
- A manual `slashslash backup` stops both tools until the archive is written, and the liveness
  probe restarts the pod after 60 to 90 s of that, killing the backup, so allow about a minute in all. On a volume too large to
  archive in that time, copy the claim with your storage's own snapshot instead. A killed backup
  can leave a `*.partial` file in `/data/backups`; delete it.
- amd64 only, like the image.

## Checks

```sh
bunx moon run self-host:chart       # lint, renders, kubeconform, the restricted check, the render
bun self-host/chart.ts --write      # re-render slashslash.yaml after changing the chart
```

The chart's `version` and `appVersion` are `self-host/VERSION`; the check fails when they drift. A
release tag (see "Releasing" in `self-host/README.md`) pushes the chart to
`oci://ghcr.io/madangryscientist/charts` after the image.
