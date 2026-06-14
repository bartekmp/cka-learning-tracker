#!/usr/bin/env bash
#
# Set up a 2-node CKA practice cluster (1 control-plane + 1 worker) with kind.
# Installs any missing dependencies (kind, kubectl), creates the cluster, and
# installs the addons the practice tasks need (Calico, metrics-server, ingress).
#
# Usage:
#   ./setup.sh [--with-gateway] [--skip-addons]
#
# Environment overrides: CLUSTER_NAME, KIND_VERSION, KIND_NODE_IMAGE,
#   CALICO_VERSION, INSTALL_DIR  (see lib.sh for defaults).
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

WITH_GATEWAY=0
SKIP_ADDONS=0
for arg in "$@"; do
	case "$arg" in
		--with-gateway) WITH_GATEWAY=1 ;;
		--skip-addons)  SKIP_ADDONS=1 ;;
		-h|--help)
			grep '^#' "$0" | grep -v '^#!' | sed 's/^# \{0,1\}//'; exit 0 ;;
		*) die "unknown argument: $arg (try --help)" ;;
	esac
done

step "checking dependencies"
require_docker
ensure_kind
ensure_kubectl
# Only preflight the ports when we're about to create a cluster — an already
# running '${CLUSTER_NAME}' cluster legitimately holds them itself.
cluster_exists || check_ingress_ports

create_cluster

if [ "$SKIP_ADDONS" -eq 0 ]; then
	install_calico
	install_metrics_server
	install_ingress
	[ "$WITH_GATEWAY" -eq 1 ] && install_gateway
else
	warn "skipping addons (--skip-addons); cluster has NO CNI, pods will stay Pending"
fi

echo
step "waiting for nodes to be Ready"
kc wait --for=condition=Ready nodes --all --timeout=180s || warn "nodes not all Ready yet — give it a moment"
echo
ok "done — your CKA practice cluster is up"
echo
kc get nodes -o wide
echo
printf "${C_GREEN}Next:${C_OFF} kubectl config use-context %s && kubectl get pods -A\n" "$KUBE_CONTEXT"
# Point at reset.sh next to however this script was actually invoked.
printf "      Reset to a clean cluster any time with:  %s\n" "$(dirname "$0")/reset.sh"
