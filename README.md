# CKA Learning Tracker

A lightweight static study site for the Certified Kubernetes Administrator exam.

It includes:

- A study tracker split into the 9 CKA domains.
- A practice task page with hands-on exam-style exercises.
- Offline-first usage with browser-based progress persistence helpers.
- A build step that bundles React into the final published files.

## Project Structure

- `src/`: source HTML, CSS, JS, and data files.
  - `404.html`: custom not-found page served by GitHub Pages.
  - `robots.txt`: crawler policy (allow all).
- `dist/`: generated static output ready for GitHub Pages.
- `build.mjs`: build script that copies assets and bundles the React tracker.
- `.editorconfig`: enforces tab indentation (4-wide) and LF line endings across editors.
- `SECURITY.md`: security policy and vulnerability reporting guidance.

## Local Usage

Build the site:

```bash
npm install
npm run build
```

Then serve the generated `dist/` directory. For example:

```powershell
python -m http.server 8000 --directory dist
```

Then open `http://localhost:8000/`.

## Quality Checks

This repository uses a small Node.js toolchain for formatting, linting, and bundling.

Install dependencies:

```bash
npm install
```

Run all checks:

```bash
npm run format:check
npm run lint
npm run build
```

Auto-format supported files:

```bash
npm run format
```

## GitHub Actions

The repository includes:

- `CI`: runs formatting and linting on pushes and pull requests.
- `Deploy Pages`: builds the site and publishes the generated `dist` directory to GitHub Pages.
- `Dependabot`: keeps npm and GitHub Actions dependencies up to date.

## GitHub Pages

The Pages workflow is ready for a static site deployment from the built output.

To enable it in GitHub:

1. Push this repository to GitHub.
2. In repository settings, open the Pages section.
3. Ensure the source is set to GitHub Actions.
4. Push to `main` to trigger deployment.

If the repository is published as `bartekmp/cka-learning-tracker`, the site URL will typically be:

```text
https://bartekmp.github.io/cka-learning-tracker/
```

## License

This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE).