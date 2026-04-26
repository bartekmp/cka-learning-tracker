// Practice tasks data — loaded before tasks.js
// Edit this file to add, remove, or modify tasks and sections.

const SECTIONS = [
	{
		id: 's1',
		title: 'Core Concepts',
		color: '#60a5fa',
		tasks: [
			{
				id: 't1',
				tag: 'essential',
				title: 'Explore the cluster architecture',
				difficulty: 'easy',
				scenario:
					"You've just been given access to a cluster. Before anything else, identify how many nodes exist, which is the control plane node, and list all system pods running in the kube-system namespace.",
				steps: [
					{
						label: 'Step 1 — list nodes and their roles',
						desc: 'Use -o wide to also see IPs and the OS image.',
						code: ['kubectl get nodes -o wide'],
					},
					{
						label: 'Step 2 — inspect the control plane node',
						desc: 'Look at the Roles column. Then describe it to see allocated resources and conditions.',
						code: ['kubectl describe node <control-plane-node-name>'],
					},
					{
						label: 'Step 3 — list kube-system pods',
						desc: 'These are the control plane components running as static pods.',
						code: ['kubectl get pods -n kube-system'],
					},
					{
						label: 'Step 4 — check cluster info',
						desc: '',
						code: ['kubectl cluster-info'],
					},
				],
				expected:
					'You should see nodes (one labelled control-plane), and pods like kube-apiserver, etcd, kube-scheduler, kube-controller-manager, coredns, kube-proxy.',
				note: 'Static pods in kube-system have the node name as a suffix, e.g. kube-apiserver-controlplane.',
			},
			{
				id: 't2',
				tag: 'essential',
				title: 'Create and inspect a Pod',
				difficulty: 'easy',
				scenario:
					'Create a pod named web running nginx in the default namespace. Then exec into it, confirm nginx is running, and clean up.',
				steps: [
					{
						label: 'Step 1 — create the pod',
						desc: '',
						code: ['kubectl run web --image=nginx'],
					},
					{
						label: 'Step 2 — wait for Running, then describe it',
						desc: '',
						code: ['kubectl get pod web -w', 'kubectl describe pod web'],
					},
					{
						label: 'Step 3 — exec in and check the process',
						desc: '',
						code: ['kubectl exec -it web -- /bin/bash', '# inside: curl localhost'],
					},
					{
						label: 'Step 4 — clean up',
						desc: '',
						code: ['kubectl delete pod web --force --grace-period=0'],
					},
				],
				expected:
					'Pod reaches Running state. curl localhost returns the nginx welcome page.',
				note: 'Use --force --grace-period=0 in the exam to skip the 30-second termination wait.',
			},
			{
				id: 't3',
				tag: 'essential',
				title: 'Deploy and expose a Deployment',
				difficulty: 'medium',
				scenario:
					'Create a Deployment named myapp with 3 replicas of the httpd image. Expose it as a ClusterIP service on port 80. Verify connectivity from a one-shot busybox pod.',
				steps: [
					{
						label: 'Step 1 — create the deployment',
						desc: '',
						code: ['kubectl create deployment myapp --image=httpd --replicas=3'],
					},
					{
						label: 'Step 2 — expose it',
						desc: '',
						code: ['kubectl expose deployment myapp --port=80 --target-port=80'],
					},
					{
						label: 'Step 3 — get the ClusterIP',
						desc: '',
						code: ['kubectl get svc myapp'],
					},
					{
						label: 'Step 4 — test from a debug pod',
						desc: 'Replace <CLUSTER-IP> with the IP from step 3.',
						code: [
							'kubectl run tmp --image=busybox:1.28 --rm -it --restart=Never -- wget -O- <CLUSTER-IP>:80',
						],
					},
					{
						label: 'Step 5 — test using the DNS name',
						desc: 'K8s DNS resolves service names automatically.',
						code: [
							'kubectl run tmp --image=busybox:1.28 --rm -it --restart=Never -- wget -O- myapp.default.svc.cluster.local:80',
						],
					},
				],
				expected: "wget returns the Apache 'It works!' page.",
				note: 'DNS format: <service>.<namespace>.svc.cluster.local',
			},
			{
				id: 't4',
				tag: 'essential',
				title: 'Work with Namespaces',
				difficulty: 'easy',
				scenario:
					'Create a namespace called staging. Deploy a pod named api running nginx in that namespace. Then set staging as your default namespace for the current context, and verify by running kubectl get pods.',
				steps: [
					{
						label: 'Step 1 — create namespace',
						desc: '',
						code: ['kubectl create namespace staging'],
					},
					{
						label: 'Step 2 — deploy pod into it',
						desc: '',
						code: ['kubectl run api --image=nginx -n staging'],
					},
					{
						label: 'Step 3 — set default namespace',
						desc: '',
						code: ['kubectl config set-context --current --namespace=staging'],
					},
					{
						label: 'Step 4 — verify',
						desc: 'Now kubectl get pods should show the api pod without needing -n.',
						code: ['kubectl get pods'],
					},
					{
						label: 'Step 5 — reset to default',
						desc: "Don't forget this in the exam when switching tasks!",
						code: ['kubectl config set-context --current --namespace=default'],
					},
				],
				expected:
					'kubectl get pods (without -n) returns the api pod when staging is the default namespace.',
				note: '',
			},
			{
				id: 't25',
				tag: 'essential',
				title: 'Create a static pod on the control plane',
				difficulty: 'medium',
				scenario:
					"Static pods are managed directly by kubelet — the API server has no say in them. SSH to the control plane node, place a manifest in the static pod directory, and watch kubelet pick it up automatically. Use Killercoda's Kubernetes playground (killercoda.com) for SSH access to a real control plane.",
				steps: [
					{
						label: 'Step 1 — SSH to the control plane node',
						desc: 'On Killercoda the hostname is usually "controlplane".',
						code: ['ssh controlplane'],
					},
					{
						label: 'Step 2 — find the static pod directory',
						desc: "Check kubelet's config for the staticPodPath setting.",
						code: ['grep staticPodPath /var/lib/kubelet/config.yaml'],
					},
					{
						label: 'Step 3 — write the pod manifest directly into that directory',
						desc: 'Default path is /etc/kubernetes/manifests/.',
						code: [
							'cat <<EOF > /etc/kubernetes/manifests/static-web.yaml\napiVersion: v1\nkind: Pod\nmetadata:\n  name: static-web\nspec:\n  containers:\n  - name: web\n    image: nginx\nEOF',
						],
					},
					{
						label: 'Step 4 — exit SSH and verify from the control plane',
						desc: 'kubelet picks up the file within seconds. The pod name gets the node name appended as a suffix.',
						code: ['kubectl get pods | grep static-web'],
					},
					{
						label: 'Step 5 — try deleting it via kubectl',
						desc: 'kubectl delete appears to succeed but kubelet immediately recreates it from the file.',
						code: [
							'kubectl delete pod static-web-controlplane',
							'kubectl get pods | grep static-web  # it comes back',
						],
					},
					{
						label: 'Step 6 — clean up',
						desc: 'SSH back in and remove the manifest. That permanently stops the pod.',
						code: ['rm /etc/kubernetes/manifests/static-web.yaml'],
					},
				],
				expected:
					'Pod appears as static-web-controlplane. kubectl delete cannot permanently remove it — only deleting the file stops it.',
				note: 'All control plane components (kube-apiserver, etcd, scheduler, controller-manager) are themselves static pods managed this exact way.',
			},
			{
				id: 't26',
				tag: 'essential',
				title: 'Label a node and use nodeSelector',
				difficulty: 'easy',
				scenario:
					'Label a worker node with disktype=ssd. Then create a pod named ssd-pod running nginx that will only schedule on nodes with that label. Confirm it lands on the right node.',
				steps: [
					{
						label: 'Step 1 — list nodes',
						desc: '',
						code: ['kubectl get nodes'],
					},
					{
						label: 'Step 2 — label the worker node',
						desc: '',
						code: ['kubectl label node <worker-node> disktype=ssd'],
					},
					{
						label: 'Step 3 — verify the label',
						desc: '',
						code: ['kubectl get node <worker-node> --show-labels'],
					},
					{
						label: 'Step 4 — generate pod YAML',
						desc: '',
						code: [
							'kubectl run ssd-pod --image=nginx --dry-run=client -o yaml > ssd-pod.yaml',
						],
					},
					{
						label: 'Step 5 — add nodeSelector under spec',
						desc: 'Place it at the same level as containers:, not inside it.',
						code: ['nodeSelector:\n  disktype: ssd'],
					},
					{
						label: 'Step 6 — apply and verify',
						desc: 'The NODE column should show your labeled node.',
						code: ['kubectl apply -f ssd-pod.yaml', 'kubectl get pod ssd-pod -o wide'],
					},
					{
						label: 'Step 7 — remove the label to see what happens',
						desc: 'The running pod is not evicted (IgnoredDuringExecution), but a new pod with this selector would stay Pending.',
						code: ['kubectl label node <worker-node> disktype-'],
					},
				],
				expected: 'Pod schedules exclusively on the node labeled disktype=ssd.',
				note: 'nodeSelector is the simplest form of node targeting. For OR conditions or weighted preferences, use nodeAffinity instead.',
			},
		],
	},
	{
		id: 's2',
		title: 'Scheduling',
		color: '#a78bfa',
		tasks: [
			{
				id: 't5',
				tag: 'optional',
				title: 'Manually schedule a Pod to a specific node',
				difficulty: 'medium',
				scenario:
					'Without using node selectors or affinity, schedule a pod named pinned running nginx directly onto a specific node. The pod should already be running — you need to replace it.',
				steps: [
					{
						label: 'Step 1 — find available nodes',
						desc: '',
						code: ['kubectl get nodes'],
					},
					{
						label: 'Step 2 — generate pod YAML',
						desc: '',
						code: [
							'kubectl run pinned --image=nginx --dry-run=client -o yaml > pinned.yaml',
						],
					},
					{
						label: 'Step 3 — add nodeName to the spec',
						desc: 'Edit pinned.yaml and add nodeName under spec:',
						code: ['# In pinned.yaml, under spec: add:\nnodeName: <your-node-name>'],
					},
					{
						label: 'Step 4 — apply it',
						desc: '',
						code: ['kubectl apply -f pinned.yaml'],
					},
					{
						label: 'Step 5 — verify',
						desc: 'Check the NODE column.',
						code: ['kubectl get pod pinned -o wide'],
					},
				],
				expected: 'Pod runs on the exact node you specified in nodeName.',
				note: 'nodeName bypasses the scheduler entirely. Useful exam trick when a scheduler is broken.',
			},
			{
				id: 't6',
				tag: 'essential',
				title: 'Taint a node and add a Toleration',
				difficulty: 'medium',
				scenario:
					'Taint the worker node with gpu=true:NoSchedule. Then create a pod named gpu-job that tolerates this taint and confirm it schedules on that node.',
				steps: [
					{
						label: 'Step 1 — taint the node',
						desc: '',
						code: ['kubectl taint nodes <worker-node> gpu=true:NoSchedule'],
					},
					{
						label: "Step 2 — try to run a regular pod (it won't schedule)",
						desc: '',
						code: [
							'kubectl run no-tol --image=nginx',
							'kubectl get pod no-tol -o wide  # stays Pending',
						],
					},
					{
						label: 'Step 3 — generate YAML for the tolerating pod',
						desc: '',
						code: [
							'kubectl run gpu-job --image=nginx --dry-run=client -o yaml > gpu-job.yaml',
						],
					},
					{
						label: 'Step 4 — add toleration block to the spec',
						desc: 'Add this under spec:',
						code: [
							'tolerations:\n- key: gpu\n  operator: Equal\n  value: "true"\n  effect: NoSchedule',
						],
					},
					{
						label: 'Step 5 — apply and verify',
						desc: '',
						code: ['kubectl apply -f gpu-job.yaml', 'kubectl get pod gpu-job -o wide'],
					},
					{
						label: 'Step 6 — clean up taint',
						desc: 'The minus sign at the end removes the taint.',
						code: ['kubectl taint nodes <worker-node> gpu=true:NoSchedule-'],
					},
				],
				expected: 'gpu-job schedules on the tainted node. no-tol remains Pending.',
				note: "NoSchedule = new pods won't be scheduled. NoExecute = existing pods are evicted too.",
			},
			{
				id: 't7',
				tag: 'essential',
				title: 'Create a DaemonSet',
				difficulty: 'medium',
				scenario:
					'Create a DaemonSet named node-monitor using the busybox image that runs sleep 3600 on every node. Verify a pod exists on each node.',
				steps: [
					{
						label: 'Step 1 — generate a Deployment YAML as a base',
						desc: "There's no kubectl create daemonset — use a Deployment as a template.",
						code: [
							'kubectl create deployment node-monitor --image=busybox --dry-run=client -o yaml > ds.yaml',
						],
					},
					{
						label: 'Step 2 — edit ds.yaml',
						desc: 'Change kind to DaemonSet, remove replicas and strategy fields, add command:',
						code: [
							"# Change:\nkind: DaemonSet\n# Remove: replicas, strategy\n# Under containers, add:\ncommand: ['sh', '-c', 'sleep 3600']",
						],
					},
					{ label: 'Step 3 — apply it', desc: '', code: ['kubectl apply -f ds.yaml'] },
					{
						label: 'Step 4 — verify',
						desc: 'DESIRED should equal number of nodes.',
						code: [
							'kubectl get ds node-monitor',
							'kubectl get pods -o wide | grep node-monitor',
						],
					},
				],
				expected: 'One pod per node, all in Running state.',
				note: 'DaemonSets ignore replicas — they always run exactly one pod per eligible node.',
			},
			{
				id: 't8',
				tag: 'essential',
				title: 'Set resource requests and limits',
				difficulty: 'easy',
				scenario:
					'Create a pod named limited running nginx that requests 100m CPU and 128Mi memory, with limits of 200m CPU and 256Mi memory.',
				steps: [
					{
						label: 'Step 1 — generate base YAML',
						desc: '',
						code: [
							'kubectl run limited --image=nginx --dry-run=client -o yaml > limited.yaml',
						],
					},
					{
						label: 'Step 2 — add resources block',
						desc: 'Under containers[0], add:',
						code: [
							'resources:\n  requests:\n    cpu: 100m\n    memory: 128Mi\n  limits:\n    cpu: 200m\n    memory: 256Mi',
						],
					},
					{
						label: 'Step 3 — apply and verify',
						desc: '',
						code: [
							'kubectl apply -f limited.yaml',
							'kubectl describe pod limited | grep -A8 Requests',
						],
					},
				],
				expected: 'describe pod shows the correct Requests and Limits values.',
				note: '100m = 0.1 CPU cores. OOMKilled happens when a container exceeds its memory limit.',
			},
			{
				id: 't27',
				tag: 'essential',
				title: 'Configure node affinity for flexible pod placement',
				difficulty: 'medium',
				scenario:
					'Node affinity gives you more expressive scheduling rules than nodeSelector. Create two pods: one with a soft preference for a labeled node (it can run elsewhere), and one with a hard requirement (it stays Pending if the label is missing). Use Killercoda\'s 2-node Kubernetes playground for a realistic multi-node environment.',
				steps: [
					{
						label: 'Step 1 — label a worker node',
						desc: '',
						code: ['kubectl label node <worker-node> zone=us-east'],
					},
					{
						label: 'Step 2 — write the soft-preference pod (preferredDuringScheduling)',
						desc: 'This pod prefers the labeled node but will run anywhere if unavailable.',
						code: [
							'# affinity-soft.yaml\napiVersion: v1\nkind: Pod\nmetadata:\n  name: affinity-soft\nspec:\n  affinity:\n    nodeAffinity:\n      preferredDuringSchedulingIgnoredDuringExecution:\n      - weight: 1\n        preference:\n          matchExpressions:\n          - key: zone\n            operator: In\n            values:\n            - us-east\n  containers:\n  - name: app\n    image: nginx',
						],
					},
					{
						label: 'Step 3 — write the hard-requirement pod (requiredDuringScheduling)',
						desc: 'This pod will stay Pending if no node matches.',
						code: [
							'# affinity-hard.yaml\napiVersion: v1\nkind: Pod\nmetadata:\n  name: affinity-hard\nspec:\n  affinity:\n    nodeAffinity:\n      requiredDuringSchedulingIgnoredDuringExecution:\n        nodeSelectorTerms:\n        - matchExpressions:\n          - key: zone\n            operator: In\n            values:\n            - us-east\n  containers:\n  - name: app\n    image: nginx',
						],
					},
					{
						label: 'Step 4 — apply both',
						desc: '',
						code: [
							'kubectl apply -f affinity-soft.yaml -f affinity-hard.yaml',
							'kubectl get pods -o wide',
						],
					},
					{
						label: 'Step 5 — remove the label and create a third hard pod',
						desc: 'affinity-hard2 will stay Pending because no node matches the required label.',
						code: [
							'kubectl label node <worker-node> zone-',
							'kubectl run affinity-hard2 --image=nginx --dry-run=client -o yaml | kubectl apply -f - # reuse affinity-hard.yaml with name changed',
							'kubectl get pod affinity-hard2  # Pending',
						],
					},
				],
				expected:
					'Both initial pods schedule on the labeled node. A new hard-requirement pod stays Pending after the label is removed.',
				note: 'required = hard constraint, pod stays Pending if unmet. preferred = soft hint with a weight. IgnoredDuringExecution means already-running pods are not evicted if node labels change.',
			},
			{
				id: 't28',
				tag: 'optional',
				title: 'Use a PriorityClass to preempt lower-priority pods',
				difficulty: 'hard',
				scenario:
					'Create two PriorityClasses: low-priority (value 100) and high-priority (value 1000). Fill a node with low-priority pods until it is nearly full. Then create a high-priority pod and observe the scheduler preempt a low-priority pod to make room.',
				steps: [
					{
						label: 'Step 1 — create the PriorityClasses',
						desc: '',
						code: [
							'kubectl create priorityclass low-priority --value=100 --description="low"',
							'kubectl create priorityclass high-priority --value=1000 --description="high"',
						],
					},
					{
						label: 'Step 2 — create low-priority pods with resource requests',
						desc: 'Create enough to fill most of a node.',
						code: [
							'# low-pod.yaml\napiVersion: v1\nkind: Pod\nmetadata:\n  name: low-1\nspec:\n  priorityClassName: low-priority\n  containers:\n  - name: app\n    image: nginx\n    resources:\n      requests:\n        cpu: 200m\n        memory: 100Mi',
						],
					},
					{
						label: 'Step 3 — apply several low-priority pods',
						desc: '',
						code: [
							'for i in 1 2 3 4 5; do\n  sed "s/low-1/low-$i/" low-pod.yaml | kubectl apply -f -\ndone',
						],
					},
					{
						label: 'Step 4 — create a high-priority pod with the same resource size',
						desc: '',
						code: [
							'# high-pod.yaml\napiVersion: v1\nkind: Pod\nmetadata:\n  name: high-1\nspec:\n  priorityClassName: high-priority\n  containers:\n  - name: app\n    image: nginx\n    resources:\n      requests:\n        cpu: 200m\n        memory: 100Mi',
						],
					},
					{
						label: 'Step 5 — apply and observe preemption',
						desc: 'The scheduler will evict a low-priority pod to schedule the high-priority one.',
						code: ['kubectl apply -f high-pod.yaml', 'kubectl get pods -o wide -w'],
					},
					{
						label: 'Step 6 — check events to confirm preemption',
						desc: '',
						code: ['kubectl describe pod high-1 | grep -A10 Events'],
					},
				],
				expected:
					'high-1 reaches Running. One or more low-priority pods are evicted (Terminating → gone). Events show "Preempted by" message.',
				note: 'Preemption only happens when the cluster cannot schedule the high-priority pod any other way. The evicted pods are re-queued and may reschedule later.',
			},
		],
	},
	{
		id: 's3',
		title: 'Logging & Monitoring',
		color: '#34d399',
		tasks: [
			{
				id: 't9',
				tag: 'essential',
				title: 'Inspect logs of a crashing container',
				difficulty: 'easy',
				scenario:
					'Run a pod named crasher using busybox that exits immediately with a non-zero code. Retrieve the logs of the crashed container.',
				steps: [
					{
						label: 'Step 1 — create a pod that crashes',
						desc: '',
						code: ["kubectl run crasher --image=busybox -- /bin/sh -c 'exit 1'"],
					},
					{
						label: 'Step 2 — watch it restart',
						desc: 'Status will show CrashLoopBackOff.',
						code: ['kubectl get pod crasher -w'],
					},
					{
						label: 'Step 3 — get logs of the previous run',
						desc: "Without --previous you'd get nothing (container is not running).",
						code: ['kubectl logs crasher --previous'],
					},
					{
						label: 'Step 4 — describe to see exit code and events',
						desc: '',
						code: ['kubectl describe pod crasher'],
					},
				],
				expected:
					'kubectl logs --previous shows the output (empty for exit 1 but no error). describe shows Exit Code: 1.',
				note: 'In the exam, --previous is essential for diagnosing CrashLoopBackOff pods.',
			},
			{
				id: 't10',
				tag: 'essential',
				title: 'Use metrics-server to find resource usage',
				difficulty: 'easy',
				scenario:
					'Assuming metrics-server is installed, find which pod in the kube-system namespace is consuming the most CPU, and which node is consuming the most memory.',
				steps: [
					{
						label: 'Step 1 — sort pods by CPU',
						desc: '',
						code: ['kubectl top pods -n kube-system --sort-by=cpu'],
					},
					{
						label: 'Step 2 — sort nodes by memory',
						desc: '',
						code: ['kubectl top nodes --sort-by=memory'],
					},
				],
				expected: 'A table showing pods/nodes sorted by the chosen metric.',
				note: "If metrics-server isn't installed: kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml",
			},
			{
				id: 't29',
				tag: 'essential',
				title: 'Retrieve logs from a multi-container pod',
				difficulty: 'easy',
				scenario:
					'Create a pod with two containers: a web server (nginx) and a sidecar (busybox printing timestamps every 3 seconds). Practice retrieving logs from each container independently, then stream both at the same time.',
				steps: [
					{
						label: 'Step 1 — create the multi-container pod',
						desc: '',
						code: [
							"# multi.yaml\napiVersion: v1\nkind: Pod\nmetadata:\n  name: multi\nspec:\n  containers:\n  - name: web\n    image: nginx\n  - name: sidecar\n    image: busybox\n    command: ['sh', '-c', 'while true; do date; sleep 3; done']",
						],
					},
					{
						label: 'Step 2 — apply and wait for Running',
						desc: '',
						code: ['kubectl apply -f multi.yaml', 'kubectl get pod multi'],
					},
					{
						label: 'Step 3 — get logs from the web container',
						desc: '',
						code: ['kubectl logs multi -c web'],
					},
					{
						label: 'Step 4 — stream logs from the sidecar',
						desc: '',
						code: ['kubectl logs multi -c sidecar -f'],
					},
					{
						label: 'Step 5 — stream all containers at once',
						desc: '',
						code: ['kubectl logs multi --all-containers --follow'],
					},
					{
						label: 'Step 6 — try without -c to see the error',
						desc: 'kubectl logs refuses to guess when multiple containers are present.',
						code: ['kubectl logs multi  # error: specify -c'],
					},
				],
				expected:
					'sidecar logs show timestamps every 3 seconds. web container logs show nginx startup output.',
				note: "Without -c in a multi-container pod, kubectl logs will error. Always specify -c in the exam when there's more than one container.",
			},
			{
				id: 't30',
				tag: 'essential',
				title: 'Diagnose a Pending pod using events',
				difficulty: 'easy',
				scenario:
					'Create a pod that requests more CPU than any node has available. Use kubectl events and describe to understand why it stays Pending, then fix the resource request to get it running.',
				steps: [
					{
						label: 'Step 1 — check how much CPU your nodes actually have',
						desc: '',
						code: ['kubectl describe nodes | grep -A5 "Allocatable"'],
					},
					{
						label: 'Step 2 — generate pod YAML with an impossible CPU request',
						desc: '',
						code: [
							'kubectl run heavy --image=nginx --dry-run=client -o yaml > heavy.yaml',
						],
					},
					{
						label: 'Step 3 — add an oversized resource block',
						desc: 'Under containers[0], add resources requesting more CPU than any node has:',
						code: ['resources:\n  requests:\n    cpu: "100"   # 100 full cores — no node has this'],
					},
					{
						label: 'Step 4 — apply and observe Pending',
						desc: '',
						code: ['kubectl apply -f heavy.yaml', 'kubectl get pod heavy'],
					},
					{
						label: 'Step 5 — read the scheduling failure reason',
						desc: '',
						code: [
							'kubectl describe pod heavy | grep -A10 Events',
							'kubectl get events --field-selector involvedObject.name=heavy',
						],
					},
					{
						label: 'Step 6 — fix the request and reschedule',
						desc: 'Edit heavy.yaml to use cpu: 100m, then delete the stuck pod and re-apply.',
						code: [
							'kubectl delete pod heavy --force --grace-period=0',
							'# Edit heavy.yaml: change cpu: "100" → cpu: 100m\nkubectl apply -f heavy.yaml',
						],
					},
				],
				expected:
					'Events show "0/N nodes are available: N Insufficient cpu." After fixing the request, the pod reaches Running.',
				note: 'kubectl get events --sort-by=.lastTimestamp is useful for seeing the most recent cluster-wide events first. Scheduling failures always appear here.',
			},
		],
	},
	{
		id: 's4',
		title: 'Application Lifecycle',
		color: '#f59e0b',
		tasks: [
			{
				id: 't11',
				tag: 'essential',
				title: 'Rolling update and rollback',
				difficulty: 'medium',
				scenario:
					'Create a deployment app-v1 with image nginx:1.19 and 3 replicas. Update it to nginx:1.21. Then roll back to the previous version and confirm the image is nginx:1.19 again.',
				steps: [
					{
						label: 'Step 1 — create the deployment',
						desc: '',
						code: ['kubectl create deployment app-v1 --image=nginx:1.19 --replicas=3'],
					},
					{
						label: 'Step 2 — update the image',
						desc: 'The container name defaults to nginx (same as image name).',
						code: ['kubectl set image deployment/app-v1 nginx=nginx:1.21'],
					},
					{
						label: 'Step 3 — watch the rollout',
						desc: '',
						code: ['kubectl rollout status deployment/app-v1'],
					},
					{
						label: 'Step 4 — check rollout history',
						desc: '',
						code: ['kubectl rollout history deployment/app-v1'],
					},
					{
						label: 'Step 5 — roll back to previous',
						desc: '',
						code: ['kubectl rollout undo deployment/app-v1'],
					},
					{
						label: 'Step 6 — verify image is back to 1.19',
						desc: '',
						code: ['kubectl describe deployment app-v1 | grep Image'],
					},
				],
				expected: 'After rollback, Image shows nginx:1.19.',
				note: 'Use --to-revision=N to roll back to a specific revision instead of just the previous one.',
			},
			{
				id: 't12',
				tag: 'essential',
				title: 'Inject config via ConfigMap and Secret',
				difficulty: 'medium',
				scenario:
					'Create a ConfigMap named app-config with APP_ENV=production. Create a Secret named app-secret with DB_PASS=s3cr3t. Mount both as environment variables in a pod named configured running nginx.',
				steps: [
					{
						label: 'Step 1 — create ConfigMap',
						desc: '',
						code: [
							'kubectl create configmap app-config --from-literal=APP_ENV=production',
						],
					},
					{
						label: 'Step 2 — create Secret',
						desc: '',
						code: [
							'kubectl create secret generic app-secret --from-literal=DB_PASS=s3cr3t',
						],
					},
					{
						label: 'Step 3 — generate pod YAML',
						desc: '',
						code: [
							'kubectl run configured --image=nginx --dry-run=client -o yaml > configured.yaml',
						],
					},
					{
						label: 'Step 4 — add envFrom to the container spec',
						desc: 'Under containers[0], add:',
						code: [
							'envFrom:\n- configMapRef:\n    name: app-config\n- secretRef:\n    name: app-secret',
						],
					},
					{
						label: 'Step 5 — apply and verify',
						desc: '',
						code: [
							'kubectl apply -f configured.yaml',
							"kubectl exec configured -- env | grep -E 'APP_ENV|DB_PASS'",
						],
					},
				],
				expected: 'env output shows APP_ENV=production and DB_PASS=s3cr3t.',
				note: 'Secrets are base64-encoded in etcd but appear decoded inside the container. Base64 is NOT encryption.',
			},
			{
				id: 't13',
				tag: 'essential',
				title: 'Use an Init Container',
				difficulty: 'medium',
				scenario:
					'Create a pod with an init container that writes a message to /data/init.txt, and a main container that reads and prints it. Both containers share an emptyDir volume.',
				steps: [
					{
						label: 'Step 1 — write the pod YAML from scratch',
						desc: 'No shortcut here — write it directly.',
						code: [
							"# init-pod.yaml\napiVersion: v1\nkind: Pod\nmetadata:\n  name: init-demo\nspec:\n  initContainers:\n  - name: init-writer\n    image: busybox\n    command: ['sh', '-c', 'echo hello from init > /data/init.txt']\n    volumeMounts:\n    - name: shared\n      mountPath: /data\n  containers:\n  - name: reader\n    image: busybox\n    command: ['sh', '-c', 'cat /data/init.txt && sleep 3600']\n    volumeMounts:\n    - name: shared\n      mountPath: /data\n  volumes:\n  - name: shared\n    emptyDir: {}",
						],
					},
					{
						label: 'Step 2 — apply it',
						desc: '',
						code: ['kubectl apply -f init-pod.yaml'],
					},
					{
						label: 'Step 3 — check init ran first',
						desc: 'Watch the Init:0/1 → PodInitializing → Running progression.',
						code: ['kubectl get pod init-demo -w'],
					},
					{
						label: 'Step 4 — read the logs of the main container',
						desc: '',
						code: ['kubectl logs init-demo -c reader'],
					},
				],
				expected: 'Logs show: hello from init',
				note: 'The pod stays in Init status until ALL init containers complete successfully. If an init container fails, the pod restarts it.',
			},
			{
				id: 't31',
				tag: 'essential',
				title: 'Run a one-off task with a Job',
				difficulty: 'medium',
				scenario:
					'Create a Job named hash-job that uses busybox to print the SHA256 hash of the string "cka-exam". Configure it to retry up to 3 times on failure and to keep 2 completed pods in history. Confirm it completes and retrieve the output.',
				steps: [
					{
						label: 'Step 1 — write the Job YAML',
						desc: '',
						code: [
							"# job.yaml\napiVersion: batch/v1\nkind: Job\nmetadata:\n  name: hash-job\nspec:\n  backoffLimit: 3\n  ttlSecondsAfterFinished: 120\n  template:\n    spec:\n      restartPolicy: Never\n      containers:\n      - name: hasher\n        image: busybox\n        command: ['sh', '-c', 'echo -n cka-exam | sha256sum']",
						],
					},
					{
						label: 'Step 2 — apply the Job',
						desc: '',
						code: ['kubectl apply -f job.yaml'],
					},
					{
						label: 'Step 3 — watch it complete',
						desc: 'COMPLETIONS 0/1 → 1/1.',
						code: ['kubectl get jobs -w', 'kubectl get pods -l job-name=hash-job'],
					},
					{
						label: 'Step 4 — retrieve the output',
						desc: '',
						code: ['kubectl logs -l job-name=hash-job'],
					},
					{
						label: 'Step 5 — inspect job details',
						desc: '',
						code: ['kubectl describe job hash-job'],
					},
				],
				expected:
					'COMPLETIONS shows 1/1. Logs show the SHA256 hash of "cka-exam".',
				note: 'restartPolicy must be Never or OnFailure in a Job — Always is not allowed. backoffLimit controls how many times the pod is retried before the Job is marked Failed.',
			},
			{
				id: 't32',
				tag: 'essential',
				title: 'Schedule recurring work with a CronJob',
				difficulty: 'medium',
				scenario:
					'Create a CronJob named heartbeat that prints "ping" every minute. After it fires at least once, suspend it and verify no new Jobs are created. Then re-enable it.',
				steps: [
					{
						label: 'Step 1 — write the CronJob YAML',
						desc: '',
						code: [
							"# cron.yaml\napiVersion: batch/v1\nkind: CronJob\nmetadata:\n  name: heartbeat\nspec:\n  schedule: \"* * * * *\"\n  successfulJobsHistoryLimit: 3\n  failedJobsHistoryLimit: 1\n  jobTemplate:\n    spec:\n      template:\n        spec:\n          restartPolicy: Never\n          containers:\n          - name: ping\n            image: busybox\n            command: ['sh', '-c', 'echo ping']",
						],
					},
					{
						label: 'Step 2 — apply and watch for the first run',
						desc: 'Wait up to 60 seconds. LAST SCHEDULE will show a recent time.',
						code: ['kubectl apply -f cron.yaml', 'kubectl get cronjob heartbeat -w'],
					},
					{
						label: 'Step 3 — check the spawned Job and read logs',
						desc: '',
						code: [
							'kubectl get jobs',
							'kubectl logs -l job-name=$(kubectl get jobs --no-headers | head -1 | awk \'{print $1}\')',
						],
					},
					{
						label: 'Step 4 — suspend the CronJob',
						desc: '',
						code: [
							"kubectl patch cronjob heartbeat -p '{\"spec\":{\"suspend\":true}}'",
						],
					},
					{
						label: 'Step 5 — verify no new Jobs are created',
						desc: 'Wait a minute — no new Job should appear.',
						code: ['kubectl get jobs -w'],
					},
					{
						label: 'Step 6 — re-enable it',
						desc: '',
						code: [
							"kubectl patch cronjob heartbeat -p '{\"spec\":{\"suspend\":false}}'",
						],
					},
				],
				expected:
					'LAST SCHEDULE shows a recent time after the first run. No new jobs appear while suspended.',
				note: 'successfulJobsHistoryLimit and failedJobsHistoryLimit control how many old Job records are kept (defaults: 3 and 1). Old Jobs are automatically deleted beyond the limit.',
			},
			{
				id: 't42',
				tag: 'essential',
				title: 'Autoscale a deployment with HorizontalPodAutoscaler',
				difficulty: 'medium',
				scenario:
					'Create a deployment named php-apache running a CPU-intensive image. Create an HPA targeting 50% CPU utilisation, scaling between 1 and 5 replicas. Generate load and watch it scale out, then stop the load and watch it scale back in.',
				steps: [
					{
						label: 'Step 1 — confirm metrics-server is running',
						desc: 'HPA reads pod CPU usage from metrics-server.',
						code: ['kubectl get deployment metrics-server -n kube-system'],
					},
					{
						label: 'Step 2 — create the deployment and expose it',
						desc: 'php-apache is a purpose-built image that responds to CPU load.',
						code: [
							'kubectl create deployment php-apache \\\n  --image=registry.k8s.io/hpa-example \\\n  --port=80',
							'kubectl expose deployment php-apache --port=80',
						],
					},
					{
						label: 'Step 3 — create the HPA',
						desc: '',
						code: [
							'kubectl autoscale deployment php-apache \\\n  --cpu-percent=50 --min=1 --max=5',
						],
					},
					{
						label: 'Step 4 — check the HPA status',
						desc: 'TARGETS shows current/desired CPU%. May show <unknown> for ~60 seconds.',
						code: ['kubectl get hpa php-apache'],
					},
					{
						label: 'Step 5 — generate load in a separate terminal',
						desc: 'This loop hammers the service continuously to drive CPU up.',
						code: [
							'kubectl run load --image=busybox:1.28 --rm -it --restart=Never -- \\\n  /bin/sh -c "while true; do wget -q -O- http://php-apache; done"',
						],
					},
					{
						label: 'Step 6 — watch the HPA scale out',
						desc: 'Open another terminal. Replicas increase within 1–2 minutes.',
						code: ['kubectl get hpa php-apache -w', 'kubectl get pods -l app=php-apache'],
					},
					{
						label: 'Step 7 — stop the load and watch scale-in',
						desc: 'Ctrl+C the load pod. Scale-in has a default 5-minute cooldown to prevent flapping.',
						code: ['kubectl get hpa php-apache -w  # replicas drop back to 1 after cooldown'],
					},
					{
						label: 'Step 8 — inspect HPA details',
						desc: '',
						code: ['kubectl describe hpa php-apache'],
					},
				],
				expected:
					'HPA scales from 1 up to multiple replicas under load, then back to 1 after load stops.',
				note: 'Scale-out is fast (~30 s). Scale-in is slow (5 min cooldown by default) to avoid flapping. The HPA YAML can also be written with kubectl autoscale --dry-run=client -o yaml.',
			},
		],
	},
	{
		id: 's5',
		title: 'Cluster Maintenance',
		color: '#f87171',
		tasks: [
			{
				id: 't14',
				tag: 'essential',
				title: 'Drain a node and bring it back',
				difficulty: 'medium',
				scenario:
					'Simulate a maintenance window: drain a worker node (evicting all pods), then uncordon it and verify workloads reschedule onto it.',
				steps: [
					{
						label: 'Step 1 — get the worker node name',
						desc: '',
						code: ['kubectl get nodes'],
					},
					{
						label: 'Step 2 — deploy something to drain',
						desc: '',
						code: ['kubectl create deployment drain-test --image=nginx --replicas=3'],
					},
					{
						label: 'Step 3 — drain the node',
						desc: "DaemonSet pods can't be moved, hence --ignore-daemonsets.",
						code: [
							'kubectl drain <worker-node> --ignore-daemonsets --delete-emptydir-data',
						],
					},
					{
						label: 'Step 4 — verify the node is SchedulingDisabled',
						desc: '',
						code: ['kubectl get nodes'],
					},
					{
						label: 'Step 5 — check pods moved elsewhere',
						desc: '',
						code: ['kubectl get pods -o wide'],
					},
					{
						label: 'Step 6 — uncordon the node',
						desc: '',
						code: ['kubectl uncordon <worker-node>'],
					},
					{
						label: 'Step 7 — verify node is Ready again',
						desc: '',
						code: ['kubectl get nodes'],
					},
				],
				expected:
					'After drain, node shows SchedulingDisabled. After uncordon, node shows Ready.',
				note: "drain = cordon + evict all pods. uncordon only re-enables scheduling — existing pods don't automatically move back.",
			},
			{
				id: 't15',
				tag: 'optional',
				title: 'etcd backup and restore ⭐',
				difficulty: 'hard',
				scenario:
					"Take a snapshot of the etcd database. Then simulate disaster by creating a test deployment, and restore the snapshot (which won't have the deployment). Verify the cluster is healthy after restore.",
				steps: [
					{
						label: 'Step 1 — find etcd certs',
						desc: '',
						code: ['ls /etc/kubernetes/pki/etcd/'],
					},
					{
						label: 'Step 2 — take the snapshot',
						desc: 'All four flags are required — memorise them.',
						code: [
							'ETCDCTL_API=3 etcdctl snapshot save /backup/etcd-snap.db \\\n  --endpoints=https://127.0.0.1:2379 \\\n  --cacert=/etc/kubernetes/pki/etcd/ca.crt \\\n  --cert=/etc/kubernetes/pki/etcd/server.crt \\\n  --key=/etc/kubernetes/pki/etcd/server.key',
						],
					},
					{
						label: 'Step 3 — verify the snapshot',
						desc: '',
						code: [
							'ETCDCTL_API=3 etcdctl snapshot status /backup/etcd-snap.db --write-out=table',
						],
					},
					{
						label: 'Step 4 — create something AFTER the backup (to confirm it disappears post-restore)',
						desc: '',
						code: ['kubectl create deployment post-backup --image=nginx'],
					},
					{
						label: 'Step 5 — restore to a new data directory',
						desc: '',
						code: [
							'ETCDCTL_API=3 etcdctl snapshot restore /backup/etcd-snap.db \\\n  --data-dir=/var/lib/etcd-restored',
						],
					},
					{
						label: 'Step 6 — update the etcd static pod to use the new dir',
						desc: 'Edit the etcd manifest and change --data-dir:',
						code: [
							'vi /etc/kubernetes/manifests/etcd.yaml\n# Change: --data-dir=/var/lib/etcd\n# To:     --data-dir=/var/lib/etcd-restored\n# Also update the hostPath volume path to match',
						],
					},
					{
						label: 'Step 7 — wait for etcd and apiserver to restart',
						desc: 'The static pod will auto-restart after the manifest changes.',
						code: ['watch kubectl get pods -n kube-system'],
					},
					{
						label: 'Step 8 — verify post-backup deployment is gone',
						desc: '',
						code: ['kubectl get deployments'],
					},
				],
				expected:
					'post-backup deployment no longer exists. Cluster is healthy. All pre-backup resources are intact.',
				note: 'Not in the current CKA v1.35 curriculum — etcd backup was removed from the exam in recent revisions. Still valuable Kubernetes knowledge, but deprioritise it for exam prep.',
			},
			{
				id: 't33',
				tag: 'essential',
				title: 'Upgrade a cluster with kubeadm ⭐',
				difficulty: 'hard',
				scenario:
					"Upgrade a kubeadm cluster one minor version (e.g. 1.30 → 1.31): control plane first, then worker nodes. Each worker must be drained, upgraded, and uncordoned. Use Killercoda's 'Kubernetes Upgrade' scenario (killercoda.com) which provides a pre-built cluster at a specific version.",
				steps: [
					{
						label: 'Step 1 — check current version and available targets',
						desc: '',
						code: [
							'kubectl get nodes',
							'kubeadm version',
							'apt-cache madison kubeadm  # lists installable versions',
						],
					},
					{
						label: 'Step 2 — upgrade kubeadm on the control plane',
						desc: 'Replace X.Y.Z-1.1 with the target version from apt-cache output.',
						code: [
							'apt-mark unhold kubeadm\napt-get install -y kubeadm=X.Y.Z-1.1\napt-mark hold kubeadm',
						],
					},
					{
						label: 'Step 3 — review the upgrade plan',
						desc: 'This shows what will change and flags any issues.',
						code: ['kubeadm upgrade plan'],
					},
					{
						label: 'Step 4 — apply the upgrade on the control plane',
						desc: '',
						code: ['kubeadm upgrade apply vX.Y.Z'],
					},
					{
						label: 'Step 5 — upgrade kubelet and kubectl on the control plane',
						desc: '',
						code: [
							'apt-mark unhold kubelet kubectl\napt-get install -y kubelet=X.Y.Z-1.1 kubectl=X.Y.Z-1.1\napt-mark hold kubelet kubectl\nsystemctl daemon-reload\nsystemctl restart kubelet',
						],
					},
					{
						label: 'Step 6 — drain each worker node (one at a time)',
						desc: 'Run this from the control plane.',
						code: ['kubectl drain <worker-node> --ignore-daemonsets --delete-emptydir-data'],
					},
					{
						label: 'Step 7 — upgrade kubeadm and kubelet on the worker',
						desc: 'SSH to the worker node.',
						code: [
							'apt-mark unhold kubeadm kubelet\napt-get install -y kubeadm=X.Y.Z-1.1 kubelet=X.Y.Z-1.1\napt-mark hold kubeadm kubelet\nkubeadm upgrade node\nsystemctl daemon-reload\nsystemctl restart kubelet',
						],
					},
					{
						label: 'Step 8 — uncordon the worker and verify',
						desc: 'Back on the control plane.',
						code: ['kubectl uncordon <worker-node>', 'kubectl get nodes'],
					},
				],
				expected:
					'All nodes show the new version in the VERSION column and Ready status.',
				note: 'You can only upgrade one minor version at a time (1.30 → 1.31, not 1.30 → 1.32). Always upgrade the control plane before worker nodes.',
			},
			{
				id: 't43',
				tag: 'essential',
				title: 'Install and manage a release with Helm',
				difficulty: 'medium',
				scenario:
					'Use Helm to install nginx from the Bitnami repository, inspect the release, upgrade it with a custom value, roll back, and uninstall. Helm is explicitly tested in the CKA v1.35 curriculum.',
				steps: [
					{
						label: 'Step 1 — verify Helm is installed',
						desc: '',
						code: ['helm version'],
					},
					{
						label: 'Step 2 — add the Bitnami chart repository',
						desc: '',
						code: [
							'helm repo add bitnami https://charts.bitnami.com/bitnami',
							'helm repo update',
						],
					},
					{
						label: 'Step 3 — search the repo',
						desc: '',
						code: ['helm search repo nginx'],
					},
					{
						label: 'Step 4 — inspect available values before installing',
						desc: '',
						code: ['helm show values bitnami/nginx | head -40'],
					},
					{
						label: 'Step 5 — install into a dedicated namespace',
						desc: '',
						code: [
							'kubectl create namespace helm-demo',
							'helm install my-nginx bitnami/nginx -n helm-demo',
						],
					},
					{
						label: 'Step 6 — list and inspect the release',
						desc: '',
						code: ['helm list -n helm-demo', 'helm status my-nginx -n helm-demo'],
					},
					{
						label: 'Step 7 — upgrade with a custom value',
						desc: '',
						code: [
							'helm upgrade my-nginx bitnami/nginx -n helm-demo --set replicaCount=2',
						],
					},
					{
						label: 'Step 8 — view revision history',
						desc: '',
						code: ['helm history my-nginx -n helm-demo'],
					},
					{
						label: 'Step 9 — roll back to revision 1',
						desc: '',
						code: ['helm rollback my-nginx 1 -n helm-demo'],
					},
					{
						label: 'Step 10 — uninstall',
						desc: '',
						code: ['helm uninstall my-nginx -n helm-demo'],
					},
				],
				expected:
					'Release installs cleanly, upgrades to 2 replicas, rolls back to 1, and uninstalls without leaving resources behind.',
				note: 'Key commands to memorise: helm install, helm upgrade, helm rollback, helm list, helm history, helm uninstall, helm show values. In the exam, repos may already be configured.',
			},
			{
				id: 't44',
				tag: 'essential',
				title: 'Patch manifests with Kustomize',
				difficulty: 'medium',
				scenario:
					'Use Kustomize (built into kubectl as kubectl apply -k) to manage a base nginx deployment with two overlays: dev (1 replica) and prod (3 replicas, newer image tag). No YAML duplication.',
				steps: [
					{
						label: 'Step 1 — create the directory structure',
						desc: '',
						code: [
							'mkdir -p kustomize/base kustomize/overlays/dev kustomize/overlays/prod',
						],
					},
					{
						label: 'Step 2 — write the base deployment',
						desc: '',
						code: [
							'# kustomize/base/deployment.yaml\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: nginx\nspec:\n  replicas: 1\n  selector:\n    matchLabels:\n      app: nginx\n  template:\n    metadata:\n      labels:\n        app: nginx\n    spec:\n      containers:\n      - name: nginx\n        image: nginx:1.25',
						],
					},
					{
						label: 'Step 3 — write the base kustomization.yaml',
						desc: '',
						code: [
							'# kustomize/base/kustomization.yaml\napiVersion: kustomize.config.k8s.io/v1beta1\nkind: Kustomization\nresources:\n- deployment.yaml',
						],
					},
					{
						label: 'Step 4 — write the dev overlay',
						desc: 'Adds a dev- prefix to all resource names.',
						code: [
							'# kustomize/overlays/dev/kustomization.yaml\napiVersion: kustomize.config.k8s.io/v1beta1\nkind: Kustomization\nnamePrefix: dev-\nresources:\n- ../../base\npatches:\n- patch: |\n    apiVersion: apps/v1\n    kind: Deployment\n    metadata:\n      name: nginx\n    spec:\n      replicas: 1',
						],
					},
					{
						label: 'Step 5 — write the prod overlay',
						desc: '3 replicas and a newer image tag.',
						code: [
							'# kustomize/overlays/prod/kustomization.yaml\napiVersion: kustomize.config.k8s.io/v1beta1\nkind: Kustomization\nnamePrefix: prod-\nresources:\n- ../../base\nimages:\n- name: nginx\n  newTag: "1.27"\npatches:\n- patch: |\n    apiVersion: apps/v1\n    kind: Deployment\n    metadata:\n      name: nginx\n    spec:\n      replicas: 3',
						],
					},
					{
						label: 'Step 6 — preview rendered YAML without applying',
						desc: '',
						code: [
							'kubectl kustomize kustomize/overlays/dev',
							'kubectl kustomize kustomize/overlays/prod',
						],
					},
					{
						label: 'Step 7 — apply both overlays',
						desc: '',
						code: [
							'kubectl apply -k kustomize/overlays/dev',
							'kubectl apply -k kustomize/overlays/prod',
							'kubectl get deployments',
						],
					},
				],
				expected:
					'dev-nginx deploys with 1 replica and nginx:1.25. prod-nginx deploys with 3 replicas and nginx:1.27.',
				note: 'Kustomize is built into kubectl — no install needed. kubectl apply -k applies a kustomization. kubectl kustomize just renders YAML without applying. The images: field is the cleanest way to swap image tags across environments.',
			},
		],
	},
	{
		id: 's6',
		title: 'Security',
		color: '#c084fc',
		tasks: [
			{
				id: 't16',
				tag: 'essential',
				title: 'Create RBAC Role and test permissions',
				difficulty: 'medium',
				scenario:
					'Create a ServiceAccount named reader in the apps namespace. Grant it read-only access to pods (get, list, watch). Verify it can list pods but cannot create them.',
				steps: [
					{
						label: 'Step 1 — create namespace and serviceaccount',
						desc: '',
						code: [
							'kubectl create namespace apps',
							'kubectl create serviceaccount reader -n apps',
						],
					},
					{
						label: 'Step 2 — create the Role',
						desc: '',
						code: [
							'kubectl create role pod-reader \\\n  --verb=get,list,watch \\\n  --resource=pods \\\n  -n apps',
						],
					},
					{
						label: 'Step 3 — bind the Role to the ServiceAccount',
						desc: '',
						code: [
							'kubectl create rolebinding reader-binding \\\n  --role=pod-reader \\\n  --serviceaccount=apps:reader \\\n  -n apps',
						],
					},
					{
						label: 'Step 4 — test: can list pods?',
						desc: '',
						code: [
							'kubectl auth can-i list pods -n apps \\\n  --as=system:serviceaccount:apps:reader',
						],
					},
					{
						label: 'Step 5 — test: can create pods?',
						desc: '',
						code: [
							'kubectl auth can-i create pods -n apps \\\n  --as=system:serviceaccount:apps:reader',
						],
					},
				],
				expected: 'list pods → yes. create pods → no.',
				note: 'kubectl auth can-i is the fastest way to debug RBAC during the exam.',
			},
			{
				id: 't17',
				tag: 'optional',
				title: 'Apply a Security Context',
				difficulty: 'easy',
				scenario:
					'Create a pod named secure running busybox that: runs as user ID 1000, has a read-only root filesystem, and drops ALL Linux capabilities. Verify with exec.',
				steps: [
					{
						label: 'Step 1 — generate base YAML',
						desc: '',
						code: [
							'kubectl run secure --image=busybox --dry-run=client -o yaml -- sleep 3600 > secure.yaml',
						],
					},
					{
						label: 'Step 2 — add securityContext to the container',
						desc: 'Under containers[0], add:',
						code: [
							'securityContext:\n  runAsUser: 1000\n  readOnlyRootFilesystem: true\n  capabilities:\n    drop:\n    - ALL',
						],
					},
					{
						label: 'Step 3 — apply it',
						desc: '',
						code: ['kubectl apply -f secure.yaml'],
					},
					{
						label: 'Step 4 — verify user',
						desc: '',
						code: ['kubectl exec secure -- whoami', 'kubectl exec secure -- id'],
					},
					{
						label: 'Step 5 — verify read-only filesystem',
						desc: '',
						code: ['kubectl exec secure -- touch /testfile  # should fail'],
					},
				],
				expected:
					'whoami returns an ID of 1000. touch /testfile fails with Read-only file system error.',
				note: 'Pod-level securityContext applies to all containers. Container-level overrides the pod-level.',
			},
			{
				id: 't18',
				tag: 'essential',
				title: 'Write a Network Policy',
				difficulty: 'hard',
				scenario:
					'Deploy two pods: frontend (label app=frontend) and backend (label app=backend). Write a NetworkPolicy that allows only the frontend pod to reach the backend on port 8080. All other ingress to the backend should be denied.',
				steps: [
					{
						label: 'Step 1 — deploy both pods',
						desc: '',
						code: [
							'kubectl run backend --image=nginx --labels=app=backend',
							'kubectl run frontend --image=busybox --labels=app=frontend -- sleep 3600',
						],
					},
					{
						label: 'Step 2 — write the NetworkPolicy YAML',
						desc: '',
						code: [
							'# netpol.yaml\napiVersion: networking.k8s.io/v1\nkind: NetworkPolicy\nmetadata:\n  name: allow-frontend\nspec:\n  podSelector:\n    matchLabels:\n      app: backend\n  policyTypes:\n  - Ingress\n  ingress:\n  - from:\n    - podSelector:\n        matchLabels:\n          app: frontend\n    ports:\n    - protocol: TCP\n      port: 8080',
						],
					},
					{
						label: 'Step 3 — apply it',
						desc: '',
						code: ['kubectl apply -f netpol.yaml'],
					},
					{
						label: 'Step 4 — test from frontend (should work on port 80, backend listens on 80)',
						desc: 'Note: nginx listens on 80 not 8080 in this exercise — adjust port in the policy to 80 to see it work.',
						code: ['kubectl exec frontend -- wget -O- <backend-pod-ip>:80 --timeout=3'],
					},
					{
						label: 'Step 5 — test from a pod without the label (should be blocked)',
						desc: '',
						code: [
							'kubectl run other --image=busybox --rm -it -- wget -O- <backend-pod-ip>:80 --timeout=3',
						],
					},
				],
				expected:
					'frontend can reach backend. A pod without app=frontend label is blocked (timeout).',
				note: 'NetworkPolicy requires a CNI that supports it (Calico, Cilium, Weave). Flannel alone does NOT enforce NetworkPolicy.',
			},
			{
				id: 't34',
				tag: 'essential',
				title: 'Create a ClusterRole for cross-namespace access',
				difficulty: 'medium',
				scenario:
					'Create a ClusterRole named secret-reader that allows get/list/watch on secrets cluster-wide. Bind it to a ServiceAccount named vault in the tools namespace using a ClusterRoleBinding. Verify it can read secrets in multiple namespaces.',
				steps: [
					{
						label: 'Step 1 — create the namespace and ServiceAccount',
						desc: '',
						code: [
							'kubectl create namespace tools',
							'kubectl create serviceaccount vault -n tools',
						],
					},
					{
						label: 'Step 2 — create the ClusterRole',
						desc: '',
						code: [
							'kubectl create clusterrole secret-reader \\\n  --verb=get,list,watch \\\n  --resource=secrets',
						],
					},
					{
						label: 'Step 3 — bind it with a ClusterRoleBinding',
						desc: 'This grants the permission in every namespace.',
						code: [
							'kubectl create clusterrolebinding vault-secret-reader \\\n  --clusterrole=secret-reader \\\n  --serviceaccount=tools:vault',
						],
					},
					{
						label: 'Step 4 — test access in different namespaces',
						desc: '',
						code: [
							'kubectl auth can-i list secrets -n default \\\n  --as=system:serviceaccount:tools:vault',
							'kubectl auth can-i list secrets -n kube-system \\\n  --as=system:serviceaccount:tools:vault',
						],
					},
					{
						label: 'Step 5 — confirm it cannot create secrets',
						desc: '',
						code: [
							'kubectl auth can-i create secrets \\\n  --as=system:serviceaccount:tools:vault',
						],
					},
				],
				expected:
					'list secrets → yes in any namespace. create secrets → no.',
				note: 'ClusterRole + ClusterRoleBinding = cluster-wide access. ClusterRole + RoleBinding (namespace-scoped) = access only in that namespace. The ClusterRole is reusable across both.',
			},
			{
				id: 't35',
				tag: 'optional',
				title: 'Approve a CertificateSigningRequest',
				difficulty: 'medium',
				scenario:
					'A new developer named dev-jane needs a client certificate to authenticate to the cluster. Generate a private key and CSR, submit it as a Kubernetes CertificateSigningRequest, approve it, and retrieve the signed certificate.',
				steps: [
					{
						label: 'Step 1 — generate a private key and CSR',
						desc: '',
						code: [
							'openssl genrsa -out dev-jane.key 2048',
							'openssl req -new -key dev-jane.key -out dev-jane.csr -subj "/CN=dev-jane/O=developers"',
						],
					},
					{
						label: 'Step 2 — base64-encode the CSR (no newlines)',
						desc: '',
						code: ['cat dev-jane.csr | base64 | tr -d "\\n"'],
					},
					{
						label: 'Step 3 — write the CertificateSigningRequest manifest',
						desc: 'Paste the base64 output from step 2 into the request field.',
						code: [
							'# csr.yaml\napiVersion: certificates.k8s.io/v1\nkind: CertificateSigningRequest\nmetadata:\n  name: dev-jane\nspec:\n  request: <BASE64_CSR_HERE>\n  signerName: kubernetes.io/kube-apiserver-client\n  expirationSeconds: 86400\n  usages:\n  - client auth',
						],
					},
					{
						label: 'Step 4 — submit the CSR',
						desc: '',
						code: ['kubectl apply -f csr.yaml', 'kubectl get csr dev-jane'],
					},
					{
						label: 'Step 5 — approve it',
						desc: '',
						code: ['kubectl certificate approve dev-jane'],
					},
					{
						label: 'Step 6 — retrieve the signed certificate',
						desc: '',
						code: [
							'kubectl get csr dev-jane -o jsonpath=\'{.status.certificate}\' | base64 -d > dev-jane.crt',
							'openssl x509 -in dev-jane.crt -text -noout | grep Subject',
						],
					},
				],
				expected:
					'CSR moves from Pending → Approved,Issued. dev-jane.crt is a valid certificate with CN=dev-jane.',
				note: 'After getting the cert, you would create a kubeconfig entry using: kubectl config set-credentials dev-jane --client-key=dev-jane.key --client-certificate=dev-jane.crt',
			},
		],
	},
	{
		id: 's7',
		title: 'Storage',
		color: '#2dd4bf',
		tasks: [
			{
				id: 't19',
				tag: 'essential',
				title: 'Create a PersistentVolume and claim it',
				difficulty: 'medium',
				scenario:
					'Create a PersistentVolume named pv-data (hostPath /mnt/data, 1Gi, RWO, Retain). Create a PVC named pvc-data requesting 500Mi. Mount it in a pod named pv-pod at /data. Write a file and verify it persists after pod deletion.',
				steps: [
					{
						label: 'Step 1 — create the PV',
						desc: '',
						code: [
							'# pv.yaml\napiVersion: v1\nkind: PersistentVolume\nmetadata:\n  name: pv-data\nspec:\n  capacity:\n    storage: 1Gi\n  accessModes:\n  - ReadWriteOnce\n  persistentVolumeReclaimPolicy: Retain\n  hostPath:\n    path: /mnt/data',
						],
					},
					{
						label: 'Step 2 — create the PVC',
						desc: '',
						code: [
							'# pvc.yaml\napiVersion: v1\nkind: PersistentVolumeClaim\nmetadata:\n  name: pvc-data\nspec:\n  accessModes:\n  - ReadWriteOnce\n  resources:\n    requests:\n      storage: 500Mi',
						],
					},
					{
						label: 'Step 3 — apply both',
						desc: '',
						code: [
							'kubectl apply -f pv.yaml -f pvc.yaml',
							'kubectl get pv,pvc  # Both should show Bound',
						],
					},
					{
						label: 'Step 4 — create a pod that mounts the PVC',
						desc: '',
						code: [
							"# pod.yaml\napiVersion: v1\nkind: Pod\nmetadata:\n  name: pv-pod\nspec:\n  containers:\n  - name: app\n    image: busybox\n    command: ['sleep', '3600']\n    volumeMounts:\n    - name: storage\n      mountPath: /data\n  volumes:\n  - name: storage\n    persistentVolumeClaim:\n      claimName: pvc-data",
						],
					},
					{
						label: 'Step 5 — write a file and verify persistence',
						desc: '',
						code: [
							"kubectl exec pv-pod -- sh -c 'echo hello > /data/test.txt'",
							'kubectl delete pod pv-pod --force --grace-period=0',
							'# Re-create the pod, then:\nkubectl exec pv-pod -- cat /data/test.txt',
						],
					},
				],
				expected:
					"PV and PVC both show Bound. After pod deletion and recreation, test.txt still contains 'hello'.",
				note: 'PVC binds to a PV if capacity >= request AND accessModes match. A 500Mi PVC can bind to a 1Gi PV.',
			},
			{
				id: 't36',
				tag: 'essential',
				title: 'Mount a ConfigMap as a file inside a pod',
				difficulty: 'easy',
				scenario:
					'Create a ConfigMap named app-config containing a key called settings.ini. Mount it as a file at /etc/app/settings.ini inside a pod using a volume — not envFrom. Verify the file exists with the correct content.',
				steps: [
					{
						label: 'Step 1 — create the ConfigMap',
						desc: '',
						code: [
							"kubectl create configmap app-config \\\n  --from-literal=settings.ini='[server]\nport=8080\ndebug=false'",
						],
					},
					{
						label: 'Step 2 — write the pod YAML',
						desc: 'The subPath field mounts a single key as a file rather than a directory.',
						code: [
							"# cm-mount.yaml\napiVersion: v1\nkind: Pod\nmetadata:\n  name: cm-pod\nspec:\n  containers:\n  - name: app\n    image: busybox\n    command: ['sleep', '3600']\n    volumeMounts:\n    - name: config\n      mountPath: /etc/app/settings.ini\n      subPath: settings.ini\n  volumes:\n  - name: config\n    configMap:\n      name: app-config",
						],
					},
					{
						label: 'Step 3 — apply and verify',
						desc: '',
						code: [
							'kubectl apply -f cm-mount.yaml',
							'kubectl exec cm-pod -- cat /etc/app/settings.ini',
						],
					},
					{
						label: 'Step 4 — update the ConfigMap and observe',
						desc: 'Without subPath, changes propagate automatically. With subPath, the pod must restart to see new values.',
						code: [
							"kubectl create configmap app-config \\\n  --from-literal=settings.ini='[server]\nport=9090\ndebug=true' \\\n  --dry-run=client -o yaml | kubectl apply -f -",
						],
					},
				],
				expected:
					'File /etc/app/settings.ini exists inside the pod and contains the ConfigMap content.',
				note: 'Use subPath when mounting a single key as a specific file. Without subPath, the entire ConfigMap is mounted as a directory (one file per key). subPath mounts do NOT auto-update when the ConfigMap changes.',
			},
			{
				id: 't37',
				tag: 'essential',
				title: 'Dynamically provision a PVC with a StorageClass',
				difficulty: 'medium',
				scenario:
					'Create a StorageClass named fast-local using the local-path provisioner (available on Killercoda and most kubeadm clusters). Create a PVC that uses it — no manual PV needed. Mount the PVC in a pod and write a file. Verify the PV was created automatically.',
				steps: [
					{
						label: 'Step 1 — check what provisioners are available',
						desc: '',
						code: ['kubectl get storageclass'],
					},
					{
						label: 'Step 2 — create a custom StorageClass',
						desc: 'Use the provisioner name shown in step 1. On Killercoda it is rancher.io/local-path.',
						code: [
							'# sc.yaml\napiVersion: storage.k8s.io/v1\nkind: StorageClass\nmetadata:\n  name: fast-local\nprovisioner: rancher.io/local-path\nreclaimPolicy: Delete\nvolumeBindingMode: WaitForFirstConsumer',
						],
					},
					{
						label: 'Step 3 — create a PVC that references the StorageClass',
						desc: 'No PV is created manually — the provisioner handles it.',
						code: [
							'# pvc.yaml\napiVersion: v1\nkind: PersistentVolumeClaim\nmetadata:\n  name: fast-pvc\nspec:\n  storageClassName: fast-local\n  accessModes:\n  - ReadWriteOnce\n  resources:\n    requests:\n      storage: 200Mi',
						],
					},
					{
						label: 'Step 4 — apply both and check the PVC status',
						desc: 'With WaitForFirstConsumer the PVC stays Pending until a pod consumes it.',
						code: [
							'kubectl apply -f sc.yaml -f pvc.yaml',
							'kubectl get pvc fast-pvc  # Pending until a pod is created',
						],
					},
					{
						label: 'Step 5 — create a pod that mounts the PVC',
						desc: '',
						code: [
							"# pod.yaml\napiVersion: v1\nkind: Pod\nmetadata:\n  name: fast-pod\nspec:\n  containers:\n  - name: app\n    image: busybox\n    command: ['sleep', '3600']\n    volumeMounts:\n    - name: data\n      mountPath: /data\n  volumes:\n  - name: data\n    persistentVolumeClaim:\n      claimName: fast-pvc",
						],
					},
					{
						label: 'Step 6 — apply, then verify PVC and PV are both Bound',
						desc: '',
						code: [
							'kubectl apply -f pod.yaml',
							'kubectl get pvc fast-pvc',
							'kubectl get pv  # auto-created PV should appear',
						],
					},
				],
				expected:
					'PVC and auto-created PV both show Bound. Pod is Running. No manual PV was created.',
				note: 'WaitForFirstConsumer delays binding until a pod is scheduled, so the PV is created on the same node the pod lands on — important for local storage.',
			},
		],
	},
	{
		id: 's8',
		title: 'Networking',
		color: '#fb923c',
		tasks: [
			{
				id: 't20',
				tag: 'essential',
				title: 'Test DNS resolution inside the cluster',
				difficulty: 'easy',
				scenario:
					'Create a service named web-svc in the dev namespace backed by an nginx pod. From a debug pod in the default namespace, resolve and curl the service using its full DNS name.',
				steps: [
					{
						label: 'Step 1 — set up namespace, pod, and service',
						desc: '',
						code: [
							'kubectl create namespace dev',
							'kubectl run web --image=nginx -n dev --labels=app=web',
							'kubectl expose pod web -n dev --port=80 --name=web-svc',
						],
					},
					{
						label: 'Step 2 — get the full DNS name',
						desc: 'Format: <service>.<namespace>.svc.cluster.local',
						code: ['# DNS name is: web-svc.dev.svc.cluster.local'],
					},
					{
						label: 'Step 3 — test from the default namespace',
						desc: 'Cross-namespace DNS requires the full name.',
						code: [
							'kubectl run debug --image=busybox:1.28 --rm -it --restart=Never -- \\\n  nslookup web-svc.dev.svc.cluster.local',
						],
					},
					{
						label: 'Step 4 — curl it',
						desc: '',
						code: [
							'kubectl run debug --image=busybox:1.28 --rm -it --restart=Never -- \\\n  wget -O- web-svc.dev.svc.cluster.local:80',
						],
					},
				],
				expected:
					'nslookup resolves the name to a ClusterIP. wget returns nginx welcome page.',
				note: 'Within the same namespace you can use just the service name. Cross-namespace requires the full FQDN.',
			},
			{
				id: 't21',
				tag: 'essential',
				title: 'Create an Ingress with path-based routing',
				difficulty: 'hard',
				scenario:
					'You have two services: svc-a on port 80 and svc-b on port 80 in the default namespace. Create an Ingress that routes myapp.local/a to svc-a and myapp.local/b to svc-b.',
				steps: [
					{
						label: 'Step 1 — create mock services',
						desc: '',
						code: [
							'kubectl create deployment app-a --image=nginx',
							'kubectl expose deployment app-a --port=80 --name=svc-a',
							'kubectl create deployment app-b --image=httpd',
							'kubectl expose deployment app-b --port=80 --name=svc-b',
						],
					},
					{
						label: 'Step 2 — write the Ingress YAML',
						desc: '',
						code: [
							'# ingress.yaml\napiVersion: networking.k8s.io/v1\nkind: Ingress\nmetadata:\n  name: path-ingress\n  annotations:\n    nginx.ingress.kubernetes.io/rewrite-target: /\nspec:\n  ingressClassName: nginx\n  rules:\n  - host: myapp.local\n    http:\n      paths:\n      - path: /a\n        pathType: Prefix\n        backend:\n          service:\n            name: svc-a\n            port:\n              number: 80\n      - path: /b\n        pathType: Prefix\n        backend:\n          service:\n            name: svc-b\n            port:\n              number: 80',
						],
					},
					{
						label: 'Step 3 — apply and inspect',
						desc: '',
						code: [
							'kubectl apply -f ingress.yaml',
							'kubectl describe ingress path-ingress',
						],
					},
					{
						label: 'Step 4 — test (requires ingress controller and /etc/hosts or curl -H)',
						desc: '',
						code: [
							"curl -H 'Host: myapp.local' http://<ingress-ip>/a",
							"curl -H 'Host: myapp.local' http://<ingress-ip>/b",
						],
					},
				],
				expected: '/a returns nginx response, /b returns httpd response.',
				note: 'In the exam, an nginx Ingress controller is usually already installed. Check with: kubectl get pods -n ingress-nginx',
			},
			{
				id: 't38',
				tag: 'essential',
				title: 'Expose a deployment as a NodePort service',
				difficulty: 'easy',
				scenario:
					'Create a deployment named node-app with 2 replicas running nginx. Expose it as a NodePort service so it is reachable on a specific port on every node. Confirm you can curl the app using a node IP and the port.',
				steps: [
					{
						label: 'Step 1 — create the deployment',
						desc: '',
						code: ['kubectl create deployment node-app --image=nginx --replicas=2'],
					},
					{
						label: 'Step 2 — expose it as NodePort',
						desc: '',
						code: [
							'kubectl expose deployment node-app \\\n  --type=NodePort \\\n  --port=80 \\\n  --target-port=80 \\\n  --name=node-app-svc',
						],
					},
					{
						label: 'Step 3 — find the auto-assigned NodePort',
						desc: 'Look at the PORT(S) column — it will show 80:<nodePort>/TCP.',
						code: ['kubectl get svc node-app-svc'],
					},
					{
						label: 'Step 4 — get a node IP',
						desc: '',
						code: ['kubectl get nodes -o wide  # note the INTERNAL-IP column'],
					},
					{
						label: 'Step 5 — curl the app via node IP and NodePort',
						desc: '',
						code: ['curl http://<node-ip>:<node-port>'],
					},
					{
						label: 'Step 6 — patch to a specific NodePort (optional)',
						desc: 'The exam may ask for a specific port number.',
						code: [
							"kubectl patch svc node-app-svc -p '{\"spec\":{\"ports\":[{\"port\":80,\"targetPort\":80,\"nodePort\":30080}]}}'",
						],
					},
				],
				expected:
					'curl returns the nginx welcome page via the node IP and NodePort.',
				note: 'NodePort range: 30000–32767. The same port is open on ALL nodes in the cluster, even if the pod only runs on one of them.',
			},
			{
				id: 't39',
				tag: 'essential',
				title: 'Debug a CoreDNS failure and restore DNS resolution',
				difficulty: 'medium',
				scenario:
					'Simulate a CoreDNS outage by scaling its deployment to 0. Observe DNS failures in a pod, then restore CoreDNS and confirm resolution works again.',
				steps: [
					{
						label: 'Step 1 — confirm DNS works before breaking it',
						desc: '',
						code: [
							'kubectl run dns-test --image=busybox:1.28 --rm -it --restart=Never -- \\\n  nslookup kubernetes.default.svc.cluster.local',
						],
					},
					{
						label: 'Step 2 — scale CoreDNS to 0',
						desc: '',
						code: ['kubectl scale deployment coredns -n kube-system --replicas=0'],
					},
					{
						label: 'Step 3 — try DNS resolution again (it will fail)',
						desc: '',
						code: [
							'kubectl run dns-test2 --image=busybox:1.28 --rm -it --restart=Never -- \\\n  nslookup kubernetes.default.svc.cluster.local',
						],
					},
					{
						label: 'Step 4 — diagnose: check CoreDNS pods',
						desc: 'This is the first check when pods cannot resolve service names.',
						code: [
							'kubectl get pods -n kube-system | grep coredns',
							'kubectl get deployment coredns -n kube-system',
						],
					},
					{
						label: 'Step 5 — check the CoreDNS ConfigMap',
						desc: "A corrupt Corefile will cause CoreDNS pods to crash even when they're running.",
						code: ['kubectl describe configmap coredns -n kube-system'],
					},
					{
						label: 'Step 6 — restore CoreDNS',
						desc: '',
						code: ['kubectl scale deployment coredns -n kube-system --replicas=2'],
					},
					{
						label: 'Step 7 — wait for pods to be ready and re-test',
						desc: '',
						code: [
							'kubectl get pods -n kube-system -l k8s-app=kube-dns -w',
							'kubectl run dns-test3 --image=busybox:1.28 --rm -it --restart=Never -- \\\n  nslookup kubernetes.default.svc.cluster.local',
						],
					},
				],
				expected:
					'DNS fails after scaling to 0. After restoring, nslookup resolves kubernetes.default.svc.cluster.local successfully.',
				note: "DNS troubleshooting checklist: (1) CoreDNS pods running? (2) CoreDNS service exists in kube-system? (3) Pod's /etc/resolv.conf points to the cluster DNS IP? (4) NetworkPolicy blocking UDP 53?",
			},
			{
				id: 't45',
				tag: 'essential',
				title: 'Route HTTP traffic with the Gateway API',
				difficulty: 'hard',
				scenario:
					"The Gateway API is the modern successor to Ingress and is explicitly in the CKA v1.35 curriculum. Install the Gateway API CRDs, deploy Envoy Gateway as the controller, then create a Gateway and an HTTPRoute that routes /a to one service and /b to another. Use Killercoda's Kubernetes playground.",
				steps: [
					{
						label: 'Step 1 — install the Gateway API standard CRDs',
						desc: 'These are not bundled with Kubernetes by default.',
						code: [
							'kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/latest/download/standard-install.yaml',
							'kubectl get crd | grep gateway',
						],
					},
					{
						label: 'Step 2 — install Envoy Gateway (the controller)',
						desc: 'The controller watches Gateway resources and provisions the actual proxy.',
						code: [
							'helm install eg oci://docker.io/envoyproxy/gateway-helm \\\n  --version v1.3.0 \\\n  -n envoy-gateway-system \\\n  --create-namespace',
							'kubectl wait --timeout=5m \\\n  -n envoy-gateway-system \\\n  deployment/envoy-gateway \\\n  --for=condition=Available',
						],
					},
					{
						label: 'Step 3 — create two backend services',
						desc: '',
						code: [
							'kubectl create deployment app-a --image=nginx',
							'kubectl expose deployment app-a --port=80 --name=svc-a',
							'kubectl create deployment app-b --image=httpd',
							'kubectl expose deployment app-b --port=80 --name=svc-b',
						],
					},
					{
						label: 'Step 4 — create the Gateway',
						desc: 'The gatewayClassName must match the GatewayClass installed by the controller.',
						code: [
							'# gateway.yaml\napiVersion: gateway.networking.k8s.io/v1\nkind: Gateway\nmetadata:\n  name: demo-gateway\nspec:\n  gatewayClassName: eg\n  listeners:\n  - name: http\n    port: 80\n    protocol: HTTP\n    allowedRoutes:\n      namespaces:\n        from: Same',
						],
					},
					{
						label: 'Step 5 — create the HTTPRoute with path-based rules',
						desc: '',
						code: [
							'# httproute.yaml\napiVersion: gateway.networking.k8s.io/v1\nkind: HTTPRoute\nmetadata:\n  name: demo-route\nspec:\n  parentRefs:\n  - name: demo-gateway\n  rules:\n  - matches:\n    - path:\n        type: PathPrefix\n        value: /a\n    backendRefs:\n    - name: svc-a\n      port: 80\n  - matches:\n    - path:\n        type: PathPrefix\n        value: /b\n    backendRefs:\n    - name: svc-b\n      port: 80',
						],
					},
					{
						label: 'Step 6 — apply and wait for the Gateway to get an address',
						desc: '',
						code: [
							'kubectl apply -f gateway.yaml -f httproute.yaml',
							'kubectl get gateway demo-gateway -w  # wait for ADDRESS to appear',
						],
					},
					{
						label: 'Step 7 — test path routing',
						desc: 'Replace <GATEWAY-IP> with the ADDRESS from step 6.',
						code: [
							'curl http://<GATEWAY-IP>/a  # nginx',
							'curl http://<GATEWAY-IP>/b  # Apache httpd',
						],
					},
				],
				expected:
					'/a returns nginx welcome page. /b returns Apache httpd page.',
				note: 'Gateway API concepts: GatewayClass (cluster-scoped, like IngressClass), Gateway (the listener endpoint), HTTPRoute (the routing rules). A single Gateway can have many HTTPRoutes attached to it.',
			},
		],
	},
	{
		id: 's9',
		title: 'Troubleshooting',
		color: '#94a3b8',
		tasks: [
			{
				id: 't22',
				tag: 'essential',
				title: 'Debug a CrashLoopBackOff pod',
				difficulty: 'medium',
				scenario:
					"A pod named broken is in CrashLoopBackOff. It's running busybox with command /bin/sh -c 'cat /config/app.conf'. The file doesn't exist. Fix it by mounting a ConfigMap that provides the file.",
				steps: [
					{
						label: 'Step 1 — create the broken pod',
						desc: '',
						code: [
							"kubectl run broken --image=busybox -- /bin/sh -c 'cat /config/app.conf && sleep 3600'",
						],
					},
					{
						label: 'Step 2 — diagnose',
						desc: '',
						code: ['kubectl describe pod broken', 'kubectl logs broken --previous'],
					},
					{
						label: 'Step 3 — create the missing ConfigMap',
						desc: '',
						code: [
							"kubectl create configmap app-conf --from-literal=app.conf='debug=true'",
						],
					},
					{
						label: 'Step 4 — get the pod YAML and edit it',
						desc: '',
						code: [
							'kubectl get pod broken -o yaml > broken.yaml',
							'# Delete the pod, edit YAML to add volume + volumeMount',
						],
					},
					{
						label: 'Step 5 — add volume and mount to broken.yaml',
						desc: 'Under spec.volumes and containers[0].volumeMounts:',
						code: [
							'# Under spec.volumes:\nvolumes:\n- name: config-vol\n  configMap:\n    name: app-conf\n\n# Under containers[0].volumeMounts:\nvolumeMounts:\n- name: config-vol\n  mountPath: /config',
						],
					},
					{
						label: 'Step 6 — re-apply and verify',
						desc: '',
						code: [
							'kubectl delete pod broken --force --grace-period=0',
							'kubectl apply -f broken.yaml',
							'kubectl logs broken',
						],
					},
				],
				expected: 'Pod runs successfully and logs show: debug=true',
				note: 'Always check describe + logs + logs --previous. That trio solves 90% of pod failures.',
			},
			{
				id: 't23',
				tag: 'essential',
				title: 'Debug a service not routing to pods',
				difficulty: 'medium',
				scenario:
					'A deployment myapp exists with pods running nginx. A service myapp-svc also exists but requests to it return nothing. Find and fix the issue — the service selector is wrong.',
				steps: [
					{
						label: 'Step 1 — set up the broken scenario',
						desc: '',
						code: [
							'kubectl create deployment myapp --image=nginx --replicas=2',
							'kubectl expose deployment myapp --port=80 --name=myapp-svc',
							'# Now break the selector:\nkubectl patch svc myapp-svc -p \'{"spec":{"selector":{"app":"wrong-label"}}}\'',
						],
					},
					{
						label: 'Step 2 — check endpoints (the key diagnostic step)',
						desc: 'Empty endpoints = selector mismatch.',
						code: ['kubectl get endpoints myapp-svc'],
					},
					{
						label: 'Step 3 — check what labels the pods actually have',
						desc: '',
						code: ['kubectl get pods --show-labels'],
					},
					{
						label: 'Step 4 — fix the service selector',
						desc: '',
						code: [
							'kubectl patch svc myapp-svc -p \'{"spec":{"selector":{"app":"myapp"}}}\'',
						],
					},
					{
						label: 'Step 5 — verify endpoints are populated',
						desc: '',
						code: [
							'kubectl get endpoints myapp-svc',
							'kubectl run tmp --image=busybox:1.28 --rm -it -- wget -O- myapp-svc:80',
						],
					},
				],
				expected: 'After fix, endpoints shows pod IPs. wget returns nginx page.',
				note: "Empty Endpoints is always the first thing to check when a service doesn't route. It means the selector matches nothing.",
			},
			{
				id: 't24',
				tag: 'essential',
				title: 'Fix a broken kubelet on a worker node',
				difficulty: 'hard',
				scenario:
					"A worker node shows NotReady. SSH to it and diagnose why the kubelet isn't running. Fix it and confirm the node comes back.",
				steps: [
					{
						label: 'Step 1 — identify the NotReady node',
						desc: '',
						code: ['kubectl get nodes'],
					},
					{
						label: 'Step 2 — SSH to the broken node and check kubelet',
						desc: '',
						code: ['ssh <node>', 'systemctl status kubelet'],
					},
					{
						label: 'Step 3 — if kubelet is stopped, start it',
						desc: '',
						code: ['systemctl start kubelet', 'systemctl enable kubelet'],
					},
					{
						label: 'Step 4 — if kubelet fails to start, read the logs',
						desc: '',
						code: ['journalctl -u kubelet -n 50 --no-pager'],
					},
					{
						label: 'Step 5 — common fix: wrong config path',
						desc: 'Check /var/lib/kubelet/config.yaml exists and has valid content.',
						code: ['cat /var/lib/kubelet/config.yaml', 'ls /etc/kubernetes/pki/'],
					},
					{
						label: 'Step 6 — restart and watch',
						desc: '',
						code: [
							'systemctl daemon-reload',
							'systemctl restart kubelet',
							'systemctl status kubelet',
						],
					},
					{
						label: 'Step 7 — verify node comes back from the control plane',
						desc: '',
						code: ['kubectl get nodes -w'],
					},
				],
				expected:
					'Node transitions from NotReady to Ready within 1–2 minutes of kubelet restarting.',
				note: 'journalctl -u kubelet is your best friend for worker node failures. Look for certificate errors, wrong API server address, or missing config files.',
			},
			{
				id: 't40',
				tag: 'essential',
				title: 'Fix a broken static pod manifest',
				difficulty: 'hard',
				scenario:
					"A static pod manifest in /etc/kubernetes/manifests/ has an indentation error and uses a non-existent image tag. SSH to the control plane, identify and fix both issues. Use Killercoda's Kubernetes playground for SSH access.",
				steps: [
					{
						label: 'Step 1 — SSH to the control plane and create a broken manifest',
						desc: '',
						code: [
							"cat <<'EOF' > /etc/kubernetes/manifests/broken-static.yaml\napiVersion: v1\nkind: Pod\nmetadata:\n  name: broken-static\nspec:\n  containers:\n  - name: app\n    image: nginx:NOSUCHVERSION999\n  command: ['sleep', '9999']   # BUG: wrong indent — should be inside containers[]\nEOF",
						],
					},
					{
						label: 'Step 2 — observe kubelet errors',
						desc: 'kubelet logs the YAML parse or image pull failure.',
						code: ['journalctl -u kubelet -n 40 --no-pager | grep -i broken'],
					},
					{
						label: 'Step 3 — check what kubectl sees',
						desc: 'If the YAML is valid but image fails, the pod appears in ErrImagePull.',
						code: [
							'kubectl get pods -A | grep broken',
							'kubectl describe pod broken-static-controlplane 2>/dev/null | tail -20',
						],
					},
					{
						label: 'Step 4 — open the manifest and fix both issues',
						desc: 'Move command inside containers[0]. Change image to nginx:latest.',
						code: ['vi /etc/kubernetes/manifests/broken-static.yaml'],
					},
					{
						label: 'Step 5 — corrected manifest for reference',
						desc: 'This is what the fixed file should look like.',
						code: [
							"apiVersion: v1\nkind: Pod\nmetadata:\n  name: broken-static\nspec:\n  containers:\n  - name: app\n    image: nginx:latest\n    command: ['sleep', '9999']   # correct: inside the container spec",
						],
					},
					{
						label: 'Step 6 — verify kubelet picks up the fix automatically',
						desc: 'No restart needed — kubelet watches the directory.',
						code: ['kubectl get pods | grep broken-static'],
					},
				],
				expected:
					'After fixing both issues, the static pod reaches Running state.',
				note: "kubelet logs (journalctl -u kubelet) are the primary tool for static pod failures — kubectl events are less useful here because the pod may not even appear to the API server until the YAML is valid.",
			},
			{
				id: 't41',
				tag: 'essential',
				title: 'Diagnose and fix an ImagePullBackOff pod',
				difficulty: 'easy',
				scenario:
					'A pod named bad-image is stuck in ImagePullBackOff. Identify the root cause using events, fix the image reference, and get the pod running. Then do the same for a pod that needs registry credentials.',
				steps: [
					{
						label: 'Step 1 — create a pod with a bad image tag',
						desc: '',
						code: ['kubectl run bad-image --image=nginx:NOSUCHVERSION999'],
					},
					{
						label: 'Step 2 — observe the status progression',
						desc: 'ErrImagePull appears first, then ImagePullBackOff after retries.',
						code: ['kubectl get pod bad-image -w'],
					},
					{
						label: 'Step 3 — read the failure reason from events',
						desc: '',
						code: ['kubectl describe pod bad-image | tail -20'],
					},
					{
						label: 'Step 4 — fix the image — delete and recreate',
						desc: 'You cannot update a running pod image in-place. Delete and re-run.',
						code: [
							'kubectl delete pod bad-image --force --grace-period=0',
							'kubectl run bad-image --image=nginx:latest',
						],
					},
					{
						label: 'Step 5 — bonus: pull from a private registry using an imagePullSecret',
						desc: 'Create a docker-registry secret, then reference it in the pod spec.',
						code: [
							'kubectl create secret docker-registry my-registry-creds \\\n  --docker-server=myregistry.example.com \\\n  --docker-username=user \\\n  --docker-password=pass',
							'# In pod spec, add:\nimagePullSecrets:\n- name: my-registry-creds',
						],
					},
				],
				expected:
					'Pod reaches Running state after fixing the image tag.',
				note: 'ImagePullBackOff causes: wrong tag, typo in image name, private registry without credentials, or registry is unreachable. Check describe → Events for the exact message.',
			},
		],
	},
];
