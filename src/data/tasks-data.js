// Practice tasks data — loaded before tasks.js
// Edit this file to add, remove, or modify tasks and sections.

const SECTIONS = [
  {
    id: "s1", title: "Core Concepts", color: "#60a5fa",
    tasks: [
      {
        id: "t1", title: "Explore the cluster architecture",
        difficulty: "easy",
        scenario: "You've just been given access to a cluster. Before anything else, identify how many nodes exist, which is the control plane node, and list all system pods running in the kube-system namespace.",
        steps: [
          { label: "Step 1 — list nodes and their roles", desc: "Use -o wide to also see IPs and the OS image.", code: ["kubectl get nodes -o wide"] },
          { label: "Step 2 — inspect the control plane node", desc: "Look at the Roles column. Then describe it to see allocated resources and conditions.", code: ["kubectl describe node <control-plane-node-name>"] },
          { label: "Step 3 — list kube-system pods", desc: "These are the control plane components running as static pods.", code: ["kubectl get pods -n kube-system"] },
          { label: "Step 4 — check cluster info", desc: "", code: ["kubectl cluster-info"] },
        ],
        expected: "You should see nodes (one labelled control-plane), and pods like kube-apiserver, etcd, kube-scheduler, kube-controller-manager, coredns, kube-proxy.",
        note: "Static pods in kube-system have the node name as a suffix, e.g. kube-apiserver-controlplane."
      },
      {
        id: "t2", title: "Create and inspect a Pod",
        difficulty: "easy",
        scenario: "Create a pod named web running nginx in the default namespace. Then exec into it, confirm nginx is running, and clean up.",
        steps: [
          { label: "Step 1 — create the pod", desc: "", code: ["kubectl run web --image=nginx"] },
          { label: "Step 2 — wait for Running, then describe it", desc: "", code: ["kubectl get pod web -w", "kubectl describe pod web"] },
          { label: "Step 3 — exec in and check the process", desc: "", code: ["kubectl exec -it web -- /bin/bash", "# inside: curl localhost"] },
          { label: "Step 4 — clean up", desc: "", code: ["kubectl delete pod web --force --grace-period=0"] },
        ],
        expected: "Pod reaches Running state. curl localhost returns the nginx welcome page.",
        note: "Use --force --grace-period=0 in the exam to skip the 30-second termination wait."
      },
      {
        id: "t3", title: "Deploy and expose a Deployment",
        difficulty: "medium",
        scenario: "Create a Deployment named myapp with 3 replicas of the httpd image. Expose it as a ClusterIP service on port 80. Verify connectivity from a one-shot busybox pod.",
        steps: [
          { label: "Step 1 — create the deployment", desc: "", code: ["kubectl create deployment myapp --image=httpd --replicas=3"] },
          { label: "Step 2 — expose it", desc: "", code: ["kubectl expose deployment myapp --port=80 --target-port=80"] },
          { label: "Step 3 — get the ClusterIP", desc: "", code: ["kubectl get svc myapp"] },
          { label: "Step 4 — test from a debug pod", desc: "Replace <CLUSTER-IP> with the IP from step 3.", code: ["kubectl run tmp --image=busybox:1.28 --rm -it --restart=Never -- wget -O- <CLUSTER-IP>:80"] },
          { label: "Step 5 — test using the DNS name", desc: "K8s DNS resolves service names automatically.", code: ["kubectl run tmp --image=busybox:1.28 --rm -it --restart=Never -- wget -O- myapp.default.svc.cluster.local:80"] },
        ],
        expected: "wget returns the Apache 'It works!' page.",
        note: "DNS format: <service>.<namespace>.svc.cluster.local"
      },
      {
        id: "t4", title: "Work with Namespaces",
        difficulty: "easy",
        scenario: "Create a namespace called staging. Deploy a pod named api running nginx in that namespace. Then set staging as your default namespace for the current context, and verify by running kubectl get pods.",
        steps: [
          { label: "Step 1 — create namespace", desc: "", code: ["kubectl create namespace staging"] },
          { label: "Step 2 — deploy pod into it", desc: "", code: ["kubectl run api --image=nginx -n staging"] },
          { label: "Step 3 — set default namespace", desc: "", code: ["kubectl config set-context --current --namespace=staging"] },
          { label: "Step 4 — verify", desc: "Now kubectl get pods should show the api pod without needing -n.", code: ["kubectl get pods"] },
          { label: "Step 5 — reset to default", desc: "Don't forget this in the exam when switching tasks!", code: ["kubectl config set-context --current --namespace=default"] },
        ],
        expected: "kubectl get pods (without -n) returns the api pod when staging is the default namespace.",
        note: ""
      },
    ]
  },
  {
    id: "s2", title: "Scheduling", color: "#a78bfa",
    tasks: [
      {
        id: "t5", title: "Manually schedule a Pod to a specific node",
        difficulty: "medium",
        scenario: "Without using node selectors or affinity, schedule a pod named pinned running nginx directly onto a specific node. The pod should already be running — you need to replace it.",
        steps: [
          { label: "Step 1 — find available nodes", desc: "", code: ["kubectl get nodes"] },
          { label: "Step 2 — generate pod YAML", desc: "", code: ["kubectl run pinned --image=nginx --dry-run=client -o yaml > pinned.yaml"] },
          { label: "Step 3 — add nodeName to the spec", desc: "Edit pinned.yaml and add nodeName under spec:", code: ["# In pinned.yaml, under spec: add:\nnodeName: <your-node-name>"] },
          { label: "Step 4 — apply it", desc: "", code: ["kubectl apply -f pinned.yaml"] },
          { label: "Step 5 — verify", desc: "Check the NODE column.", code: ["kubectl get pod pinned -o wide"] },
        ],
        expected: "Pod runs on the exact node you specified in nodeName.",
        note: "nodeName bypasses the scheduler entirely. Useful exam trick when a scheduler is broken."
      },
      {
        id: "t6", title: "Taint a node and add a Toleration",
        difficulty: "medium",
        scenario: "Taint the worker node with gpu=true:NoSchedule. Then create a pod named gpu-job that tolerates this taint and confirm it schedules on that node.",
        steps: [
          { label: "Step 1 — taint the node", desc: "", code: ["kubectl taint nodes <worker-node> gpu=true:NoSchedule"] },
          { label: "Step 2 — try to run a regular pod (it won't schedule)", desc: "", code: ["kubectl run no-tol --image=nginx", "kubectl get pod no-tol -o wide  # stays Pending"] },
          { label: "Step 3 — generate YAML for the tolerating pod", desc: "", code: ["kubectl run gpu-job --image=nginx --dry-run=client -o yaml > gpu-job.yaml"] },
          { label: "Step 4 — add toleration block to the spec", desc: "Add this under spec:", code: ["tolerations:\n- key: gpu\n  operator: Equal\n  value: \"true\"\n  effect: NoSchedule"] },
          { label: "Step 5 — apply and verify", desc: "", code: ["kubectl apply -f gpu-job.yaml", "kubectl get pod gpu-job -o wide"] },
          { label: "Step 6 — clean up taint", desc: "The minus sign at the end removes the taint.", code: ["kubectl taint nodes <worker-node> gpu=true:NoSchedule-"] },
        ],
        expected: "gpu-job schedules on the tainted node. no-tol remains Pending.",
        note: "NoSchedule = new pods won't be scheduled. NoExecute = existing pods are evicted too."
      },
      {
        id: "t7", title: "Create a DaemonSet",
        difficulty: "medium",
        scenario: "Create a DaemonSet named node-monitor using the busybox image that runs sleep 3600 on every node. Verify a pod exists on each node.",
        steps: [
          { label: "Step 1 — generate a Deployment YAML as a base", desc: "There's no kubectl create daemonset — use a Deployment as a template.", code: ["kubectl create deployment node-monitor --image=busybox --dry-run=client -o yaml > ds.yaml"] },
          { label: "Step 2 — edit ds.yaml", desc: "Change kind to DaemonSet, remove replicas and strategy fields, add command:", code: ["# Change:\nkind: DaemonSet\n# Remove: replicas, strategy\n# Under containers, add:\ncommand: ['sh', '-c', 'sleep 3600']"] },
          { label: "Step 3 — apply it", desc: "", code: ["kubectl apply -f ds.yaml"] },
          { label: "Step 4 — verify", desc: "DESIRED should equal number of nodes.", code: ["kubectl get ds node-monitor", "kubectl get pods -o wide | grep node-monitor"] },
        ],
        expected: "One pod per node, all in Running state.",
        note: "DaemonSets ignore replicas — they always run exactly one pod per eligible node."
      },
      {
        id: "t8", title: "Set resource requests and limits",
        difficulty: "easy",
        scenario: "Create a pod named limited running nginx that requests 100m CPU and 128Mi memory, with limits of 200m CPU and 256Mi memory.",
        steps: [
          { label: "Step 1 — generate base YAML", desc: "", code: ["kubectl run limited --image=nginx --dry-run=client -o yaml > limited.yaml"] },
          { label: "Step 2 — add resources block", desc: "Under containers[0], add:", code: ["resources:\n  requests:\n    cpu: 100m\n    memory: 128Mi\n  limits:\n    cpu: 200m\n    memory: 256Mi"] },
          { label: "Step 3 — apply and verify", desc: "", code: ["kubectl apply -f limited.yaml", "kubectl describe pod limited | grep -A8 Requests"] },
        ],
        expected: "describe pod shows the correct Requests and Limits values.",
        note: "100m = 0.1 CPU cores. OOMKilled happens when a container exceeds its memory limit."
      },
    ]
  },
  {
    id: "s3", title: "Logging & Monitoring", color: "#34d399",
    tasks: [
      {
        id: "t9", title: "Inspect logs of a crashing container",
        difficulty: "easy",
        scenario: "Run a pod named crasher using busybox that exits immediately with a non-zero code. Retrieve the logs of the crashed container.",
        steps: [
          { label: "Step 1 — create a pod that crashes", desc: "", code: ["kubectl run crasher --image=busybox -- /bin/sh -c 'exit 1'"] },
          { label: "Step 2 — watch it restart", desc: "Status will show CrashLoopBackOff.", code: ["kubectl get pod crasher -w"] },
          { label: "Step 3 — get logs of the previous run", desc: "Without --previous you'd get nothing (container is not running).", code: ["kubectl logs crasher --previous"] },
          { label: "Step 4 — describe to see exit code and events", desc: "", code: ["kubectl describe pod crasher"] },
        ],
        expected: "kubectl logs --previous shows the output (empty for exit 1 but no error). describe shows Exit Code: 1.",
        note: "In the exam, --previous is essential for diagnosing CrashLoopBackOff pods."
      },
      {
        id: "t10", title: "Use metrics-server to find resource usage",
        difficulty: "easy",
        scenario: "Assuming metrics-server is installed, find which pod in the kube-system namespace is consuming the most CPU, and which node is consuming the most memory.",
        steps: [
          { label: "Step 1 — sort pods by CPU", desc: "", code: ["kubectl top pods -n kube-system --sort-by=cpu"] },
          { label: "Step 2 — sort nodes by memory", desc: "", code: ["kubectl top nodes --sort-by=memory"] },
        ],
        expected: "A table showing pods/nodes sorted by the chosen metric.",
        note: "If metrics-server isn't installed: kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml"
      },
    ]
  },
  {
    id: "s4", title: "Application Lifecycle", color: "#f59e0b",
    tasks: [
      {
        id: "t11", title: "Rolling update and rollback",
        difficulty: "medium",
        scenario: "Create a deployment app-v1 with image nginx:1.19 and 3 replicas. Update it to nginx:1.21. Then roll back to the previous version and confirm the image is nginx:1.19 again.",
        steps: [
          { label: "Step 1 — create the deployment", desc: "", code: ["kubectl create deployment app-v1 --image=nginx:1.19 --replicas=3"] },
          { label: "Step 2 — update the image", desc: "The container name defaults to nginx (same as image name).", code: ["kubectl set image deployment/app-v1 nginx=nginx:1.21"] },
          { label: "Step 3 — watch the rollout", desc: "", code: ["kubectl rollout status deployment/app-v1"] },
          { label: "Step 4 — check rollout history", desc: "", code: ["kubectl rollout history deployment/app-v1"] },
          { label: "Step 5 — roll back to previous", desc: "", code: ["kubectl rollout undo deployment/app-v1"] },
          { label: "Step 6 — verify image is back to 1.19", desc: "", code: ["kubectl describe deployment app-v1 | grep Image"] },
        ],
        expected: "After rollback, Image shows nginx:1.19.",
        note: "Use --to-revision=N to roll back to a specific revision instead of just the previous one."
      },
      {
        id: "t12", title: "Inject config via ConfigMap and Secret",
        difficulty: "medium",
        scenario: "Create a ConfigMap named app-config with APP_ENV=production. Create a Secret named app-secret with DB_PASS=s3cr3t. Mount both as environment variables in a pod named configured running nginx.",
        steps: [
          { label: "Step 1 — create ConfigMap", desc: "", code: ["kubectl create configmap app-config --from-literal=APP_ENV=production"] },
          { label: "Step 2 — create Secret", desc: "", code: ["kubectl create secret generic app-secret --from-literal=DB_PASS=s3cr3t"] },
          { label: "Step 3 — generate pod YAML", desc: "", code: ["kubectl run configured --image=nginx --dry-run=client -o yaml > configured.yaml"] },
          { label: "Step 4 — add envFrom to the container spec", desc: "Under containers[0], add:", code: ["envFrom:\n- configMapRef:\n    name: app-config\n- secretRef:\n    name: app-secret"] },
          { label: "Step 5 — apply and verify", desc: "", code: ["kubectl apply -f configured.yaml", "kubectl exec configured -- env | grep -E 'APP_ENV|DB_PASS'"] },
        ],
        expected: "env output shows APP_ENV=production and DB_PASS=s3cr3t.",
        note: "Secrets are base64-encoded in etcd but appear decoded inside the container. Base64 is NOT encryption."
      },
      {
        id: "t13", title: "Use an Init Container",
        difficulty: "medium",
        scenario: "Create a pod with an init container that writes a message to /data/init.txt, and a main container that reads and prints it. Both containers share an emptyDir volume.",
        steps: [
          { label: "Step 1 — write the pod YAML from scratch", desc: "No shortcut here — write it directly.", code: ["# init-pod.yaml\napiVersion: v1\nkind: Pod\nmetadata:\n  name: init-demo\nspec:\n  initContainers:\n  - name: init-writer\n    image: busybox\n    command: ['sh', '-c', 'echo hello from init > /data/init.txt']\n    volumeMounts:\n    - name: shared\n      mountPath: /data\n  containers:\n  - name: reader\n    image: busybox\n    command: ['sh', '-c', 'cat /data/init.txt && sleep 3600']\n    volumeMounts:\n    - name: shared\n      mountPath: /data\n  volumes:\n  - name: shared\n    emptyDir: {}"] },
          { label: "Step 2 — apply it", desc: "", code: ["kubectl apply -f init-pod.yaml"] },
          { label: "Step 3 — check init ran first", desc: "Watch the Init:0/1 → PodInitializing → Running progression.", code: ["kubectl get pod init-demo -w"] },
          { label: "Step 4 — read the logs of the main container", desc: "", code: ["kubectl logs init-demo -c reader"] },
        ],
        expected: "Logs show: hello from init",
        note: "The pod stays in Init status until ALL init containers complete successfully. If an init container fails, the pod restarts it."
      },
    ]
  },
  {
    id: "s5", title: "Cluster Maintenance", color: "#f87171",
    tasks: [
      {
        id: "t14", title: "Drain a node and bring it back",
        difficulty: "medium",
        scenario: "Simulate a maintenance window: drain a worker node (evicting all pods), then uncordon it and verify workloads reschedule onto it.",
        steps: [
          { label: "Step 1 — get the worker node name", desc: "", code: ["kubectl get nodes"] },
          { label: "Step 2 — deploy something to drain", desc: "", code: ["kubectl create deployment drain-test --image=nginx --replicas=3"] },
          { label: "Step 3 — drain the node", desc: "DaemonSet pods can't be moved, hence --ignore-daemonsets.", code: ["kubectl drain <worker-node> --ignore-daemonsets --delete-emptydir-data"] },
          { label: "Step 4 — verify the node is SchedulingDisabled", desc: "", code: ["kubectl get nodes"] },
          { label: "Step 5 — check pods moved elsewhere", desc: "", code: ["kubectl get pods -o wide"] },
          { label: "Step 6 — uncordon the node", desc: "", code: ["kubectl uncordon <worker-node>"] },
          { label: "Step 7 — verify node is Ready again", desc: "", code: ["kubectl get nodes"] },
        ],
        expected: "After drain, node shows SchedulingDisabled. After uncordon, node shows Ready.",
        note: "drain = cordon + evict all pods. uncordon only re-enables scheduling — existing pods don't automatically move back."
      },
      {
        id: "t15", title: "etcd backup and restore ⭐",
        difficulty: "hard",
        scenario: "Take a snapshot of the etcd database. Then simulate disaster by creating a test deployment, and restore the snapshot (which won't have the deployment). Verify the cluster is healthy after restore.",
        steps: [
          { label: "Step 1 — find etcd certs", desc: "", code: ["ls /etc/kubernetes/pki/etcd/"] },
          { label: "Step 2 — take the snapshot", desc: "All four flags are required — memorise them.", code: ["ETCDCTL_API=3 etcdctl snapshot save /backup/etcd-snap.db \\\n  --endpoints=https://127.0.0.1:2379 \\\n  --cacert=/etc/kubernetes/pki/etcd/ca.crt \\\n  --cert=/etc/kubernetes/pki/etcd/server.crt \\\n  --key=/etc/kubernetes/pki/etcd/server.key"] },
          { label: "Step 3 — verify the snapshot", desc: "", code: ["ETCDCTL_API=3 etcdctl snapshot status /backup/etcd-snap.db --write-out=table"] },
          { label: "Step 4 — create something AFTER the backup (to confirm it disappears post-restore)", desc: "", code: ["kubectl create deployment post-backup --image=nginx"] },
          { label: "Step 5 — restore to a new data directory", desc: "", code: ["ETCDCTL_API=3 etcdctl snapshot restore /backup/etcd-snap.db \\\n  --data-dir=/var/lib/etcd-restored"] },
          { label: "Step 6 — update the etcd static pod to use the new dir", desc: "Edit the etcd manifest and change --data-dir:", code: ["vi /etc/kubernetes/manifests/etcd.yaml\n# Change: --data-dir=/var/lib/etcd\n# To:     --data-dir=/var/lib/etcd-restored\n# Also update the hostPath volume path to match"] },
          { label: "Step 7 — wait for etcd and apiserver to restart", desc: "The static pod will auto-restart after the manifest changes.", code: ["watch kubectl get pods -n kube-system"] },
          { label: "Step 8 — verify post-backup deployment is gone", desc: "", code: ["kubectl get deployments"] },
        ],
        expected: "post-backup deployment no longer exists. Cluster is healthy. All pre-backup resources are intact.",
        note: "This is the most commonly tested topic. Practice until you can do it from memory in under 5 minutes."
      },
    ]
  },
  {
    id: "s6", title: "Security", color: "#c084fc",
    tasks: [
      {
        id: "t16", title: "Create RBAC Role and test permissions",
        difficulty: "medium",
        scenario: "Create a ServiceAccount named reader in the apps namespace. Grant it read-only access to pods (get, list, watch). Verify it can list pods but cannot create them.",
        steps: [
          { label: "Step 1 — create namespace and serviceaccount", desc: "", code: ["kubectl create namespace apps", "kubectl create serviceaccount reader -n apps"] },
          { label: "Step 2 — create the Role", desc: "", code: ["kubectl create role pod-reader \\\n  --verb=get,list,watch \\\n  --resource=pods \\\n  -n apps"] },
          { label: "Step 3 — bind the Role to the ServiceAccount", desc: "", code: ["kubectl create rolebinding reader-binding \\\n  --role=pod-reader \\\n  --serviceaccount=apps:reader \\\n  -n apps"] },
          { label: "Step 4 — test: can list pods?", desc: "", code: ["kubectl auth can-i list pods -n apps \\\n  --as=system:serviceaccount:apps:reader"] },
          { label: "Step 5 — test: can create pods?", desc: "", code: ["kubectl auth can-i create pods -n apps \\\n  --as=system:serviceaccount:apps:reader"] },
        ],
        expected: "list pods → yes. create pods → no.",
        note: "kubectl auth can-i is the fastest way to debug RBAC during the exam."
      },
      {
        id: "t17", title: "Apply a Security Context",
        difficulty: "easy",
        scenario: "Create a pod named secure running busybox that: runs as user ID 1000, has a read-only root filesystem, and drops ALL Linux capabilities. Verify with exec.",
        steps: [
          { label: "Step 1 — generate base YAML", desc: "", code: ["kubectl run secure --image=busybox --dry-run=client -o yaml -- sleep 3600 > secure.yaml"] },
          { label: "Step 2 — add securityContext to the container", desc: "Under containers[0], add:", code: ["securityContext:\n  runAsUser: 1000\n  readOnlyRootFilesystem: true\n  capabilities:\n    drop:\n    - ALL"] },
          { label: "Step 3 — apply it", desc: "", code: ["kubectl apply -f secure.yaml"] },
          { label: "Step 4 — verify user", desc: "", code: ["kubectl exec secure -- whoami", "kubectl exec secure -- id"] },
          { label: "Step 5 — verify read-only filesystem", desc: "", code: ["kubectl exec secure -- touch /testfile  # should fail"] },
        ],
        expected: "whoami returns an ID of 1000. touch /testfile fails with Read-only file system error.",
        note: "Pod-level securityContext applies to all containers. Container-level overrides the pod-level."
      },
      {
        id: "t18", title: "Write a Network Policy",
        difficulty: "hard",
        scenario: "Deploy two pods: frontend (label app=frontend) and backend (label app=backend). Write a NetworkPolicy that allows only the frontend pod to reach the backend on port 8080. All other ingress to the backend should be denied.",
        steps: [
          { label: "Step 1 — deploy both pods", desc: "", code: ["kubectl run backend --image=nginx --labels=app=backend", "kubectl run frontend --image=busybox --labels=app=frontend -- sleep 3600"] },
          { label: "Step 2 — write the NetworkPolicy YAML", desc: "", code: ["# netpol.yaml\napiVersion: networking.k8s.io/v1\nkind: NetworkPolicy\nmetadata:\n  name: allow-frontend\nspec:\n  podSelector:\n    matchLabels:\n      app: backend\n  policyTypes:\n  - Ingress\n  ingress:\n  - from:\n    - podSelector:\n        matchLabels:\n          app: frontend\n    ports:\n    - protocol: TCP\n      port: 8080"] },
          { label: "Step 3 — apply it", desc: "", code: ["kubectl apply -f netpol.yaml"] },
          { label: "Step 4 — test from frontend (should work on port 80, backend listens on 80)", desc: "Note: nginx listens on 80 not 8080 in this exercise — adjust port in the policy to 80 to see it work.", code: ["kubectl exec frontend -- wget -O- <backend-pod-ip>:80 --timeout=3"] },
          { label: "Step 5 — test from a pod without the label (should be blocked)", desc: "", code: ["kubectl run other --image=busybox --rm -it -- wget -O- <backend-pod-ip>:80 --timeout=3"] },
        ],
        expected: "frontend can reach backend. A pod without app=frontend label is blocked (timeout).",
        note: "NetworkPolicy requires a CNI that supports it (Calico, Cilium, Weave). Flannel alone does NOT enforce NetworkPolicy."
      },
    ]
  },
  {
    id: "s7", title: "Storage", color: "#2dd4bf",
    tasks: [
      {
        id: "t19", title: "Create a PersistentVolume and claim it",
        difficulty: "medium",
        scenario: "Create a PersistentVolume named pv-data (hostPath /mnt/data, 1Gi, RWO, Retain). Create a PVC named pvc-data requesting 500Mi. Mount it in a pod named pv-pod at /data. Write a file and verify it persists after pod deletion.",
        steps: [
          { label: "Step 1 — create the PV", desc: "", code: ["# pv.yaml\napiVersion: v1\nkind: PersistentVolume\nmetadata:\n  name: pv-data\nspec:\n  capacity:\n    storage: 1Gi\n  accessModes:\n  - ReadWriteOnce\n  persistentVolumeReclaimPolicy: Retain\n  hostPath:\n    path: /mnt/data"] },
          { label: "Step 2 — create the PVC", desc: "", code: ["# pvc.yaml\napiVersion: v1\nkind: PersistentVolumeClaim\nmetadata:\n  name: pvc-data\nspec:\n  accessModes:\n  - ReadWriteOnce\n  resources:\n    requests:\n      storage: 500Mi"] },
          { label: "Step 3 — apply both", desc: "", code: ["kubectl apply -f pv.yaml -f pvc.yaml", "kubectl get pv,pvc  # Both should show Bound"] },
          { label: "Step 4 — create a pod that mounts the PVC", desc: "", code: ["# pod.yaml\napiVersion: v1\nkind: Pod\nmetadata:\n  name: pv-pod\nspec:\n  containers:\n  - name: app\n    image: busybox\n    command: ['sleep', '3600']\n    volumeMounts:\n    - name: storage\n      mountPath: /data\n  volumes:\n  - name: storage\n    persistentVolumeClaim:\n      claimName: pvc-data"] },
          { label: "Step 5 — write a file and verify persistence", desc: "", code: ["kubectl exec pv-pod -- sh -c 'echo hello > /data/test.txt'", "kubectl delete pod pv-pod --force --grace-period=0", "# Re-create the pod, then:\nkubectl exec pv-pod -- cat /data/test.txt"] },
        ],
        expected: "PV and PVC both show Bound. After pod deletion and recreation, test.txt still contains 'hello'.",
        note: "PVC binds to a PV if capacity >= request AND accessModes match. A 500Mi PVC can bind to a 1Gi PV."
      },
    ]
  },
  {
    id: "s8", title: "Networking", color: "#fb923c",
    tasks: [
      {
        id: "t20", title: "Test DNS resolution inside the cluster",
        difficulty: "easy",
        scenario: "Create a service named web-svc in the dev namespace backed by an nginx pod. From a debug pod in the default namespace, resolve and curl the service using its full DNS name.",
        steps: [
          { label: "Step 1 — set up namespace, pod, and service", desc: "", code: ["kubectl create namespace dev", "kubectl run web --image=nginx -n dev --labels=app=web", "kubectl expose pod web -n dev --port=80 --name=web-svc"] },
          { label: "Step 2 — get the full DNS name", desc: "Format: <service>.<namespace>.svc.cluster.local", code: ["# DNS name is: web-svc.dev.svc.cluster.local"] },
          { label: "Step 3 — test from the default namespace", desc: "Cross-namespace DNS requires the full name.", code: ["kubectl run debug --image=busybox:1.28 --rm -it --restart=Never -- \\\n  nslookup web-svc.dev.svc.cluster.local"] },
          { label: "Step 4 — curl it", desc: "", code: ["kubectl run debug --image=busybox:1.28 --rm -it --restart=Never -- \\\n  wget -O- web-svc.dev.svc.cluster.local:80"] },
        ],
        expected: "nslookup resolves the name to a ClusterIP. wget returns nginx welcome page.",
        note: "Within the same namespace you can use just the service name. Cross-namespace requires the full FQDN."
      },
      {
        id: "t21", title: "Create an Ingress with path-based routing",
        difficulty: "hard",
        scenario: "You have two services: svc-a on port 80 and svc-b on port 80 in the default namespace. Create an Ingress that routes myapp.local/a to svc-a and myapp.local/b to svc-b.",
        steps: [
          { label: "Step 1 — create mock services", desc: "", code: ["kubectl create deployment app-a --image=nginx", "kubectl expose deployment app-a --port=80 --name=svc-a", "kubectl create deployment app-b --image=httpd", "kubectl expose deployment app-b --port=80 --name=svc-b"] },
          { label: "Step 2 — write the Ingress YAML", desc: "", code: ["# ingress.yaml\napiVersion: networking.k8s.io/v1\nkind: Ingress\nmetadata:\n  name: path-ingress\n  annotations:\n    nginx.ingress.kubernetes.io/rewrite-target: /\nspec:\n  ingressClassName: nginx\n  rules:\n  - host: myapp.local\n    http:\n      paths:\n      - path: /a\n        pathType: Prefix\n        backend:\n          service:\n            name: svc-a\n            port:\n              number: 80\n      - path: /b\n        pathType: Prefix\n        backend:\n          service:\n            name: svc-b\n            port:\n              number: 80"] },
          { label: "Step 3 — apply and inspect", desc: "", code: ["kubectl apply -f ingress.yaml", "kubectl describe ingress path-ingress"] },
          { label: "Step 4 — test (requires ingress controller and /etc/hosts or curl -H)", desc: "", code: ["curl -H 'Host: myapp.local' http://<ingress-ip>/a", "curl -H 'Host: myapp.local' http://<ingress-ip>/b"] },
        ],
        expected: "/a returns nginx response, /b returns httpd response.",
        note: "In the exam, an nginx Ingress controller is usually already installed. Check with: kubectl get pods -n ingress-nginx"
      },
    ]
  },
  {
    id: "s9", title: "Troubleshooting", color: "#94a3b8",
    tasks: [
      {
        id: "t22", title: "Debug a CrashLoopBackOff pod",
        difficulty: "medium",
        scenario: "A pod named broken is in CrashLoopBackOff. It's running busybox with command /bin/sh -c 'cat /config/app.conf'. The file doesn't exist. Fix it by mounting a ConfigMap that provides the file.",
        steps: [
          { label: "Step 1 — create the broken pod", desc: "", code: ["kubectl run broken --image=busybox -- /bin/sh -c 'cat /config/app.conf && sleep 3600'"] },
          { label: "Step 2 — diagnose", desc: "", code: ["kubectl describe pod broken", "kubectl logs broken --previous"] },
          { label: "Step 3 — create the missing ConfigMap", desc: "", code: ["kubectl create configmap app-conf --from-literal=app.conf='debug=true'"] },
          { label: "Step 4 — get the pod YAML and edit it", desc: "", code: ["kubectl get pod broken -o yaml > broken.yaml", "# Delete the pod, edit YAML to add volume + volumeMount"] },
          { label: "Step 5 — add volume and mount to broken.yaml", desc: "Under spec.volumes and containers[0].volumeMounts:", code: ["# Under spec.volumes:\nvolumes:\n- name: config-vol\n  configMap:\n    name: app-conf\n\n# Under containers[0].volumeMounts:\nvolumeMounts:\n- name: config-vol\n  mountPath: /config"] },
          { label: "Step 6 — re-apply and verify", desc: "", code: ["kubectl delete pod broken --force --grace-period=0", "kubectl apply -f broken.yaml", "kubectl logs broken"] },
        ],
        expected: "Pod runs successfully and logs show: debug=true",
        note: "Always check describe + logs + logs --previous. That trio solves 90% of pod failures."
      },
      {
        id: "t23", title: "Debug a service not routing to pods",
        difficulty: "medium",
        scenario: "A deployment myapp exists with pods running nginx. A service myapp-svc also exists but requests to it return nothing. Find and fix the issue — the service selector is wrong.",
        steps: [
          { label: "Step 1 — set up the broken scenario", desc: "", code: ["kubectl create deployment myapp --image=nginx --replicas=2", "kubectl expose deployment myapp --port=80 --name=myapp-svc", "# Now break the selector:\nkubectl patch svc myapp-svc -p '{\"spec\":{\"selector\":{\"app\":\"wrong-label\"}}}'"] },
          { label: "Step 2 — check endpoints (the key diagnostic step)", desc: "Empty endpoints = selector mismatch.", code: ["kubectl get endpoints myapp-svc"] },
          { label: "Step 3 — check what labels the pods actually have", desc: "", code: ["kubectl get pods --show-labels"] },
          { label: "Step 4 — fix the service selector", desc: "", code: ["kubectl patch svc myapp-svc -p '{\"spec\":{\"selector\":{\"app\":\"myapp\"}}}'"] },
          { label: "Step 5 — verify endpoints are populated", desc: "", code: ["kubectl get endpoints myapp-svc", "kubectl run tmp --image=busybox:1.28 --rm -it -- wget -O- myapp-svc:80"] },
        ],
        expected: "After fix, endpoints shows pod IPs. wget returns nginx page.",
        note: "Empty Endpoints is always the first thing to check when a service doesn't route. It means the selector matches nothing."
      },
      {
        id: "t24", title: "Fix a broken kubelet on a worker node",
        difficulty: "hard",
        scenario: "A worker node shows NotReady. SSH to it and diagnose why the kubelet isn't running. Fix it and confirm the node comes back.",
        steps: [
          { label: "Step 1 — identify the NotReady node", desc: "", code: ["kubectl get nodes"] },
          { label: "Step 2 — SSH to the broken node and check kubelet", desc: "", code: ["ssh <node>", "systemctl status kubelet"] },
          { label: "Step 3 — if kubelet is stopped, start it", desc: "", code: ["systemctl start kubelet", "systemctl enable kubelet"] },
          { label: "Step 4 — if kubelet fails to start, read the logs", desc: "", code: ["journalctl -u kubelet -n 50 --no-pager"] },
          { label: "Step 5 — common fix: wrong config path", desc: "Check /var/lib/kubelet/config.yaml exists and has valid content.", code: ["cat /var/lib/kubelet/config.yaml", "ls /etc/kubernetes/pki/"] },
          { label: "Step 6 — restart and watch", desc: "", code: ["systemctl daemon-reload", "systemctl restart kubelet", "systemctl status kubelet"] },
          { label: "Step 7 — verify node comes back from the control plane", desc: "", code: ["kubectl get nodes -w"] },
        ],
        expected: "Node transitions from NotReady to Ready within 1–2 minutes of kubelet restarting.",
        note: "journalctl -u kubelet is your best friend for worker node failures. Look for certificate errors, wrong API server address, or missing config files."
      },
    ]
  },
];
