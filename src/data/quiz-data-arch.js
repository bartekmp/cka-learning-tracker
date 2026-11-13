// Quiz questions — Cluster Architecture, Installation & Configuration.
QUIZ.push(
	// ── Components and ports ──
	quizQ(
		'arch-scheduler',
		'arch',
		'Which component decides which node a new pod runs on?',
		'kube-scheduler',
		['kubelet', 'kube-proxy', 'kube-controller-manager'],
		'The scheduler watches for pods with no node and picks one based on requests, taints and affinity.'
	),
	quizQ(
		'arch-controller-manager',
		'arch',
		'Which component runs the control loops for ReplicaSets, Nodes and Jobs?',
		'kube-controller-manager',
		['kube-scheduler', 'kube-apiserver', 'etcd'],
		'Each controller compares desired state with actual state and acts on the difference.'
	),
	quizQ(
		'arch-kubelet',
		'arch',
		'Which agent runs on every node and starts the pod containers?',
		'kubelet',
		['kube-proxy', 'containerd', 'kube-scheduler'],
		'The kubelet talks to the container runtime and reports node and pod status to the API server.'
	),
	quizQ(
		'arch-only-apiserver-etcd',
		'arch',
		'Which is the ONLY component that talks to etcd directly?',
		'kube-apiserver',
		['kube-scheduler', 'kubelet', 'kube-controller-manager'],
		'Everything else goes through the API server.'
	),
	quizQ(
		'arch-ccm',
		'arch',
		'Which component holds cloud-provider specific control loops, such as creating load balancers?',
		'cloud-controller-manager',
		['kube-controller-manager', 'kube-scheduler', 'kubelet'],
		'It lets the cloud vendor code evolve separately from the core controllers.'
	),
	quizQ(
		'arch-api-port',
		'arch',
		'Which port does kube-apiserver listen on by default in a kubeadm cluster?',
		'6443',
		['8080', '2379', '10250'],
		'8080 was the old insecure port, removed long ago.'
	),
	quizQ(
		'arch-etcd-ports',
		'arch',
		'Which port do clients (such as the API server) use to reach etcd?',
		'2379',
		['2380', '6443', '10250'],
		'2379 is the client port. 2380 is for etcd peer traffic.'
	),
	quizQ(
		'arch-kubelet-port',
		'arch',
		'Which port does the kubelet API listen on?',
		'10250',
		['6443', '2379', '10257'],
		'The API server uses it for logs and exec.'
	),

	// ── kubeadm and files ──
	quizQ(
		'arch-pod-cidr-flag',
		'arch',
		'Which kubeadm init flag sets the pod network range?',
		'--pod-network-cidr',
		['--service-cidr', '--cluster-cidr-range', '--pod-subnet-mask'],
		'Many CNI plugins need it to match their own config. --service-cidr is for Service IPs.'
	),
	quizQ(
		'arch-admin-conf',
		'arch',
		'Where does kubeadm write the cluster-admin kubeconfig on a control plane node?',
		'/etc/kubernetes/admin.conf',
		[
			'/etc/kubernetes/kubelet.conf',
			'/var/lib/kubelet/config.yaml',
			'/etc/kubernetes/pki/ca.crt',
		],
		'Copy it to ~/.kube/config to use kubectl as admin.'
	),
	quizQ(
		'arch-pki',
		'arch',
		'Where do the cluster certificates and keys live on a kubeadm control plane node?',
		'/etc/kubernetes/pki',
		['/etc/kubernetes/manifests', '/var/lib/etcd', '/etc/ssl/kubernetes'],
		'It includes ca.crt, apiserver.crt and the `etcd/` subdirectory.'
	),
	quizQ(
		'arch-cert-expiry',
		'arch',
		'Which command shows when the kubeadm-managed certificates expire?',
		'kubeadm certs check-expiration',
		['kubectl get certificates', 'kubeadm token list', 'openssl list-certs'],
		'Renew them with `kubeadm certs renew all`, then restart the control plane static pods.'
	),
	quizQ(
		'arch-kubelet-config',
		'arch',
		'Where is the kubelet configuration file on a kubeadm node?',
		'/var/lib/kubelet/config.yaml',
		[
			'/etc/kubernetes/kubelet.yaml',
			'/etc/kubelet/config.json',
			'/etc/kubernetes/manifests/kubelet.yaml',
		],
		'After editing it, run `systemctl restart kubelet`.'
	),
	quizQ(
		'arch-taint-cp',
		'arch',
		'Which taint does kubeadm put on control plane nodes so normal pods stay off them?',
		'node-role.kubernetes.io/control-plane:NoSchedule',
		[
			'node-role.kubernetes.io/master:NoExecute',
			'control-plane=true:NoSchedule',
			'dedicated=control-plane:PreferNoSchedule',
		],
		'To schedule there anyway, add a toleration or remove the taint.'
	),
	quizQ(
		'arch-swap',
		'arch',
		'By default the kubelet refuses to start if which setting is on?',
		'Swap',
		['IPv6', 'SELinux in permissive mode', 'A second network interface'],
		'Disable it with `swapoff -a` and remove the swap line from `/etc/fstab`.'
	),
	quizQ(
		'arch-sysctl',
		'arch',
		'Which sysctl must be 1 on a node so pod traffic can be routed?',
		'net.ipv4.ip_forward',
		['vm.swappiness', 'kernel.panic', 'fs.file-max'],
		'kubeadm preflight checks fail without it. `br_netfilter` is the related kernel module.'
	),
	quizQ(
		'arch-systemd-cgroup',
		'arch',
		'Which containerd setting must match the kubelet cgroup driver on systemd hosts?',
		'SystemdCgroup = true',
		['UseSystemd = enabled', 'cgroup_manager = "cgroupfs"', 'RuntimeType = "systemd"'],
		'It lives in /etc/containerd/config.toml. A mismatch causes unstable pods.'
	),
	quizQ(
		'arch-stacked-etcd',
		'arch',
		'In a "stacked etcd" HA topology, where do the etcd members run?',
		'On the control plane nodes themselves',
		['On dedicated external etcd servers', 'On the worker nodes', 'Inside a StatefulSet'],
		'External etcd means separate hosts. Stacked is simpler but couples the two failure domains.'
	),

	// ── Upgrades and etcd ──
	quizQ(
		'arch-upgrade-plan',
		'arch',
		'What does `kubeadm upgrade plan` do?',
		'Shows which versions you can upgrade to and what will change',
		['Upgrades the control plane', 'Drains the node', 'Rolls back the last upgrade'],
		'It changes nothing. `kubeadm upgrade apply` does the work.'
	),
	quizQ(
		'arch-upgrade-node',
		'arch',
		'Which command upgrades the local kubelet configuration on a WORKER node?',
		'kubeadm upgrade node',
		['kubeadm upgrade apply', 'kubeadm join --upgrade', 'kubectl upgrade node'],
		'`apply` is for the first control plane node only. Other nodes use `kubeadm upgrade node`.'
	),
	quizQ(
		'arch-drain-before',
		'arch',
		'You are about to upgrade a worker node. Which command moves its pods away first?',
		'kubectl drain <node> --ignore-daemonsets',
		[
			'kubectl cordon <node>',
			'kubectl delete node <node>',
			'kubectl taint node <node> drain=true',
		],
		'`drain` cordons and evicts. DaemonSet pods cannot be evicted, hence the flag. Run `uncordon` afterwards.'
	),
	quizQ(
		'arch-uncordon',
		'arch',
		'After the upgrade the node shows SchedulingDisabled. Which command fixes it?',
		'kubectl uncordon <node>',
		[
			'kubectl drain <node> --undo',
			'kubectl taint nodes <node> -',
			'systemctl restart kubelet',
		],
		'`drain` marked the node unschedulable. `uncordon` lifts that.'
	),
	quizQ(
		'arch-skew',
		'arch',
		'Version skew rule: the kubelet must NOT be...',
		'Newer than the kube-apiserver',
		[
			'Older than the kube-proxy',
			'On a different OS than the API server',
			'Using a different container runtime',
		],
		'Upgrade the control plane first, then the nodes.'
	),
	quizQ(
		'arch-etcd-health',
		'arch',
		'Which command checks that an etcd endpoint is healthy?',
		'etcdctl endpoint health',
		['etcdctl check', 'etcdctl member status --all', 'kubectl get etcd'],
		'Add --endpoints and the TLS flags, just like for snapshots.'
	),

	// ── RBAC and access ──
	quizQ(
		'arch-create-role',
		'arch',
		'Which command creates a Role that can get and list pods?',
		'kubectl create role pod-reader --verb=get,list --resource=pods',
		[
			'kubectl create role pod-reader --allow=get,list --on=pods',
			'kubectl create clusterrole pod-reader --verb=get,list --resource=pods -n dev',
			'kubectl grant pods get,list',
		],
		'Add `-n <namespace>` to place it. A ClusterRole is a different object.'
	),
	quizQ(
		'arch-create-rolebinding',
		'arch',
		'Which command binds Role pod-reader to user jane in the current namespace?',
		'kubectl create rolebinding jane-read --role=pod-reader --user=jane',
		[
			'kubectl bind role pod-reader jane',
			'kubectl create rolebinding jane-read --clusterrole=pod-reader --group=jane',
			'kubectl create role jane-read --user=jane',
		],
		'Use --serviceaccount=<ns>:<name> for a ServiceAccount.'
	),
	quizQ(
		'arch-can-i',
		'arch',
		'Which command checks whether user jane may list pods?',
		'kubectl auth can-i list pods --as jane',
		[
			'kubectl get permissions jane',
			'kubectl describe user jane',
			'kubectl rbac check jane list pods',
		],
		'`--as` impersonates the user. Add `-n <ns>` for a namespace.'
	),
	quizQ(
		'arch-clusterrole-rolebinding',
		'arch',
		'A RoleBinding that references a ClusterRole grants those permissions...',
		'Only inside the RoleBinding’s namespace',
		['Cluster-wide', 'Only on cluster-scoped resources', 'Nowhere, this is not allowed'],
		'It is a handy way to reuse one ClusterRole in many namespaces.'
	),
	quizQ(
		'arch-api-group-core',
		'arch',
		'In a Role rule, what does `apiGroups: [""]` refer to?',
		'The core API group (pods, services, configmaps…)',
		['All API groups', 'No API group', 'Only custom resources'],
		'Deployments are in the "apps" group, so they need `apiGroups: ["apps"]`.',
		`rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list"]`
	),
	quizQ(
		'arch-sa-token',
		'arch',
		'Which command prints a short-lived token for ServiceAccount "build"?',
		'kubectl create token build',
		[
			'kubectl get token build',
			'kubectl describe sa build --token',
			'kubectl token create build',
		],
		'Since v1.24 ServiceAccounts no longer get a long-lived Secret token automatically.'
	),
	quizQ(
		'arch-use-context',
		'arch',
		'Which command switches kubectl to another cluster context?',
		'kubectl config use-context <name>',
		['kubectl config set-cluster <name>', 'kubectl switch <name>', 'kubectl context <name>'],
		'`kubectl config get-contexts` lists them.'
	),
	quizQ(
		'arch-kubeconfig-env',
		'arch',
		'Which environment variable makes kubectl read a different kubeconfig file?',
		'KUBECONFIG',
		['KUBE_CONFIG_PATH', 'KUBECTL_CONFIG', 'K8S_CONFIG'],
		'Default is ~/.kube/config. --kubeconfig does the same per command.'
	),

	// ── Helm, Kustomize, CRDs ──
	quizQ(
		'arch-helm-repo-add',
		'arch',
		'Which command registers a chart repository in Helm?',
		'helm repo add <name> <url>',
		['helm add repo <name> <url>', 'helm install repo <name> <url>', 'helm repo create <url>'],
		'Follow with `helm repo update` to fetch the index.'
	),
	quizQ(
		'arch-helm-upgrade',
		'arch',
		'Which command upgrades a release, or installs it if it does not exist?',
		'helm upgrade --install <release> <chart>',
		[
			'helm install --upgrade <release> <chart>',
			'helm apply <release> <chart>',
			'helm replace <release> <chart>',
		],
		'Handy in scripts because it works both times.'
	),
	quizQ(
		'arch-helm-rollback',
		'arch',
		'Which command returns Helm release "web" to its first revision?',
		'helm rollback web 1',
		['helm undo web 1', 'helm revert web --to 1', 'helm install web --revision 1'],
		'`helm history web` lists the revisions.'
	),
	quizQ(
		'arch-helm-template',
		'arch',
		'Which command renders a chart to YAML without installing anything?',
		'helm template <release> <chart>',
		['helm dry <chart>', 'helm show manifests <chart>', 'helm lint <chart>'],
		'Great for reviewing what would be applied. `helm lint` only checks the chart.'
	),
	quizQ(
		'arch-helm-values',
		'arch',
		'Which flags override chart values at install time?',
		'--set key=value and -f values.yaml',
		['--env key=value and --config file', '--override and --patch', '--values-from and --var'],
		'`helm show values <chart>` lists the defaults you can override.'
	),
	quizQ(
		'arch-helm-list',
		'arch',
		'Which command lists the Helm releases in the current namespace?',
		'helm list',
		['helm releases', 'helm get all', 'helm status'],
		'Add -A for all namespaces.'
	),
	quizQ(
		'arch-helm-uninstall',
		'arch',
		'Which command removes a Helm release?',
		'helm uninstall <release>',
		['helm delete --chart <chart>', 'helm remove <chart>', 'kubectl delete release <release>'],
		'The older spelling `helm delete` is an alias.'
	),
	quizQ(
		'arch-kustomize-file',
		'arch',
		'What is the name of the file Kustomize looks for in a directory?',
		'kustomization.yaml',
		['kustomize.yaml', 'overlay.yaml', 'Kustomizefile'],
		'It lists resources and the changes to apply to them.',
		`resources:
  - deployment.yaml
namePrefix: dev-
images:
  - name: nginx
    newTag: "1.27"`
	),
	quizQ(
		'arch-kustomize-preview',
		'arch',
		'Which command prints the Kustomize result without applying it?',
		'kubectl kustomize ./dir',
		['kubectl apply -k ./dir --print', 'kubectl build ./dir', 'kubectl get -k ./dir'],
		'Pipe it to `kubectl apply -f -` if it looks right.'
	),
	quizQ(
		'arch-crd-apiversion',
		'arch',
		'Which apiVersion does a CustomResourceDefinition use?',
		'apiextensions.k8s.io/v1',
		['apps/v1', 'custom.k8s.io/v1', 'v1'],
		'The custom resources themselves use the group you define in the CRD.'
	),
	quizQ(
		'arch-operator',
		'arch',
		'What is an "operator"?',
		'A custom controller that manages a CRD-based resource',
		[
			'A kubectl plugin',
			'A kind of admission webhook only',
			'A node-level daemon for networking',
		],
		'It encodes day-two knowledge such as backups and failover as a control loop.'
	),
	quizQ(
		'arch-cni-dir',
		'arch',
		'Where does the container runtime look for CNI network config files?',
		'/etc/cni/net.d',
		['/opt/cni/conf', '/etc/kubernetes/cni', '/var/lib/cni/config'],
		'The plugin binaries are in /opt/cni/bin. Nodes stay NotReady until a CNI config exists.'
	),
	quizQ(
		'arch-extension-points',
		'arch',
		'Match the interface to its job: CSI is for...',
		'Storage',
		['Networking', 'Container runtimes', 'Scheduling'],
		'CRI = runtimes, CNI = networking, CSI = storage.'
	)
);
