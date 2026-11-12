// Quiz questions — Services & Networking.
QUIZ.push(
	// ── Services ──
	quizQ(
		'net-expose',
		'network',
		'Which command creates a Service for Deployment web, listening on 80 and sending to container port 8080?',
		'kubectl expose deployment web --port=80 --target-port=8080',
		[
			'kubectl expose deployment web --port=8080 --target-port=80',
			'kubectl create service web 80:8080',
			'kubectl service web --listen=80 --to=8080',
		],
		'--port is the Service port, --target-port is the container port.'
	),
	quizQ(
		'net-port-fields',
		'network',
		'In this Service, which number must match the port the container listens on?',
		'targetPort: 8080',
		['port: 80', 'nodePort: 30080', 'None of them'],
		'`port` is what clients use on the Service IP. nodePort is exposed on every node.',
		`spec:
  type: NodePort
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 8080
      nodePort: 30080`
	),
	quizQ(
		'net-nodeport-access',
		'network',
		'A NodePort Service is reachable on...',
		'The nodePort of every node’s IP',
		['Only the node running the pod', 'Only inside the cluster', 'The control plane node only'],
		'kube-proxy forwards from any node to the pods.'
	),
	quizQ(
		'net-loadbalancer',
		'network',
		'A LoadBalancer Service stays <pending> on a bare-metal cluster. Why?',
		'No cloud or load balancer implementation (such as MetalLB) is installed',
		[
			'The Service has no selector',
			'LoadBalancer needs a NodePort first',
			'Bare-metal clusters block port 80',
		],
		'The type needs something that provisions the external IP.'
	),
	quizQ(
		'net-externalname',
		'network',
		'What does a Service of type ExternalName return?',
		'A DNS CNAME to an external hostname',
		['A cluster IP that proxies externally', 'A NodePort', 'A list of pod IPs'],
		'No proxying happens. DNS just points at the external name.'
	),
	quizQ(
		'net-endpoints-cmd',
		'network',
		'Which command shows the pod IPs behind a Service?',
		'kubectl get endpoints <svc>',
		[
			'kubectl get backends <svc>',
			'kubectl describe pods --service <svc>',
			'kubectl top svc <svc>',
		],
		'`kubectl describe svc` shows them too. EndpointSlices are the newer API.'
	),
	quizQ(
		'net-selector-svc',
		'network',
		'How does a Service find its pods?',
		'Its selector matches pod labels',
		['By pod name prefix', 'By Deployment name', 'By namespace only'],
		'A Service without a selector has no automatic endpoints.'
	),
	quizQ(
		'net-pod-ip-model',
		'network',
		'In the Kubernetes network model, pods can reach each other...',
		'By pod IP, without NAT',
		['Only through Services', 'Only inside the same node', 'Only via hostPort'],
		'The CNI plugin makes this work across nodes.'
	),
	quizQ(
		'net-external-policy',
		'network',
		'What does `externalTrafficPolicy: Local` do on a NodePort Service?',
		'Keeps the client source IP and only uses pods on the node that received the traffic',
		['Blocks external traffic', 'Spreads traffic over all nodes evenly', 'Enables TLS'],
		'The trade-off is uneven load, and nodes with no pod drop the traffic.'
	),
	quizQ(
		'net-port-forward',
		'network',
		'Which command forwards local port 8080 to port 80 of pod web?',
		'kubectl port-forward pod/web 8080:80',
		[
			'kubectl proxy pod/web 80:8080',
			'kubectl expose pod web 8080:80 --local',
			'kubectl forward web 8080 80',
		],
		'The format is `<local>:<remote>`. Handy for a quick look without a Service.'
	),
	quizQ(
		'net-session-affinity',
		'network',
		'Which Service setting sends a client to the same pod each time?',
		'sessionAffinity: ClientIP',
		['loadBalancer: sticky', 'affinity: pod', 'externalTrafficPolicy: Local'],
		'It is based on the client IP address.'
	),

	// ── DNS ──
	quizQ(
		'net-dns-short',
		'network',
		'From a pod in namespace "shop", which name reaches Service "web" in the SAME namespace?',
		'web',
		['web.default', 'web.svc', 'web.cluster'],
		'The search path in /etc/resolv.conf completes it. From another namespace use web.shop.'
	),
	quizQ(
		'net-dns-other-ns',
		'network',
		'From namespace "dev", which name reaches Service "api" in namespace "prod"?',
		'api.prod',
		['api', 'prod.api', 'api.dev'],
		'`<service>.<namespace>`.'
	),
	quizQ(
		'net-coredns-config',
		'network',
		'Where is the CoreDNS configuration (Corefile) stored?',
		'In the coredns ConfigMap in kube-system',
		['In /etc/coredns on each node', 'In the kube-dns Service', 'In a Secret in default'],
		'Edit it with `kubectl -n kube-system edit configmap coredns`.'
	),
	quizQ(
		'net-dns-policy',
		'network',
		'What is the default dnsPolicy of a pod?',
		'ClusterFirst',
		['Default', 'None', 'HostFirst'],
		'The name "Default" is confusing: it means "inherit the node’s resolver", and it is NOT the default.'
	),
	quizQ(
		'net-nslookup',
		'network',
		'Which command tests DNS from inside the cluster with a throwaway pod?',
		'kubectl run -it --rm dns --image=busybox --restart=Never -- nslookup web',
		['kubectl dns web', 'kubectl exec dns -- ping web', 'kubectl get dns web'],
		'--rm deletes the pod when it exits.'
	),
	quizQ(
		'net-svc-cidr',
		'network',
		'Service ClusterIPs are taken from which range?',
		'The service CIDR set on the API server (--service-cluster-ip-range)',
		['The pod CIDR', 'The node network', 'The CNI plugin’s overlay range'],
		'kubeadm sets it with `--service-cidr`.'
	),

	// ── NetworkPolicy ──
	quizQ(
		'net-default-allow',
		'network',
		'A pod is selected by NO NetworkPolicy. What traffic is allowed?',
		'All ingress and egress',
		['Nothing', 'Only traffic from the same namespace', 'Only egress'],
		'Policies are opt-in per pod. Once a pod is selected, only what a policy allows gets through.'
	),
	quizQ(
		'net-deny-all',
		'network',
		'What does this policy do?',
		'Blocks all incoming traffic to every pod in the namespace',
		[
			'Blocks all outgoing traffic',
			'Allows all incoming traffic',
			'Blocks traffic between namespaces only',
		],
		'It selects all pods, lists Ingress and gives no rules, so nothing is allowed in.',
		`apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-ingress
spec:
  podSelector: {}
  policyTypes:
    - Ingress`
	),
	quizQ(
		'net-allow-same-ns',
		'network',
		'In this ingress rule, who may connect to port 80?',
		'Pods labelled role=frontend in the same namespace',
		[
			'Any pod in any namespace',
			'Pods in namespaces labelled role=frontend',
			'Only the node itself',
		],
		'A podSelector alone is limited to the policy’s own namespace.',
		`ingress:
  - from:
      - podSelector:
          matchLabels:
            role: frontend
    ports:
      - port: 80`
	),
	quizQ(
		'net-and-or',
		'network',
		'In this rule, namespaceSelector and podSelector are in ONE list item. What does it mean?',
		'Both must match: pods labelled app=api in namespaces labelled team=a',
		['Either may match', 'Only the namespace is checked', 'It is invalid YAML'],
		'With a dash before each, they would be two items and combine with OR.',
		`from:
  - namespaceSelector:
      matchLabels:
        team: a
    podSelector:
      matchLabels:
        app: api`
	),
	quizQ(
		'net-additive',
		'network',
		'Two NetworkPolicies select the same pod. How are they combined?',
		'The allowed traffic is the union of both',
		[
			'Only the intersection is allowed',
			'The oldest one wins',
			'The API server rejects the second',
		],
		'Policies only add allowed traffic, they never conflict.'
	),
	quizQ(
		'net-egress-dns',
		'network',
		'You block all egress with a policy. Name lookups now fail. What do you allow?',
		'Egress to port 53 (UDP and TCP) towards CoreDNS',
		['Ingress on port 443', 'Egress to the API server only', 'Nothing, DNS bypasses policies'],
		'DNS is just traffic to CoreDNS in kube-system.'
	),
	quizQ(
		'net-policy-cni-list',
		'network',
		'Which CNI plugin does NOT enforce NetworkPolicy on its own?',
		'Flannel',
		['Calico', 'Cilium', 'Weave Net'],
		'You can run Flannel for networking and Calico for policy, or just use Calico.'
	),
	quizQ(
		'net-netpol-list',
		'network',
		'Which command lists NetworkPolicies in all namespaces?',
		'kubectl get networkpolicy -A',
		['kubectl get netrules -A', 'kubectl get policy --all', 'kubectl describe network -A'],
		'netpol is the short name.'
	),

	// ── Ingress and Gateway API ──
	quizQ(
		'net-ingress-yaml',
		'network',
		'In this Ingress, where does a request for example.com/shop go?',
		'To Service shop on port 80',
		['To Service example', 'To a Service named /shop', 'To the default backend'],
		'`pathType: Prefix` matches /shop and anything below it.',
		`spec:
  ingressClassName: nginx
  rules:
    - host: example.com
      http:
        paths:
          - path: /shop
            pathType: Prefix
            backend:
              service:
                name: shop
                port:
                  number: 80`
	),
	quizQ(
		'net-ingress-class',
		'network',
		'What does ingressClassName select?',
		'Which ingress controller handles the Ingress',
		['The Service type', 'The TLS certificate', 'The load balancer size'],
		'Several controllers can run in one cluster.'
	),
	quizQ(
		'net-ingress-tls',
		'network',
		'Which command creates the Secret that Ingress TLS refers to?',
		'kubectl create secret tls web-tls --cert=tls.crt --key=tls.key',
		[
			'kubectl create secret generic web-tls --tls tls.crt',
			'kubectl create tls web-tls tls.crt tls.key',
			'kubectl create certificate web-tls --cert=tls.crt',
		],
		'Reference it under `spec.tls[].secretName`.'
	),
	quizQ(
		'net-ingress-vs-svc',
		'network',
		'Compared to a Service, an Ingress works at which layer?',
		'HTTP (L7): routes by host and path',
		['TCP (L4) only', 'Ethernet (L2)', 'DNS only'],
		'Services balance TCP and UDP connections.'
	),
	quizQ(
		'net-gateway-parent',
		'network',
		'In a Gateway API HTTPRoute, which field attaches the route to a Gateway?',
		'parentRefs',
		['gatewayClassName', 'backendRefs', 'listenerRef'],
		'backendRefs point at the Services that receive the traffic.',
		`spec:
  parentRefs:
    - name: public-gw
  hostnames: ["example.com"]
  rules:
    - backendRefs:
        - name: web
          port: 80`
	),
	quizQ(
		'net-gatewayclass',
		'network',
		'What is a GatewayClass?',
		'Names the controller implementation that handles Gateways of that class',
		['A route for HTTP traffic', 'A TLS certificate', 'A kind of Service'],
		'It is to Gateway what StorageClass is to a PVC.'
	),

	// ── Node-level networking ──
	quizQ(
		'net-kube-proxy-modes',
		'network',
		'Which is NOT a kube-proxy mode?',
		'bgp',
		['iptables', 'ipvs', 'nftables'],
		'kube-proxy programs the node so Service IPs reach pods.'
	),
	quizQ(
		'net-host-network',
		'network',
		'What does `hostNetwork: true` do for a pod?',
		'The pod uses the node’s network namespace and IP',
		[
			'It gets a dedicated NIC',
			'It is exposed through a Service',
			'It bypasses the CNI for egress only',
		],
		'Port clashes with the node become possible.'
	),
	quizQ(
		'net-cni-bin',
		'network',
		'Where are the CNI plugin binaries installed by default?',
		'/opt/cni/bin',
		['/etc/cni/net.d', '/usr/lib/kubernetes/cni', '/var/lib/cni'],
		'The config is in /etc/cni/net.d.'
	),
	quizQ(
		'net-svc-wide',
		'network',
		'Which command shows Services with their selectors?',
		'kubectl get svc -o wide',
		[
			'kubectl get svc --selectors',
			'kubectl describe svc --all',
			'kubectl get services --labels',
		],
		'The SELECTOR column is added.'
	)
);
