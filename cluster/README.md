# CKA practice cluster

A one-command, two-node Kubernetes cluster for running the practice tasks in
this project on your own machine. It is built with [**kind**](https://kind.sigs.k8s.io/)
(Kubernetes IN Docker).

## Why kind (and not k3s / microk8s)?

The practice tasks lean heavily on kubeadm-style cluster internals:

- `etcd` running as a **static pod** with certs under `/etc/kubernetes/pki/etcd/`
- the `kubelet` managed by **systemd** on the node
- **containerd** + **crictl** on the node
- static pod manifests in `/etc/kubernetes/manifests/`
- a real **second node** to `drain` / `cordon` / `uncordon`

kind boots every node with **kubeadm inside a container**, so all of the above
behave exactly like the exam. k3s and microk8s use their own bootstrap paths
(embedded etcd / snap, no kubeadm) and don't expose these internals — so they're
poor fits for CKA maintenance and troubleshooting practice. kind also resets in
~90 seconds, which makes "get back to a clean cluster" trivial.

## What you get

- **2 nodes**: 1 control-plane + 1 worker (`cka-control-plane`, `cka-worker`)
- **Calico** CNI — unlike kind's default (kindnet), Calico actually **enforces
  NetworkPolicy**, which the security tasks require
- **metrics-server** — patched for kind so `kubectl top` works
- **ingress-nginx** — reachable on `http://localhost:43991` / `https://localhost:43992`
  (high ports by default so they don't clash with a web server or need root)
- pod CIDR `10.244.0.0/16` — chosen to avoid clashing with typical home LANs
  (which sit on `192.168.x.x`); kind's `podSubnet` and Calico's IP pool are pinned
  to the same value
- optional **Gateway API** + NGINX Gateway Fabric (for the Gateway API task)

## Prerequisites

- **Docker** must already be installed and running
  ([Linux](https://docs.docker.com/engine/install/) /
  [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)).
  On Windows, the WSL 2 backend is recommended.
- `kind` and `kubectl` are **installed automatically** if missing.

## Usage

From the project root, either use the npm scripts (cross-platform) …

```bash
npm run cluster:up       # create the cluster + addons
npm run cluster:status   # show nodes and all pods
npm run cluster:reset    # wipe and rebuild a clean cluster
npm run cluster:down     # delete the cluster
```

… or call the scripts directly.

**Linux / macOS / WSL:**

```bash
./cluster/setup.sh                 # add --with-gateway for the Gateway API task
./cluster/reset.sh
./cluster/teardown.sh
```

**Windows (PowerShell):**

```powershell
./cluster/setup.ps1                # add -WithGateway for the Gateway API task
./cluster/reset.ps1
./cluster/teardown.ps1
```

After setup, your kubeconfig context is `kind-cka`:

```bash
kubectl config use-context kind-cka
kubectl get nodes -o wide
```

## Reverting to a clean state

`reset` deletes the cluster and rebuilds it from scratch. Because every kind
node is an ephemeral container, this guarantees a pristine cluster with no
leftover objects — the most reliable "undo" after an experiment.

## Working on the nodes (etcd, kubelet, crictl, static pods)

Some tasks operate on a node rather than through `kubectl`. Open a shell on a
node with `docker exec` (this is the kind equivalent of SSH-ing to the node):

```bash
docker exec -it cka-control-plane bash    # control-plane node
docker exec -it cka-worker bash           # worker node
```

Inside, `crictl`, `systemctl status kubelet`, and `/etc/kubernetes/manifests/`
all work as on a kubeadm node.

For the **etcd backup/restore** task, `etcdctl` ships inside the etcd pod, so the
snapshot commands are easiest to run there:

```bash
kubectl -n kube-system exec -it etcd-cka-control-plane -- sh
# then run the ETCDCTL_API=3 etcdctl snapshot ... commands from the task
```

## Configuration

Override defaults with environment variables before running setup:

| Variable             | Default                | Purpose                                    |
| -------------------- | ---------------------- | ------------------------------------------ |
| `CLUSTER_NAME`       | `cka`                  | kind cluster name / kubeconfig context     |
| `KIND_VERSION`       | `v0.30.0`              | kind version to install if missing         |
| `KIND_NODE_IMAGE`    | `kindest/node:v1.35.0` | Kubernetes version of the nodes            |
| `CALICO_VERSION`     | `v3.29.1`              | Calico release to install                  |
| `POD_CIDR`           | `10.244.0.0/16`        | pod network (kind podSubnet + Calico pool) |
| `INGRESS_HTTP_PORT`  | `43991`                | host port for ingress HTTP                 |
| `INGRESS_HTTPS_PORT` | `43992`                | host port for ingress HTTPS                |
| `INSTALL_DIR`        | `/usr/local/bin`       | where to install kind/kubectl (Bash only)  |

> **Node image / kind version:** each kind release publishes node images for
> specific Kubernetes versions. If `KIND_NODE_IMAGE` fails to pull, check the
> [kind release notes](https://github.com/kubernetes-sigs/kind/releases) for the
> exact `kindest/node` tag (and digest) shipped with your `KIND_VERSION`, and set
> `KIND_NODE_IMAGE` accordingly.

## Running alongside another cluster (k3s, minikube, …) or a web server

kind is self-contained — its nodes are Docker containers on a dedicated `kind`
network with their own runtime, so it coexists fine with a k3s/minikube install
(different runtime, different kubeconfig context). The pod/service CIDRs also
don't overlap k3s defaults (`10.42`/`10.43`).

Host ports could still collide, so the ingress controller is published on the
high/unprivileged ports **43991** (HTTP) and **43992** (HTTPS) by default —
chosen to avoid a local web server, k3s's Traefik, etc., and to not need root.
setup verifies they're free before creating the cluster. Override them if needed:

```bash
INGRESS_HTTP_PORT=8080 INGRESS_HTTPS_PORT=8443 ./setup.sh
# then your Ingress is reachable on http://localhost:8080 / https://localhost:8443
```

```powershell
$env:INGRESS_HTTP_PORT=8080; $env:INGRESS_HTTPS_PORT=8443; ./setup.ps1
```

## Two tasks this cluster can't fully cover

These map to known limitations of any container-based local cluster — use a
free [Killercoda](https://killercoda.com/) playground instead (the task notes
already point you there):

- **Upgrade a cluster with kubeadm** — kind node images are fixed at one
  Kubernetes version with the kube packages held; there's no `apt-get install
kubeadm=<newer>` upgrade path inside the node.
- **Bootstrap a cluster from scratch with kubeadm** — kind _runs_ `kubeadm init`
  for you, so it can't be the exercise. To practice the steps yourself, use the
  Killercoda "Kubernetes Kubeadm" 2-node playground.

Everything else in the practice task list runs on this cluster.
