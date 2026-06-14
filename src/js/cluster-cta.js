// Practice-cluster call-to-action. Shared by the landing page and the practice
// tasks page: localises the bootstrap one-liners to whatever host serves the
// page, and wires up click-to-copy on the command rows.
(function () {
	// The cluster/ dir is always a sibling of the page, so resolving it relative
	// to the document works on any origin or sub-path (github.io, learning.lel.lu/cka,
	// localhost, …). get.sh / get.ps1 are self-contained, so this is the only URL.
	function localiseCommands() {
		var base;
		try {
			base = new URL('cluster', document.baseURI).href.replace(/\/+$/, '');
		} catch (_err) {
			return; // keep the static fallback URL baked into the markup
		}
		var unix = document.getElementById('cmd-unix');
		var win = document.getElementById('cmd-win');
		if (unix) {
			unix.textContent = 'curl -fsSL ' + base + '/get.sh | bash';
		}
		if (win) {
			win.textContent = 'irm ' + base + '/get.ps1 | iex';
		}
	}

	function wireCopy() {
		document.querySelectorAll('.cmd').forEach(function (row) {
			row.addEventListener('click', function () {
				var code = row.querySelector('code');
				var label = row.querySelector('.cmd-copy');
				if (!code) return;
				navigator.clipboard.writeText(code.textContent.trim()).then(function () {
					if (!label) return;
					var prev = label.textContent;
					label.textContent = 'Copied!';
					setTimeout(function () {
						label.textContent = prev;
					}, 1500);
				});
			});
		});
	}

	document.addEventListener('DOMContentLoaded', function () {
		localiseCommands();
		wireCopy();
	});
})();
