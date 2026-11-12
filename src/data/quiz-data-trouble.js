// Quiz questions — Troubleshooting.
QUIZ.push(
	// ── Reading state ──
	quizQ(
		'tro-describe-events',
		'trouble',
		'Where do you see why a pod is stuck, such as scheduling or image pull errors?',
		'The Events section of `kubectl describe pod`',
		['kubectl get pod -o name', 'kubectl top pod', 'kubectl version'],
		'Events are at the bottom of the output. Read from the bottom up.'
	),
	quizQ(
		'tro-logs-container',
		'trouble',
		'A pod has two containers. Which command shows the logs of container "sidecar"?',
		'kubectl logs web -c sidecar',
		[
			'kubectl logs web --name sidecar',
			'kubectl logs sidecar/web',
			'kubectl logs web sidecar --all',
		],
		'Without `-c`, kubectl asks you to choose or picks the default container.'
	),
	quizQ(
		'tro-logs-follow',
		'trouble',
		'Which command streams the logs of a pod live?',
		'kubectl logs -f web',
		['kubectl logs --live web', 'kubectl logs web --stream', 'kubectl attach logs web'],
		'Combine with --tail=20 to start from the last lines.'
	),
	quizQ(
		'tro-logs-label',
		'trouble',
		'Which command prints logs from all pods labelled app=web?',
		'kubectl logs -l app=web',
		['kubectl logs app=web', 'kubectl logs --all web', 'kubectl get logs -l app=web'],
		'Add --all-containers to include every container.'
	),
	quizQ(
		'tro-exec',
		'trouble',
		'Which command opens a shell in a running pod?',
		'kubectl exec -it web -- sh',
		['kubectl shell web', 'kubectl attach web --sh', 'kubectl run -it web -- sh'],
		'The `--` separates kubectl flags from the command in the container.'
	),
	quizQ(
		'tro-wide',
		'trouble',
		'Which flag shows the node and IP of each pod?',
		'-o wide',
		['--nodes', '-o nodes', '--details'],
		'It adds the IP, NODE and other columns.'
	),
	quizQ(
		'tro-jsonpath',
		'trouble',
		'Which command prints just the names of all pods?',
		"kubectl get pods -o jsonpath='{.items[*].metadata.name}'",
		[
			'kubectl get pods -o names',
			'kubectl get pods --only-name',
			'kubectl get pods -o text=name',
		],
		'`kubectl get pods -o name` also works and prints `pod/<name>`.'
	),
	quizQ(
		'tro-sort-by',
		'trouble',
		'Which flag orders a list by creation time?',
		'--sort-by=.metadata.creationTimestamp',
		['--order=created', '--sort=time', '--newest-first'],
		'Works on any list, such as pods or events.'
	),
	quizQ(
		'tro-field-selector',
		'trouble',
		'Which command lists pods in all namespaces that are not Running?',
		'kubectl get pods -A --field-selector=status.phase!=Running',
		[
			'kubectl get pods -A --not-running',
			'kubectl get pods -A -l status!=Running',
			'kubectl get pods --failed',
		],
		'Completed pods show up here too.'
	),
	quizQ(
		'tro-api-resources',
		'trouble',
		'Which command lists every resource type, with short names and whether it is namespaced?',
		'kubectl api-resources',
		['kubectl get all', 'kubectl explain', 'kubectl get types'],
		'Useful to find the right kind or short name quickly.'
	),

	// ── Pod states ──
	quizQ(
		'tro-pending-cpu',
		'trouble',
		'Events say "0/3 nodes are available: 3 Insufficient cpu". What is the fix?',
		'Lower the pod CPU request or add node capacity',
		['Restart the kubelet', 'Delete the Service', 'Add a toleration'],
		'The scheduler compares requests with what is still free on each node.'
	),
	quizQ(
		'tro-no-events',
		'trouble',
		'A pod is Pending and describe shows NO scheduling events at all. What is most likely down?',
		'kube-scheduler',
		['kube-proxy', 'CoreDNS', 'The container runtime'],
		'No scheduler means nobody even tries to place the pod. Check its static pod.'
	),
	quizQ(
		'tro-containercreating',
		'trouble',
		'A pod hangs in ContainerCreating. Which is a likely cause?',
		'A missing PVC, ConfigMap or Secret, or a CNI problem',
		[
			'The liveness probe is failing',
			'The image exits with code 1',
			'The Service selector is wrong',
		],
		'Events show FailedMount or a sandbox creation error.'
	),
	quizQ(
		'tro-cfgerr',
		'trouble',
		'Status CreateContainerConfigError usually means...',
		'A referenced ConfigMap or Secret (or key) does not exist',
		['The image tag does not exist', 'The node is out of memory', 'The probe path is wrong'],
		'Check env.valueFrom and volume references.'
	),
	quizQ(
		'tro-init-stuck',
		'trouble',
		'A pod shows Init:0/1 for minutes. Which command finds out why?',
		'kubectl logs <pod> -c <init-container-name>',
		['kubectl logs <pod> --previous', 'kubectl top pod <pod>', 'kubectl rollout status <pod>'],
		'The app container has not started yet, so the init container holds the answer.'
	),
	quizQ(
		'tro-exit-137',
		'trouble',
		'A container ends with exit code 137. What does that most often mean?',
		'It was killed with SIGKILL, often by the OOM killer',
		['It exited normally', 'A permissions error', 'The image was not found'],
		'137 = 128 + 9. Check Reason: OOMKilled in describe.'
	),
	quizQ(
		'tro-exit-143',
		'trouble',
		'Exit code 143 means the container...',
		'Was stopped with SIGTERM, a normal shutdown request',
		['Ran out of memory', 'Hit a segmentation fault', 'Could not pull its image'],
		'143 = 128 + 15.'
	),
	quizQ(
		'tro-running-0-1',
		'trouble',
		'A pod is Running but READY shows 0/1. What is failing?',
		'The readiness probe',
		['The liveness probe', 'The image pull', 'The scheduler'],
		'It stays out of Service endpoints until it is ready.'
	),
	quizQ(
		'tro-evicted',
		'trouble',
		'Many pods show Evicted. Which node condition is a likely cause?',
		'DiskPressure or MemoryPressure',
		['NetworkUnavailable', 'Ready', 'Unschedulable'],
		'`kubectl describe node` lists the conditions.'
	),
	quizQ(
		'tro-terminating',
		'trouble',
		'A pod is stuck Terminating. Which command force-removes it from the API?',
		'kubectl delete pod web --force --grace-period=0',
		[
			'kubectl kill pod web',
			'kubectl delete pod web --now --hard',
			'kubectl terminate pod web',
		],
		'Last resort: the container may still be running on the node.'
	),
	quizQ(
		'tro-drain-stuck',
		'trouble',
		'`kubectl drain` hangs. Which is a common reason?',
		'A PodDisruptionBudget does not allow evicting another pod',
		['The node has no kubelet', 'The Service is headless', 'The namespace is empty'],
		'Check `kubectl get pdb -A`. A pod without a controller needs `--force`.'
	),
	quizQ(
		'tro-oom-limit',
		'trouble',
		'A pod keeps getting OOMKilled. What is the most direct fix?',
		'Raise its memory limit, or reduce the app’s memory use',
		['Increase the CPU limit', 'Add a toleration', 'Change the restart policy'],
		'CPU is throttled. Memory is killed.'
	),

	// ── Services and DNS ──
	quizQ(
		'tro-svc-curl',
		'trouble',
		'Which check separates "DNS is broken" from "the Service is broken"?',
		'Call the Service ClusterIP directly from a pod',
		['Restart all pods', 'Delete the Endpoints object', 'Check the node CIDR'],
		'If the IP works but the name does not, look at CoreDNS.'
	),
	quizQ(
		'tro-coredns-check',
		'trouble',
		'In-cluster name lookups fail. Where do you look first?',
		'The CoreDNS pods and their logs in kube-system',
		['The kubelet config on each node', 'The Ingress controller', 'etcd health'],
		'`kubectl -n kube-system get pods -l k8s-app=kube-dns`'
	),
	quizQ(
		'tro-netpol-block',
		'trouble',
		'Pods could reach each other yesterday, today they cannot. A new object appeared. Which?',
		'A NetworkPolicy selecting the destination pods',
		['A new ConfigMap', 'A new Namespace', 'A new PriorityClass'],
		'`kubectl get netpol -A` shows what exists.'
	),
	quizQ(
		'tro-ingress-404',
		'trouble',
		'An Ingress returns 404 from the controller. What do you verify first?',
		'Host, path, backend Service name and port in the Ingress rule',
		['The node taints', 'The StorageClass', 'The kubelet certificate'],
		'`kubectl describe ingress` shows the backends and whether they resolve to endpoints.'
	),
	quizQ(
		'tro-ingress-502',
		'trouble',
		'The ingress controller answers 503 or 502. What does that suggest?',
		'The backend Service has no ready endpoints',
		['The TLS certificate is expired', 'The DNS name is wrong', 'The Ingress class is missing'],
		'Check `kubectl get endpoints` for that Service.'
	),
	quizQ(
		'tro-pvc-describe',
		'trouble',
		'Which command tells you why a PVC is Pending?',
		'kubectl describe pvc <name>',
		['kubectl logs pvc <name>', 'kubectl top pvc <name>', 'kubectl get pv --why'],
		'Events show, for example, "no persistent volumes available for this claim".'
	),

	// ── Nodes and control plane ──
	quizQ(
		'tro-describe-node',
		'trouble',
		'Which command shows node conditions, taints, allocatable resources and the pods on it?',
		'kubectl describe node <name>',
		['kubectl get node <name> --all', 'kubectl top node <name>', 'kubectl logs node/<name>'],
		'Look at Conditions first.'
	),
	quizQ(
		'tro-kubelet-logs',
		'trouble',
		'Which command shows kubelet logs on a systemd node?',
		'journalctl -u kubelet',
		['kubectl logs kubelet', '`cat /var/log/kubelet.yaml`', 'systemctl logs kubelet --pods'],
		'Add `-f` to follow, and `-n 100` for the last lines.'
	),
	quizQ(
		'tro-kubelet-restart',
		'trouble',
		'You fixed /var/lib/kubelet/config.yaml. What next?',
		'systemctl restart kubelet',
		['kubectl rollout restart kubelet', 'kubeadm reset', 'kubectl delete node'],
		'The kubelet is a systemd service, not a pod.'
	),
	quizQ(
		'tro-kubelet-down',
		'trouble',
		'A worker is NotReady and `systemctl status kubelet` shows it stopped. What do you run?',
		'`systemctl start kubelet` (and enable it)',
		['kubectl uncordon <node>', 'kubectl drain <node>', 'kubeadm token create'],
		'Then read `journalctl -u kubelet` if it fails to stay up.'
	),
	quizQ(
		'tro-cp-manifest',
		'trouble',
		'kube-apiserver is down after you edited its manifest. Where do you look?',
		'The file in /etc/kubernetes/manifests and the container logs via crictl',
		['kubectl logs kube-apiserver', 'The kube-proxy ConfigMap', 'kubectl describe apiserver'],
		'kubectl does not work without the API server. `crictl ps -a` and `crictl logs` do.'
	),
	quizQ(
		'tro-crictl-logs',
		'trouble',
		'Which command shows the logs of a container directly through the runtime?',
		'crictl logs <container-id>',
		['kubectl logs --runtime <id>', 'docker logs <id> (always)', 'journalctl -u crictl'],
		'Find the ID with `crictl ps -a`.'
	),
	quizQ(
		'tro-scheduler-flag',
		'trouble',
		'The scheduler static pod crash-loops after an edit. What is the most likely cause?',
		'A typo in its manifest, such as a wrong flag or path',
		['A full PVC', 'A missing Ingress', 'A Service of the wrong type'],
		'Compare with a working manifest and read `crictl logs`.'
	),
	quizQ(
		'tro-cert-expired',
		'trouble',
		'kubectl fails with "x509: certificate has expired". Which command renews the cluster certificates?',
		'kubeadm certs renew all',
		[
			'kubectl certificate renew',
			'kubeadm token create',
			'`openssl renew /etc/kubernetes/pki`',
		],
		'Restart the control plane static pods afterwards.'
	),
	quizQ(
		'tro-kubeconfig-refused',
		'trouble',
		'kubectl says "connection refused" to `localhost:8080`. What does that usually mean?',
		'No kubeconfig was found, so kubectl used its default address',
		['etcd is full', 'The CNI is broken', 'The node has no swap'],
		'Check `KUBECONFIG` and ~/.kube/config, or run with --kubeconfig.'
	),
	quizQ(
		'tro-current-context',
		'trouble',
		'Your commands hit the wrong cluster. Which command shows the active context?',
		'kubectl config current-context',
		['kubectl cluster-info dump', 'kubectl whoami', 'kubectl get context'],
		'`kubectl config get-contexts` lists all of them with a * on the active one.'
	),
	quizQ(
		'tro-readyz',
		'trouble',
		'Which command checks the API server health endpoint in detail?',
		"kubectl get --raw='/readyz?verbose'",
		['kubectl get health', 'kubectl cluster-health', 'kubectl status apiserver'],
		'It lists each internal check with ok or failed.'
	),
	quizQ(
		'tro-top-nodes',
		'trouble',
		'Which command shows CPU and memory use per node?',
		'kubectl top nodes',
		['kubectl get nodes --usage', 'kubectl describe nodes --top', 'kubectl metrics nodes'],
		'Needs metrics-server. `kubectl top pods` does the same for pods.'
	),
	quizQ(
		'tro-top-containers',
		'trouble',
		'Which flag makes `kubectl top pods` break usage down per container?',
		'--containers',
		['--detail', '-o wide', '--split'],
		'Useful for finding the memory hog in a multi-container pod.'
	),
	quizQ(
		'tro-events-watch',
		'trouble',
		'Which command watches cluster events as they happen?',
		'kubectl get events -w',
		['kubectl logs events -f', 'kubectl watch events', 'kubectl top events'],
		'Add -A for every namespace.'
	),
	quizQ(
		'tro-diff',
		'trouble',
		'Which command shows what an apply would change, without changing anything?',
		'kubectl diff -f manifest.yaml',
		[
			'kubectl apply --show -f manifest.yaml',
			'kubectl get -f manifest.yaml --changes',
			'kubectl describe -f manifest.yaml --plan',
		],
		'Add --dry-run=server on apply to validate against the API server too.'
	),
	quizQ(
		'tro-etcd-health',
		'trouble',
		'The cluster is slow and API calls time out. Which component’s health do you check?',
		'etcd',
		['CoreDNS', 'kube-proxy', 'The Ingress controller'],
		'Use `etcdctl endpoint health` with the TLS flags.'
	),
	quizQ(
		'tro-wrong-image-tag',
		'trouble',
		'Events say "manifest for nginx:1.99 not found". What is wrong?',
		'The image tag does not exist',
		['The registry password is wrong', 'The node is out of disk', 'The pod has no label'],
		'Fix the tag, or check the spelling of the image name.'
	),
	quizQ(
		'tro-pull-secret',
		'trouble',
		'A private image fails with "unauthorized". What do you add to the pod?',
		'imagePullSecrets referencing a docker-registry Secret',
		['A ConfigMap with the password', 'A toleration', 'hostNetwork: true'],
		'`kubectl create secret docker-registry` creates it.'
	),
	quizQ(
		'tro-debug-node',
		'trouble',
		'Which command starts a debugging pod on a node, with the node filesystem under /host?',
		'kubectl debug node/<name> -it --image=busybox',
		[
			'kubectl exec node/<name> -- sh',
			'kubectl attach node/<name>',
			'kubectl run node-shell --node=<name>',
		],
		'Handy when SSH is not available.'
	),
	quizQ(
		'tro-previous-vs-current',
		'trouble',
		'What does the `--previous` flag of `kubectl logs` show?',
		'Logs of the container instance that ran before the last restart',
		[
			'Logs from the previous namespace',
			'Logs of the previous pod revision',
			'Older kubelet logs',
		],
		'It is the key to crash-loop debugging.'
	)
);
