#!/usr/bin/env bash
#
# Reset the CKA practice cluster to a clean, freshly-bootstrapped state.
# This deletes the cluster and rebuilds it from scratch (~90s), which is the
# fastest reliable way to undo any experiment you ran during practice.
#
# Usage: ./reset.sh [--with-gateway] [--skip-addons]   (args forwarded to setup.sh)
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

"${DIR}/teardown.sh"
"${DIR}/setup.sh" "$@"
