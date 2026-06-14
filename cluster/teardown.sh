#!/usr/bin/env bash
#
# Delete the CKA practice cluster. Removes the kind cluster and its kubeconfig
# context, then restores the kubectl context that was active before setup (so you
# aren't left with no current context). Nothing else on your machine is touched.
#
# Usage: ./teardown.sh
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

if ! command -v kind >/dev/null 2>&1; then
	die "kind is not installed; nothing to tear down"
fi

if cluster_exists; then
	step "deleting cluster '${CLUSTER_NAME}'"
	kind delete cluster --name "$CLUSTER_NAME"
	ok "cluster '${CLUSTER_NAME}' deleted"
	restore_context
else
	warn "cluster '${CLUSTER_NAME}' does not exist — nothing to do"
fi
