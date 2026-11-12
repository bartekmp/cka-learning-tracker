// Streak widget — daily goal + weekly streak, shared across pages.
// Depends on: js/autosave.js (activity log). Renders into #streak-widget.
//
// The streak counts WEEKS, not days: a week counts once WEEK_GOAL days in it
// had activity. A missed day therefore never breaks anything — a strict daily
// chain that snaps once tends to end the habit instead of building it.

const WEEK_GOAL = 4;
const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function streakAddDays(date, days) {
	const copy = new Date(date);
	copy.setDate(copy.getDate() + days);
	return copy;
}

// Monday of the week containing `date`, at noon so DST shifts cannot move it.
function streakWeekStart(date) {
	const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
	const daysSinceMonday = (monday.getDay() + 6) % 7;
	return streakAddDays(monday, -daysSinceMonday);
}

function streakActiveDays(activity, weekStart) {
	let active = 0;
	for (let i = 0; i < 7; i++) {
		if (activity[activityDayKey(streakAddDays(weekStart, i))] > 0) active++;
	}
	return active;
}

// Consecutive weeks that hit the goal. The current week counts once it is
// hit, and does not break the streak while it is still in progress.
function streakWeeks(activity, today) {
	let week = streakWeekStart(today);
	let streak = streakActiveDays(activity, week) >= WEEK_GOAL ? 1 : 0;
	for (;;) {
		week = streakAddDays(week, -7);
		if (streakActiveDays(activity, week) < WEEK_GOAL) break;
		streak++;
	}
	return streak;
}

function streakEl(tag, className, text) {
	const el = document.createElement(tag);
	el.className = className;
	if (text) el.textContent = text;
	return el;
}

function renderStreak() {
	const root = document.getElementById('streak-widget');
	if (!root) return;

	const activity = activityRead();
	const today = new Date();
	const todayKey = activityDayKey(today);
	const todayCount = activity[todayKey] || 0;
	const weekStart = streakWeekStart(today);
	const activeDays = streakActiveDays(activity, weekStart);
	const weeks = streakWeeks(activity, today);

	root.textContent = '';
	root.classList.toggle('today-done', todayCount > 0);

	const headline =
		weeks > 0
			? `🔥 ${weeks}-week streak`
			: `🌱 Study ${WEEK_GOAL} days this week to start a streak`;
	root.appendChild(streakEl('div', 'streak-headline', headline));

	const todayText =
		todayCount > 0
			? `✓ Today: ${todayCount} done`
			: 'Today: tick off 1 thing — that is the goal';
	root.appendChild(streakEl('div', 'streak-today', todayText));

	const week = streakEl('div', 'streak-week');
	for (let i = 0; i < 7; i++) {
		const key = activityDayKey(streakAddDays(weekStart, i));
		let cls = 'streak-day';
		if (activity[key] > 0) cls += ' active';
		if (key === todayKey) cls += ' today';
		week.appendChild(streakEl('span', cls, DAY_LETTERS[i]));
	}
	const goalMet = activeDays >= WEEK_GOAL;
	const weekLabel = goalMet
		? `✓ ${activeDays} days — week goal hit`
		: `${activeDays} / ${WEEK_GOAL} days this week`;
	week.appendChild(streakEl('span', 'streak-week-label' + (goalMet ? ' met' : ''), weekLabel));
	root.appendChild(week);
}

renderStreak();
