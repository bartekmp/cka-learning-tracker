// Quiz questions — fill in the blank. The snippet in `code` contains "____";
// the options are what goes there. Ids are named after the practice task
// (t6 = "Taint a node and add a Toleration", …) the snippet comes from.
QUIZ.push(
	// ── Workloads & Scheduling ────────────────────────────────────────────────
	quizQ(
		'fill-t2-force-delete',
		'workloads',
		'Fill the blank: delete the pod immediately, without the 30-second wait.',
		'--force --grace-period=0',
		['--grace-period=30 --wait', '--cascade=foreground --wait', '--force --timeout=0'],
		'--grace-period=0 alone becomes 1 second; with --force the object is removed at once.',
		'kubectl delete pod web ____'
	),
	quizQ(
		'fill-t3-expose',
		'workloads',
		'Fill the blank: put a Service in front of the Deployment.',
		'expose',
		['create service', 'port-forward', 'publish'],
		'kubectl expose deployment <name> creates a Service that selects the Deployment’s pods.',
		'kubectl ____ deployment myapp --port=80 --target-port=80'
	),
	quizQ(
		'fill-t4-set-context',
		'workloads',
		'Fill the blank: make staging the default namespace of the current context.',
		'set-context',
		['use-context', 'set-cluster', 'set-namespace'],
		'There is no set-namespace; the namespace is a field of the context.',
		'kubectl config ____ --current --namespace=staging'
	),
	quizQ(
		'fill-t26-nodeselector',
		'workloads',
		'Fill the blank: only run this pod on nodes labelled disktype=ssd.',
		'nodeSelector',
		['nodeName', 'nodeAffinity', 'nodeLabels'],
		'nodeSelector is a plain label match. nodeName would pin to one node by name.',
		`spec:
  ____:
    disktype: ssd
  containers:
  - name: nginx
    image: nginx`
	),
	quizQ(
		'fill-t26-label-remove',
		'workloads',
		'Fill the blank: remove the disktype label from the node.',
		'-',
		['=none', '=', '--remove'],
		'A trailing dash after the key removes the label.',
		'kubectl label node worker1 disktype____'
	),
	quizQ(
		'fill-t5-nodename',
		'workloads',
		'Fill the blank: bypass the scheduler and put the pod on worker1.',
		'nodeName',
		['nodeSelector', 'schedulerName', 'nodeAffinity'],
		'A pod with nodeName set is already "scheduled" as far as the scheduler cares.',
		`spec:
  ____: worker1
  containers:
  - name: pinned
    image: nginx`
	),
	quizQ(
		'fill-t6-taint-noschedule',
		'workloads',
		'Fill the blank: new pods without a toleration must not land here, but running pods stay.',
		'NoSchedule',
		['NoExecute', 'PreferNoSchedule', 'Evict'],
		'NoExecute would also evict pods that are already running. NoSchedule only blocks new ones.',
		'kubectl taint nodes worker1 gpu=true:____'
	),
	quizQ(
		'fill-t6-untaint',
		'workloads',
		'Fill the blank: remove the taint again.',
		'-',
		['--remove', '=false', ':none'],
		'Same trick as labels: repeat the taint and add a trailing dash.',
		'kubectl taint nodes worker1 gpu=true:NoSchedule____'
	),
	quizQ(
		'fill-t6-toleration-operator',
		'workloads',
		'Fill the blank: the toleration must match key gpu and value "true".',
		'Equal',
		['Exists', 'Match', 'In'],
		'Equal compares the value. Exists ignores the value and must not have one.',
		`tolerations:
- key: gpu
  operator: ____
  value: "true"
  effect: NoSchedule`
	),
	quizQ(
		'fill-t8-requests',
		'workloads',
		'Fill the blank: the amount the scheduler reserves for the pod when picking a node.',
		'requests',
		['reservations', 'guarantees', 'minimum'],
		'The scheduler places by requests. limits only matter at runtime.',
		`resources:
  ____:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 200m
    memory: 256Mi`
	),
	quizQ(
		'fill-t27-required',
		'workloads',
		'Fill the blank: a hard rule. The pod stays Pending if no node matches.',
		'requiredDuringSchedulingIgnoredDuringExecution',
		[
			'preferredDuringSchedulingIgnoredDuringExecution',
			'requiredDuringSchedulingRequiredDuringExecution',
			'requiredDuringExecution',
		],
		'The "preferred" variant is soft and uses weight + preference instead of nodeSelectorTerms.',
		`affinity:
  nodeAffinity:
    ____:
      nodeSelectorTerms:
      - matchExpressions:
        - key: zone
          operator: In
          values: ["us-east"]`
	),
	quizQ(
		'fill-t28-priority-value',
		'workloads',
		'Fill the blank: create a PriorityClass with value 1000.',
		'--value',
		['--priority', '--weight', '--level'],
		'A PriorityClass is just a name and an integer value; higher wins.',
		'kubectl create priorityclass high-priority ____=1000 --description="high"'
	),
	quizQ(
		'fill-t11-set-image',
		'workloads',
		'Fill the blank: update the container image of Deployment app-v1 (created with --image=nginx:1.19).',
		'nginx',
		['app-v1', 'image', 'deployment'],
		'The left side is the container name. kubectl create deployment names it after the image.',
		'kubectl set image deployment/app-v1 ____=nginx:1.21'
	),
	quizQ(
		'fill-t11-rollout-undo',
		'workloads',
		'Fill the blank: go back to revision 1.',
		'undo',
		['rollback', 'revert', 'restore'],
		'helm has rollback, kubectl has rollout undo.',
		'kubectl rollout ____ deployment/app-v1 --to-revision=1'
	),
	quizQ(
		'fill-t12-envfrom-configmap',
		'workloads',
		'Fill the blank: load every key of the ConfigMap app-config as an environment variable.',
		'configMapRef',
		['configMapKeyRef', 'secretRef', 'configMapEnv'],
		'envFrom + configMapRef takes the whole map. configMapKeyRef (under env) picks one key.',
		`envFrom:
- ____:
    name: app-config`
	),
	quizQ(
		'fill-t12-create-secret',
		'workloads',
		'Fill the blank: create a Secret from a literal.',
		'secret',
		['configmap', 'credential', 'opaque'],
		'The full form is kubectl create secret generic <name> --from-literal=…',
		'kubectl create ____ generic app-secret --from-literal=DB_PASS=s3cr3t'
	),
	quizQ(
		'fill-t31-backoff-limit',
		'workloads',
		'Fill the blank: retry a failing pod up to 3 times before the Job is marked failed.',
		'backoffLimit',
		['retries', 'completions', 'activeDeadlineSeconds'],
		'completions is how many successful pods are needed, not how many retries are allowed.',
		`apiVersion: batch/v1
kind: Job
spec:
  ____: 3
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: hash
        image: busybox`
	),
	quizQ(
		'fill-t32-suspend',
		'workloads',
		'Fill the blank: pause the CronJob without deleting it.',
		'suspend',
		['paused', 'disabled', 'stop'],
		'spec.suspend: true stops new Jobs from being created. Running ones finish.',
		`kubectl patch cronjob heartbeat -p '{"spec":{"____":true}}'`
	),
	quizQ(
		'fill-t32-every-5-min',
		'workloads',
		'Fill the blank: run every 5 minutes.',
		'*/5 * * * *',
		['5 * * * *', '* */5 * * *', '*/5 */5 * * *'],
		'The first field is minutes. 5 * * * * would run once an hour, at minute 5.',
		`spec:
  schedule: "____"`
	),
	quizQ(
		'fill-t42-hpa-max',
		'workloads',
		'Fill the blank: never scale beyond 5 replicas.',
		'--max',
		['--replicas', '--limit', '--upper'],
		'kubectl autoscale takes --min, --max and --cpu-percent.',
		'kubectl autoscale deployment php-apache --cpu-percent=50 --min=1 ____=5'
	),
	quizQ(
		'fill-t49-native-sidecar',
		'workloads',
		'Fill the blank: make this init container a native sidecar that keeps running.',
		'Always',
		['Never', 'OnFailure', 'Sidecar'],
		'An init container with restartPolicy: Always starts first and keeps running next to the app.',
		`initContainers:
  - name: log-shipper
    image: busybox:1.28
    restartPolicy: ____
    command: ["sh", "-c", "tail -F /var/log/app.log"]`
	),
	quizQ(
		'fill-t53-initial-delay',
		'workloads',
		'Fill the blank: wait 3 seconds after the container starts before the first probe.',
		'initialDelaySeconds',
		['timeoutSeconds', 'failureThreshold', 'startDelay'],
		'timeoutSeconds is how long one probe may take; it does not delay the first one.',
		`livenessProbe:
  httpGet:
    path: /healthz
    port: 80
  ____: 3
  periodSeconds: 5`
	),

	// ── Cluster Architecture, Installation & Configuration ────────────────────
	quizQ(
		'fill-t25-static-pod-path',
		'arch',
		'Fill the blank: find the directory the kubelet reads static pod manifests from.',
		'staticPodPath',
		['manifestPath', 'staticPods', 'podManifestDir'],
		'On kubeadm clusters it is /etc/kubernetes/manifests.',
		'grep ____ /var/lib/kubelet/config.yaml'
	),
	quizQ(
		'fill-t14-drain',
		'arch',
		'Fill the blank: drain the node even though DaemonSet pods run on it.',
		'--ignore-daemonsets',
		['--force-daemonsets', '--skip-daemonsets', '--evict-all'],
		'DaemonSet pods would be recreated at once, so drain skips them when told to.',
		'kubectl drain worker1 ____ --delete-emptydir-data'
	),
	quizQ(
		'fill-t33-upgrade-apply',
		'arch',
		'Fill the blank: upgrade the FIRST control plane node.',
		'apply',
		['node', 'plan', 'start'],
		'plan only shows what is possible. apply does the upgrade on the first control plane node.',
		'kubeadm upgrade ____ v1.37.1'
	),
	quizQ(
		'fill-t33-upgrade-node',
		'arch',
		'Fill the blank: upgrade a WORKER node after its kubeadm package is updated.',
		'node',
		['apply', 'plan', 'kubelet'],
		'Workers (and extra control plane nodes) use kubeadm upgrade node.',
		'kubeadm upgrade ____'
	),
	quizQ(
		'fill-t33-apt-hold',
		'arch',
		'Fill the blank: stop apt from upgrading kubeadm by accident.',
		'hold',
		['pin', 'lock', 'freeze'],
		'apt-mark hold keeps the version; unhold before the next planned upgrade.',
		'sudo apt-mark ____ kubeadm'
	),
	quizQ(
		'fill-t43-helm-install',
		'arch',
		'Fill the blank: install a chart as a release named my-nginx.',
		'install',
		['deploy', 'create', 'add'],
		'helm repo add adds a repository; helm install creates a release.',
		'helm ____ my-nginx bitnami/nginx -n helm-demo'
	),
	quizQ(
		'fill-t43-helm-set',
		'arch',
		'Fill the blank: override one chart value on the command line.',
		'--set',
		['--values', '--param', '--override'],
		'--values (-f) takes a file. --set takes key=value.',
		'helm upgrade my-nginx bitnami/nginx -n helm-demo ____ replicaCount=2'
	),
	quizQ(
		'fill-t43-helm-rollback',
		'arch',
		'Fill the blank: roll back to the first revision.',
		'1',
		['--to=1', '-1', 'v1'],
		'helm rollback takes the revision number as an argument. helm history lists them.',
		'helm rollback my-nginx ____ -n helm-demo'
	),
	quizQ(
		'fill-t44-apply-k',
		'arch',
		'Fill the blank: build and apply the kustomization in a directory.',
		'-k',
		['-f', '-R', '--overlay'],
		'-f wants files; -k wants a directory containing kustomization.yaml.',
		'kubectl apply ____ kustomize/overlays/dev'
	),
	quizQ(
		'fill-t44-patches',
		'arch',
		'Fill the blank: apply a patch file on top of the base.',
		'patches',
		['patch', 'overlays', 'transformers'],
		'`patches:` takes a list of entries with path: or an inline patch.',
		`resources:
  - ../../base
____:
  - path: replicas-patch.yaml`
	),
	quizQ(
		'fill-t47-pod-cidr',
		'arch',
		'Fill the blank: tell kubeadm the pod network range (Calico’s default).',
		'--pod-network-cidr',
		['--service-cidr', '--cluster-cidr', '--pod-cidr'],
		'--service-cidr is for Service IPs. The CNI plugin needs the pod range.',
		'sudo kubeadm init ____=192.168.0.0/16'
	),
	quizQ(
		'fill-t47-swapoff',
		'arch',
		'Fill the blank: turn swap off on every node before kubeadm init.',
		'swapoff',
		['swapctl', 'swapdel', 'mkswap'],
		'Also comment the swap line in /etc/fstab or it returns after a reboot.',
		'sudo ____ -a'
	),
	quizQ(
		'fill-t47-ip-forward',
		'arch',
		'Fill the blank: the sysctl that lets the node route pod traffic.',
		'ip_forward',
		['forward', 'ipv4_forward', 'routing'],
		'net.ipv4.ip_forward=1, plus the two bridge-nf-call settings.',
		'net.ipv4.____=1'
	),
	quizQ(
		'fill-t50-pdb-min-available',
		'arch',
		'Fill the blank: at least 2 pods must stay available during voluntary disruptions.',
		'--min-available',
		['--min-replicas', '--keep', '--minimum'],
		'kubectl create pdb takes --min-available or --max-unavailable, plus --selector.',
		'kubectl create pdb web-pdb --selector=app=web ____=2'
	),
	quizQ(
		'fill-t16-role-resource',
		'arch',
		'Fill the blank: allow the verbs on pods.',
		'--resource',
		['--object', '--kind', '--target'],
		'kubectl create role needs --verb and --resource.',
		'kubectl create role pod-reader --verb=get,list,watch ____=pods -n apps'
	),
	quizQ(
		'fill-t16-rolebinding-sa',
		'arch',
		'Fill the blank: bind the role to the ServiceAccount reader in namespace apps.',
		'--serviceaccount',
		['--user', '--sa', '--account'],
		'--user would bind a User named "apps:reader". The format is <namespace>:<name>.',
		'kubectl create rolebinding reader-binding --role=pod-reader ____=apps:reader -n apps'
	),
	quizQ(
		'fill-t16-can-i-as',
		'arch',
		'Fill the blank: impersonate the ServiceAccount reader from namespace apps.',
		'system:serviceaccount:apps:reader',
		[
			'serviceaccount:apps:reader',
			'system:sa:apps:reader',
			'system:serviceaccount:reader:apps',
		],
		'Format: system:serviceaccount:<namespace>:<name>.',
		'kubectl auth can-i list pods -n apps --as=____'
	),
	quizQ(
		'fill-t34-clusterrolebinding',
		'arch',
		'Fill the blank: let the ServiceAccount read secrets in every namespace.',
		'clusterrolebinding',
		['rolebinding', 'clusterbinding', 'rolebinding --all-namespaces'],
		'A RoleBinding grants only inside its own namespace, even for a ClusterRole.',
		'kubectl create ____ vault-secret-reader --clusterrole=secret-reader --serviceaccount=tools:vault'
	),

	// ── Services & Networking ─────────────────────────────────────────────────
	quizQ(
		'fill-t18-policy-types',
		'network',
		'Fill the blank: this policy restricts traffic coming INTO the backend pods.',
		'Ingress',
		['Egress', 'Inbound', 'Allow'],
		'policyTypes lists Ingress and/or Egress. With only Ingress, outgoing traffic stays open.',
		`spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - ____
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend`
	),
	quizQ(
		'fill-t20-dns-svc',
		'network',
		'Fill the blank: the fully qualified name of Service web-svc in namespace dev.',
		'svc',
		['service', 'pod', 'ns'],
		'<service>.<namespace>.svc.<cluster-domain>, usually cluster.local.',
		'nslookup web-svc.dev.____.cluster.local'
	),
	quizQ(
		'fill-t21-path-type',
		'network',
		'Fill the blank: the Ingress path field that decides how /a is matched.',
		'pathType',
		['matchType', 'pathPrefix', 'type'],
		'pathType is required in networking.k8s.io/v1: Prefix, Exact or ImplementationSpecific.',
		`- path: /a
  ____: Prefix
  backend:
    service:
      name: svc-a
      port:
        number: 80`
	),
	quizQ(
		'fill-t38-nodeport-type',
		'network',
		'Fill the blank: make the Service reachable on every node’s IP.',
		'--type',
		['--service-type', '--expose', '--kind'],
		'kubectl expose --type=NodePort. The default is ClusterIP.',
		'kubectl expose deployment node-app ____=NodePort --port=80'
	),
	quizQ(
		'fill-t39-coredns-ns',
		'network',
		'Fill the blank: the namespace CoreDNS runs in.',
		'kube-system',
		['kube-dns', 'coredns', 'default'],
		'kube-dns is only the Service name and pod label. The namespace is kube-system.',
		'kubectl scale deployment coredns -n ____ --replicas=2'
	),
	quizQ(
		'fill-t45-parent-refs',
		'network',
		'Fill the blank: attach the HTTPRoute to the Gateway demo-gateway.',
		'parentRefs',
		['gatewayRef', 'parents', 'gateways'],
		'A route points at its Gateway through parentRefs and at its Services through backendRefs.',
		`spec:
  ____:
  - name: demo-gateway
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /a`
	),

	// ── Storage ───────────────────────────────────────────────────────────────
	quizQ(
		'fill-t19-access-mode',
		'storage',
		'Fill the blank: the volume can be mounted read-write by a single node.',
		'ReadWriteOnce',
		['ReadOnlyOnce', 'ReadWrite', 'SingleNode'],
		'Modes are ReadWriteOnce, ReadOnlyMany, ReadWriteMany and ReadWriteOncePod.',
		`spec:
  capacity:
    storage: 1Gi
  accessModes:
    - ____`
	),
	quizQ(
		'fill-t19-pod-pvc',
		'storage',
		'Fill the blank: mount the claim pv-claim into the pod.',
		'persistentVolumeClaim',
		['persistentVolume', 'claim', 'pvc'],
		'Pods reference the claim, never the PV directly.',
		`volumes:
- name: data
  ____:
    claimName: pv-claim`
	),
	quizQ(
		'fill-t36-configmap-volume',
		'storage',
		'Fill the blank: mount the ConfigMap app-config as files.',
		'configMap',
		['configMapRef', 'config', 'configMapKeyRef'],
		'Under volumes the source is named configMap. configMapRef is for envFrom.',
		`volumes:
- name: cfg
  ____:
    name: app-config`
	),
	quizQ(
		'fill-t37-binding-mode',
		'storage',
		'Fill the blank: delay binding until a pod uses the claim.',
		'volumeBindingMode',
		['bindingMode', 'reclaimPolicy', 'provisionMode'],
		'WaitForFirstConsumer keeps the PVC Pending until a pod is scheduled.',
		`kind: StorageClass
metadata:
  name: fast
provisioner: rancher.io/local-path
____: WaitForFirstConsumer`
	),

	// ── Troubleshooting ───────────────────────────────────────────────────────
	quizQ(
		'fill-t9-logs-previous',
		'trouble',
		'Fill the blank: show the logs of the container instance that crashed.',
		'--previous',
		['--last', '--prior', '--crashed'],
		'--previous (-p) reads the terminated container; the current one may have no output yet.',
		'kubectl logs crasher ____'
	),
	quizQ(
		'fill-t29-logs-container',
		'trouble',
		'Fill the blank: logs of the container sidecar in a multi-container pod.',
		'-c',
		['-n', '-l', '-f'],
		'-c picks the container. Without it kubectl uses the first one (or the default-container annotation). -n is the namespace.',
		'kubectl logs multi ____ sidecar'
	),
	quizQ(
		'fill-t10-top-sort',
		'trouble',
		'Fill the blank: sort pods by CPU use.',
		'--sort-by',
		['--order-by', '--sort', '--by'],
		'kubectl top needs metrics-server installed.',
		'kubectl top pods -n kube-system ____=cpu'
	),
	quizQ(
		'fill-t30-events-selector',
		'trouble',
		'Fill the blank: events for the pod named heavy.',
		'name',
		['pod', 'kind', 'id'],
		'involvedObject.name and involvedObject.kind are the useful selectors.',
		'kubectl get events --field-selector involvedObject.____=heavy'
	),
	quizQ(
		'fill-t23-patch-selector',
		'trouble',
		'Fill the blank: point the Service at pods labelled app=myapp.',
		'selector',
		['labels', 'matchLabels', 'podSelector'],
		'A Service uses a plain label map in spec.selector, not matchLabels.',
		`kubectl patch svc myapp-svc -p '{"spec":{"____":{"app":"myapp"}}}'`
	),
	quizQ(
		'fill-t24-journalctl',
		'trouble',
		'Fill the blank: the last 50 kubelet log lines.',
		'-n',
		['-t', '-f', '-p'],
		'-f follows, -p filters by priority, -n limits the line count.',
		'journalctl -u kubelet ____ 50 --no-pager'
	),
	quizQ(
		'fill-t41-registry-secret',
		'trouble',
		'Fill the blank: create the pull secret for a private registry.',
		'docker-registry',
		['registry', 'docker', 'generic'],
		'Then reference it with imagePullSecrets in the pod spec.',
		'kubectl create secret ____ my-registry-creds --docker-server=myregistry.example.com'
	),
	quizQ(
		'fill-t46-crictl-ps',
		'trouble',
		'Fill the blank: list all containers on the node, including exited ones.',
		'ps',
		['list', 'containers', 'get'],
		'crictl ps -a mirrors docker ps -a. crictl pods lists pod sandboxes.',
		'sudo crictl ____ -a'
	),
	quizQ(
		'fill-t48-debug-target',
		'trouble',
		'Fill the blank: share the process namespace of the container quiet.',
		'--target',
		['--same-pid', '--share', '--container-of'],
		'The ephemeral container then sees the target’s processes.',
		'kubectl debug -it quiet --image=busybox:1.28 ____=quiet -- sh'
	)
);
