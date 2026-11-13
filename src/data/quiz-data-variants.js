// Quiz questions — look-alike variants. Each group changes one detail of a
// practice task (an effect, a flag, a field) so the answer changes with it.
// Ids are named after the task: t6 = "Taint a node and add a Toleration", …
QUIZ.push(
	// ── Workloads & Scheduling ────────────────────────────────────────────────
	// t6 — taint effects
	quizQ(
		'var-t6-noschedule-running',
		'workloads',
		'A node gets the taint gpu=true:NoSchedule. What happens to a pod without a toleration that is already running there?',
		'It keeps running',
		['It is evicted at once', 'It is evicted after 5 minutes', 'It is moved to another node'],
		'NoSchedule only affects scheduling of new pods.'
	),
	quizQ(
		'var-t6-noexecute-running',
		'workloads',
		'A node gets the taint gpu=true:NoExecute. What happens to a pod without a toleration that is already running there?',
		'It is evicted',
		[
			'It keeps running',
			'It stays but cannot restart',
			'It is paused until the taint is removed',
		],
		'NoExecute also evicts running pods that do not tolerate it.'
	),
	quizQ(
		'var-t6-wrong-effect',
		'workloads',
		'The node is tainted gpu=true:NoExecute. A pod tolerates key gpu with effect NoSchedule. Can it run there?',
		'No, the effect does not match',
		[
			'Yes, the key matches',
			'Yes, but only if it is already running',
			'Yes, NoSchedule covers NoExecute',
		],
		'A toleration must match the taint’s effect (or omit the effect to match all).'
	),
	quizQ(
		'var-t6-prefer',
		'workloads',
		'What does the taint effect PreferNoSchedule do?',
		'The scheduler avoids the node but may still use it',
		['It never schedules there', 'It evicts running pods', 'It only blocks DaemonSets'],
		'It is the soft version of NoSchedule.'
	),

	// t14 / t50 — drain
	quizQ(
		'var-t14-cordon',
		'workloads',
		'What does kubectl cordon worker1 do?',
		'Marks the node unschedulable; running pods stay',
		['Evicts all pods', 'Evicts pods except DaemonSets', 'Deletes the node object'],
		'cordon only blocks new pods. drain = cordon + evict.'
	),
	quizQ(
		'var-t14-drain-daemonset',
		'workloads',
		'kubectl drain fails: "cannot delete DaemonSet-managed Pods". What is the fix?',
		'Add --ignore-daemonsets',
		['Add --delete-emptydir-data', 'Add --force-daemonsets', 'Cordon the node first'],
		'DaemonSet pods would be recreated on the node at once, so drain is told to skip them.'
	),
	quizQ(
		'var-t14-drain-emptydir',
		'workloads',
		'kubectl drain fails: "cannot delete Pods with local storage". What is the fix?',
		'Add --delete-emptydir-data',
		['Add --ignore-daemonsets', 'Add --local-storage=false', 'Add --grace-period=0'],
		'emptyDir contents are lost on eviction, so drain asks you to confirm.'
	),
	quizQ(
		'var-t14-uncordon',
		'workloads',
		'After maintenance a drained node still shows SchedulingDisabled. Which command fixes that?',
		'kubectl uncordon worker1',
		[
			'kubectl undrain worker1',
			'kubectl taint nodes worker1 -',
			'kubectl drain worker1 --undo',
		],
		'drain cordons the node; uncordon lets the scheduler use it again.'
	),
	quizQ(
		'var-t50-pdb-3-of-3',
		'workloads',
		'Deployment with 3 replicas, PDB minAvailable: 3. You drain a node that runs one of them. Result?',
		'The drain blocks; eviction is refused',
		[
			'One pod is evicted and rescheduled',
			'All three pods are evicted',
			'The PDB is ignored by drain',
		],
		'No pod can be removed without dropping below 3 available.'
	),
	quizQ(
		'var-t50-pdb-2-of-3',
		'workloads',
		'Deployment with 3 replicas, PDB minAvailable: 2. You drain a node that runs one of them. Result?',
		'The pod is evicted; the drain proceeds',
		[
			'The drain blocks',
			'All three pods are evicted',
			'The PDB blocks drain only for DaemonSets',
		],
		'One pod may go as long as 2 stay available.'
	),
	quizQ(
		'var-t50-pdb-max-unavailable',
		'workloads',
		'PDB with maxUnavailable: 0 on a 3-replica Deployment. What does a drain do?',
		'It blocks; no voluntary eviction is allowed',
		['It evicts one pod at a time', 'It ignores the PDB', 'It evicts all pods in parallel'],
		'maxUnavailable: 0 is the same as minAvailable: 100%.'
	),

	// t8 — requests vs limits
	quizQ(
		'var-t8-memory-limit',
		'workloads',
		'A container goes above its memory limit. What happens?',
		'It is OOMKilled',
		[
			'It is throttled',
			'It is evicted at once without a restart',
			'Nothing, limits are advisory',
		],
		'Memory cannot be throttled, so the kernel kills the process.'
	),
	quizQ(
		'var-t8-cpu-limit',
		'workloads',
		'A container goes above its CPU limit. What happens?',
		'It is throttled',
		['It is OOMKilled', 'It is evicted', 'The pod is rescheduled'],
		'CPU is compressible: the container is slowed down, not killed.'
	),
	quizQ(
		'var-t8-pending-cpu',
		'workloads',
		'A pod requests 100 CPUs and no node has that much. What state is it in, and why?',
		'Pending: Insufficient cpu',
		['CrashLoopBackOff: OOMKilled', 'ContainerCreating: image pull', 'Failed: quota exceeded'],
		'The scheduler cannot place it; the Events section says "0/2 nodes are available: Insufficient cpu".'
	),

	// t27 — node affinity
	quizQ(
		'var-t27-required-nomatch',
		'workloads',
		'No node has the label zone=us-east. The pod has a REQUIRED node affinity for it. Result?',
		'The pod stays Pending',
		['It runs on any node', 'It runs on the control plane', 'It fails with an error on apply'],
		'Required rules are hard. The pod waits until a node matches.'
	),
	quizQ(
		'var-t27-preferred-nomatch',
		'workloads',
		'No node has the label zone=us-east. The pod has a PREFERRED node affinity for it. Result?',
		'It is scheduled on any node',
		['The pod stays Pending', 'The pod is rejected', 'It waits for a node to get the label'],
		'Preferred rules only add weight to matching nodes.'
	),
	quizQ(
		'var-t27-notin',
		'workloads',
		'Which operator keeps a pod OFF nodes labelled zone=us-east?',
		'NotIn',
		['In', 'Exists', 'Equal'],
		'Node affinity operators: In, NotIn, Exists, DoesNotExist, Gt, Lt. Equal is for tolerations.'
	),

	// t28 — priority
	quizQ(
		'var-t28-preempt',
		'workloads',
		'The cluster is full of pods with priority 100. A pod with priority 1000 is Pending. What does the scheduler do?',
		'Preempts (evicts) lower-priority pods to make room',
		['Waits for a node to free up', 'Evicts pods at random', 'Lowers the new pod’s priority'],
		'Preemption is the point of a PriorityClass.'
	),
	quizQ(
		'var-t28-preempt-never',
		'workloads',
		'Same situation, but the PriorityClass has preemptionPolicy: Never. What happens?',
		'The pod is queued ahead of others but evicts nothing',
		['It still preempts', 'It is rejected', 'It runs on the control plane'],
		'Never keeps the queue priority but turns off eviction.'
	),

	// t7 — DaemonSet
	quizQ(
		'var-t7-daemonset-replicas',
		'workloads',
		'You turn a generated Deployment YAML into a DaemonSet. Which field must you remove?',
		'spec.replicas',
		['spec.selector', 'spec.template', 'metadata.name'],
		'A DaemonSet runs one pod per node; it has no replica count.'
	),
	quizQ(
		'var-t7-daemonset-cp',
		'workloads',
		'A DaemonSet pod is missing on the control plane node. Why?',
		'The node is tainted and the pod has no toleration',
		['DaemonSets never run on control planes', 'replicas is too low', 'The node is cordoned'],
		'Add a toleration for node-role.kubernetes.io/control-plane.'
	),

	// t11 — rollout
	quizQ(
		'var-t11-history',
		'workloads',
		'Which command lists the revisions of a Deployment?',
		'kubectl rollout history deployment/app-v1',
		[
			'kubectl rollout status deployment/app-v1',
			'kubectl get revisions deployment/app-v1',
			'kubectl describe rollout app-v1',
		],
		'status waits for a rollout to finish; history lists revisions.'
	),
	quizQ(
		'var-t11-status',
		'workloads',
		'Which command blocks until a rollout has finished?',
		'kubectl rollout status deployment/app-v1',
		[
			'kubectl rollout history deployment/app-v1',
			'kubectl wait deployment/app-v1',
			'kubectl rollout pause deployment/app-v1',
		],
		'It exits non-zero if the rollout fails, which suits scripts.'
	),
	quizQ(
		'var-t11-undo-default',
		'workloads',
		'kubectl rollout undo deployment/app-v1 without --to-revision goes to…',
		'the previous revision',
		['revision 1', 'the newest revision', 'the revision with the most replicas'],
		'Add --to-revision=N to pick another one.'
	),

	// t12 — config injection
	quizQ(
		'var-t12-env-update',
		'workloads',
		'A ConfigMap used via envFrom is edited. What happens to a running pod?',
		'Nothing; env vars are read at start, so restart the pod',
		[
			'The env vars update within a minute',
			'The pod restarts by itself',
			'The pod is marked NotReady',
		],
		'Only volume-mounted ConfigMaps are refreshed in place.'
	),
	quizQ(
		'var-t12-volume-update',
		'workloads',
		'A ConfigMap mounted as a volume is edited. What happens to a running pod?',
		'The files update after a short delay',
		['Nothing until the pod restarts', 'The pod restarts by itself', 'The files are deleted'],
		'The kubelet syncs the files. A subPath mount is the exception: it never updates.'
	),

	// t31 / t32 — Job and CronJob
	quizQ(
		'var-t31-restart-policy',
		'workloads',
		'Which restartPolicy is NOT allowed in a Job’s pod template?',
		'Always',
		['Never', 'OnFailure', 'All three are allowed'],
		'Jobs need pods that can finish: Never or OnFailure.'
	),
	quizQ(
		'var-t32-schedule-daily',
		'workloads',
		'Which schedule runs a CronJob every day at 02:30?',
		'30 2 * * *',
		['2 30 * * *', '*/30 2 * * *', '30 2 * * 0'],
		'Fields: minute hour day-of-month month day-of-week.'
	),
	quizQ(
		'var-t32-forbid',
		'workloads',
		'CronJob concurrencyPolicy: Forbid. The previous run is still going when the next is due. What happens?',
		'The new run is skipped',
		['The old run is replaced', 'Both run at once', 'The CronJob is suspended'],
		'Allow runs both, Replace swaps the old for the new, Forbid skips the new one.'
	),
	quizQ(
		'var-t32-replace',
		'workloads',
		'CronJob concurrencyPolicy: Replace. The previous run is still going when the next is due. What happens?',
		'The old run is cancelled and a new one starts',
		['The new run is skipped', 'Both run at once', 'The new run waits'],
		'Forbid would skip the new one instead.'
	),

	// t42 — HPA
	quizQ(
		'var-t42-unknown',
		'workloads',
		'kubectl get hpa shows <unknown>/50% for TARGETS. Which is a likely cause?',
		'metrics-server is missing, or the pods set no CPU request',
		[
			'The max replicas is too low',
			'The Deployment has too few replicas',
			'The HPA is in the wrong namespace',
		],
		'A utilisation percentage needs metrics and a request to compare against.'
	),

	// t49 / t53 — sidecars, probes
	quizQ(
		'var-t49-sidecar-where',
		'workloads',
		'Where does a native sidecar container go in the pod spec?',
		'In initContainers with restartPolicy: Always',
		[
			'In containers with sidecar: true',
			'In ephemeralContainers',
			'In containers with lifecycle.type: Sidecar',
		],
		'It starts before the app containers and keeps running next to them.'
	),
	quizQ(
		'var-t53-liveness',
		'workloads',
		'A liveness probe keeps failing. What does the kubelet do?',
		'Restarts the container',
		['Removes the pod from Service endpoints', 'Deletes the pod', 'Marks the node NotReady'],
		'Failing liveness means a restart (restartCount grows). The pod can end up in CrashLoopBackOff.'
	),
	quizQ(
		'var-t53-readiness',
		'workloads',
		'A readiness probe keeps failing. What happens?',
		'The pod stays Running but gets no Service traffic',
		['The container is restarted', 'The pod is deleted', 'The Deployment rolls back'],
		'READY shows 0/1 and the pod IP is removed from the endpoints.'
	),
	quizQ(
		'var-t53-startup',
		'workloads',
		'Which probe holds off liveness and readiness checks until a slow app has started?',
		'startupProbe',
		['initProbe', 'bootProbe', 'delayProbe'],
		'Once the startup probe succeeds, the other two take over.'
	),

	// t13 — init containers
	quizQ(
		'var-t13-init-order',
		'workloads',
		'A pod has two init containers and one app container. In what order do they run?',
		'Init containers one after another, then the app',
		[
			'All three at the same time',
			'The app first, then the init containers',
			'Init containers in parallel, then the app',
		],
		'Each init container must finish successfully before the next starts.'
	),
	quizQ(
		'var-t13-init-status',
		'workloads',
		'Pod status shows Init:0/1. What does it mean?',
		'The init container has not finished yet',
		[
			'The app has 0 of 1 replicas ready',
			'The init container failed to be created',
			'The pod has no init containers',
		],
		'Check kubectl logs <pod> -c <init-container>.'
	),

	// ── Cluster Architecture, Installation & Configuration ────────────────────
	// t15 — etcd
	quizQ(
		'var-t15-snapshot-status',
		'arch',
		'Which etcdctl command shows the hash, revision and key count of a snapshot file?',
		'etcdctl snapshot status <file>',
		['etcdctl snapshot save <file>', 'etcdctl snapshot restore <file>', 'etcdctl member list'],
		'Handy to check a backup before relying on it.'
	),
	quizQ(
		'var-t15-restore-manifest',
		'arch',
		'After restoring a snapshot into /var/lib/etcd-restored, what must you change in /etc/kubernetes/manifests/etcd.yaml?',
		'The --data-dir flag and the hostPath volume path',
		[
			'Only the --data-dir flag',
			'Only the hostPath volume path',
			'The --listen-client-urls flag',
		],
		'Both must point at the new directory, or etcd keeps using the old data.'
	),
	quizQ(
		'var-t15-listen',
		'arch',
		'In the etcd static pod manifest, which flag tells you where etcdctl should connect?',
		'--listen-client-urls',
		['--data-dir', '--peer-cert-file', '--initial-cluster'],
		'etcdctl --endpoints must match the client URL; the cert flags in the same file give the cert paths.'
	),

	// t33 — kubeadm upgrade
	quizQ(
		'var-t33-second-cp',
		'arch',
		'You upgraded the first control plane node with kubeadm upgrade apply. Which command upgrades a SECOND control plane node?',
		'kubeadm upgrade node',
		['kubeadm upgrade apply', 'kubeadm upgrade plan', 'kubeadm join --upgrade'],
		'apply is only for the first control plane node.'
	),
	quizQ(
		'var-t33-order',
		'arch',
		'Correct order for upgrading a worker node?',
		'Drain, upgrade kubeadm, kubeadm upgrade node, upgrade kubelet, uncordon',
		[
			'Upgrade kubelet, kubeadm upgrade apply, drain, uncordon',
			'Upgrade kubeadm, uncordon, drain, restart kubelet',
			'kubeadm upgrade plan, drain, kubeadm upgrade apply, uncordon',
		],
		'Drain first so workloads move away while the kubelet restarts.'
	),
	quizQ(
		'var-t33-kubelet-restart',
		'arch',
		'After installing the new kubelet package, what is the usual next step?',
		'systemctl daemon-reload, then systemctl restart kubelet',
		[
			'kubeadm upgrade apply again',
			'Reboot the node',
			'kubectl rollout restart daemonset kubelet',
		],
		'The kubelet is a systemd service, not a pod.'
	),

	// t16 / t34 — RBAC
	quizQ(
		'var-t16-can-i-create',
		'arch',
		'Role pod-reader (get, list, watch on pods) is bound to ServiceAccount reader in namespace apps. Can it create pods in apps?',
		'No, create is not in the role',
		[
			'Yes, it is namespaced to apps',
			'Yes, ServiceAccounts can create their own pods',
			'Only with a ClusterRoleBinding',
		],
		'RBAC is additive: only the listed verbs are allowed.'
	),
	quizQ(
		'var-t16-can-i-other-ns',
		'arch',
		'The same Role and RoleBinding live in namespace apps. Can reader list pods in namespace default?',
		'No, a RoleBinding only grants inside its own namespace',
		['Yes, pods are cluster resources', 'Yes, if the pod exists', 'Only in kube-system'],
		'A Role is namespaced. Use a ClusterRole + ClusterRoleBinding for cluster-wide access.'
	),
	quizQ(
		'var-t34-clusterrole-rolebinding',
		'arch',
		'A ClusterRole secret-reader is bound with a RoleBinding in namespace tools. Where can the subject read secrets?',
		'Only in namespace tools',
		['In every namespace', 'In no namespace', 'In tools and kube-system'],
		'The binding’s scope decides. ClusterRole + RoleBinding = one namespace.'
	),
	quizQ(
		'var-t34-clusterrole-clusterrolebinding',
		'arch',
		'A ClusterRole secret-reader is bound with a ClusterRoleBinding. Where can the subject read secrets?',
		'In every namespace',
		['Only in the subject’s own namespace', 'In no namespace', 'Only in kube-system'],
		'ClusterRole + ClusterRoleBinding = cluster-wide.'
	),

	// t17 — securityContext
	quizQ(
		'var-t17-pod-vs-container',
		'arch',
		'runAsUser is set to 1000 on the pod and to 2000 on one container. Which user does that container run as?',
		'2000, the container setting wins',
		['1000, the pod setting wins', 'Root, they cancel out', 'The pod fails to start'],
		'Container-level securityContext overrides the pod level.'
	),
	quizQ(
		'var-t17-capabilities-level',
		'arch',
		'Where can you set capabilities.drop?',
		'Only in the container securityContext',
		['Only in the pod securityContext', 'In both', 'Only in a PodSecurityPolicy'],
		'capabilities and readOnlyRootFilesystem are container-level fields.'
	),

	// t35 — CSR
	quizQ(
		'var-t35-deny',
		'arch',
		'Which command rejects a pending CertificateSigningRequest?',
		'kubectl certificate deny <name>',
		[
			'kubectl certificate reject <name>',
			'kubectl delete csr <name> --deny',
			'kubectl certificate revoke <name>',
		],
		'approve and deny are the two decisions.'
	),
	quizQ(
		'var-t35-usages',
		'arch',
		'A CSR for a user certificate (client login) needs which usage in its spec?',
		'client auth',
		['server auth', 'digital signature only', 'cert sign'],
		'Together with signerName: kubernetes.io/kube-apiserver-client.'
	),

	// t52 — admission policy
	quizQ(
		'var-t52-warn',
		'arch',
		'A ValidatingAdmissionPolicyBinding uses validationActions: ["Warn"]. A Deployment violates the rule. Result?',
		'It is created, and the client sees a warning',
		['It is rejected', 'It is created silently', 'It is created and scaled to 0'],
		'Deny rejects, Warn tells the client, Audit only writes to the audit log.'
	),
	quizQ(
		'var-t52-namespace-selector',
		'arch',
		'The binding’s namespaceSelector matches policy=strict. A violating Deployment goes into a namespace without that label. Result?',
		'It is created; the policy does not apply there',
		['It is rejected', 'It is created with a warning', 'The binding is deleted'],
		'A policy only acts where a binding selects the object.'
	),

	// t44 — kustomize
	quizQ(
		'var-t44-render',
		'arch',
		'Which command prints the kustomized YAML without applying it?',
		'kubectl kustomize <dir>',
		['kubectl apply -k <dir> --dry-run', 'kubectl build <dir>', 'kubectl get -k <dir>'],
		'kubectl kustomize is the render-only form. kubectl apply -k applies.'
	),

	// t43 — helm
	quizQ(
		'var-t43-helm-ns',
		'arch',
		'You installed a release with -n helm-demo. helm list shows nothing. Why?',
		'It lists the current namespace only; add -n helm-demo',
		[
			'The release failed',
			'helm list needs --all',
			'Releases are stored per user, not per namespace',
		],
		'Releases live in a namespace. helm list -A shows all namespaces.'
	),
	quizQ(
		'var-t43-rollback-default',
		'arch',
		'helm rollback my-nginx with no revision number goes to…',
		'the previous revision',
		['revision 1', 'the chart’s default values', 'the newest revision'],
		'helm history lists the revisions.'
	),
	quizQ(
		'var-t43-upgrade-install',
		'arch',
		'Which command installs a release if it is missing and upgrades it if present?',
		'helm upgrade --install',
		['helm install --upgrade', 'helm apply', 'helm install --force'],
		'Handy for repeatable scripts.'
	),

	// t47 — bootstrap
	quizQ(
		'var-t47-advertise',
		'arch',
		'Which kubeadm init flag sets the IP the API server advertises to the cluster?',
		'--apiserver-advertise-address',
		['--pod-network-cidr', '--service-cidr', '--control-plane-endpoint-ip'],
		'--pod-network-cidr and --service-cidr are address ranges, not the API server’s own IP.'
	),
	quizQ(
		'var-t47-service-cidr',
		'arch',
		'Which kubeadm init flag sets the range Service ClusterIPs come from?',
		'--service-cidr',
		['--pod-network-cidr', '--apiserver-advertise-address', '--cluster-cidr'],
		'The default is 10.96.0.0/12.'
	),

	// t25 / t40 — static pods
	quizQ(
		'var-t25-static-delete',
		'arch',
		'You kubectl delete a static pod. What happens?',
		'The kubelet recreates it right away',
		['It is deleted for good', 'The Deployment recreates it', 'It stays Terminating'],
		'The API object is only a mirror. The manifest file is the source.'
	),
	quizQ(
		'var-t25-static-remove',
		'arch',
		'How do you really remove a static pod?',
		'Delete its manifest file on the node',
		['kubectl delete pod --force', 'kubectl drain the node', 'Scale its Deployment to 0'],
		'The kubelet watches the manifest directory.'
	),
	quizQ(
		'var-t25-static-name',
		'arch',
		'A static pod static-web runs on node controlplane. What is its name in kubectl get pods?',
		'static-web-controlplane',
		['static-web', 'controlplane-static-web', 'static-web-0'],
		'The kubelet appends the node name.'
	),

	// ── Services & Networking ─────────────────────────────────────────────────
	// t3 / t38 — services
	quizQ(
		'var-t38-target-port',
		'network',
		'kubectl expose … --port=80 --target-port=8080. Which port does a client use, and where does traffic go?',
		'Clients use 80; traffic goes to container port 8080',
		[
			'Clients use 8080; traffic goes to 80',
			'Both are the same port',
			'Clients use 80 on the node',
		],
		'port is the Service port; target-port is the container port.'
	),
	quizQ(
		'var-t38-target-port-swapped',
		'network',
		'kubectl expose … --port=8080 --target-port=80. Which port does a client use, and where does traffic go?',
		'Clients use 8080; traffic goes to container port 80',
		[
			'Clients use 80; traffic goes to 8080',
			'Both are the same port',
			'Clients use 8080 on the node',
		],
		'Same flags, swapped numbers, swapped meaning.'
	),
	quizQ(
		'var-t38-nodeport-range',
		'network',
		'Which nodePort value is valid with the default settings?',
		'30080',
		['8080', '80', '40000'],
		'The default NodePort range is 30000-32767.'
	),
	quizQ(
		'var-t3-default-type',
		'network',
		'kubectl expose deployment myapp --port=80 with no --type creates which Service type?',
		'ClusterIP',
		['NodePort', 'LoadBalancer', 'ExternalName'],
		'ClusterIP is the default and is reachable only inside the cluster.'
	),

	// t20 — DNS names
	quizQ(
		'var-t20-same-ns',
		'network',
		'From a pod in namespace dev, which name reaches Service web-svc in the SAME namespace?',
		'web-svc',
		['web-svc.default', 'web-svc.svc', 'web-svc.dev.cluster.local'],
		'The pod’s search domains add the namespace automatically.'
	),
	quizQ(
		'var-t20-other-ns',
		'network',
		'From a pod in namespace default, which name reaches Service web-svc in namespace dev?',
		'web-svc.dev',
		['web-svc', 'web-svc.default', 'dev.web-svc'],
		'Add the namespace: web-svc.dev, or the full web-svc.dev.svc.cluster.local.'
	),

	// t21 — ingress
	quizQ(
		'var-t21-prefix',
		'network',
		'Ingress path /a with pathType Prefix. Which request matches?',
		'/a/index.html',
		['/b', '/ab', 'Only /a'],
		'Prefix matches on whole path segments: /a and /a/anything, not /ab.'
	),
	quizQ(
		'var-t21-exact',
		'network',
		'Ingress path /a with pathType Exact. Which request matches?',
		'Only /a',
		['/a/index.html', '/A', '/ab'],
		'Exact is case-sensitive and matches nothing else.'
	),
	quizQ(
		'var-t21-ingress-class',
		'network',
		'An Ingress exists but nothing answers. What is missing?',
		'An ingress controller (and a matching ingressClassName)',
		['A LoadBalancer Service for each path', 'A NetworkPolicy', 'A Gateway'],
		'An Ingress object is only a set of rules. A controller must act on it.'
	),

	// t45 — Gateway API
	quizQ(
		'var-t45-gateway-route',
		'network',
		'In Gateway API, which resource holds the path-matching rules?',
		'HTTPRoute',
		['Gateway', 'GatewayClass', 'IngressRoute'],
		'GatewayClass = controller type, Gateway = listener, HTTPRoute = routing rules.'
	),
	quizQ(
		'var-t45-gateway-class',
		'network',
		'In Gateway API, which resource names the controller that implements gateways?',
		'GatewayClass',
		['Gateway', 'HTTPRoute', 'IngressClass'],
		'It is the counterpart of IngressClass.'
	),

	// t18 — network policy
	quizQ(
		'var-t18-other-pod',
		'network',
		'Policy: backend pods accept ingress only from pods labelled app=frontend. A pod with app=other tries to connect. Result?',
		'Blocked',
		[
			'Allowed, policies only log',
			'Allowed, it is in the same namespace',
			'Blocked only after 3 attempts',
		],
		'Once a pod is selected by an ingress policy, everything not listed is denied.'
	),
	quizQ(
		'var-t18-and-or',
		'network',
		'In a from rule, a podSelector and a namespaceSelector are in ONE list item (same dash). How are they combined?',
		'AND: the pod must match both',
		['OR: either is enough', 'The namespaceSelector wins', 'It is a syntax error'],
		'Two separate list items (two dashes) would be OR.'
	),
	quizQ(
		'var-t18-and-or-2',
		'network',
		'In a from rule, a podSelector and a namespaceSelector are in TWO list items (two dashes). How are they combined?',
		'OR: either is enough',
		['AND: both must match', 'Only the first item counts', 'It is a syntax error'],
		'One item with both selectors would be AND.'
	),
	quizQ(
		'var-t18-no-policy',
		'network',
		'No NetworkPolicy selects a pod. What traffic does it accept?',
		'All traffic',
		['None', 'Only from its namespace', 'Only from the control plane'],
		'Pods are open until a policy selects them.'
	),

	// t39 — CoreDNS
	quizQ(
		'var-t39-coredns-zero',
		'network',
		'CoreDNS is scaled to 0. What stops working?',
		'Name resolution; pods can still reach Services by IP',
		['Pod-to-pod traffic by IP', 'Service IPs', 'kubectl get pods'],
		'DNS is just a Service. Connectivity by IP does not need it.'
	),
	quizQ(
		'var-t39-coredns-config',
		'network',
		'Where is CoreDNS’s configuration (the Corefile) stored?',
		'In the coredns ConfigMap in kube-system',
		['In /etc/coredns on each node', 'In the kube-dns Service', 'In etcd under /dns'],
		'kubectl describe configmap coredns -n kube-system.'
	),

	// ── Storage ───────────────────────────────────────────────────────────────
	quizQ(
		'var-t19-pvc-too-big',
		'storage',
		'A PVC asks for 5Gi; the only free PV offers 1Gi. Result?',
		'The PVC stays Pending',
		['It binds and gets 1Gi', 'It binds and grows the PV', 'It fails and is deleted'],
		'A claim only binds to a PV with at least the requested capacity.'
	),
	quizQ(
		'var-t19-pvc-mode-mismatch',
		'storage',
		'A PVC asks for ReadWriteMany; the only free PV is ReadWriteOnce. Result?',
		'The PVC stays Pending',
		['It binds anyway', 'It binds read-only', 'The PV is converted'],
		'Access modes must be supported by the PV.'
	),
	quizQ(
		'var-t19-reclaim',
		'storage',
		'A PV has persistentVolumeReclaimPolicy: Retain. The PVC is deleted. What happens to the PV?',
		'It stays, status Released, data kept',
		[
			'It is deleted with its data',
			'It is available for a new claim at once',
			'The data is wiped but the PV stays',
		],
		'Delete would remove it. A Released PV needs manual cleanup before reuse.'
	),
	quizQ(
		'var-t37-immediate',
		'storage',
		'A StorageClass has volumeBindingMode: Immediate. When does the PVC bind?',
		'Right after it is created',
		['When a pod first uses it', 'When the PV is manually approved', 'After 5 minutes'],
		'WaitForFirstConsumer is the delayed variant.'
	),
	quizQ(
		'var-t37-wait',
		'storage',
		'A StorageClass has volumeBindingMode: WaitForFirstConsumer. The PVC shows Pending with no pod yet. Is that a problem?',
		'No, it binds once a pod using it is scheduled',
		[
			'Yes, the provisioner is broken',
			'Yes, the PVC needs a PV first',
			'Yes, the class is not default',
		],
		'It lets the scheduler pick the node first, so the volume lands in the right zone.'
	),
	quizQ(
		'var-t36-mount-hides',
		'storage',
		'A ConfigMap is mounted at /etc/app, a directory that already has files. What happens to them?',
		'They are hidden by the mount',
		[
			'They are merged with the ConfigMap keys',
			'They are deleted from the image',
			'The pod fails to start',
		],
		'Use subPath to mount a single key as one file without hiding the directory.'
	),
	quizQ(
		'var-t36-from-file-key',
		'storage',
		'kubectl create configmap app --from-file=settings.ini. What is the key name?',
		'settings.ini',
		['settings', 'app', 'file'],
		'The file name is the key. Use --from-file=mykey=settings.ini to choose another.'
	),
	quizQ(
		'var-t51-snapshot-source',
		'storage',
		'What does a VolumeSnapshot need to point at the PVC it copies?',
		'source.persistentVolumeClaimName',
		['spec.claimName', 'spec.dataSource', 'metadata.pvc'],
		'The restore side uses dataSource on the new PVC instead.'
	),
	quizQ(
		'var-t51-needs-class',
		'storage',
		'Snapshots do nothing in a cluster. What is a likely missing piece?',
		'The snapshot CRDs, controller or a VolumeSnapshotClass',
		['A StorageClass with Retain', 'A second PVC', 'metrics-server'],
		'kubectl get crd | grep snapshot and kubectl get volumesnapshotclass.'
	),

	// ── Troubleshooting ───────────────────────────────────────────────────────
	// t22 / t41 / t30 / t23 — symptom → cause
	quizQ(
		'var-t22-crashloop',
		'trouble',
		'A pod runs a command that exits 1 immediately and restarts again and again. Which status do you see?',
		'CrashLoopBackOff',
		['ImagePullBackOff', 'Pending', 'ContainerCreating'],
		'Start with kubectl logs --previous and kubectl describe.'
	),
	quizQ(
		'var-t41-wrong-tag',
		'trouble',
		'A pod uses image nginx:NOSUCHVERSION999. Which status do you see, and what is the fix?',
		'ImagePullBackOff; correct the image tag',
		[
			'CrashLoopBackOff; check logs --previous',
			'Pending; add node resources',
			'ErrImageNeverPull; add imagePullSecrets',
		],
		'Events say "manifest unknown" / "not found".'
	),
	quizQ(
		'var-t41-private',
		'trouble',
		'A pod’s events say "pull access denied … unauthorized" for a private image. What is the fix?',
		'Create a docker-registry Secret and set imagePullSecrets',
		['Correct the image tag', 'Add more node memory', 'Restart the kubelet'],
		'Wrong tag and missing credentials both give ImagePullBackOff; the event text tells them apart.'
	),
	quizQ(
		'var-t30-untolerated',
		'trouble',
		'Pending pod events say "node(s) had untolerated taint". What fixes it?',
		'Add a matching toleration, or remove the taint',
		['Add more CPU requests', 'Delete the PVC', 'Restart the scheduler'],
		'Compare the node taints with the pod’s tolerations.'
	),
	quizQ(
		'var-t30-selector',
		'trouble',
		'Pending pod events say "node(s) didn’t match Pod’s node affinity/selector". What do you check?',
		'The pod’s nodeSelector/affinity against the node labels',
		['The pod’s CPU limits', 'The Service selector', 'The CNI plugin'],
		'kubectl get nodes --show-labels.'
	),
	quizQ(
		'var-t30-unbound-pvc',
		'trouble',
		'Pending pod events say "pod has unbound immediate PersistentVolumeClaims". What do you check?',
		'Whether its PVC is bound, and why not',
		['The pod’s tolerations', 'The node’s kubelet', 'The Ingress controller'],
		'kubectl describe pvc shows why it is not binding.'
	),
	quizQ(
		'var-t23-label-typo',
		'trouble',
		'A Service has selector app=myapp but its pods are labelled app=my-app. What does kubectl get endpoints show?',
		'<none>',
		['The pod IPs', 'The Service IP', 'The node IPs'],
		'Empty endpoints mean the selector matches no (ready) pods.'
	),
	quizQ(
		'var-t23-not-ready',
		'trouble',
		'The Service selector is right but the readiness probe fails on every pod. What do the endpoints look like?',
		'No ready addresses; the pods are listed as not ready',
		['All pod IPs as ready', 'The Service IP', 'Endpoints are deleted'],
		'Failing readiness removes pods from traffic, not from existence.'
	),
	quizQ(
		'var-t23-wrong-target-port',
		'trouble',
		'The endpoints list pod IPs, but connecting to the Service gives "connection refused". What is a likely cause?',
		'targetPort does not match the port the app listens on',
		['The selector is wrong', 'The Service has no ClusterIP', 'The pod is Pending'],
		'The selector worked (endpoints exist), so look at the port.'
	),

	// t24 — kubelet
	quizQ(
		'var-t24-inactive',
		'trouble',
		'A node is NotReady and systemctl status kubelet says inactive (dead). First fix?',
		'systemctl start kubelet (and enable it)',
		['kubeadm reset', 'kubectl delete node', 'Reinstall containerd'],
		'If it fails again, read journalctl -u kubelet.'
	),
	quizQ(
		'var-t24-failing',
		'trouble',
		'The kubelet service keeps exiting. Which command shows why?',
		'journalctl -u kubelet',
		['kubectl logs kubelet', 'crictl logs kubelet', 'systemctl show kubelet --logs'],
		'The kubelet runs under systemd, not as a pod, so kubectl logs cannot read it.'
	),
	quizQ(
		'var-t24-unit-edit',
		'trouble',
		'You edited the kubelet’s systemd unit or drop-in file. What do you run next?',
		'systemctl daemon-reload, then systemctl restart kubelet',
		['Only systemctl restart kubelet', 'kubeadm upgrade node', 'kubectl rollout restart'],
		'systemd must re-read changed unit files first.'
	),

	// t46 / t48 — crictl, debug
	quizQ(
		'var-t46-crictl-pods',
		'trouble',
		'Which crictl command lists pod sandboxes?',
		'crictl pods',
		['crictl ps', 'crictl images', 'crictl sandboxes'],
		'crictl ps lists containers; crictl pods lists the pods.'
	),
	quizQ(
		'var-t46-crictl-images',
		'trouble',
		'Which crictl command lists the images on a node?',
		'crictl images',
		['crictl ps -a', 'crictl pods', 'crictl pull --list'],
		'Handy to check whether an image was pulled.'
	),
	quizQ(
		'var-t48-debug-copy',
		'trouble',
		'What does kubectl debug <pod> --copy-to=<new> --image=busybox do?',
		'Creates a copy of the pod with a changed image',
		[
			'Adds an ephemeral container to the original pod',
			'Opens a shell on the node',
			'Restarts the pod in place',
		],
		'--target with -it adds an ephemeral container to the original instead.'
	),
	quizQ(
		'var-t48-debug-node',
		'trouble',
		'After kubectl debug node/worker1 -it --image=busybox, where is the node’s filesystem?',
		'Under /host in the debug pod',
		['At /', 'At /node', 'It is not mounted'],
		'chroot /host gives you the node’s own tools.'
	),
	quizQ(
		'var-t48-exec-distroless',
		'trouble',
		'kubectl exec -it <pod> -- sh fails on a distroless image. Why?',
		'The image has no shell',
		['The pod has no IP', 'exec needs --privileged', 'The API server blocks exec'],
		'Use an ephemeral container with kubectl debug.'
	),

	// t9 / t29 / t10 — logs, metrics
	quizQ(
		'var-t29-no-c',
		'trouble',
		'kubectl logs multi on a two-container pod. What happens?',
		'It asks you to choose a container with -c',
		[
			'It shows both containers’ logs',
			'It shows the first container’s logs only',
			'It shows the last restart’s logs',
		],
		'Use -c <name> or --all-containers.'
	),
	quizQ(
		'var-t9-previous-vs-current',
		'trouble',
		'A container is in CrashLoopBackOff and kubectl logs shows nothing. What do you try?',
		'kubectl logs --previous',
		['kubectl logs -f', 'kubectl logs --since=0', 'kubectl logs --all-containers'],
		'The current instance may not have written anything yet. The crashed one did.'
	),
	quizQ(
		'var-t10-top-missing',
		'trouble',
		'kubectl top nodes fails with "Metrics API not available". What is missing?',
		'metrics-server',
		['kube-proxy', 'CoreDNS', 'The CNI plugin'],
		'It is not installed by kubeadm by default.'
	),

	// t40 — static manifest
	quizQ(
		'var-t40-bad-manifest',
		'trouble',
		'A static pod manifest has a YAML indentation error. Where do you see the error?',
		'In the kubelet logs; the pod does not appear',
		['In kubectl describe pod', 'In the API server logs', 'In kubectl get events'],
		'The kubelet cannot parse it, so no mirror pod is created. journalctl -u kubelet.'
	)
);
