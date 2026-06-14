# Delete the CKA practice cluster. Removes the kind cluster and its kubeconfig
# context, then restores the kubectl context that was active before setup (so you
# aren't left with no current context). Nothing else on your machine is touched.
#
# Usage: ./teardown.ps1
. (Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) 'lib.ps1')

if (-not (Test-Command 'kind')) { Die "kind is not installed; nothing to tear down" }

if (Cluster-Exists) {
	Step "deleting cluster '$ClusterName'"
	kind delete cluster --name $ClusterName
	Ok "cluster '$ClusterName' deleted"
	Restore-Context
} else {
	Warn "cluster '$ClusterName' does not exist — nothing to do"
}
