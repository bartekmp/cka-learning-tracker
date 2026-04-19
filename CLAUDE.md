# CKA Helper — Agent Notes

Project-specific facts and guidelines for AI coding agents working in this repo.

## What this project is

A **fully static, local-only** study site for the Certified Kubernetes Administrator (CKA) exam, built with ADHD-friendly UX in mind. It has two main pages:

- **Study Tracker** (`cka-tracker.html`) — React (bundled via esbuild) + localStorage persistence. Covers the 9 CKA exam domains with topics, cheatsheet commands, ADHD tips, and progress tracking.
- **Practice Tasks** (`cka-practice-tasks.html`) — Vanilla JS IIFE. Step-by-step exam-style tasks with copy-ready commands, hints, and difficulty ratings.

There is **no backend, no server, no API, no authentication**. All state lives in `localStorage`. Never add a server-side component, database, or external API dependency.

## ADHD-first design principles

This is the most important product constraint. Every UX decision should reduce cognitive load and support the way ADHD brains actually work — not how a neurotypical learner is expected to work.

**Core problems this project solves:**

- Passive video courses are hard to follow when attention fades; this site replaces them with small, active, checkable tasks.
- Long study sessions cause burnout; the Pomodoro timer enforces structured breaks.
- Losing track of "where was I?" is a major ADHD blocker; the Continue / Next incomplete button always gives an instant re-entry point.
- Feeling overwhelmed by a huge syllabus; focus mode narrows the view to one domain at a time.
- Forgetting to save progress; autosave removes any action required from the user.

**Guidelines for new features and content:**

- **Break things into the smallest possible steps.** Each task step should be one concrete action with a copy-ready command. Never ask the user to figure out intermediate steps.
- **Always show where to go next.** Any flow that could leave the user staring at the screen without knowing what to do has failed.
- **Avoid walls of text.** Use short sentences, bullet points, and visual hierarchy. Dense paragraphs do not belong in UI copy.
- **Reward progress visibly.** Checkboxes, completion percentages, session dots on the Pomodoro — small signals of progress matter.
- **Do not add friction.** Features that require configuration, setup, or explanation before they can be used are a last resort. Defaults should be immediately useful.
- **Preserve context across pages.** State must survive navigation. Never wipe progress without explicit user action.
- **Keyboard shortcuts are a first-class feature.** Users who hyperfocus on the keyboard should not need the mouse.

When in doubt, ask: _does this reduce the number of decisions the user has to make?_ If yes, it belongs. If it adds decisions, reconsider.

## Repository layout

```text
src/                   source files (edit these)
  css/
    shared.css         styles shared across all pages (incl. Pomodoro widget)
    index.css          landing page styles
    tracker.css        tracker page styles
    tasks.css          practice tasks page styles
  data/
    tracker-data.js    all study tracker content (topics, commands, labs, tips)
    tasks-data.js      all practice task content (tasks, steps, hints, commands)
  js/
    tracker.js         React component tree for the tracker page (JSX in a .js file)
    tasks.js           vanilla JS IIFE for the practice tasks page
    theme.js           dark/light mode toggle, shared across all pages
    autosave.js        localStorage-based autosave helper, shared across all pages
    pomodoro.js        floating Pomodoro timer widget, shared across all pages
dist/                  build output — do NOT edit directly
build.mjs              esbuild-based build script
```

## Development workflow

### Install

```bash
npm install
```

### Build

```bash
npm run build
```

Output goes to `dist/`. The build:

1. Copies all `src/` assets verbatim to `dist/`.
2. Bundles `src/js/tracker.js` (JSX) with esbuild into `dist/js/tracker.js`.
3. Injects a cache-busting query string (`?v=<version>`) on `<script>` and `<link>` tags in the HTML files.

### Serve locally

```powershell
python -m http.server 8000 --directory dist
```

Then open `http://localhost:8000/`. **Always serve from `dist/`, never from `src/` directly.**

### Format

```bash
npm run format          # auto-fix all supported files
npm run format:check    # check only (used in CI)
```

Prettier handles HTML, CSS, JS, JSON, Markdown, and YAML.

### Lint

