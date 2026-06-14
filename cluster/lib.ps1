# Shared helpers for the CKA practice-cluster scripts (Windows / PowerShell).
# Dot-sourced by setup.ps1 / teardown.ps1 / reset.ps1.
$ErrorActionPreference = 'Stop'

# ---- configuration (override via environment) -------------------------------
$script:ClusterName   = if ($env:CLUSTER_NAME)    { $env:CLUSTER_NAME }    else { 'cka' }
$script:KindVersion   = if ($env:KIND_VERSION)    { $env:KIND_VERSION }    else { 'v0.30.0' }
$script:KindNodeImage = if ($env:KIND_NODE_IMAGE) { $env:KIND_NODE_IMAGE } else { 'kindest/node:v1.35.0' }
$script:CalicoVersion = if ($env:CALICO_VERSION)  { $env:CALICO_VERSION }  else { 'v3.29.1' }
# Pod network. 10.244.0.0/16 avoids the 192.168.x.x range used by most home LANs.
$script:PodCidr       = if ($env:POD_CIDR)        { $env:POD_CIDR }        else { '10.244.0.0/16' }
# Host ports the ingress controller is published on. High/unprivileged by default
# so they don't need admin rights and don't collide with a web server / k3s Traefik.
$script:IngressHttpPort  = if ($env:INGRESS_HTTP_PORT)  { $env:INGRESS_HTTP_PORT }  else { '43991' }
$script:IngressHttpsPort = if ($env:INGRESS_HTTPS_PORT) { $env:INGRESS_HTTPS_PORT } else { '43992' }

$script:ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$script:KindConfig = Join-Path $ScriptDir 'kind-config.yaml'
$script:KubeContext = "kind-$ClusterName"
# Where setup records the kubectl context active before it switched to the kind
# cluster, so teardown can restore it.
$script:StateDir = if ($env:STATE_DIR) { $env:STATE_DIR } else { Join-Path $HOME '.cka-tools' }
$script:PrevContextFile = Join-Path $StateDir "$ClusterName.prev-context"
# Local tools dir used when kind/kubectl have to be downloaded.
$script:ToolsDir = Join-Path $HOME '.cka-tools\bin'

# ---- pretty output ----------------------------------------------------------
function Step($m) { Write-Host "==> $m" -ForegroundColor Cyan }
function Ok($m)   { Write-Host "  + $m" -ForegroundColor Green }
function Warn($m) { Write-Host "  ! $m" -ForegroundColor Yellow }
function Die($m)  { Write-Host "error: $m" -ForegroundColor Red; exit 1 }

function Test-Command($name) { return [bool](Get-Command $name -ErrorAction SilentlyContinue) }

function Initialize-ToolsDir {
	if (-not (Test-Path $ToolsDir)) { New-Item -ItemType Directory -Force -Path $ToolsDir | Out-Null }
	if ($env:PATH -notlike "*$ToolsDir*") { $env:PATH = "$ToolsDir;$env:PATH" }
}

# ---- dependency checks ------------------------------------------------------
function Require-Docker {
	if (-not (Test-Command 'docker')) { Die "Docker Desktop is required but not found: https://docs.docker.com/desktop/install/windows-install/" }
	try { docker info *> $null } catch { Die "Docker is installed but the daemon is not reachable. Start Docker Desktop and retry." }
	Ok "docker is available"
}

# Fail early (with a clear hint) if the ingress host ports are taken.
function Test-IngressPorts {
	foreach ($p in @($IngressHttpPort, $IngressHttpsPort)) {
		$inUse = $false
		try { $inUse = [bool](Get-NetTCPConnection -State Listen -LocalPort ([int]$p) -ErrorAction SilentlyContinue) } catch {}
		if ($inUse) {
			Die "host port $p is already in use (needed to publish ingress). Free it, or rerun with different ports, e.g.:`n       `$env:INGRESS_HTTP_PORT=8080; `$env:INGRESS_HTTPS_PORT=8443; ./setup.ps1"
		}
	}
	Ok "ingress host ports $IngressHttpPort/$IngressHttpsPort are free"
}

