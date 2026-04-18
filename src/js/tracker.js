import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

const TRACKER_MARKER = 'cka-tracker-progress-v1';
const HANDLE_KEY = 'tracker-handle';
const ACCENT = [
	'#60a5fa',
	'#a78bfa',
	'#34d399',
	'#f59e0b',
	'#f87171',
	'#c084fc',
	'#2dd4bf',
	'#fb923c',
	'#94a3b8',
];

let fileHandle = null;

function trackerCbs() {
	return {
		pickFile: window._asPickFile,
		reEnable: window._asReEnable,
		manualExport: window._asManualExport,
		manualImport: window._asManualImport,
	};
}

function useTheme() {
	const [dark, setDark] = useState(document.documentElement.classList.contains('dark'));

	useEffect(function () {
		function handleThemeChange() {
			setDark(document.documentElement.classList.contains('dark'));
		}

		window.addEventListener('themechange', handleThemeChange);
		return function () {
			window.removeEventListener('themechange', handleThemeChange);
		};
	}, []);

	return {
		bgSec: dark ? '#252522' : '#ffffff',
		bgTer: dark ? '#2e2e2b' : '#f0efe8',
		text: dark ? '#e8e6df' : '#1a1a18',
		textSec: dark ? '#b0ada3' : '#4a4a46',
		textTer: dark ? '#7a7872' : '#888780',
		textInfo: dark ? '#93c5fd' : '#1d4ed8',
		border: dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)',
		linkColor: dark ? '#60a5fa' : '#2563eb',
		codeColor: dark ? '#93c5fd' : '#1d4ed8',
		codeBg: dark ? '#1e2030' : '#f0f4ff',
		mono: "'SFMono-Regular', 'Consolas', 'Liberation Mono', monospace",
	};
}

