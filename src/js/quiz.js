// CKA Quiz — page logic
// Depends on: js/autosave.js (activityBump), data/exam-domains.js, data/quiz-data*.js

const QUIZ_KEY = 'cka-quiz';
const ROUND_SIZE = 5;

// { questionId: true | false } — result of the last time it was answered.
let quizResults = {};
let quizDomain = 'all';
let round = null; // { items, index, correct, missed, answered }

function quizLoad() {
	try {
		quizResults = JSON.parse(localStorage.getItem(QUIZ_KEY)) || {};
	} catch {
		quizResults = {};
	}
}

function quizSave() {
	try {
		localStorage.setItem(QUIZ_KEY, JSON.stringify(quizResults));
	} catch {
		/* storage unavailable — the quiz still works, it just forgets */
	}
}

function shuffle(list) {
	const copy = list.slice();
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
}

// Questions you missed come first, then ones you have not seen, then the rest.
function pickRound() {
	const pool = QUIZ.filter((q) => quizDomain === 'all' || q.domain === quizDomain);
	const missed = shuffle(pool.filter((q) => quizResults[q.id] === false));
	const fresh = shuffle(pool.filter((q) => quizResults[q.id] === undefined));
	const known = shuffle(pool.filter((q) => quizResults[q.id] === true));
	return missed
		.concat(fresh, known)
		.slice(0, ROUND_SIZE)
		.map((q) => ({
			question: q,
			// Shuffle the options on screen so the answer is not always in the same spot.
			options: shuffle(q.options.map((text, i) => ({ text, correct: i === q.answer }))),
		}));
}

function domainTitle(id) {
	const domain = EXAM_DOMAINS.find((d) => d.id === id);
	return domain ? domain.title : id;
}

function quizEl(tag, className, text) {
	const el = document.createElement(tag);
	if (className) el.className = className;
	if (text !== undefined) el.textContent = text;
	return el;
}

// ── Code formatting ──────────────────────────────────────────────────────────
// Text may contain `backtick spans`. On top of that, obvious code is wrapped
// automatically: CLI tool names, flags, paths, camelCase fields, dotted names,
// key=value pairs and <placeholders>.
const QUIZ_TOOLS =
	'kubectl|kubeadm|helm|etcdctl|etcdutl|crictl|systemctl|journalctl|swapoff|nslookup';
const AUTO_CODE = new RegExp(
	[
		'\\b(?:' + QUIZ_TOOLS + ')\\b',
		'(?<![\\w-])--?[a-zA-Z][\\w-]*(?:=[^\\s,;)]+)?',
		'(?<![\\w/.])~?/[\\w.-]+(?:/[\\w.-]+)*',
		'\\b[a-z]+(?:[A-Z][a-z0-9]*)+\\b',
		'\\b[a-z][\\w-]*(?:\\.[a-z][\\w-]*)+(?:/[\\w.-]+)*',
		'[\\w.-]+=[\\w./:-]+',
		'<[\\w-]+>',
	].join('|'),
	'g'
);

function quizRich(parent, text) {
	text.split('`').forEach((part, i) => {
		if (i % 2 === 1) {
			parent.appendChild(quizEl('code', '', part));
			return;
		}
		let last = 0;
		for (const match of part.matchAll(AUTO_CODE)) {
			// A sentence-ending dot or comma is not part of the code.
			const code = match[0].replace(/[.,;:]+$/, '');
			if (!code) continue;
			parent.appendChild(document.createTextNode(part.slice(last, match.index)));
			parent.appendChild(quizEl('code', '', code));
			last = match.index + code.length;
		}
		parent.appendChild(document.createTextNode(part.slice(last)));
	});
}

// An answer option that IS a command, flag, path, field or value is shown
// entirely as code. Anything with its own `backticks` is left to quizRich.
function quizIsCode(text) {
	if (text.includes('`')) return false;
	if (new RegExp('^(' + QUIZ_TOOLS + ')\\b').test(text)) return true;
	if (/^(-|\/|~\/)/.test(text)) return true;
	if (/^[A-Za-z][\w.-]*\s?[:=]\s?\S/.test(text)) return true;
	if (/^[\d][\d.\-/:]*$/.test(text)) return true;
	if (/^[A-Z][A-Z0-9_]{3,}$/.test(text) || /^(CMD|RUN)$/.test(text)) return true;
	return /^\S+$/.test(text) && (/[./=_]/.test(text) || /^[a-z]+[A-Z]/.test(text));
}

function quizOptionText(parent, text) {
	if (quizIsCode(text)) parent.appendChild(quizEl('code', '', text));
	else quizRich(parent, text);
}

// ── Start screen ─────────────────────────────────────────────────────────────

function renderStart() {
	const root = document.getElementById('quiz');
	root.textContent = '';

	const pool = QUIZ.filter((q) => quizDomain === 'all' || q.domain === quizDomain);
	const known = pool.filter((q) => quizResults[q.id] === true).length;
	const missed = pool.filter((q) => quizResults[q.id] === false).length;

	const card = quizEl('div', 'quiz-card');
	card.appendChild(quizEl('div', 'quiz-big', `${ROUND_SIZE} quick questions`));
	card.appendChild(quizEl('div', 'quiz-sub', 'About 2 minutes. Answer, see why, move on.'));

	const chips = quizEl('div', 'quiz-chips');
	[{ id: 'all', title: 'All domains' }].concat(EXAM_DOMAINS).forEach((d) => {
		const chip = quizEl(
			'button',
			'quiz-chip' + (d.id === quizDomain ? ' active' : ''),
			d.title
		);
		chip.type = 'button';
		chip.onclick = () => {
			quizDomain = d.id;
			renderStart();
		};
		chips.appendChild(chip);
	});
	card.appendChild(chips);

	const stats = `✓ ${known} known · ${missed} to revisit · ${pool.length - known - missed} new`;
	card.appendChild(quizEl('div', 'quiz-stats', stats));

	const start = quizEl('button', 'quiz-primary', '▶ Start');
	start.type = 'button';
	start.onclick = startRound;
	card.appendChild(start);
	root.appendChild(card);
	start.focus();
}

