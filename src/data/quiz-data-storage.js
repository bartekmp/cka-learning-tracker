// Quiz questions — Storage.
QUIZ.push(
	quizQ(
		'sto-pv-yaml',
		'storage',
		'What does this PersistentVolume provide?',
		'10Gi of storage backed by a directory on one node',
		['10Gi of NFS storage', 'A 10Gi emptyDir for one pod', 'A dynamically created cloud disk'],
		'hostPath ties the volume to a node. Fine for labs and the exam.',
		`apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv1
spec:
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce
  hostPath:
    path: /data/pv1`
	),
	quizQ(
		'sto-pvc-yaml',
		'storage',
		'Which field of a PVC states how much storage it needs?',
		'spec.resources.requests.storage',
		['spec.capacity.storage', 'spec.size', 'spec.storage.limit'],
		'capacity is on the PV, requests on the PVC.'
	),
	quizQ(
		'sto-pod-mount',
		'storage',
		'This pod fails to start. Why?',
		'`volumeMounts.name` does not match any `volumes.name`',
		[
			'mountPath must start with /data',
			'A PVC cannot be used in a pod',
			'The image has no volume support',
		],
		'The mount refers to "data" but the volume is called "storage".',
		`volumes:
  - name: storage
    persistentVolumeClaim:
      claimName: my-claim
containers:
  - name: app
    image: nginx
    volumeMounts:
      - name: data
        mountPath: /usr/share/nginx/html`
	),
	quizQ(
		'sto-pvc-pending',
		'storage',
		'A PVC stays Pending. Which is NOT a likely cause?',
		'The pod has too many replicas',
		[
			'No PV matches its size, class or access mode',
			'No default StorageClass exists',
			'The class uses WaitForFirstConsumer and no pod uses the PVC yet',
		],
		'`kubectl describe pvc` shows the reason in Events.'
	),
	quizQ(
		'sto-pv-phases',
		'storage',
		'A PV whose PVC was deleted (policy Retain) shows which status?',
		'Released',
		['Available', 'Bound', 'Pending'],
		'It cannot be claimed again until the old claimRef is cleared.'
	),
	quizQ(
		'sto-pv-available',
		'storage',
		'Which PV status means "free, can be claimed"?',
		'Available',
		['Released', 'Bound', 'Idle'],
		'Bound means a PVC already owns it.'
	),
	quizQ(
		'sto-binding',
		'storage',
		'How many PVCs can bind to one PV?',
		'One',
		['Any number', 'One per namespace', 'One per node'],
		'The binding is exclusive, even if the PV is bigger than the claim.'
	),
	quizQ(
		'sto-empty-class',
		'storage',
		'What does `storageClassName: ""` (empty string) on a PVC mean?',
		'Do not use dynamic provisioning; bind only to a PV with no class',
		['Use the default StorageClass', 'Use any StorageClass', 'The PVC is invalid'],
		'Leaving the field out is different: it selects the default class.'
	),
	quizQ(
		'sto-reclaim-delete',
		'storage',
		'What does reclaim policy Delete do?',
		'Removes the PV and the underlying storage when the PVC is deleted',
		[
			'Keeps the data for a manual cleanup',
			'Wipes the data and keeps the PV',
			'Moves the data to another PV',
		],
		'It is the default for dynamically provisioned volumes.'
	),
	quizQ(
		'sto-access-modes-short',
		'storage',
		'What does ReadOnlyMany (ROX) allow?',
		'Mounting read-only from many nodes',
		['One writer, many readers', 'Read-only on one node', 'Read-write on many nodes'],
		'RWO, ROX, RWX and RWOP are the four modes.'
	),
	quizQ(
		'sto-rwop',
		'storage',
		'What does ReadWriteOncePod guarantee?',
		'Only a single pod in the whole cluster can use the volume',
		['One node, many pods', 'Read-only access for pods', 'One pod per namespace'],
		'RWO still lets several pods on the same node share it.'
	),
	quizQ(
		'sto-emptydir-memory',
		'storage',
		'What does `emptyDir` with `medium: Memory` do?',
		'Backs the volume with RAM (tmpfs)',
		['Stores data in etcd', 'Keeps data after the pod dies', 'Shares data between nodes'],
		'It counts against the container memory limit.',
		`volumes:
  - name: cache
    emptyDir:
      medium: Memory
      sizeLimit: 128Mi`
	),
	quizQ(
		'sto-configmap-volume',
		'storage',
		'When you mount a ConfigMap as a volume, what do you get?',
		'One file per key',
		['A single JSON file', 'Environment variables', 'A block device'],
		'The files update when the ConfigMap changes, with a short delay.'
	),
	quizQ(
		'sto-subpath',
		'storage',
		'What does subPath do on a volumeMount?',
		'Mounts one file or subdirectory of the volume instead of the whole thing',
		[
			'Mounts the volume read-only',
			'Chooses the StorageClass',
			'Creates a symlink on the node',
		],
		'Mounts made with subPath do not receive ConfigMap updates.'
	),
	quizQ(
		'sto-secret-volume',
		'storage',
		'A Secret mounted as a volume appears as...',
		'Files, one per key, with decoded values',
		['One base64 file', 'Environment variables', 'An encrypted block device'],
		'Kubernetes stores the Secret in a tmpfs on the node.'
	),
	quizQ(
		'sto-expand-shrink',
		'storage',
		'Can you shrink a PVC by lowering its requested size?',
		'No, PVCs can only grow',
		['Yes, any time', 'Yes, with allowVolumeExpansion', 'Yes, if the pod is stopped'],
		'To go smaller you must create a new, smaller PVC and copy the data.'
	),
	quizQ(
		'sto-sc-yaml',
		'storage',
		'Which field of a StorageClass names the plugin that creates the volumes?',
		'provisioner',
		['driver', 'backend', 'plugin'],
		'Example: rancher.io/local-path or ebs.csi.aws.com.',
		`apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast
provisioner: ebs.csi.aws.com
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer`
	),
	quizQ(
		'sto-set-default',
		'storage',
		'Which command makes StorageClass "fast" the default?',
		'kubectl patch storageclass fast -p \'{"metadata":{"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}\'',
		[
			'kubectl set default storageclass fast',
			'kubectl label storageclass fast default=true',
			'kubectl edit pvc --default fast',
		],
		'Only one class should carry the annotation.'
	),
	quizQ(
		'sto-pvc-protection',
		'storage',
		'You delete a PVC that a running pod uses. What happens?',
		'It stays Terminating until no pod uses it',
		['It is deleted and the pod crashes', 'The delete is rejected', 'The PV is deleted first'],
		'The kubernetes.io/pvc-protection finalizer prevents data loss.'
	),
	quizQ(
		'sto-pv-scope',
		'storage',
		'Which of these is cluster-scoped, not namespaced?',
		'PersistentVolume',
		['PersistentVolumeClaim', 'Pod', 'ConfigMap'],
		'A PVC lives in a namespace and binds to a PV that belongs to the whole cluster.'
	),
	quizQ(
		'sto-hostpath-type',
		'storage',
		'Which hostPath type creates the directory if it does not exist?',
		'DirectoryOrCreate',
		['Directory', 'Create', 'MakeDir'],
		'Plain Directory fails if the path is missing.',
		`volumes:
  - name: data
    hostPath:
      path: /data/app
      type: DirectoryOrCreate`
	),
	quizQ(
		'sto-nfs',
		'storage',
		'Which two fields does an NFS volume need?',
		'server and path',
		['host and share', 'address and export', 'ip and mount'],
		'NFS supports ReadWriteMany, so many pods and nodes can share it.',
		`volumes:
  - name: shared
    nfs:
      server: 10.0.0.5
      path: /exports/data`
	),
	quizQ(
		'sto-local-pv',
		'storage',
		'A local PV needs which extra field so pods land on the right node?',
		'nodeAffinity',
		['nodeName on the PVC', 'tolerations', 'topologyKey on the Service'],
		'The scheduler uses it to place the pod where the disk is.'
	),
	quizQ(
		'sto-csi',
		'storage',
		'What is CSI?',
		'A standard interface for storage vendors to plug into Kubernetes',
		['A network plugin standard', 'A kubectl output format', 'A container image format'],
		'Drivers run as pods and are registered with CSIDriver objects.'
	),
	quizQ(
		'sto-snapshot',
		'storage',
		'Which object takes a point-in-time copy of a PVC (with a CSI driver that supports it)?',
		'VolumeSnapshot',
		['PVCBackup', 'StorageCopy', 'PersistentSnapshot'],
		'Restoring uses a new PVC with the snapshot as dataSource.'
	),
	quizQ(
		'sto-get-all',
		'storage',
		'Which command lists PVs and PVCs together?',
		'kubectl get pv,pvc',
		['kubectl get storage', 'kubectl get volumes', 'kubectl describe pv pvc'],
		'Add -A to include every namespace’s claims.'
	),
	quizQ(
		'sto-ephemeral',
		'storage',
		'Which resource name limits a container’s use of local disk (logs, emptyDir, writable layer)?',
		'ephemeral-storage',
		['disk', 'local-storage', 'scratch'],
		'The kubelet evicts pods that exceed it, or when the node is under disk pressure.'
	)
);
