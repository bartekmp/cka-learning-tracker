# Set up a 2-node CKA practice cluster (1 control-plane + 1 worker) with kind.
# Installs any missing dependencies (kind, kubectl), creates the cluster, and
# installs the addons the practice tasks need (Calico, metrics-server, ingress).
#
# Usage:
#   ./setup.ps1 [-WithGateway] [-SkipAddons]
#
# Environment overrides: CLUSTER_NAME, KIND_VERSION, KIND_NODE_IMAGE, CALICO_VERSION.
param(
	[switch]$WithGateway,
	[switch]$SkipAddons
)
. (Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) 'lib.ps1')

Step "checking dependencies"
Require-Docker
Ensure-Kind
Ensure-Kubectl
# Only preflight the ports when about to create a cluster — an already running
# cluster legitimately holds them itself.
if (-not (Cluster-Exists)) { Test-IngressPorts }

Create-Cluster

if (-not $SkipAddons) {
	Install-Calico
	Install-MetricsServer
	Install-Ingress
	if ($WithGateway) { Install-Gateway }
} else {
	Warn "skipping addons (-SkipAddons); cluster has NO CNI, pods will stay Pending"
}

Write-Host ''
Step "waiting for nodes to be Ready"
Invoke-Kubectl wait --for=condition=Ready nodes --all --timeout=180s
Write-Host ''
Ok "done — your CKA practice cluster is up"
Write-Host ''
Invoke-Kubectl get nodes -o wide
Write-Host ''
Write-Host "Next: kubectl config use-context $KubeContext ; kubectl get pods -A" -ForegroundColor Green
Write-Host "      Reset to a clean cluster any time with:  $(Join-Path $PSScriptRoot 'reset.ps1')"