// ── Question screen ──────────────────────────────────────────────────────────

function startRound() {
	round = { items: pickRound(), index: 0, correct: 0, missed: [], answered: false };
	renderQuestion();
}

function renderQuestion() {
	const root = document.getElementById('quiz');
	root.textContent = '';
	const item = round.items[round.index];

	const card = quizEl('div', 'quiz-card');
	const head = quizEl('div', 'quiz-head');
	head.appendChild(
		quizEl('span', 'quiz-count', `Question ${round.index + 1} / ${round.items.length}`)
	);
	head.appendChild(quizEl('span', 'quiz-domain', domainTitle(item.question.domain)));
	card.appendChild(head);

	const bar = quizEl('div', 'quiz-bar');
	const fill = quizEl('div', 'quiz-bar-fill');
	fill.style.width = (round.index / round.items.length) * 100 + '%';
	bar.appendChild(fill);
	card.appendChild(bar);

	const questionEl = quizEl('div', 'quiz-question');
	quizRich(questionEl, item.question.q);
	card.appendChild(questionEl);
	if (item.question.code) card.appendChild(quizEl('pre', 'quiz-code', item.question.code));

	const list = quizEl('div', 'quiz-options');
	item.options.forEach((option, i) => {
		const btn = quizEl('button', 'quiz-option');
		btn.type = 'button';
		btn.appendChild(quizEl('span', 'quiz-key', 'ABCD'[i]));
		const label = quizEl('span', 'quiz-text');
		quizOptionText(label, option.text);
		btn.appendChild(label);
		btn.onclick = () => answer(i);
		list.appendChild(btn);
	});
	card.appendChild(list);

	card.appendChild(quizEl('div', 'quiz-feedback'));
	root.appendChild(card);
	round.answered = false;
}

function answer(optionIndex) {
	if (round.answered) return;
	round.answered = true;

	const item = round.items[round.index];
	const chosen = item.options[optionIndex];
	quizResults[item.question.id] = chosen.correct;
	quizSave();
	if (chosen.correct) round.correct++;
	else round.missed.push(item);

	const buttons = document.querySelectorAll('.quiz-option');
	buttons.forEach((btn, i) => {
		btn.disabled = true;
		if (item.options[i].correct) btn.classList.add('correct');
		else if (i === optionIndex) btn.classList.add('wrong');
	});

	const feedback = document.querySelector('.quiz-feedback');
	feedback.classList.add(chosen.correct ? 'ok' : 'bad');
	feedback.appendChild(quizEl('strong', '', chosen.correct ? '✓ Correct. ' : '✗ Not quite. '));
	quizRich(feedback, item.question.why);

	const last = round.index === round.items.length - 1;
	const next = quizEl('button', 'quiz-primary', last ? 'See result ▸' : 'Next ▸');
	next.type = 'button';
	next.onclick = nextQuestion;
	feedback.appendChild(next);
	next.focus();
}

function nextQuestion() {
	if (round.index < round.items.length - 1) {
		round.index++;
		renderQuestion();
	} else {
		renderResult();
	}
}

// ── Result screen ────────────────────────────────────────────────────────────

function renderResult() {
	const root = document.getElementById('quiz');
	root.textContent = '';
	// Finishing a round counts as studying today, so it feeds the streak.
	activityBump(1);

	const total = round.items.length;
	const card = quizEl('div', 'quiz-card');
	card.appendChild(quizEl('div', 'quiz-big', `${round.correct} / ${total}`));
	const message =
		round.correct === total
			? '🎉 Perfect round.'
			: round.correct >= total - 2
				? '👍 Solid. The missed ones come back next round.'
				: '🌱 Good start. The missed ones come back next round.';
	card.appendChild(quizEl('div', 'quiz-sub', message));

	if (round.missed.length) {
		const missed = quizEl('div', 'quiz-missed');
		missed.appendChild(quizEl('div', 'quiz-missed-title', 'To revisit'));
		round.missed.forEach((item) => {
			const correct = item.options.find((o) => o.correct);
			const row = quizEl('div', 'quiz-missed-row');
			const questionRow = quizEl('div', 'quiz-missed-q');
			quizRich(questionRow, item.question.q);
			const answerRow = quizEl('div', 'quiz-missed-a', '→ ');
			quizOptionText(answerRow, correct.text);
			row.append(questionRow, answerRow);
			missed.appendChild(row);
		});
		card.appendChild(missed);
	}

	const again = quizEl('button', 'quiz-primary', '▶ Another 5');
	again.type = 'button';
	again.onclick = startRound;
	const back = quizEl('button', 'quiz-secondary', 'Change domain');
	back.type = 'button';
	back.onclick = renderStart;
	const actions = quizEl('div', 'quiz-actions');
	actions.append(again, back);
	card.appendChild(actions);
	root.appendChild(card);
	again.focus();
}

// ── Keyboard: A–D or 1–4 to answer, Enter / Space to continue ────────────────

document.addEventListener('keydown', (e) => {
	if (e.ctrlKey || e.metaKey || e.altKey || !round) return;
	const key = e.key.toLowerCase();
	const index = 'abcd1234'.indexOf(key) % 4;
	if (key.length === 1 && 'abcd1234'.includes(key) && !round.answered) {
		if (document.querySelectorAll('.quiz-option')[index]) answer(index);
	}
});

quizLoad();
renderStart();