function App() {
	const theme = useTheme();
	const [done, setDone] = useState({});
	const [open, setOpen] = useState({});
	const [tab, setTab] = useState('plan');
	const [copied, setCopied] = useState(null);
	const doneRef = useRef(done);
	const mounted = useRef(false);

	useEffect(
		function () {
			doneRef.current = done;
		},
		[done]
	);

	useEffect(function () {
		window._asPickFile = async function () {
			try {
				const handle = await window.showSaveFilePicker({
					suggestedName: 'cka-tracker-progress.json',
					types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
				});
				fileHandle = handle;
				await idbSet(HANDLE_KEY, handle);
				await writeHandle(handle, doneRef.current, TRACKER_MARKER);
				setBarState('active', handle.name, trackerCbs());
				asFlash('✓ Auto-save enabled!');
			} catch (error) {
				if (error.name !== 'AbortError') asFlash('Could not set up auto-save', '#dc2626');
			}
		};

		window._asReEnable = async function () {
			if (!fileHandle) return;
			if (await canWrite(fileHandle)) {
				setBarState('active', fileHandle.name, trackerCbs());
				asFlash('✓ Auto-save re-enabled!');
			} else {
				asFlash('Permission denied', '#dc2626');
			}
		};

		window._asManualExport = function () {
			const blob = new Blob(
				[
					JSON.stringify(
						{
							_type: TRACKER_MARKER,
							saved: new Date().toISOString(),
							data: doneRef.current,
						},
						null,
						2
					),
				],
				{ type: 'application/json' }
			);
			const anchor = document.createElement('a');
			anchor.href = URL.createObjectURL(blob);
			anchor.download = 'cka-tracker-progress.json';
			anchor.click();
			URL.revokeObjectURL(anchor.href);
			asFlash('✓ Exported!');
		};

		window._asManualImport = function (event) {
			const file = event.target.files[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onload = function (loadEvent) {
				try {
					const payload = JSON.parse(loadEvent.target.result);
					if (payload._type !== TRACKER_MARKER) {
						asFlash('Wrong file', '#dc2626');
						return;
					}
					setDone(payload.data || {});
					asFlash('✓ Imported!');
				} catch {
					asFlash('Could not read file', '#dc2626');
				}
				event.target.value = '';
			};
			reader.readAsText(file);
		};

		window._asAutoSave = async function (data) {
			if (!fileHandle) return;
			try {
				if (!(await canWrite(fileHandle))) {
					setBarState('perm', null, trackerCbs());
					return;
				}
				await writeHandle(fileHandle, data, TRACKER_MARKER);
				asFlash('✓ Saved');
			} catch {
				asFlash('Save failed', '#dc2626');
			}
		};

		(async function () {
			if (!HAS_FSA) {
				setBarState('fallback', null, trackerCbs());
				return;
			}

			const handle = await idbGet(HANDLE_KEY);
			if (!handle) {
				setBarState('none', null, trackerCbs());
				return;
			}

			fileHandle = handle;
			if (!(await canWrite(handle))) {
				setBarState('perm', null, trackerCbs());
				return;
			}

			try {
				const stored = await readHandle(handle, TRACKER_MARKER);
				setDone(stored);
				setBarState('active', handle.name, trackerCbs());
				asFlash('✓ Progress loaded');
			} catch {
				await idbDel(HANDLE_KEY);
				fileHandle = null;
				setBarState('none', null, trackerCbs());
			}
		})();
	}, []);

	useEffect(
		function () {
			if (!mounted.current) {
				mounted.current = true;
				return;
			}
			if (window._asAutoSave) window._asAutoSave(done);
		},
		[done]
	);

	function toggleDone(id) {
		setDone(function (previous) {
			return { ...previous, [id]: !previous[id] };
		});
	}

	function toggleOpen(id) {
		setOpen(function (previous) {
			return { ...previous, [id]: !previous[id] };
		});
	}

	function copyCommand(command) {
		navigator.clipboard.writeText(command).catch(function () {});
		setCopied(command);
		setTimeout(function () {
			setCopied(null);
		}, 1800);
	}

	function getSectionStats(section, index) {
		let total = 0;
		let completed = 0;

		section.topics.forEach(function (topic) {
			topic.tasks.forEach(function (_, taskIndex) {
				total += 1;
				if (done[topic.id + ':' + taskIndex]) completed += 1;
			});
		});

		return {
			total: total,
			completed: completed,
			pct: total ? Math.round((completed / total) * 100) : 0,
			color: ACCENT[index % ACCENT.length],
		};
	}

	const overall = (function () {
		let total = 0;
		let completed = 0;
		SECTIONS.forEach(function (section, index) {
			const stats = getSectionStats(section, index);
			total += stats.total;
			completed += stats.completed;
		});
		return total ? Math.round((completed / total) * 100) : 0;
	})();

	return (
		<div
			style={{
				maxWidth: 820,
				margin: '0 auto',
				fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
			}}
		>
			<div style={{ marginBottom: 20 }}>
				<h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 500, color: theme.text }}>
					CKA study tracker
				</h1>
				<p style={{ margin: '0 0 10px', fontSize: 13, color: theme.textTer }}>
					~77 hrs across 9 sections · progress saved in your browser
				</p>
				<div
					style={{
						display: 'inline-flex',
						alignItems: 'center',
						gap: 8,
						background: 'rgba(37,99,235,.08)',
						border: '0.5px solid rgba(37,99,235,.25)',
						borderRadius: 8,
						padding: '6px 12px',
						marginBottom: 14,
						fontSize: 12,
						color: theme.textSec,
					}}
				>
					<span style={{ fontSize: 15 }}>☸️</span>
					<span>
						Based on{' '}
						<strong style={{ color: theme.text, fontWeight: 500 }}>
							Kubernetes v1.35
						</strong>{' '}
						— CKA exam version as of April 2026.
					</span>
					<a
						href="https://docs.linuxfoundation.org/tc-docs/certification/faq-cka-ckad-cks"
						target="_blank"
						rel="noreferrer"
						style={{ color: theme.textInfo, whiteSpace: 'nowrap' }}
					>
						Check current version ↗
					</a>
				</div>
				<div
					style={{
						background: theme.bgTer,
						borderRadius: 99,
						height: 8,
						overflow: 'hidden',
						border: '0.5px solid ' + theme.border,
					}}
				>
					<div
						style={{
							background: '#2563eb',
							height: '100%',
							width: overall + '%',
							transition: 'width 0.3s',
							borderRadius: 99,
						}}
					/>
				</div>
				<p style={{ margin: '5px 0 0', fontSize: 12, color: theme.textTer }}>
					{overall}% overall complete
				</p>
			</div>

			<div
				style={{
					display: 'flex',
					gap: 4,
					marginBottom: 18,
					background: theme.bgSec,
					padding: 4,
					borderRadius: 12,
					border: '0.5px solid ' + theme.border,
				}}
			>
				{[
					['plan', 'Study plan'],
					['cheat', 'Cheatsheet'],
					['tips', 'ADHD tips'],
				].map(function (entry) {
					const isActive = tab === entry[0];
					return (
						<button
							key={entry[0]}
							onClick={function () {
								setTab(entry[0]);
							}}
							style={{
								flex: 1,
								padding: '8px 10px',
								borderRadius: 6,
								border: 'none',
								cursor: 'pointer',
								fontSize: 13,
								fontWeight: 500,
								background: isActive ? '#2563eb22' : 'transparent',
								color: isActive ? theme.textInfo : theme.textSec,
							}}
						>
							{entry[1]}
						</button>
					);
				})}
			</div>

			{tab === 'plan' &&
				SECTIONS.map(function (section, sectionIndex) {
					const stats = getSectionStats(section, sectionIndex);
					const sectionOpen = !!open[section.id];

					return (
						<div
							key={section.id}
							style={{
								background: theme.bgSec,
								border: '0.5px solid ' + theme.border,
								borderRadius: 12,
								marginBottom: 10,
								overflow: 'hidden',
								borderLeft: '3px solid ' + stats.color,
							}}
						>
							<div
								onClick={function () {
									toggleOpen(section.id);
								}}
								style={{
									padding: '14px 16px',
									cursor: 'pointer',
									display: 'flex',
									alignItems: 'center',
									gap: 12,
									userSelect: 'none',
								}}
							>
								<div style={{ flex: 1 }}>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: 10,
											marginBottom: 6,
											flexWrap: 'wrap',
										}}
									>
										<span
											style={{
												fontSize: 14,
												fontWeight: 500,
												color: theme.text,
											}}
										>
											{section.title}
										</span>
										<span style={{ fontSize: 11, color: theme.textTer }}>
											{section.schedule}
										</span>
										<span
											style={{
												display: 'inline-flex',
												alignItems: 'center',
												justifyContent: 'center',
												minWidth: 32,
												fontSize: 11,
												padding: '2px 6px',
												borderRadius: 99,
												background: stats.color + '28',
												color: stats.color,
												fontWeight: 500,
											}}
										>
											{stats.completed}/{stats.total}
										</span>
									</div>
									<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
										<div
											style={{
												flex: 1,
												background: theme.bgTer,
												borderRadius: 99,
												height: 4,
												overflow: 'hidden',
											}}
										>
											<div
												style={{
													background: stats.color,
													height: '100%',
													width: stats.pct + '%',
													transition: 'width 0.3s',
													borderRadius: 99,
												}}
											/>
										</div>
										<span
											style={{
												fontSize: 11,
												color: theme.textTer,
												minWidth: 32,
												textAlign: 'right',
											}}
										>
											{stats.pct}%
										</span>
									</div>
								</div>
								<span
									style={{
										color: theme.textTer,
										fontSize: 12,
										display: 'inline-block',
										transform: sectionOpen ? 'rotate(90deg)' : 'none',
										transition: 'transform 0.2s',
										marginLeft: 4,
									}}
								>
									▶
								</span>
							</div>

							{sectionOpen &&
								section.topics.map(function (topic) {
									const topicOpen = !!open[topic.id];
									const doneCount = topic.tasks.filter(function (_, taskIndex) {
										return !!done[topic.id + ':' + taskIndex];
									}).length;

									return (
										<div key={topic.id}>
											<div
												onClick={function () {
													toggleOpen(topic.id);
												}}
												style={{
													padding: '10px 16px 10px 18px',
													cursor: 'pointer',
													display: 'flex',
													alignItems: 'center',
													gap: 10,
													background: theme.bgTer,
													userSelect: 'none',
													borderTop: '0.5px solid ' + theme.border,
												}}
											>
												<span
													style={{
														width: 6,
														height: 6,
														borderRadius: '50%',
														background: stats.color,
														flexShrink: 0,
														display: 'inline-block',
													}}
												/>
												<span
													style={{
														flex: 1,
														fontSize: 13,
														fontWeight: 500,
														color: theme.text,
													}}
												>
													{topic.title}
												</span>
												<span
													style={{
														fontSize: 11,
														color: theme.textTer,
														marginRight: 6,
													}}
												>
													{doneCount}/{topic.tasks.length}
												</span>
												<span
													style={{
														color: theme.textTer,
														fontSize: 11,
														display: 'inline-block',
														transform: topicOpen
															? 'rotate(90deg)'
															: 'none',
														transition: 'transform 0.2s',
													}}
												>
													▶
												</span>
											</div>

											{topicOpen && (
												<div
													style={{
														padding: '12px 18px 16px 28px',
														borderTop: '0.5px solid ' + theme.border,
													}}
												>
													<div style={{ marginBottom: 14 }}>
														<div
															style={{
																fontSize: 11,
																fontWeight: 500,
																color: theme.textTer,
																textTransform: 'uppercase',
																letterSpacing: '0.7px',
																marginBottom: 8,
															}}
														>
															Tasks
														</div>
														{topic.tasks.map(
															function (task, taskIndex) {
																const key =
																	topic.id + ':' + taskIndex;
																const isDone = !!done[key];
																return (
																	<label
																		key={key}
																		style={{
																			display: 'flex',
																			gap: 8,
																			alignItems:
																				'flex-start',
																			cursor: 'pointer',
																			marginBottom: 7,
																		}}
																	>
																		<input
																			type="checkbox"
																			checked={isDone}
																			onChange={function () {
																				toggleDone(key);
																			}}
																			style={{
																				marginTop: 2,
																				accentColor:
																					stats.color,
																				flexShrink: 0,
																				width: 14,
																				height: 14,
																			}}
																		/>
																		<span
																			style={{
																				fontSize: 13,
																				color: isDone
																					? theme.textTer
																					: theme.textSec,
																				textDecoration:
																					isDone
																						? 'line-through'
																						: 'none',
																				lineHeight: 1.5,
																			}}
																		>
																			{task}
																		</span>
																	</label>
																);
															}
														)}
													</div>

													{topic.cmds && topic.cmds.length > 0 && (
														<div style={{ marginBottom: 14 }}>
															<div
																style={{
																	fontSize: 11,
																	fontWeight: 500,
																	color: theme.textTer,
																	textTransform: 'uppercase',
																	letterSpacing: '0.7px',
																	marginBottom: 8,
																}}
															>
																Key commands — click to copy
															</div>
															{topic.cmds.map(function (cmd) {
																const isCopied = copied === cmd;
																return (
																	<div
																		key={cmd}
																		onClick={function () {
																			copyCommand(cmd);
																		}}
																		title="Click to copy"
																		style={{
																			display: 'flex',
																			alignItems:
																				'flex-start',
																			gap: 8,
																			background:
																				theme.codeBg,
																			border:
																				'0.5px solid ' +
																				theme.border,
																			borderRadius: 8,
																			padding: '7px 10px',
																			marginBottom: 4,
																			cursor: 'pointer',
																		}}
																	>
																		<span
																			style={{
																				flex: 1,
																				fontFamily:
																					theme.mono,
																				fontSize: 12,
																				whiteSpace:
																					'pre-wrap',
																				wordBreak:
																					'break-all',
																				lineHeight: 1.5,
																				color: isCopied
																					? '#16a34a'
																					: theme.codeColor,
																			}}
																		>
																			{cmd}
																		</span>
																		<span
																			style={{
																				fontSize: 10,
																				color: theme.textTer,
																				flexShrink: 0,
																				marginTop: 1,
																				minWidth: 28,
																			}}
																		>
																			{isCopied
																				? '✓'
																				: 'copy'}
																		</span>
																	</div>
																);
															})}
														</div>
													)}

													{topic.labs && topic.labs.length > 0 && (
														<div>
															<div
																style={{
																	fontSize: 11,
																	fontWeight: 500,
																	color: theme.textTer,
																	textTransform: 'uppercase',
																	letterSpacing: '0.7px',
																	marginBottom: 8,
																}}
															>
																Practice labs
															</div>
															{topic.labs.map(function (lab, index) {
																return (
																	<div
																		key={lab + index}
																		style={{
																			fontSize: 12,
																			color: theme.textSec,
																			marginBottom: 5,
																			paddingLeft: 10,
																			borderLeft:
																				'2px solid ' +
																				stats.color +
																				'55',
																			lineHeight: 1.5,
																		}}
																	>
																		{lab}
																	</div>
																);
															})}
														</div>
													)}
												</div>
											)}
										</div>
									);
								})}
						</div>
					);
				})}

			{tab === 'cheat' && (
				<div>
					{CHEATSHEET.map(function (group) {
						return (
							<div
								key={group.cat}
								style={{
									background: theme.bgSec,
									border: '0.5px solid ' + theme.border,
									borderRadius: 12,
									marginBottom: 10,
									overflow: 'hidden',
								}}
							>
								<div
									style={{
										padding: '10px 16px',
										borderBottom: '0.5px solid ' + theme.border,
									}}
								>
									<span
										style={{ fontSize: 13, fontWeight: 500, color: theme.text }}
									>
										{group.cat}
									</span>
								</div>
								<div style={{ padding: '10px 12px' }}>
									{group.items.map(function (item) {
										const isCopied = copied === item.cmd;
										return (
											<div key={item.cmd} style={{ marginBottom: 8 }}>
												<div
													onClick={function () {
														copyCommand(item.cmd);
													}}
													title="Click to copy"
													style={{
														display: 'flex',
														alignItems: 'flex-start',
														gap: 8,
														background: theme.codeBg,
														border: '0.5px solid ' + theme.border,
														borderRadius: 8,
														padding: '7px 10px',
														marginBottom: 4,
														cursor: 'pointer',
													}}
												>
													<span
														style={{
															flex: 1,
															fontFamily: theme.mono,
															fontSize: 12,
															whiteSpace: 'pre-wrap',
															wordBreak: 'break-all',
															lineHeight: 1.5,
															color: isCopied
																? '#16a34a'
																: theme.codeColor,
														}}
													>
														{item.cmd}
													</span>
													<span
														style={{
															fontSize: 10,
															color: theme.textTer,
															flexShrink: 0,
															marginTop: 1,
															minWidth: 28,
														}}
													>
														{isCopied ? '✓' : 'copy'}
													</span>
												</div>
												<div
													style={{
														fontSize: 11,
														color: theme.textTer,
														paddingLeft: 10,
														marginTop: 2,
													}}
												>
													{item.desc}
												</div>
											</div>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>
			)}

			{tab === 'tips' && (
				<div
					style={{
						background: theme.bgSec,
						border: '0.5px solid ' + theme.border,
						borderRadius: 12,
						marginBottom: 10,
						overflow: 'hidden',
					}}
				>
					<div
						style={{
							padding: '10px 16px',
							borderBottom: '0.5px solid ' + theme.border,
						}}
					>
						<span style={{ fontSize: 13, fontWeight: 500, color: theme.text }}>
							ADHD focus rules for CKA
						</span>
					</div>
					<div style={{ padding: '14px 16px' }}>
						{TIPS.map(function (tip, index) {
							return (
								<div
									key={tip}
									style={{
										display: 'flex',
										gap: 12,
										marginBottom: 14,
										paddingBottom: 14,
										borderBottom:
											index < TIPS.length - 1
												? '0.5px solid ' + theme.border
												: 'none',
									}}
								>
									<span
										style={{
											fontSize: 13,
											fontWeight: 500,
											color: theme.textTer,
											flexShrink: 0,
											minWidth: 20,
										}}
									>
										{index + 1}.
									</span>
									<span
										style={{
											fontSize: 13,
											color: theme.textSec,
											lineHeight: 1.6,
										}}
									>
										{tip}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			)}

			<div
				style={{
					marginTop: 12,
					padding: '12px 16px',
					background: theme.bgSec,
					borderRadius: 8,
					border: '0.5px solid ' + theme.border,
				}}
			>
				<p style={{ margin: 0, fontSize: 12, color: theme.textTer, lineHeight: 1.6 }}>
					<strong style={{ color: theme.textSec }}>Useful resources:</strong>{' '}
					<a
						href="https://killercoda.com/killer-shell-cka"
						target="_blank"
						rel="noreferrer"
						style={{ color: theme.linkColor }}
					>
						Killer Coda (free labs)
					</a>{' '}
					·{' '}
					<a
						href="https://killer.sh"
						target="_blank"
						rel="noreferrer"
						style={{ color: theme.linkColor }}
					>
						killer.sh (2 free sessions with exam)
					</a>{' '}
					·{' '}
					<a
						href="https://kubernetes.io/docs/reference/kubectl/cheatsheet/"
						target="_blank"
						rel="noreferrer"
						style={{ color: theme.linkColor }}
					>
						kubectl cheat sheet
					</a>{' '}
					·{' '}
					<a
						href="https://pomofocus.io"
						target="_blank"
						rel="noreferrer"
						style={{ color: theme.linkColor }}
					>
						Pomofocus (Pomodoro timer)
					</a>
				</p>
			</div>
		</div>
	);
}

createRoot(document.getElementById('root')).render(<App />);
