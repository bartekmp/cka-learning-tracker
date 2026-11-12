// Exam domains — shared by the tracker and the practice tasks page.

// The official CKA curriculum grades five weighted domains, while the study
// plan and the practice tasks are organised into nine teaching sections. Each
// section carries a `domain` key so progress can be reported against what the
// exam actually scores. Weights are from CKA_Curriculum_v1.37.pdf — keep them
// in sync when the curriculum version changes.
const EXAM_DOMAINS = [
	{ id: 'trouble', title: 'Troubleshooting', weight: 30 },
	{ id: 'arch', title: 'Cluster Architecture, Installation & Configuration', weight: 25 },
	{ id: 'network', title: 'Services & Networking', weight: 20 },
	{ id: 'workloads', title: 'Workloads & Scheduling', weight: 15 },
	{ id: 'storage', title: 'Storage', weight: 10 },
];
