// Tracker data — loaded before tracker.js
// Edit this file to update study plan topics, cheatsheet commands, and ADHD tips.

const SECTIONS = [
	{
		id: 's1',
		title: 'Core Concepts',
		schedule: '~12 hrs',
		topics: [
			{
				id: 's1t1',
				title: 'K8s Architecture',
				tasks: [
					'Name all control plane components from memory: apiserver, etcd, scheduler, controller-manager',
					'Name node components: kubelet, kube-proxy, container runtime',
					'Run: kubectl cluster-info && kubectl get nodes -o wide',
					'Describe a node and read its Conditions block',
				],
				cmds: [
					'kubectl cluster-info',
					'kubectl get nodes -o wide',
					'kubectl describe node <node>',
				],
				labs: [
					'KodeKloud: Core Concepts Practice Test 1',
					'Task: identify all pods in kube-system and their roles',
				],
			},
			{
				id: 's1t2',
				title: 'Pods',
				tasks: [
					'Create pod: kubectl run nginx --image=nginx',
					'Generate YAML: kubectl run nginx --image=nginx --dry-run=client -o yaml > pod.yaml',
					'Apply, get, describe, delete a pod',
					'Exec into pod: kubectl exec -it <pod> -- /bin/bash',
					'Write a multi-container pod YAML from scratch',
					'Create a pod in a specific namespace with -n flag',
				],
				cmds: [
					'kubectl run <n> --image=<img>',
					'kubectl run <n> --image=<img> --dry-run=client -o yaml > pod.yaml',
					'kubectl exec -it <pod> -- sh',
					'kubectl delete pod <pod> --force --grace-period=0',
				],
				labs: [
					'KodeKloud: Pods Practice Test',
					'Deploy 3 pods with different images in different namespaces',
				],
			},
			{
				id: 's1t3',
				title: 'ReplicaSets',
				tasks: [
					'Write a ReplicaSet YAML with selector/matchLabels',
					'Scale: kubectl scale rs <n> --replicas=5',
					'Delete RS without deleting pods: --cascade=orphan',
					'Explain pod adoption via label matching',
				],
				cmds: [
					'kubectl get rs',
					'kubectl scale rs <n> --replicas=N',
					'kubectl delete rs <n> --cascade=orphan',
				],
				labs: ['KodeKloud: ReplicaSets Practice Test'],
			},
			{
				id: 's1t4',
				title: 'Deployments',
				tasks: [
					'Create: kubectl create deployment nginx --image=nginx --replicas=3',
					'Update image: kubectl set image deployment/<n> nginx=nginx:1.20',
					'Rollback: kubectl rollout undo deployment/<n>',
					'Check rollout status: kubectl rollout status deployment/<n>',
					'Pause and resume a rollout',
				],
				cmds: [
					'kubectl create deployment <n> --image=<img> --replicas=N',
					'kubectl set image deployment/<n> <c>=<img>',
					'kubectl rollout undo deployment/<n>',
					'kubectl rollout history deployment/<n>',
				],
				labs: [
					'KodeKloud: Deployments Practice Test',
					'Task: deploy → update image → verify → rollback',
				],
			},
			{
				id: 's1t5',
				title: 'Namespaces',
				tasks: [
					'Create namespace and list all namespaces',
					'Deploy pod into specific namespace',
					'Set default namespace: kubectl config set-context --current --namespace=<ns>',
					'Access service across namespaces: <svc>.<ns>.svc.cluster.local',
				],
				cmds: [
					'kubectl create ns <n>',
					'kubectl get all -n <ns>',
					'kubectl config set-context --current --namespace=<ns>',
				],
				labs: ['KodeKloud: Namespaces Practice Test'],
			},
			{
				id: 's1t6',
				title: 'Services',
				tasks: [
					'Create ClusterIP: kubectl expose pod nginx --port=80',
					'Create NodePort service with YAML',
					'Test connectivity: kubectl run tmp --image=busybox:1.28 --rm -it -- wget -O- <svc>:80',
					'Understand LoadBalancer vs NodePort vs ClusterIP',
				],
				cmds: [
					'kubectl expose pod <pod> --port=80 --type=NodePort',
					'kubectl get svc',
					'kubectl describe svc <svc>',
				],
				labs: [
					'KodeKloud: Services Practice Test',
					'Expose deployment, test with one-shot busybox pod',
				],
			},
		],
	},
	{
		id: 's2',
		title: 'Scheduling',
		schedule: '~8 hrs',
		topics: [
			{
				id: 's2t1',
				title: 'Manual Scheduling',
				tasks: [
					'Assign pod to node via spec.nodeName in YAML',
					'Understand what happens when kube-scheduler is absent',
					"Replace a running pod's nodeName without deleting it",
				],
				cmds: ['kubectl replace --force -f pod.yaml', 'kubectl get pods -o wide'],
				labs: ['KodeKloud: Manual Scheduling Lab'],
			},
			{
				id: 's2t2',
				title: 'Labels & Selectors',
				tasks: [
					'Filter pods: kubectl get pods -l env=prod',
					'Label a node and use nodeSelector in pod spec',
					'Understand annotations vs labels',
				],
				cmds: [
					'kubectl label node <n> disk=ssd',
					'kubectl get pods -l <k>=<v>',
					'kubectl get pods --selector <k>=<v>',
				],
				labs: ['KodeKloud: Labels & Selectors Lab'],
			},
			{
				id: 's2t3',
				title: 'Taints & Tolerations',
				tasks: [
					'Taint node: kubectl taint node <n> key=val:NoSchedule',
					'Add matching toleration to pod YAML',
					'Remove taint: kubectl taint node <n> key-',
					'Understand NoSchedule vs PreferNoSchedule vs NoExecute',
				],
				cmds: [
					'kubectl taint nodes <n> key=val:NoSchedule',
					'kubectl taint nodes <n> key-',
					'kubectl describe node <n> | grep Taint',
				],
				labs: ['KodeKloud: Taints & Tolerations Lab'],
			},
			{
				id: 's2t4',
				title: 'Node Affinity',
				tasks: [
					'Write pod YAML with requiredDuringSchedulingIgnoredDuringExecution',
					'Understand required (hard) vs preferred (soft) affinity',
					'Combine node affinity with taints/tolerations',
				],
				cmds: ['kubectl label node <n> <key>=<val>', 'kubectl get nodes --show-labels'],
				labs: ['KodeKloud: Node Affinity Lab'],
			},
			{
				id: 's2t5',
				title: 'Resource Requests & Limits',
				tasks: [
					'Write pod with CPU + memory requests and limits',
					'Understand OOMKilled vs CPU throttling',
					'Create a LimitRange object',
					'Create a ResourceQuota object',
				],
				cmds: [
					'kubectl top pods',
					'kubectl top nodes',
					'kubectl describe node <n> | grep -A5 Allocatable',
				],
				labs: ['KodeKloud: Resource Requirements Lab'],
			},
			{
				id: 's2t6',
				title: 'DaemonSets',
				tasks: [
					'Create a DaemonSet YAML',
					'Understand use cases: log collector, node monitor, kube-proxy',
					'Verify pod runs on every node',
				],
				cmds: ['kubectl get ds -A', 'kubectl describe ds <n>'],
				labs: ['KodeKloud: DaemonSets Lab'],
			},
			{
				id: 's2t7',
				title: 'Static Pods',
				tasks: [
					'Find static pod dir: /etc/kubernetes/manifests/',
					'Create static pod by placing YAML in manifests dir',
					'Identify static pods in kubectl output (name has node suffix)',
					'Understand kubelet manages static pods independently',
				],
				cmds: [
					'ls /etc/kubernetes/manifests/',
					'systemctl restart kubelet',
					'kubectl get pods -A',
				],
				labs: ['KodeKloud: Static Pods Lab'],
			},
		],
	},
	{
		id: 's3',
		title: 'Logging & Monitoring',
		schedule: '~3 hrs',
		topics: [
			{
				id: 's3t1',
				title: 'Monitor Cluster Components',
				tasks: [
					'Install metrics-server, verify with kubectl top',
					'Sort pods by CPU: kubectl top pods --sort-by=cpu',
					'Understand metrics-server vs full monitoring (Prometheus)',
				],
				cmds: [
					'kubectl top nodes',
					'kubectl top pods --sort-by=cpu',
					'kubectl top pods --sort-by=memory',
				],
				labs: ['KodeKloud: Monitoring Lab'],
			},
			{
				id: 's3t2',
				title: 'Application Logs',
				tasks: [
					'kubectl logs <pod>',
					'kubectl logs <pod> -c <container> for multi-container pods',
					'kubectl logs <pod> --previous for crashed containers',
					'Stream logs: kubectl logs -f <pod>',
				],
				cmds: [
					'kubectl logs <pod>',
					'kubectl logs <pod> -c <container>',
					'kubectl logs <pod> --previous',
					'kubectl logs -f <pod>',
				],
				labs: ['KodeKloud: Logging Lab'],
			},
		],
	},
	{
		id: 's4',
		title: 'Application Lifecycle Management',
		schedule: '~8 hrs',
		topics: [
			{
				id: 's4t1',
				title: 'Rolling Updates & Rollbacks',
				tasks: [
					'Update image and observe rolling update',
					'kubectl rollout history deployment/<n>',
					'Rollback to specific revision: --to-revision=2',
					'Change rollout strategy to Recreate in YAML',
				],
				cmds: [
					'kubectl rollout history deployment/<n>',
					'kubectl rollout undo deployment/<n> --to-revision=N',
					'kubectl rollout pause deployment/<n>',
					'kubectl rollout resume deployment/<n>',
				],
				labs: ['KodeKloud: Rolling Updates Lab'],
			},
			{
				id: 's4t2',
				title: 'Commands & Arguments',
				tasks: [
					'Override ENTRYPOINT with command: in pod spec',
					'Override CMD with args: in pod spec',
					'kubectl run busybox --image=busybox -- sleep 3600',
				],
				cmds: ['kubectl run busybox --image=busybox -- sleep 3600'],
				labs: ['KodeKloud: Commands & Arguments Lab'],
			},
			{
				id: 's4t3',
				title: 'ConfigMaps',
				tasks: [
					'Create from literal: kubectl create cm app --from-literal=key=val',
					'Create from file: --from-file=config.txt',
					'Mount as env vars using envFrom',
					'Mount as a volume',
				],
				cmds: [
					'kubectl create cm <n> --from-literal=<k>=<v>',
					'kubectl create cm <n> --from-file=<file>',
					'kubectl get cm <n> -o yaml',
				],
				labs: ['KodeKloud: ConfigMaps Lab'],
			},
			{
				id: 's4t4',
				title: 'Secrets',
				tasks: [
					'Create: kubectl create secret generic my-secret --from-literal=pw=1234',
					"Decode: kubectl get secret <n> -o jsonpath='{.data.pw}' | base64 -d",
					'Mount as env var and as volume',
					'Understand base64 is NOT encryption',
				],
				cmds: [
					'kubectl create secret generic <n> --from-literal=<k>=<v>',
					"kubectl get secret <n> -o jsonpath='{.data.<k>}' | base64 -d",
				],
				labs: ['KodeKloud: Secrets Lab'],
			},
			{
				id: 's4t5',
				title: 'Init Containers',
				tasks: [
					'Write pod YAML with an initContainers: block',
					'Understand: init runs to completion first, then main starts',
					'Use init to wait for a dependency service',
				],
				cmds: ['kubectl describe pod <pod> | grep -A10 Init'],
				labs: ['KodeKloud: Init Containers Lab'],
			},
			{
				id: 's4t6',
				title: 'Jobs & CronJobs',
				tasks: [
					'Write a Job YAML: restartPolicy must be Never or OnFailure',
					'Set backoffLimit (retries) and ttlSecondsAfterFinished (auto-cleanup)',
					'kubectl get jobs — check COMPLETIONS column reaches 1/1',
					'Write a CronJob YAML with a cron schedule (e.g. "*/5 * * * *")',
					'Suspend a CronJob: kubectl patch cronjob <n> -p \'{"spec":{"suspend":true}}\'',
					'Understand successfulJobsHistoryLimit and failedJobsHistoryLimit',
				],
				cmds: [
					'kubectl create job <n> --image=<img> -- <cmd>',
					'kubectl get jobs',
					'kubectl logs -l job-name=<n>',
					'kubectl create cronjob <n> --image=<img> --schedule="* * * * *" -- <cmd>',
					'kubectl get cronjob',
				],
				labs: [
					'KodeKloud: Jobs & CronJobs Lab',
					'Task: create a Job that runs a one-off script, verify COMPLETIONS 1/1',
				],
			},
			{
				id: 's4t7',
				title: 'Workload Autoscaling (HPA)',
				tasks: [
					'Confirm metrics-server is running — HPA requires it',
					'Create HPA imperatively: kubectl autoscale deployment <n> --cpu-percent=50 --min=1 --max=5',
					'Watch HPA: kubectl get hpa -w — observe TARGETS column',
					'Generate CPU load and watch replicas scale out',
					'Understand scale-in cooldown (~5 min default) prevents flapping',
					'Write HPA YAML using autoscaling/v2 with resource metrics',
				],
				cmds: [
					'kubectl autoscale deployment <n> --cpu-percent=50 --min=1 --max=5',
					'kubectl get hpa',
					'kubectl describe hpa <n>',
					'kubectl get hpa <n> -w',
				],
				labs: [
					'KodeKloud: HPA Lab',
					'Task: autoscale php-apache, generate load with a busybox loop, watch replicas increase',
				],
			},
		],
	},
	{
		id: 's5',
		title: 'Cluster Maintenance',
		schedule: '~8 hrs',
		topics: [
			{
				id: 's5t1',
				title: 'Node Drain & Cordon',
				tasks: [
					'Drain: kubectl drain <node> --ignore-daemonsets --delete-emptydir-data',
					'Cordon a node to stop new scheduling',
					'Uncordon after maintenance',
					'Verify workloads moved to other nodes after drain',
				],
				cmds: [
					'kubectl drain <n> --ignore-daemonsets --delete-emptydir-data',
					'kubectl cordon <n>',
					'kubectl uncordon <n>',
				],
				labs: ['KodeKloud: OS Upgrades Lab'],
			},
			{
				id: 's5t2',
				title: 'Cluster Upgrade (kubeadm)',
				tasks: [
					'Check versions: kubectl version && kubeadm version',
					'Run: kubeadm upgrade plan',
					'Upgrade control plane: apt-get → kubeadm upgrade apply v1.X.X',
					'Upgrade kubelet + kubectl on control plane node',
					'Repeat drain → upgrade kubelet → uncordon for each worker',
					'Practice this end-to-end at least 3 times',
				],
				cmds: [
					'kubeadm upgrade plan',
					'kubeadm upgrade apply v1.X.X',
					'apt-mark unhold kubeadm && apt-get install kubeadm=1.X.X-00',
					'systemctl daemon-reload && systemctl restart kubelet',
				],
				labs: ['KodeKloud: Cluster Upgrade Lab — practice 3+ times, timed'],
			},
			{
				id: 's5t3',
				title: 'etcd Backup & Restore (not in v1.35 exam)',
				tasks: [
					'⚠ Not tested in the current CKA v1.35 curriculum — deprioritise if short on time',
					'Take snapshot — memorise all 4 flags (endpoint + 3 certs)',
					'Verify snapshot: etcdctl snapshot status ... --write-out=table',
					'Restore with --data-dir flag pointing to new dir',
					'Update etcd static pod manifest to use new data dir',
					'Verify cluster recovers after restore',
				],
				cmds: [
					'ETCDCTL_API=3 etcdctl snapshot save /backup/snap.db \\\n  --endpoints=https://127.0.0.1:2379 \\\n  --cacert=/etc/kubernetes/pki/etcd/ca.crt \\\n  --cert=/etc/kubernetes/pki/etcd/server.crt \\\n  --key=/etc/kubernetes/pki/etcd/server.key',
					'ETCDCTL_API=3 etcdctl snapshot status /backup/snap.db --write-out=table',
					'ETCDCTL_API=3 etcdctl snapshot restore /backup/snap.db --data-dir=/var/lib/etcd-new',
				],
				labs: ['KodeKloud: Backup & Restore Lab'],
			},
			{
				id: 's5t4',
				title: 'Helm',
				tasks: [
					'helm repo add <name> <url> && helm repo update',
					'Search: helm search repo <keyword>',
					'Inspect defaults: helm show values <chart>',
					'Install: helm install <release> <chart> -n <ns> --create-namespace',
					'Override values at install: --set key=value or -f values.yaml',
					'Upgrade: helm upgrade <release> <chart> --set key=newval',
					'Roll back: helm rollback <release> <revision>',
					'View history: helm history <release>',
					'Uninstall: helm uninstall <release> -n <ns>',
				],
				cmds: [
					'helm repo add <name> <url> && helm repo update',
					'helm search repo <keyword>',
					'helm show values <chart>',
					'helm install <release> <chart> -n <ns>',
					'helm upgrade <release> <chart> --set <k>=<v>',
					'helm rollback <release> <revision>',
					'helm list -n <ns>',
					'helm history <release>',
					'helm uninstall <release> -n <ns>',
				],
				labs: [
					'KodeKloud: Helm Lab',
					'Task: install → upgrade (change a value) → rollback → uninstall a chart end-to-end',
				],
			},
			{
				id: 's5t5',
				title: 'Kustomize',
				tasks: [
					'Understand kustomization.yaml fields: resources, patches, namePrefix, images',
					'Preview rendered output without applying: kubectl kustomize <dir>',
					'Apply a kustomization: kubectl apply -k <dir>',
					'Write a base with two overlays (e.g. dev and prod)',
					'Use images: block to change image tags per environment',
					'Use namePrefix: to prevent name collisions across overlays',
				],
				cmds: [
					'kubectl kustomize <dir>',
					'kubectl apply -k <dir>',
					'kubectl diff -k <dir>',
				],
				labs: [
					'KodeKloud: Kustomize Lab',
					'Task: create base + dev/prod overlays, apply both, verify names and replica counts differ',
				],
			},
			{
				id: 's5t6',
				title: 'CRDs & Operators',
				tasks: [
					'List installed CRDs: kubectl get crd',
					'Describe a CRD to understand its schema and group',
					'Understand: CRD = new resource type, Operator = controller that manages it',
					'Install an operator via Helm or kubectl apply -f',
					'Verify operator pods are running after installation',
					'Create a custom resource instance and verify kubectl get <kind> works',
				],
				cmds: [
					'kubectl get crd',
					'kubectl describe crd <name>',
					'kubectl api-resources | grep <group>',
					'kubectl get <custom-resource-kind>',
				],
				labs: [
					'KodeKloud: CRDs Lab',
					'Task: install a CRD, create a custom resource instance, verify it appears in kubectl get',
				],
			},
		],
	},
	{
		id: 's6',
		title: 'Security',
		schedule: '~12 hrs',
		topics: [
			{
				id: 's6t1',
				title: 'TLS Certificates',
				tasks: [
					'Understand PKI: CA, server certs, client certs',
					'Find cert files: ls /etc/kubernetes/pki/',
					'Check expiry: openssl x509 -in <cert> -text -noout | grep -A2 Validity',
					'Know which cert each component uses',
					'Run: kubeadm certs check-expiration',
				],
				cmds: [
					'ls /etc/kubernetes/pki/',
					'openssl x509 -in <cert> -text -noout',
					'kubeadm certs check-expiration',
				],
				labs: ['KodeKloud: TLS Certificates Lab'],
			},
			{
				id: 's6t2',
				title: 'CertificateSigningRequests',
				tasks: [
					'Create a CSR YAML object in Kubernetes',
					'kubectl certificate approve <n>',
					'Extract approved cert from the CSR object',
				],
				cmds: [
					'kubectl get csr',
					'kubectl certificate approve <n>',
					'kubectl certificate deny <n>',
				],
				labs: ['KodeKloud: Certificate API Lab'],
			},
			{
				id: 's6t3',
				title: 'KubeConfig',
				tasks: [
					'Understand ~/.kube/config structure: clusters / users / contexts',
					'Switch context: kubectl config use-context <n>',
					'Add a new cluster + user entry manually',
					'kubectl config view --minify',
				],
				cmds: [
					'kubectl config get-contexts',
					'kubectl config use-context <ctx>',
					'kubectl config current-context',
					'kubectl config set-context <ctx> --cluster=<c> --user=<u> --namespace=<ns>',
				],
				labs: ['KodeKloud: KubeConfig Lab'],
			},
			{
				id: 's6t4',
				title: 'RBAC — Roles & Bindings',
				tasks: [
					'Create Role: kubectl create role pod-reader --verb=get,list --resource=pods -n <ns>',
					'Create RoleBinding to a user',
					'Test: kubectl auth can-i get pods --as=jane',
					'Understand Role (namespaced) vs ClusterRole (cluster-wide)',
					'Create ClusterRole + ClusterRoleBinding',
				],
				cmds: [
					'kubectl create role <n> --verb=<v> --resource=<r>',
					'kubectl create rolebinding <n> --role=<r> --user=<u>',
					'kubectl auth can-i <verb> <resource> --as=<user>',
				],
				labs: ['KodeKloud: RBAC Lab'],
			},
			{
				id: 's6t5',
				title: 'Service Accounts',
				tasks: [
					'Create a ServiceAccount',
					'Bind a Role to the ServiceAccount',
					'Mount SA in pod via spec.serviceAccountName',
					'Understand the default SA per namespace',
				],
				cmds: [
					'kubectl create sa <n>',
					'kubectl create rolebinding <n> --role=<r> --serviceaccount=<ns>:<sa>',
				],
				labs: ['KodeKloud: Service Accounts Lab'],
			},
			{
				id: 's6t6',
				title: 'Security Contexts',
				tasks: [
					'Run pod as specific user: securityContext.runAsUser',
					'Add/drop Linux capabilities in container spec',
					'Set readOnlyRootFilesystem: true',
					'Understand pod-level vs container-level context',
				],
				cmds: ['kubectl exec <pod> -- whoami', 'kubectl exec <pod> -- id'],
				labs: ['KodeKloud: Security Contexts Lab'],
			},
			{
				id: 's6t7',
				title: 'Network Policies',
				tasks: [
					'Write NetworkPolicy: deny all ingress to a pod',
					'Allow ingress only from specific pod/namespace selector',
					'Understand CNI must support NetworkPolicy (Calico, Cilium)',
					'Test connectivity before and after applying the policy',
				],
				cmds: [
					'kubectl get netpol -A',
					'kubectl describe netpol <n>',
					'kubectl run tmp --image=busybox:1.28 --rm -it -- wget -O- <pod-ip>:80',
				],
				labs: [
					'KodeKloud: Network Policies Lab',
					'Killer Coda: NetworkPolicy scenarios (free)',
				],
			},
		],
	},
	{
		id: 's7',
		title: 'Storage',
		schedule: '~6 hrs',
		topics: [
			{
				id: 's7t1',
				title: 'Volumes',
				tasks: [
					'Mount emptyDir volume shared between two containers',
					'Mount hostPath volume',
					'Verify data persists across pod restarts with hostPath but not emptyDir',
				],
				cmds: ['kubectl exec <pod> -c <container> -- ls /mnt/data'],
				labs: ['KodeKloud: Volumes Lab'],
			},
			{
				id: 's7t2',
				title: 'Persistent Volumes & PVCs',
				tasks: [
					'Create PersistentVolume YAML (use hostPath for practice)',
					'Create PersistentVolumeClaim and bind it',
					'Mount PVC in a pod spec',
					'kubectl get pv,pvc and verify Bound status',
					'Understand accessModes: RWO, ROX, RWX',
					'Understand reclaim policies: Retain, Delete',
				],
				cmds: ['kubectl get pv', 'kubectl get pvc', 'kubectl describe pvc <n>'],
				labs: ['KodeKloud: Persistent Volumes Lab'],
			},
			{
				id: 's7t3',
				title: 'Storage Classes',
				tasks: [
					'Create a StorageClass YAML',
					'Create PVC referencing storageClassName for dynamic provisioning',
					'Understand the provisioner field',
				],
				cmds: ['kubectl get sc', 'kubectl describe sc <n>'],
				labs: ['KodeKloud: Storage Classes Lab'],
			},
		],
	},
	{
		id: 's8',
		title: 'Networking',
		schedule: '~10 hrs',
		topics: [
			{
				id: 's8t1',
				title: 'CNI & Pod Networking',
				tasks: [
					'Identify CNI in use: ls /etc/cni/net.d/',
					'Understand how pods get IPs via IPAM',
					'Verify pod-to-pod communication across nodes',
				],
				cmds: ['ls /etc/cni/net.d/', 'kubectl get pods -o wide', 'ip addr', 'ip route'],
				labs: ['KodeKloud: Networking Basics Lab'],
			},
			{
				id: 's8t2',
				title: 'CoreDNS',
				tasks: [
					'Verify CoreDNS pods: kubectl get pods -n kube-system | grep coredns',
					'Test DNS: kubectl run tmp --image=busybox:1.28 --rm -it -- nslookup kubernetes',
					'Understand DNS format: <svc>.<ns>.svc.cluster.local',
					'Inspect the CoreDNS ConfigMap',
				],
				cmds: [
					'kubectl get cm coredns -n kube-system -o yaml',
					'kubectl run tmp --image=busybox:1.28 --rm -it -- nslookup <svc>',
				],
				labs: ['KodeKloud: CoreDNS Lab'],
			},
			{
				id: 's8t3',
				title: 'Ingress',
				tasks: [
					'Install nginx Ingress controller',
					'Create Ingress routing to a service',
					'Path-based routing: /app1 → svc1, /app2 → svc2',
					'Host-based routing',
					"Test with: curl -H 'Host: myapp.com' http://<node-ip>:<port>",
				],
				cmds: [
					'kubectl create ingress <n> --rule=<host>/<path>=<svc>:<port>',
					'kubectl get ingress',
					'kubectl describe ingress <n>',
				],
				labs: ['KodeKloud: Ingress Lab', 'Killer Coda: Ingress scenarios (free)'],
			},
			{
				id: 's8t4',
				title: 'Gateway API',
				tasks: [
					'Understand the three core resources: GatewayClass, Gateway, HTTPRoute',
					'GatewayClass = cluster-level, like IngressClass (defines the controller)',
					'Gateway = the listener endpoint (port, protocol, allowed namespaces)',
					'HTTPRoute = routing rules attached to a Gateway via parentRefs',
					'Install Gateway API CRDs: kubectl apply -f standard-install.yaml',
					'Write a Gateway manifest referencing a GatewayClass',
					'Write an HTTPRoute with path-based or host-based rules',
					'kubectl get gateways && kubectl get httproutes',
				],
				cmds: [
					'kubectl get gatewayclasses',
					'kubectl get gateways',
					'kubectl get httproutes',
					'kubectl describe gateway <n>',
					'kubectl describe httproute <n>',
				],
				labs: [
					'KodeKloud: Gateway API Lab',
					'Task: deploy two services, route /a → svc-a and /b → svc-b via HTTPRoute',
					'Killercoda Kubernetes playground (install Gateway API CRDs first)',
				],
			},
		],
	},
	{
		id: 's9',
		title: 'Troubleshooting',
		schedule: '~10 hrs',
		topics: [
			{
				id: 's9t1',
				title: 'Application Failure',
				tasks: [
					'Debug CrashLoopBackOff: describe pod + logs --previous',
					'Debug ImagePullBackOff: check image name/tag/secret',
					'Debug Pending pod: check resources, taints, node affinity',
					'Debug service not routing: verify selector matches pod labels',
				],
				cmds: [
					'kubectl describe pod <pod>',
					'kubectl logs <pod> --previous',
					'kubectl get events --sort-by=.metadata.creationTimestamp',
				],
				labs: [
					'KodeKloud: Application Failure Lab',
					'Break-and-fix: deliberately misconfigure a deployment and debug it',
				],
			},
			{
				id: 's9t2',
				title: 'Control Plane Failure',
				tasks: [
					'Check control plane pods: kubectl get pods -n kube-system',
					'Check kubelet: systemctl status kubelet',
					'Inspect static pod manifests for typos in /etc/kubernetes/manifests/',
					'kubectl logs kube-apiserver-<node> -n kube-system',
				],
				cmds: [
					'kubectl get pods -n kube-system',
					'systemctl status kubelet',
					'journalctl -u kubelet -f',
				],
				labs: ['KodeKloud: Control Plane Failure Lab'],
			},
			{
				id: 's9t3',
				title: 'Worker Node Failure',
				tasks: [
					'Check node: kubectl get nodes',
					'SSH to node, check kubelet status',
					'Check kubelet config and cert paths',
					'journalctl -u kubelet for detailed error output',
				],
				cmds: [
					'kubectl get nodes',
					'kubectl describe node <n> | grep -A5 Condition',
					'systemctl restart kubelet',
					'journalctl -u kubelet -n 50',
				],
				labs: ['KodeKloud: Worker Node Failure Lab'],
			},
			{
				id: 's9t4',
				title: 'Networking Troubleshooting',
				tasks: [
					'Verify CNI pods running in kube-system',
					'Check kube-proxy pods running',
					'Test DNS: deploy busybox, run nslookup kubernetes',
					'Verify endpoints: kubectl get endpoints <svc>',
					'Check if a NetworkPolicy is blocking traffic',
				],
				cmds: [
					'kubectl get endpoints <svc>',
					'kubectl run tmp --image=busybox:1.28 --rm -it -- nslookup kubernetes',
					"kubectl get pods -n kube-system | grep -E 'coredns|proxy'",
				],
				labs: ['KodeKloud: Network Troubleshooting Lab'],
			},
		],
	},
];

