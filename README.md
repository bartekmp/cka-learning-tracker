# CKA Learning Tracker

**Live site: <https://bartekmp.github.io/cka-learning-tracker/>**

A lightweight static study site for the Certified Kubernetes Administrator exam — built specifically with **neurodivergent learners** in mind, particularly people with **ADHD**.

The core idea: passive video courses are hard to follow when your brain needs active engagement. This toolkit breaks CKA preparation into small, concrete chunks — checkable topics, hands-on practice tasks tied directly to each concept, and copy-ready commands — so you always know exactly what to do next and can feel progress without losing the thread.

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
- `server/`, `Dockerfile`, `compose.yaml`: the optional server-backed variant (see below).
- `.editorconfig`: enforces tab indentation (4-wide) and LF line endings across editors.
- `SECURITY.md`: security policy and vulnerability reporting guidance.

## Choose a deployment

Pick one before you deploy. The static site is the official version; the server-backed one is an optional extra for self-hosting.

|             | Static (official)                  | Server-backed (optional)                   |
| ----------- | ---------------------------------- | ------------------------------------------ |
| You get     | The whole app, progress in browser | The same, plus login and cross-device sync |
| You need    | Any web server                     | Docker, and an HTTPS reverse proxy         |
| Deploy with | `npm run build`, then copy `dist/` | `docker compose up -d --build`             |
| Network use | None — no requests are made        | Only to your own server                    |

### Static

```bash
npm install
npm run build
cp -r dist/. /var/www/your-site/
```

That is all. Nothing else to configure.

### Server-backed

1. Copy the example config and set your credentials:

    ```bash
    cp .env.example .env
    ```

2. Start it:

    ```bash
    docker compose up -d --build
    ```

3. Point your HTTPS reverse proxy at `127.0.0.1:8080`.

Things to know:

- **One account.** `CKA_USER` / `CKA_PASSWORD` in `.env` are the only login. There is no registration and no email.
- **HTTPS is your proxy's job.** The app speaks plain HTTP on localhost. The proxy must send `X-Forwarded-Proto` and `X-Forwarded-For`.
- **Signing in is optional.** Signed out, the app behaves exactly like the static site.
- **Data** lives in the `cka-data` volume as one JSON file. Back it up by copying that volume.
- **Without Docker:** Node 22+ is the only requirement. Run `npm ci && npm run build:server`, then `CKA_USER=… CKA_PASSWORD=… npm run serve`.

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

## Practice Cluster

The practice tasks assume a real two-node Kubernetes cluster (one control-plane,
one worker). The [`cluster/`](cluster/README.md) directory provides a one-command,
cross-platform (Linux / macOS / Windows) setup built on [kind](https://kind.sigs.k8s.io/)
that installs any missing dependencies, creates the cluster with the addons the
tasks need (Calico for NetworkPolicy, metrics-server, ingress-nginx), and resets
to a clean state in seconds:

```bash
npm run cluster:up       # create the cluster + addons
npm run cluster:status   # show nodes and pods
npm run cluster:reset    # wipe and rebuild a clean cluster
npm run cluster:down     # delete the cluster
```

Docker must be installed and running first. See [`cluster/README.md`](cluster/README.md)
for details, configuration, and the two tasks better practised on Killercoda.

Website-only users (no clone) can get the same toolkit from the
[landing page](https://bartekmp.github.io/cka-learning-tracker/#practice-cluster) —
either a per-platform zip download, or a one-liner:

```bash
# Linux / macOS
curl -fsSL https://bartekmp.github.io/cka-learning-tracker/cluster/get.sh | bash
```

```powershell
# Windows
irm https://bartekmp.github.io/cka-learning-tracker/cluster/get.ps1 | iex
```

The build publishes the scripts and zips into `dist/cluster/`, so they ship with
the static site automatically.

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

## Notable Learning Resource

The [Certified Kubernetes Administrator (CKA) with Practice Tests](https://www.udemy.com/course/certified-kubernetes-administrator-with-practice-tests/) course by **Mumshad Mannambeth** and **KodeKloud** on Udemy is a highly regarded resource for CKA preparation. It covers all exam domains — core concepts, scheduling, storage, networking, security, and more — with over 26 hours of video and hands-on browser-based labs that require no local setup.

## License

This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE).

## Built with AI assistance

This project was built with the help of **[Claude](https://claude.ai/)**.
