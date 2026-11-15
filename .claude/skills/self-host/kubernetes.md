# Kubernetes

Untested on a cluster so far; tell the person so, and run every check in SKILL.md step 5. The image
runs under the restricted Pod Security profile.

## What the pod needs

- **One replica, `Recreate`.** Both tools keep SQLite on the volume, so two pods on one volume
  corrupt it. A rolling update would start the second before the first stops.
- **A volume at `/data`**: a `ReadWriteOnce` PersistentVolumeClaim, 8 GiB to start, on the storage
  class the person chose.
- **`fsGroup: 1654`** (and `runAsUser`/`runAsGroup: 1654`, `runAsNonRoot: true`) so the volume is
  writable. If it is not, the container exits at once with one line naming the path.
- **An `emptyDir` at `/run`** when the root filesystem is read-only.
- **The GitHub values in a Secret**, made from a file or stdin, never a literal on the command line:
  ```sh
  kubectl create secret generic slashslash-github -n slashslash --from-env-file=/dev/stdin
  # then paste GITHUB_CLIENT_ID=<id> and GITHUB_CLIENT_SECRET=<secret> on two lines, then Ctrl-D
  ```
- **Probes**: Kubernetes ignores the image's Docker health check, so give it one. The first start
  can take two minutes.

## Manifest

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata: { name: slashslash-data, namespace: slashslash }
spec:
  accessModes: [ReadWriteOnce]
  resources: { requests: { storage: 8Gi } }
---
apiVersion: apps/v1
kind: Deployment
metadata: { name: slashslash, namespace: slashslash }
spec:
  replicas: 1
  strategy: { type: Recreate }
  selector: { matchLabels: { app: slashslash } }
  template:
    metadata: { labels: { app: slashslash } }
    spec:
      securityContext:
        runAsUser: 1654
        runAsGroup: 1654
        fsGroup: 1654
        runAsNonRoot: true
        seccompProfile: { type: RuntimeDefault }
      containers:
        - name: slashslash
          image: ghcr.io/madangryscientist/slashslash:<version>
          envFrom: [{ secretRef: { name: slashslash-github } }]
          ports:
            - { name: pixelslash, containerPort: 3000 }
            - { name: toggleslash, containerPort: 8080 }
          securityContext:
            allowPrivilegeEscalation: false
            capabilities: { drop: [ALL] }
          startupProbe:
            httpGet: { path: /health, port: 8080 }
            periodSeconds: 5
            failureThreshold: 48
          readinessProbe:
            httpGet: { path: /, port: 3000 }
          livenessProbe:
            httpGet: { path: /health, port: 8080 }
            periodSeconds: 30
          volumeMounts:
            - { name: data, mountPath: /data }
            - { name: run, mountPath: /run }
      volumes:
        - { name: data, persistentVolumeClaim: { claimName: slashslash-data } }
        - { name: run, emptyDir: {} }
---
apiVersion: v1
kind: Service
metadata: { name: slashslash, namespace: slashslash }
spec:
  selector: { app: slashslash }
  ports:
    - { name: pixelslash, port: 3000, targetPort: 3000 }
    - { name: toggleslash, port: 8080, targetPort: 8080 }
```

`kubectl create namespace slashslash`, the Secret, then `kubectl apply -f` the manifest. For access
from outside, an Ingress (HTTPS) or a `LoadBalancer`/`NodePort` Service, whichever the cluster has;
with an Ingress, remember SKILL.md step 3's second callback.

Done when `kubectl rollout status deploy/slashslash -n slashslash` finishes and the pod is Ready.

## For the checks

- Inside the container: `kubectl exec -n slashslash deploy/slashslash -- slashslash <command>`.
- Restart: `kubectl rollout restart deploy/slashslash -n slashslash`, then wait for Ready.

## Upgrade and remove

- Upgrade: change the image tag and apply; `Recreate` stops the old pod first, and the new version
  writes its upgrade backup before the tools start.
- Remove: `kubectl delete deploy,svc slashslash -n slashslash` keeps the PVC; deleting the PVC
  deletes the data (depending on the class's reclaim policy). Take a `slashslash backup` and
  `kubectl cp` it out first.