const CHEATSHEET = [
	{
		cat: 'Pod operations',
		items: [
			{ cmd: 'kubectl run <n> --image=<img>', desc: 'Create pod' },
			{
				cmd: 'kubectl run <n> --image=<img> --dry-run=client -o yaml > pod.yaml',
				desc: 'Generate pod YAML',
			},
			{ cmd: 'kubectl get pods -o wide', desc: 'List pods with IPs + nodes' },
			{ cmd: 'kubectl describe pod <pod>', desc: 'Full details + events' },
			{ cmd: 'kubectl exec -it <pod> -- /bin/bash', desc: 'Shell into pod' },
			{
				cmd: 'kubectl exec -it <pod> -c <container> -- sh',
				desc: 'Shell into specific container',
			},
			{ cmd: 'kubectl logs <pod> --previous', desc: 'Logs of crashed container' },
			{ cmd: 'kubectl delete pod <pod> --force --grace-period=0', desc: 'Force delete' },
			{
				cmd: 'kubectl run tmp --image=busybox:1.28 --rm -it -- <cmd>',
				desc: 'One-shot debug pod',
			},
		],
	},
	{
		cat: 'Deployments',
		items: [
			{
				cmd: 'kubectl create deployment <n> --image=<img> --replicas=3',
				desc: 'Create deployment',
			},
			{ cmd: 'kubectl set image deployment/<n> <container>=<img>', desc: 'Update image' },
			{ cmd: 'kubectl rollout status deployment/<n>', desc: 'Watch rollout' },
			{ cmd: 'kubectl rollout history deployment/<n>', desc: 'Revision history' },
			{
				cmd: 'kubectl rollout undo deployment/<n> --to-revision=N',
				desc: 'Rollback to revision',
			},
			{ cmd: 'kubectl scale deployment <n> --replicas=N', desc: 'Scale' },
		],
	},
	{
		cat: 'YAML generation (--dry-run=client -o yaml)',
		items: [
			{ cmd: 'kubectl run <pod> --image=<img> --dry-run=client -o yaml', desc: 'Pod' },
			{
				cmd: 'kubectl create deployment <n> --image=<img> --dry-run=client -o yaml',
				desc: 'Deployment',
			},
			{
				cmd: 'kubectl create service clusterip <n> --tcp=80:80 --dry-run=client -o yaml',
				desc: 'ClusterIP Service',
			},
			{
				cmd: 'kubectl create configmap <n> --from-literal=k=v --dry-run=client -o yaml',
				desc: 'ConfigMap',
			},
			{
				cmd: 'kubectl create secret generic <n> --from-literal=k=v --dry-run=client -o yaml',
				desc: 'Secret',
			},
			{
				cmd: 'kubectl create role <n> --verb=get,list --resource=pods --dry-run=client -o yaml',
				desc: 'Role',
			},
			{
				cmd: 'kubectl create rolebinding <n> --role=<r> --user=<u> --dry-run=client -o yaml',
				desc: 'RoleBinding',
			},
			{
				cmd: 'kubectl create ingress <n> --rule=host/path=svc:port --dry-run=client -o yaml',
				desc: 'Ingress',
			},
		],
	},
	{
		cat: 'Context & namespace',
		items: [
			{
				cmd: 'kubectl config set-context --current --namespace=<ns>',
				desc: 'Switch default namespace',
			},
			{ cmd: 'kubectl config use-context <ctx>', desc: 'Switch context' },
			{ cmd: 'kubectl config get-contexts', desc: 'List contexts' },
			{ cmd: 'kubectl get all -A', desc: 'All resources, all namespaces' },
		],
	},
	{
		cat: 'RBAC',
		items: [
			{
				cmd: 'kubectl auth can-i <verb> <resource> --as=<user>',
				desc: 'Test user permissions',
			},
			{
				cmd: 'kubectl auth can-i create pods -n <ns> --as=system:serviceaccount:<ns>:<sa>',
				desc: 'Test SA permissions',
			},
			{ cmd: 'kubectl get roles,rolebindings -n <ns>', desc: 'Roles in namespace' },
			{
				cmd: 'kubectl get clusterroles,clusterrolebindings | grep -v system:',
				desc: 'Custom cluster roles',
			},
		],
	},
	{
		cat: 'Storage',
		items: [
			{ cmd: 'kubectl get pv,pvc', desc: 'List PVs and PVCs' },
			{ cmd: 'kubectl describe pvc <n>', desc: 'Check binding status' },
			{ cmd: 'kubectl get sc', desc: 'List storage classes' },
		],
	},
	{
		cat: 'etcd backup (not in v1.35 exam)',
		items: [
			{
				cmd: 'ETCDCTL_API=3 etcdctl snapshot save /backup/snap.db \\\n  --endpoints=https://127.0.0.1:2379 \\\n  --cacert=/etc/kubernetes/pki/etcd/ca.crt \\\n  --cert=/etc/kubernetes/pki/etcd/server.crt \\\n  --key=/etc/kubernetes/pki/etcd/server.key',
				desc: 'Save snapshot',
			},
			{
				cmd: 'ETCDCTL_API=3 etcdctl snapshot status /backup/snap.db --write-out=table',
				desc: 'Verify snapshot',
			},
			{
				cmd: 'ETCDCTL_API=3 etcdctl snapshot restore /backup/snap.db --data-dir=/var/lib/etcd-new',
				desc: 'Restore snapshot',
			},
		],
	},
	{
		cat: 'Helm',
		items: [
			{ cmd: 'helm repo add <name> <url> && helm repo update', desc: 'Add and sync a repo' },
			{ cmd: 'helm search repo <keyword>', desc: 'Search charts' },
			{ cmd: 'helm show values <chart>', desc: 'Inspect default values' },
			{
				cmd: 'helm install <release> <chart> -n <ns> --create-namespace',
				desc: 'Install a chart',
			},
			{ cmd: 'helm upgrade <release> <chart> --set <k>=<v>', desc: 'Upgrade with override' },
			{ cmd: 'helm rollback <release> <revision>', desc: 'Roll back to a revision' },
			{ cmd: 'helm history <release> -n <ns>', desc: 'View revision history' },
			{ cmd: 'helm list -A', desc: 'All releases across namespaces' },
			{ cmd: 'helm uninstall <release> -n <ns>', desc: 'Remove a release' },
		],
	},
	{
		cat: 'Kustomize',
		items: [
			{ cmd: 'kubectl kustomize <dir>', desc: 'Preview rendered manifests (no apply)' },
			{ cmd: 'kubectl apply -k <dir>', desc: 'Apply a kustomization directory' },
			{ cmd: 'kubectl diff -k <dir>', desc: 'Diff against current cluster state' },
		],
	},
	{
		cat: 'Gateway API',
		items: [
			{ cmd: 'kubectl get gatewayclasses', desc: 'List GatewayClasses (like IngressClass)' },
			{ cmd: 'kubectl get gateways', desc: 'List Gateways (listener endpoints)' },
			{ cmd: 'kubectl get httproutes', desc: 'List HTTPRoutes (routing rules)' },
			{ cmd: 'kubectl describe gateway <n>', desc: 'Gateway status and attached routes' },
			{ cmd: 'kubectl describe httproute <n>', desc: 'Route rules and parent gateway' },
		],
	},
	{
		cat: 'Autoscaling (HPA)',
		items: [
			{
				cmd: 'kubectl autoscale deployment <n> --cpu-percent=50 --min=1 --max=5',
				desc: 'Create HPA',
			},
			{ cmd: 'kubectl get hpa', desc: 'List HPAs — shows TARGETS: current/desired %' },
			{ cmd: 'kubectl describe hpa <n>', desc: 'HPA events and scaling decisions' },
		],
	},
	{
		cat: 'Troubleshooting',
		items: [
			{
				cmd: 'kubectl get events --sort-by=.metadata.creationTimestamp -n <ns>',
				desc: 'Recent events',
			},
			{ cmd: 'kubectl get pods -A | grep -v Running', desc: 'Find unhealthy pods' },
			{ cmd: 'systemctl status kubelet', desc: 'Check kubelet service' },
			{ cmd: 'journalctl -u kubelet -n 50', desc: 'kubelet recent logs' },
			{ cmd: 'kubectl get endpoints <svc>', desc: 'Verify service endpoints' },
			{ cmd: 'crictl ps', desc: 'Container list on a node' },
		],
	},
	{
		cat: 'JSONPath & output',
		items: [
			{
				cmd: "kubectl get pods -o jsonpath='{.items[*].metadata.name}'",
				desc: 'All pod names',
			},
			{
				cmd: "kubectl get node <n> -o jsonpath='{.status.nodeInfo.osImage}'",
				desc: 'Node OS image',
			},
			{
				cmd: "kubectl get secret <n> -o jsonpath='{.data.<key>}' | base64 -d",
				desc: 'Decode secret value',
			},
			{ cmd: 'kubectl get pods --sort-by=.metadata.creationTimestamp', desc: 'Sort by age' },
			{
				cmd: "kubectl get pods -o custom-columns='NAME:.metadata.name,STATUS:.status.phase'",
				desc: 'Custom columns',
			},
		],
	},
];

const TIPS = [
	'Use Pomodoro: 25 min on, 5 min off. Start the timer BEFORE opening a terminal.',
	"Before every session: write ONE goal. E.g. 'Get PVCs working from memory without notes.'",
	'Break things deliberately — misconfigure a deployment, then debug it. Far more engaging.',
	'Docs open = good. Videos playing passively = bad. Struggle first, consult docs second.',
	'Highest-value exam topics (v1.35): Troubleshooting (30%), cluster upgrade, RBAC, Helm/Kustomize, Gateway API, HPA, NetworkPolicy. etcd backup is no longer in the exam.',
	"killer.sh is harder than the real exam. Scoring 70%+ there means you're likely ready.",
	'kubectl --dry-run=client -o yaml is your best friend. Generate everything, never type YAML cold.',
	'Local cluster (minikube/kind) lets you break things freely. More engaging than scripted labs.',
];
