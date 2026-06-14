#!/usr/bin/env bash
# Shared helpers for the CKA practice-cluster scripts (Linux / macOS / WSL).
set -euo pipefail

# ---- configuration (override via environment) -------------------------------
CLUSTER_NAME="${CLUSTER_NAME:-cka}"
KIND_VERSION="${KIND_VERSION:-v0.30.0}"
KIND_NODE_IMAGE="${KIND_NODE_IMAGE:-kindest/node:v1.35.0}"
CALICO_VERSION="${CALICO_VERSION:-v3.29.1}"
# Pod network. 10.244.0.0/16 avoids the 192.168.x.x range used by most home LANs.
POD_CIDR="${POD_CIDR:-10.244.0.0/16}"
# Host ports the ingress controller is published on. High/unprivileged by default
# so they don't need root and don't collide with a web server, k3s Traefik, etc.
INGRESS_HTTP_PORT="${INGRESS_HTTP_PORT:-43991}"
INGRESS_HTTPS_PORT="${INGRESS_HTTPS_PORT:-43992}"
INSTALL_DIR="${INSTALL_DIR:-/usr/local/bin}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KIND_CONFIG="${SCRIPT_DIR}/kind-config.yaml"
KUBE_CONTEXT="kind-${CLUSTER_NAME}"
# Where setup records the kubectl context that was active before it switched to
# the kind cluster, so teardown can restore it.
STATE_DIR="${STATE_DIR:-${HOME}/.cka-tools}"
PREV_CONTEXT_FILE="${STATE_DIR}/${CLUSTER_NAME}.prev-context"

# ---- pretty output ----------------------------------------------------------
if [ -t 1 ]; then
	C_BLUE='\033[1;34m'; C_GREEN='\033[1;32m'; C_YELLOW='\033[1;33m'; C_RED='\033[1;31m'; C_OFF='\033[0m'
else
	C_BLUE=''; C_GREEN=''; C_YELLOW=''; C_RED=''; C_OFF=''
fi
step() { printf "${C_BLUE}==>${C_OFF} %s\n" "$*"; }
ok()   { printf "${C_GREEN}  ✓${C_OFF} %s\n" "$*"; }
warn() { printf "${C_YELLOW}  !${C_OFF} %s\n" "$*"; }
die()  { printf "${C_RED}error:${C_OFF} %s\n" "$*" >&2; exit 1; }

# ---- platform detection -----------------------------------------------------
detect_os()   { case "$(uname -s)" in Linux) echo linux;; Darwin) echo darwin;; *) die "unsupported OS: $(uname -s)";; esac; }
detect_arch() { case "$(uname -m)" in x86_64|amd64) echo amd64;; arm64|aarch64) echo arm64;; *) die "unsupported arch: $(uname -m)";; esac; }

# Install a single binary onto PATH, using sudo only if INSTALL_DIR is not writable.
install_binary() {
	local src="$1" name="$2"
	chmod +x "$src"
	if [ -w "$INSTALL_DIR" ]; then
		mv "$src" "${INSTALL_DIR}/${name}"
	else
		warn "elevating with sudo to install ${name} into ${INSTALL_DIR}"
		sudo mv "$src" "${INSTALL_DIR}/${name}"
	fi
	ok "installed ${name} -> ${INSTALL_DIR}/${name}"
}

# ---- dependency checks ------------------------------------------------------
require_docker() {
	command -v docker >/dev/null 2>&1 || die "Docker is required but not found. Install Docker Engine / Docker Desktop: https://docs.docker.com/get-docker/"
	docker info >/dev/null 2>&1 || die "Docker is installed but the daemon is not reachable. Start Docker and retry."
	ok "docker is available"
}

# True if some process is already listening on TCP port $1.
port_in_use() {
	local p="$1"
	if command -v ss >/dev/null 2>&1; then
		ss -ltn 2>/dev/null | awk '{print $4}' | grep -qE "[:.]${p}\$"
	elif command -v lsof >/dev/null 2>&1; then
		lsof -nP -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1
	else
		return 1 # can't tell — let kind surface any conflict itself
	fi
}

# Fail early (with a clear hint) if the ingress host ports are taken.
check_ingress_ports() {
	local p
	for p in "$INGRESS_HTTP_PORT" "$INGRESS_HTTPS_PORT"; do
		if port_in_use "$p"; then
			die "host port ${p} is already in use (needed to publish ingress). Free it, or rerun with different ports, e.g.:
       INGRESS_HTTP_PORT=8080 INGRESS_HTTPS_PORT=8443 ./setup.sh"
		fi
	done
	ok "ingress host ports ${INGRESS_HTTP_PORT}/${INGRESS_HTTPS_PORT} are free"
}

ensure_kind() {
	if command -v kind >/dev/null 2>&1; then ok "kind is available ($(kind version 2>/dev/null | head -n1))"; return; fi
	step "kind not found — installing ${KIND_VERSION}"
	local os arch tmp; os="$(detect_os)"; arch="$(detect_arch)"; tmp="$(mktemp)"
	curl -fsSLo "$tmp" "https://kind.sigs.k8s.io/dl/${KIND_VERSION}/kind-${os}-${arch}" || die "failed to download kind"
	install_binary "$tmp" kind
}

ensure_kubectl() {
	if command -v kubectl >/dev/null 2>&1; then ok "kubectl is available"; return; fi
	step "kubectl not found — installing latest stable"
	local os arch tmp ver; os="$(detect_os)"; arch="$(detect_arch)"; tmp="$(mktemp)"
	ver="$(curl -fsSL https://dl.k8s.io/release/stable.txt)" || die "failed to resolve kubectl version"
	curl -fsSLo "$tmp" "https://dl.k8s.io/release/${ver}/bin/${os}/${arch}/kubectl" || die "failed to download kubectl"
	install_binary "$tmp" kubectl
}