function Ensure-Kind {
	if (Test-Command 'kind') { Ok "kind is available"; return }
	Step "kind not found — installing $KindVersion"
	Initialize-ToolsDir
	$arch = if ([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture -eq 'Arm64') { 'arm64' } else { 'amd64' }
	$url  = "https://kind.sigs.k8s.io/dl/$KindVersion/kind-windows-$arch"
	Invoke-WebRequest -Uri $url -OutFile (Join-Path $ToolsDir 'kind.exe')
	Ok "installed kind -> $ToolsDir\kind.exe"
}

function Ensure-Kubectl {
	if (Test-Command 'kubectl') { Ok "kubectl is available"; return }
	Step "kubectl not found — installing latest stable"
	Initialize-ToolsDir
	$arch = if ([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture -eq 'Arm64') { 'arm64' } else { 'amd64' }
	$ver  = (Invoke-WebRequest -Uri 'https://dl.k8s.io/release/stable.txt' -UseBasicParsing).Content.Trim()
	$url  = "https://dl.k8s.io/release/$ver/bin/windows/$arch/kubectl.exe"
	Invoke-WebRequest -Uri $url -OutFile (Join-Path $ToolsDir 'kubectl.exe')
	Ok "installed kubectl -> $ToolsDir\kubectl.exe"
	Warn "add $ToolsDir to your PATH permanently to use kubectl in new terminals"
}

# ---- cluster operations -----------------------------------------------------
function Cluster-Exists { return ((kind get clusters 2>$null) -split "`n") -contains $ClusterName }

function Invoke-Kubectl { kubectl --context $KubeContext @args }

# Remember the context active before kind switches to the new cluster.
function Save-PrevContext {
	New-Item -ItemType Directory -Force -Path $StateDir | Out-Null
	$prev = (kubectl config current-context 2>$null)
	if ($prev) { Set-Content -Path $PrevContextFile -Value $prev -NoNewline }
}

# After teardown, kind leaves current-context empty if it deleted the active one.
# Put kubectl back on the previously-saved context, or any remaining one.
function Restore-Context {
	if (-not (Test-Command 'kubectl')) { return }
	$prev = $null
	if (Test-Path $PrevContextFile) {
		$prev = (Get-Content $PrevContextFile -Raw).Trim()
		Remove-Item $PrevContextFile -Force
	}
	if (kubectl config current-context 2>$null) { return } # deleted a non-active cluster
	$names = @(kubectl config get-contexts -o name 2>$null) | Where-Object { $_ }
	if ($prev -and ($names -contains $prev)) {
		kubectl config use-context $prev | Out-Null; Ok "restored kubectl context to '$prev'"
	} elseif ($names.Count -gt 0) {
		kubectl config use-context $names[0] | Out-Null; Ok "switched kubectl context to '$($names[0])'"
	} else {
		Warn 'no kubectl contexts remain'
	}
}

function Create-Cluster {
	if (Cluster-Exists) { Warn "cluster '$ClusterName' already exists — skipping create (use reset to rebuild it)"; return }
	Step "creating 2-node cluster '$ClusterName' (node image: $KindNodeImage)"
	Save-PrevContext
	$cfg = New-TemporaryFile
	(Get-Content $KindConfig) `
		-replace 'image: kindest/node:.*', "image: $KindNodeImage" `
		-replace 'podSubnet: .*', "podSubnet: '$PodCidr'" `
		-replace 'hostPort: 43991$', "hostPort: $IngressHttpPort" `
		-replace 'hostPort: 43992$', "hostPort: $IngressHttpsPort" | Set-Content $cfg
	kind create cluster --name $ClusterName --config $cfg --wait 120s
	Remove-Item $cfg -Force
	Ok "cluster created; kubectl context set to '$KubeContext'"
}

function Install-Calico {
	Step "installing Calico $CalicoVersion (CNI + NetworkPolicy enforcement, pod CIDR $PodCidr)"
	$manifest = New-TemporaryFile
	Invoke-WebRequest -Uri "https://raw.githubusercontent.com/projectcalico/calico/$CalicoVersion/manifests/calico.yaml" -OutFile $manifest
	# Uncomment the CALICO_IPV4POOL_CIDR env and pin it to PodCidr so Calico's
	# pool matches kind's podSubnet (and stays off the home-LAN 192.168.x.x range).
	(Get-Content $manifest) `
		-replace '# - name: CALICO_IPV4POOL_CIDR', '- name: CALICO_IPV4POOL_CIDR' `
		-replace '#   value: "192.168.0.0/16"', "  value: `"$PodCidr`"" | Set-Content $manifest
	Invoke-Kubectl apply -f $manifest
	Remove-Item $manifest -Force
	Invoke-Kubectl -n kube-system rollout status ds/calico-node --timeout=180s
	Ok "Calico installed"
}

function Install-MetricsServer {
	Step "installing metrics-server (for 'kubectl top')"
	Invoke-Kubectl apply -f "https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml"
	Invoke-Kubectl -n kube-system patch deployment metrics-server --type=json -p '[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'
	Invoke-Kubectl -n kube-system rollout status deployment/metrics-server --timeout=120s
	Ok "metrics-server installed"
}

function Install-Ingress {
	Step "installing ingress-nginx (reachable on http://localhost:$IngressHttpPort / https://localhost:$IngressHttpsPort)"
	Invoke-Kubectl apply -f "https://kind.sigs.k8s.io/examples/ingress/deploy-ingress-nginx.yaml"
	Invoke-Kubectl -n ingress-nginx wait --for=condition=available deployment/ingress-nginx-controller --timeout=180s
	Ok "ingress-nginx installed"
}

function Install-Gateway {
	Step "installing Gateway API CRDs + NGINX Gateway Fabric"
	Invoke-Kubectl apply -f "https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.2.1/standard-install.yaml"
	Invoke-Kubectl apply -f "https://github.com/nginxinc/nginx-gateway-fabric/releases/download/v1.6.1/crds.yaml"
	Invoke-Kubectl apply -f "https://github.com/nginxinc/nginx-gateway-fabric/releases/download/v1.6.1/nginx-gateway.yaml"
	Ok "Gateway API support installed"
}
