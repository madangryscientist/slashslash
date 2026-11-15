# Kubernetes

Untested on a live cluster so far; tell the person so, and run every check in SKILL.md step 5. The
source is the Helm chart in [`self-host/chart`](../../self-host/chart/README.md): its README has
every value, how it runs and its limits. It is checked with `helm lint`, `helm template`,
`kubeconform` and against the restricted Pod Security Standard, never on a real cluster.

## What it gives

One pod (a StatefulSet of one, so two pods never share the SQLite files), a volume claim
`data-slashslash-0` at `/data` (8 GiB, the default storage class unless the person picks one; both
are fixed at install), a ClusterIP Service with PixelSlash on 3000 and ToggleSlash on 8080, and
optionally an Ingress for `pixelslash.<host>` and `toggleslash.<host>`. The pod runs under the
restricted profile with a read-only root filesystem.

## Install

The GitHub values go in a Secret made from stdin, never a literal on the command line:

```sh
kubectl create namespace slashslash
kubectl create secret generic slashslash-github -n slashslash --from-env-file=/dev/stdin
# then paste GITHUB_CLIENT_ID=<id> and GITHUB_CLIENT_SECRET=<secret> on two lines, then Ctrl-D
```

Then one of:

```sh
# with Helm
helm install slashslash oci://ghcr.io/madangryscientist/charts/slashslash -n slashslash \
  --set existingSecret=slashslash-github
# without Helm: the chart rendered with its defaults
kubectl apply -f https://raw.githubusercontent.com/madangryscientist/slashslash/self-host-v<version>/self-host/chart/slashslash.yaml
```

For access from outside: `kubectl port-forward -n slashslash svc/slashslash 3000:3000 8080:8080`,
`--set service.type=LoadBalancer` (or `NodePort`), or the chart's Ingress (`--set ingress.enabled=true
--set ingress.host=<domain>`). GitHub sign-in over HTTPS needs a PixelSlash fix first (see the
chart README), so use plain HTTP or the port-forward until then.

Done when `kubectl rollout status statefulset/slashslash -n slashslash` finishes and `slashslash-0`
is Ready. The first start can take two minutes.

## For the checks

- Inside the container: `kubectl exec -n slashslash slashslash-0 -- slashslash <command>`.
- Restart: `kubectl rollout restart statefulset/slashslash -n slashslash`, then wait for Ready.

## Upgrade and remove

- Upgrade: `helm upgrade slashslash oci://ghcr.io/madangryscientist/charts/slashslash -n slashslash
  --reuse-values --version <new>` (or apply the newer rendered file). The old pod stops first, and the
  new version writes its upgrade backup before the tools start.
- Remove: `helm uninstall slashslash -n slashslash` (or `kubectl delete -f` the rendered file) keeps
  the claim; deleting `data-slashslash-0` deletes the data (depending on the class's reclaim
  policy). Take a `slashslash backup` and `kubectl cp` it out first.