# ---- cluster operations -----------------------------------------------------
cluster_exists() { kind get clusters 2>/dev/null | grep -qx "$CLUSTER_NAME"; }

kc() { kubectl --context "$KUBE_CONTEXT" "$@"; }

# Remember the context active before kind switches to the new cluster.
save_prev_context() {
	mkdir -p "$STATE_DIR"
	kubectl config current-context 2>/dev/null > "$PREV_CONTEXT_FILE" || true
}

# After teardown, kind leaves current-context empty if it deleted the active one.
# Put kubectl back on the previously-saved context, or any remaining one.
restore_context() {
	command -v kubectl >/dev/null 2>&1 || return 0
	local prev=""
	[ -f "$PREV_CONTEXT_FILE" ] && prev="$(cat "$PREV_CONTEXT_FILE" 2>/dev/null)"
	rm -f "$PREV_CONTEXT_FILE"
	# If kubectl still has a usable current context, we deleted a non-active
	# cluster — leave the user's selection alone.
	[ -n "$(kubectl config current-context 2>/dev/null)" ] && return 0
	if [ -n "$prev" ] && kubectl config get-contexts -o name 2>/dev/null | grep -qx "$prev"; then
		kubectl config use-context "$prev" >/dev/null 2>&1 && ok "restored kubectl context to '${prev}'"
	else
		local other; other="$(kubectl config get-contexts -o name 2>/dev/null | head -n1)"
		if [ -n "$other" ]; then
			kubectl config use-context "$other" >/dev/null 2>&1 && ok "switched kubectl context to '${other}'"
		else
			warn "no kubectl contexts remain"
		fi
	fi
}

create_cluster() {
	if cluster_exists; then
		warn "cluster '${CLUSTER_NAME}' already exists — skipping create (use reset to rebuild it)"
		return
	fi
	step "creating 2-node cluster '${CLUSTER_NAME}' (node image: ${KIND_NODE_IMAGE})"
	save_prev_context
	local cfg; cfg="$(mktemp)"
	sed -E \
		-e "s#image: kindest/node:.*#image: ${KIND_NODE_IMAGE}#" \
		-e "s#podSubnet: .*#podSubnet: '${POD_CIDR}'#" \
		-e "s#hostPort: 43991\$#hostPort: ${INGRESS_HTTP_PORT}#" \
		-e "s#hostPort: 43992\$#hostPort: ${INGRESS_HTTPS_PORT}#" \
		"$KIND_CONFIG" > "$cfg"
	kind create cluster --name "$CLUSTER_NAME" --config "$cfg" --wait 120s
	rm -f "$cfg"
	ok "cluster created; kubectl context set to '${KUBE_CONTEXT}'"
}

install_calico() {
	step "installing Calico ${CALICO_VERSION} (CNI + NetworkPolicy enforcement, pod CIDR ${POD_CIDR})"
	local manifest; manifest="$(mktemp)"
	curl -fsSL "https://raw.githubusercontent.com/projectcalico/calico/${CALICO_VERSION}/manifests/calico.yaml" -o "$manifest" \
		|| die "failed to download Calico manifest"
	# Uncomment the CALICO_IPV4POOL_CIDR env and pin it to POD_CIDR so Calico's
	# pool matches kind's podSubnet (and stays off the home-LAN 192.168.x.x range).
	sed -i.bak \
		-e 's|# - name: CALICO_IPV4POOL_CIDR|- name: CALICO_IPV4POOL_CIDR|' \
		-e "s|#   value: \"192.168.0.0/16\"|  value: \"${POD_CIDR}\"|" \
		"$manifest"
	kc apply -f "$manifest"
	rm -f "$manifest" "${manifest}.bak"
	kc -n kube-system rollout status ds/calico-node --timeout=180s || warn "Calico still settling; check 'kubectl get pods -n kube-system'"
	ok "Calico installed"
}

install_metrics_server() {
	step "installing metrics-server (for 'kubectl top')"
	kc apply -f "https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml"
	# kind kubelets use self-signed certs; metrics-server must skip TLS verification.
	kc -n kube-system patch deployment metrics-server --type=json \
		-p '[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]' || true
	kc -n kube-system rollout status deployment/metrics-server --timeout=120s || warn "metrics-server still settling"
	ok "metrics-server installed"
}

install_ingress() {
	step "installing ingress-nginx (reachable on http://localhost:${INGRESS_HTTP_PORT} / https://localhost:${INGRESS_HTTPS_PORT})"
	kc apply -f "https://kind.sigs.k8s.io/examples/ingress/deploy-ingress-nginx.yaml"
	kc -n ingress-nginx wait --for=condition=available deployment/ingress-nginx-controller --timeout=180s \
		|| warn "ingress-nginx still settling; check 'kubectl get pods -n ingress-nginx'"
	ok "ingress-nginx installed"
}

install_gateway() {
	step "installing Gateway API CRDs + NGINX Gateway Fabric"
	kc apply -f "https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.2.1/standard-install.yaml"
	kc apply -f "https://github.com/nginxinc/nginx-gateway-fabric/releases/download/v1.6.1/crds.yaml"
	kc apply -f "https://github.com/nginxinc/nginx-gateway-fabric/releases/download/v1.6.1/nginx-gateway.yaml"
	ok "Gateway API support installed"
}
