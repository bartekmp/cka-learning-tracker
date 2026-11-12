// Quiz questions — Workloads & Scheduling.
QUIZ.push(
	// ── Deployments and rollouts ──
	quizQ(
		'work-create-deploy',
		'workloads',
		'Which command creates a Deployment with 3 replicas?',
		'kubectl create deployment web --image=nginx --replicas=3',
		[
			'kubectl run web --image=nginx --replicas=3',
			'kubectl create pod web --image=nginx --count=3',
			'kubectl deploy web --image=nginx -r 3',
		],
		'`kubectl run` creates a single pod, and has no `--replicas` flag today.'
	),
	quizQ(
		'work-scale',
		'workloads',
		'Which command changes the replica count of Deployment web to 5?',
		'kubectl scale deployment web --replicas=5',
		[
			'kubectl set replicas deployment web 5',
			'kubectl patch deployment web --count=5',
			'kubectl resize deployment web 5',
		],
		'You can also edit spec.replicas and apply.'
	),
	quizQ(
		'work-set-image',
		'workloads',
		'Which command updates the image of container "nginx" in Deployment web?',
		'kubectl set image deployment/web nginx=nginx:1.27',
		[
			'kubectl update image deployment/web nginx:1.27',
			'kubectl set deployment/web image=nginx:1.27',
			'kubectl apply image nginx:1.27',
		],
		'The format is `<container-name>=<image>`. It triggers a rolling update.'
	),
	quizQ(
		'work-rollout-status',
		'workloads',
		'Which command waits for a rollout and reports when it is done?',
		'kubectl rollout status deployment/web',
		[
			'kubectl get rollout deployment/web --wait',
			'kubectl wait rollout web',
			'kubectl describe rollout web',
		],
		'It exits non-zero if the rollout fails, so it is useful in scripts.'
	),
	quizQ(
		'work-rollout-history',
		'workloads',
		'Which command lists the revisions of a Deployment?',
		'kubectl rollout history deployment/web',
		[
			'kubectl get revisions deployment/web',
			'kubectl describe history web',
			'kubectl rollout log deployment/web',
		],
		'Add --revision=2 to see what that revision contained.'
	),
	quizQ(
		'work-rollout-undo-revision',
		'workloads',
		'Which command rolls back to revision 2 specifically?',
		'kubectl rollout undo deployment/web --to-revision=2',
		[
			'kubectl rollout restore deployment/web 2',
			'kubectl rollback deployment/web --revision=2',
			'kubectl apply --revision=2 deployment/web',
		],
		'Without --to-revision it goes back one step.'
	),
	quizQ(
		'work-rollout-restart',
		'workloads',
		'Which command restarts all pods of a Deployment with a rolling update?',
		'kubectl rollout restart deployment/web',
		[
			'kubectl restart deployment/web',
			'kubectl delete pods --all',
			'kubectl scale deployment/web --replicas=0',
		],
		'It bumps an annotation on the pod template, so the normal rollout logic applies.'
	),
	quizQ(
		'work-max-surge',
		'workloads',
		'In a rolling update, what does maxSurge control?',
		'How many extra pods may exist above the desired count during the update',
		[
			'How many pods may be unavailable',
			'How many old revisions are kept',
			'How fast probes run',
		],
		'maxUnavailable is the opposite: how many may be missing at once.',
		`strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0`
	),
	quizQ(
		'work-recreate',
		'workloads',
		'What does strategy type Recreate do?',
		'Stops all old pods before starting new ones',
		[
			'Starts new pods first, then removes old ones',
			'Restarts pods one by one',
			'Recreates the Service too',
		],
		'It causes downtime but guarantees two versions never run together.'
	),
	quizQ(
		'work-selector-match',
		'workloads',
		'This Deployment is rejected. Why?',
		'The selector does not match the pod template labels',
		['replicas must be at least 2', 'The image has no tag', 'The apiVersion should be v1'],
		'spec.selector.matchLabels must select the labels in spec.template.metadata.labels.',
		`apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: web
          image: nginx`
	),
	quizQ(
		'work-replicaset',
		'workloads',
		'What does a Deployment create to keep the right number of pods running?',
		'A ReplicaSet',
		['A StatefulSet', 'A DaemonSet', 'A Job'],
		'Each rollout creates a new ReplicaSet and scales the old one down.'
	),

	// ── Pods ──
	quizQ(
		'work-run-pod',
		'workloads',
		'Which command creates a single pod running nginx?',
		'kubectl run web --image=nginx',
		[
			'kubectl create pod web --image=nginx',
			'kubectl apply pod web nginx',
			'kubectl new pod web --image=nginx',
		],
		'There is no `kubectl create pod`.'
	),
	quizQ(
		'work-dry-run',
		'workloads',
		'Which flags print a pod manifest without creating anything?',
		'--dry-run=client -o yaml',
		['--preview --format=yaml', '--no-create -o manifest', '--print-only --yaml'],
		'The fastest way to start a manifest on the exam: generate it, edit it, apply it.'
	),
	quizQ(
		'work-command-args',
		'workloads',
		'In a container spec, `command` overrides which Dockerfile instruction?',
		'ENTRYPOINT',
		['CMD', 'RUN', 'EXPOSE'],
		'`args` overrides `CMD`.',
		`containers:
  - name: app
    image: busybox
    command: ["sleep"]
    args: ["3600"]`
	),
	quizQ(
		'work-restart-policy',
		'workloads',
		'What is the default restartPolicy of a pod?',
		'Always',
		['Never', 'OnFailure', 'Once'],
		'Jobs must use Never or OnFailure instead.'
	),
	quizQ(
		'work-init-container',
		'workloads',
		'When do init containers run?',
		'Before the app containers, one after another, each to completion',
		[
			'In parallel with the app containers',
			'Only when the app container crashes',
			'After the app containers finish',
		],
		'If an init container fails, the pod keeps retrying it and the app never starts.'
	),
	quizQ(
		'work-liveness',
		'workloads',
		'What happens when a liveness probe keeps failing?',
		'The kubelet restarts the container',
		[
			'The pod is removed from the Service',
			'The node is cordoned',
			'The Deployment is rolled back',
		],
		'A failing readiness probe only removes the pod from the Service.'
	),
	quizQ(
		'work-startup-probe',
		'workloads',
		'Which probe protects a slow-starting app from being killed by the liveness probe?',
		'startupProbe',
		['readinessProbe', 'initProbe', 'delayProbe'],
		'Liveness and readiness checks begin only after the startup probe succeeds.'
	),
	quizQ(
		'work-probe-types',
		'workloads',
		'Which of these is NOT a probe handler type?',
		'dnsLookup',
		['httpGet', 'tcpSocket', 'exec'],
		'grpc is also supported.'
	),
	quizQ(
		'work-resources-yaml',
		'workloads',
		'Which field belongs on the marked line to request half a CPU core?',
		'cpu: 500m',
		['cpu: 0.5m', 'cores: 500', 'cpu-request: 50%'],
		'500m = 500 millicores = 0.5 CPU.',
		`resources:
  requests:
    ???: 
  limits:
    cpu: "1"`
	),
	quizQ(
		'work-qos-guaranteed',
		'workloads',
		'When does a pod get the Guaranteed QoS class?',
		'Every container has requests equal to limits for CPU and memory',
		['It has a PriorityClass', 'It runs on a control plane node', 'It has no limits at all'],
		'No requests or limits at all is BestEffort. Everything in between is Burstable.'
	),
	quizQ(
		'work-env-secret',
		'workloads',
		'How does a container read one key from a Secret into an environment variable?',
		'env.valueFrom.secretKeyRef',
		['envFrom.configMapRef', 'volumes.secretKey', 'env.secretValue'],
		'`envFrom.secretRef` would import all keys.',
		`env:
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: db
        key: password`
	),
	quizQ(
		'work-configmap-create',
		'workloads',
		'Which command creates a ConfigMap from a literal?',
		'kubectl create configmap app --from-literal=mode=prod',
		[
			'kubectl create configmap app --value mode=prod',
			'kubectl set configmap app mode=prod',
			'kubectl create cm app --literal mode:prod',
		],
		'--from-file=<path> loads a file, one key per file.'
	),
	quizQ(
		'work-secret-create',
		'workloads',
		'Which command creates a generic Secret?',
		'kubectl create secret generic db --from-literal=password=s3cret',
		[
			'kubectl create secret db --password=s3cret',
			'kubectl create secret --encrypt db s3cret',
			'kubectl set secret db password=s3cret',
		],
		'kubectl encodes the value for you.'
	),
	quizQ(
		'work-secret-base64',
		'workloads',
		'A Secret’s data values are...',
		'base64-encoded, not encrypted',
		[
			'Encrypted with AES by default',
			'Hashed with SHA-256',
			'Stored in plain text and hidden by RBAC only',
		],
		'Anyone who can read the Secret can decode it. Encryption at rest is a separate API server setting.'
	),
	quizQ(
		'work-string-data',
		'workloads',
		'Which Secret field lets you write values as plain text in the manifest?',
		'stringData',
		['plainData', 'data', 'textData'],
		'The API server converts them to base64 in data.'
	),

	// ── Jobs ──
	quizQ(
		'work-job-restart',
		'workloads',
		'Which restartPolicy values are allowed in a Job?',
		'Never or OnFailure',
		['Always or Never', 'Always only', 'Any value'],
		'Always would restart finished containers forever, which defeats a Job.'
	),
	quizQ(
		'work-job-backoff',
		'workloads',
		'What does backoffLimit set on a Job?',
		'How many retries before the Job is marked failed',
		['Seconds to wait between pods', 'How many pods run in parallel', 'Maximum run time'],
		'Default is 6. activeDeadlineSeconds limits total run time.'
	),
	quizQ(
		'work-job-completions',
		'workloads',
		'Which two Job fields control "run 10 successful pods, 2 at a time"?',
		'completions: 10 and parallelism: 2',
		[
			'replicas: 10 and concurrency: 2',
			'count: 10 and batch: 2',
			'completions: 2 and parallelism: 10',
		],
		'The Job is complete when 10 pods have succeeded.'
	),
	quizQ(
		'work-cron-schedule',
		'workloads',
		'What does the schedule `*/5 * * * *` mean?',
		'Every 5 minutes',
		['At minute 5 of every hour', 'Every 5 hours', 'At 5 AM every day'],
		'Fields: minute, hour, day of month, month, day of week.'
	),
	quizQ(
		'work-cron-daily',
		'workloads',
		'Which schedule runs a CronJob every day at 02:30?',
		'`30 2 * * *`',
		['`2 30 * * *`', '`*/2 30 * * *`', '`30 2 1 * *`'],
		'Minute first, then hour.'
	),
	quizQ(
		'work-cron-manual',
		'workloads',
		'Which command runs a CronJob once right now?',
		'kubectl create job manual-run --from=cronjob/report',
		[
			'kubectl run cronjob/report --now',
			'kubectl trigger cronjob report',
			'kubectl start cronjob/report',
		],
		'It creates a Job from the CronJob’s template.'
	),
	quizQ(
		'work-create-cronjob',
		'workloads',
		'Which command creates a CronJob?',
		'kubectl create cronjob report --image=busybox --schedule="0 * * * *" -- date',
		[
			'kubectl create job report --schedule="0 * * * *" --image=busybox',
			'kubectl run report --cron="0 * * * *" --image=busybox',
			'kubectl create schedule report "0 * * * *" busybox',
		],
		'The command after -- is what the container runs.'
	),

	// ── StatefulSets and DaemonSets ──
	quizQ(
		'work-sts-names',
		'workloads',
		'StatefulSet "db" has 3 replicas. What are the pod names?',
		'db-0, db-1, db-2',
		['db-abc12, db-def34, db-ghi56', 'db-a, db-b, db-c', 'db-1, db-2, db-3'],
		'Stable names and ordered start-up are the point of a StatefulSet.'
	),
	quizQ(
		'work-sts-service',
		'workloads',
		'Which StatefulSet field names the headless Service that gives pods stable DNS names?',
		'serviceName',
		['headlessService', 'dnsName', 'serviceRef'],
		'The pods become `db-0.<serviceName>.<ns>.svc`.'
	),
	quizQ(
		'work-sts-vct',
		'workloads',
		'What does volumeClaimTemplates do in a StatefulSet?',
		'Creates a separate PVC for each pod',
		['Shares one PVC between all pods', 'Defines the StorageClass', 'Creates a PV by hand'],
		'The PVCs stay when the pod is deleted, so data survives rescheduling.'
	),
	quizQ(
		'work-ds-where',
		'workloads',
		'A DaemonSet pod is not running on the control plane node. Why?',
		'The node has a taint the DaemonSet does not tolerate',
		[
			'DaemonSets never run on control planes',
			'The control plane has no kubelet',
			'The DaemonSet needs a nodeSelector',
		],
		'Add a toleration for node-role.kubernetes.io/control-plane.'
	),

	// ── Scheduling ──
	quizQ(
		'work-taint-cmd',
		'workloads',
		'Which command taints node1 so new pods without a toleration stay away?',
		'kubectl taint nodes node1 dedicated=gpu:NoSchedule',
		[
			'kubectl label node node1 dedicated=gpu:NoSchedule',
			'kubectl cordon node1 --taint dedicated=gpu',
			'kubectl annotate node node1 taint=gpu',
		],
		'The format is key=value:effect.'
	),
	quizQ(
		'work-taint-remove',
		'workloads',
		'How do you remove the taint dedicated=gpu:NoSchedule from node1?',
		'kubectl taint nodes node1 dedicated=gpu:NoSchedule-',
		[
			'kubectl untaint nodes node1 dedicated',
			'kubectl taint nodes node1 dedicated=gpu:NoSchedule --remove',
			'kubectl delete taint node1 dedicated',
		],
		'The trailing minus removes it.'
	),
	quizQ(
		'work-toleration-yaml',
		'workloads',
		'This toleration lets the pod run on nodes that have...',
		'The taint dedicated=gpu with effect NoSchedule',
		['The label dedicated=gpu', 'Any taint at all', 'Only the key "dedicated" as a label'],
		'Tolerations match taints, not labels.',
		`tolerations:
  - key: dedicated
    operator: Equal
    value: gpu
    effect: NoSchedule`
	),
	quizQ(
		'work-cordon-vs-drain',
		'workloads',
		'What is the difference between cordon and drain?',
		'cordon only blocks new pods; drain also evicts the running ones',
		[
			'They are the same command',
			'drain only blocks new pods; cordon evicts',
			'cordon deletes the node object',
		],
		'Use cordon to pause scheduling, drain before maintenance.'
	),
	quizQ(
		'work-drain-flags',
		'workloads',
		'`kubectl drain` refuses to continue: pods use `emptyDir` volumes. Which flag lets it proceed?',
		'--delete-emptydir-data',
		['--force-volumes', '--ignore-emptydir', '--skip-local'],
		'The emptyDir data is lost when the pod is evicted.'
	),
	quizQ(
		'work-node-affinity',
		'workloads',
		'Which nodeAffinity type is a HARD requirement at scheduling time?',
		'requiredDuringSchedulingIgnoredDuringExecution',
		[
			'preferredDuringSchedulingIgnoredDuringExecution',
			'requiredDuringExecution',
			'mandatoryDuringScheduling',
		],
		'"Preferred" only adds weight to the score. "IgnoredDuringExecution" means running pods are not moved.'
	),
	quizQ(
		'work-pod-anti-affinity',
		'workloads',
		'What does this rule achieve?',
		'Replicas with app=web avoid sharing a node',
		[
			'All replicas land on the same node',
			'Replicas avoid control plane nodes',
			'Replicas spread across namespaces',
		],
		'`topologyKey: kubernetes.io/hostname` makes each node its own domain.',
		`affinity:
  podAntiAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchLabels:
            app: web
        topologyKey: kubernetes.io/hostname`
	),
	quizQ(
		'work-node-name',
		'workloads',
		'What does setting spec.nodeName on a pod do?',
		'Bypasses the scheduler and binds the pod to that node',
		['Adds a preference for that node', 'Creates the node if missing', 'Labels the node'],
		'No taint or resource checks from the scheduler apply.'
	),
	quizQ(
		'work-spread',
		'workloads',
		'What are topologySpreadConstraints for?',
		'Spreading pods evenly across zones or nodes',
		[
			'Limiting pods per namespace',
			'Picking the fastest node',
			'Spreading traffic between Services',
		],
		'maxSkew sets how uneven the spread may be.'
	),
	quizQ(
		'work-resourcequota',
		'workloads',
		'What does a ResourceQuota limit?',
		'The total resources or object counts in a namespace',
		[
			'The resources of a single container',
			'The nodes a namespace may use',
			'The traffic between namespaces',
		],
		'A LimitRange sets per-container defaults and bounds.'
	),
	quizQ(
		'work-limitrange',
		'workloads',
		'Which object gives containers default requests and limits in a namespace?',
		'LimitRange',
		['ResourceQuota', 'PriorityClass', 'PodDisruptionBudget'],
		'It also enforces minimum and maximum values per container.'
	),
	quizQ(
		'work-priorityclass',
		'workloads',
		'Which pods does the scheduler favour (and may preempt others for)?',
		'Pods whose PriorityClass has a higher value',
		['Pods with more replicas', 'Pods with a lower value', 'Pods created first'],
		'system-cluster-critical and system-node-critical are built in.'
	),
	quizQ(
		'work-pdb-yaml',
		'workloads',
		'What does this PodDisruptionBudget guarantee during a drain?',
		'At least 2 matching pods stay available',
		['At most 2 pods are ever created', 'Exactly 2 nodes stay up', 'Pods are never evicted'],
		'minAvailable and maxUnavailable are alternatives. Only voluntary disruptions are covered.',
		`apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: web-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: web`
	),
	quizQ(
		'work-autoscale',
		'workloads',
		'Which command creates a HorizontalPodAutoscaler for Deployment web?',
		'kubectl autoscale deployment web --min=2 --max=10',
		[
			'kubectl scale deployment web --auto --min=2 --max=10',
			'kubectl create hpa web --range=2-10',
			'kubectl set autoscale deployment web 2 10',
		],
		'Add a CPU target flag as well; check `kubectl autoscale --help` for the exact spelling.'
	),

	// ── Basics ──
	quizQ(
		'work-labels-select',
		'workloads',
		'Which command lists pods with the label app=web?',
		'kubectl get pods -l app=web',
		[
			'kubectl get pods --name app=web',
			'kubectl get pods --filter app=web',
			'kubectl get pods app/web',
		],
		'--show-labels prints all labels.'
	),
	quizQ(
		'work-label-add',
		'workloads',
		'Which command adds the label env=prod to pod web?',
		'kubectl label pod web env=prod',
		[
			'kubectl annotate pod web env=prod',
			'kubectl set label pod web env=prod',
			'kubectl tag pod web env=prod',
		],
		'Add --overwrite to change an existing label.'
	),
	quizQ(
		'work-default-ns',
		'workloads',
		'Which command makes "dev" the default namespace for the current context?',
		'kubectl config set-context --current --namespace=dev',
		[
			'kubectl set namespace dev',
			'kubectl config use-namespace dev',
			'kubectl namespace dev --default',
		],
		'It saves you typing `-n dev` on every command.'
	),
	quizQ(
		'work-create-ns',
		'workloads',
		'Which command creates a namespace?',
		'kubectl create namespace dev',
		['kubectl new namespace dev', 'kubectl run namespace dev', 'kubectl apply namespace dev'],
		'`kubectl create ns dev` is the short form.'
	),
	quizQ(
		'work-explain',
		'workloads',
		'Which command shows the documentation of the fields under spec.containers?',
		'kubectl explain pod.spec.containers',
		[
			'kubectl describe pod.spec.containers',
			'kubectl help pod containers',
			'kubectl api pod.spec.containers',
		],
		'Add --recursive to see the whole tree. Saves a trip to the docs site.'
	)
);
