# Reset the CKA practice cluster to a clean, freshly-bootstrapped state.
# Deletes the cluster and rebuilds it from scratch (~90s) — the fastest reliable
# way to undo any experiment you ran during practice.
#
# Usage: ./reset.ps1 [-WithGateway] [-SkipAddons]   (args forwarded to setup.ps1)
param(
	[switch]$WithGateway,
	[switch]$SkipAddons
)
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
& (Join-Path $dir 'teardown.ps1')
& (Join-Path $dir 'setup.ps1') @PSBoundParameters
