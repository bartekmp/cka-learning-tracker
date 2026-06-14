#!/usr/bin/env node
// Cross-platform dispatcher for the CKA practice-cluster scripts.
// Picks the PowerShell scripts on Windows and the Bash scripts everywhere else,
// so `npm run cluster:up` / `:down` / `:reset` / `:status` behave the same.
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const isWin = process.platform === 'win32';
const [, , action, ...rest] = process.argv;

const clusterName = process.env.CLUSTER_NAME || 'cka';
const context = `kind-${clusterName}`;

function run(cmd, args) {
	const res = spawnSync(cmd, args, { stdio: 'inherit', cwd: here });
	if (res.error) {
		console.error(`failed to launch ${cmd}: ${res.error.message}`);
		process.exit(1);
	}
	process.exit(res.status ?? 0);
}

// Invoke a platform script (e.g. "setup") with any extra args forwarded.
function script(name) {
	if (isWin) {
		run('powershell', [
			'-ExecutionPolicy',
			'Bypass',
			'-File',
			join(here, `${name}.ps1`),
			...rest,
		]);
	} else {
		run('bash', [join(here, `${name}.sh`), ...rest]);
	}
}

switch (action) {
	case 'up':
		script('setup');
		break;
	case 'down':
		script('teardown');
		break;
	case 'reset':
		script('reset');
		break;
	case 'status':
		// Pure kubectl — works the same on every platform.
		run('kubectl', ['--context', context, 'get', 'nodes,pods', '-A', '-o', 'wide']);
		break;
	default:
		console.error('usage: node cluster/cluster.mjs <up|down|reset|status> [-- extra args]');
		process.exit(1);
}