```bash
npm run lint            # runs all linters in sequence
npm run lint:js         # ESLint — build.mjs and src/**/*.js
npm run lint:css        # Stylelint — src/css/**/*.css
npm run lint:html       # HTMLHint — src/*.html
npm run lint:md         # markdownlint-cli2 — all *.md files
```

**Always run `npm run lint && npm run build` after editing source files to catch errors before committing.**

### Code style rules (enforced)

- **Indentation**: tabs, 4-wide (`.editorconfig`)
- **Line endings**: LF
- **Final newline**: required on all files
- **Trailing whitespace**: stripped (except Markdown)
- No unused variables (`no-unused-vars` ESLint rule — prefix with `_` if intentionally unused)

## Key technical constraints

### tracker.js is JSX inside a .js file

esbuild is configured with `loader: { '.js': 'jsx' }`. Do not rename tracker.js to .jsx — the HTML references `tracker.js` and the build output matches that name.

### No external runtime dependencies

React and ReactDOM are bundled by esbuild from `node_modules`. All `devDependencies` in `package.json` are build/lint tools only. Nothing is loaded from a CDN at runtime. No fetch calls, no XHR, no WebSockets.

### localStorage is the only persistence layer

Progress, theme preference, Pomodoro timer state, and any other user data must go in `localStorage`. Keys in use:

- `cka-tracker` — study tracker progress
- `cka-tasks` — practice task completion state
- `cka-theme` — light/dark preference
- `cka-pomodoro` — Pomodoro timer state and custom durations

### Pomodoro widget (pomodoro.js)

Vanilla JS IIFE that self-appends to `<body>` on every page. State shape:

```js
{ phase, sessions, running, endsAt, remaining, customMins: { work, shortBreak, longBreak } }
```

`customMins` values are between 1 and 99 minutes. Default: 25 / 5 / 15. Reset restores these defaults.

## Content maintenance — keeping content up to date

### Kubernetes version

The CKA exam currently targets **Kubernetes 1.35** (verify at [training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/](https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/) and [kubernetes.io/releases/](https://kubernetes.io/releases/)). When a new minor version becomes the exam target:

- Review `src/data/tracker-data.js` and `src/data/tasks-data.js` for any commands, API versions, or feature descriptions that changed.
- Pay particular attention to: deprecated `kubectl` flags, new default container runtimes, changes to kubeadm bootstrap flow, Gateway API vs Ingress status, CSI migration completions.
- Update the version reference in `src/js/tracker.js` (the info banner mentions the K8s version and exam curriculum version).

### CKA exam curriculum

The Linux Foundation publishes the official CKA curriculum at [github.com/cncf/curriculum](https://github.com/cncf/curriculum). Domain weightings and topic inclusions change periodically. When they do:

- Cross-check all 9 sections in `tracker-data.js` against the new curriculum PDF.
- Add/remove/rename topics as needed, keeping `id` values stable (they are used as `localStorage` keys).
- Update time estimates (`schedule` field) if domain weightings change significantly.

### Practice tasks

Tasks in `tasks-data.js` should reflect real exam scenarios. When reviewing:

- Ensure all `code` snippets use the current stable API versions (e.g. `apps/v1` for Deployments, not `extensions/v1beta1`).
- Check that referenced resource kinds (`PodDisruptionBudget`, `HorizontalPodAutoscaler`, etc.) match the GA API for the current exam K8s version.
- Difficulty ratings: `easy` / `medium` / `hard`.

## Pages overview

| File                      | JS                                                     | Description                              |
| ------------------------- | ------------------------------------------------------ | ---------------------------------------- |
| `index.html`              | `theme.js`                                             | Landing page, links to tracker and tasks |
| `cka-tracker.html`        | `theme.js`, `autosave.js`, `tracker.js`, `pomodoro.js` | Study tracker                            |
| `cka-practice-tasks.html` | `theme.js`, `autosave.js`, `tasks.js`, `pomodoro.js`   | Practice tasks                           |
| `404.html`                | —                                                      | Custom GitHub Pages 404                  |

## Deployment

GitHub Actions workflows in `.github/workflows/`:

- **CI**: format check + lint on push/PR
- **Deploy Pages**: build → publish `dist/` to GitHub Pages

Live site: `https://bartekmp.github.io/cka-learning-tracker/`

Use `npm ci` (not `npm install`) in CI/CD — `package-lock.json` is committed.
