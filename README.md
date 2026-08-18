# Cyber Essentials Self-Assessment

## What this is

A fully static, offline-first self-assessment tool for the
[IASME Cyber Essentials](https://iasme.co.uk/cyber-essentials/) question
set (Danzell / 2026 question set, v16.3, in force from April 2026) —
all 107 questions across Organisation, Scope of Assessment, Insurance,
Firewalls, Secure Configuration, Security Update Management, User Access
Control and Malware Protection, plus the final Attestation, with the
official question wording and guidance, question-by-question compliance
flagging against the stated CE Requirements, and the question set's own
branching/skip logic.

It's inspired by [caf-self-assessment](https://github.com/Bad-Request/caf-self-assessment),
a similar tool for the NCSC Cyber Assessment Framework, and follows the
same architecture: no server-side component at all, no build step, no
database. Plain HTML/CSS/JS, served as a folder of static files, installable
as an offline Progressive Web App.

See [CHANGELOG.md](CHANGELOG.md) for release history (this project follows
[Semantic Versioning](https://semver.org/)).

## Unofficial tool — important

This is **not** the official IASME/NCSC Cyber Essentials application
process, is not affiliated with IASME or NCSC, and does not submit
anything anywhere. It's a self-assessment aid to help you prepare your
answers, understand the requirements, and spot likely compliance gaps
*before* you complete the real application on the
[IASME Pervade portal](https://iasme.co.uk/cyber-essentials/). Always refer
to the official question set and the
[Cyber Essentials Requirements for IT Infrastructure](https://www.ncsc.gov.uk/files/cyber-essentials-requirements-for-it-infrastructure-v3-3.pdf)
document for the definitive requirements — this tool's compliance flags are
indicative only, not a certification decision.

## Attribution

The question text, guidance, and control requirements reproduced in
`assets/data.json` are taken from the IASME Cyber Essentials Danzell
question set (`.xlsx`, v16.3), published by IASME at
<https://iasme.co.uk/cyber-essentials/questions/danzell/xlsx>. All credit
for that content belongs to IASME and NCSC. This project is an independent,
unofficial companion tool and claims no ownership over that content.

## Data handling — important

Every assessment you create — assessment name, answers, notes — is saved
entirely in your browser's `localStorage`. This means:

- Assessments are tied to the browser/device you created them on.
- Clearing browser data for this site/folder will delete them.
- Use **"Export (.json)"** regularly to back up an assessment or move it
  between browsers/devices, and **"Import (.json)"** to load it elsewhere.

## How to run it

Nothing to install, but the app logic loads as native ES modules, which
browsers only allow over `http(s)://` — **opening `index.html` directly via
a `file://` URL will not work**. Serve the folder instead:

1. Any static file server, e.g.:
   ```
   python3 -m http.server 8000
   ```
   then open http://localhost:8000, or
2. Upload the whole folder to any static host — GitHub Pages, S3, a shared
   network drive, an internal web server, whatever you've already got.
   There is no database and no server-side code required.

## File layout

| File | Purpose |
|---|---|
| `index.html` | The app shell. |
| `manifest.webmanifest` | Web app manifest (name, icons, colours) that makes the app installable. |
| `sw.js` | Service worker — caches the app shell on first visit so the app works offline afterwards. Bump `CACHE_VERSION` inside it whenever a cached file's contents change. |
| `assets/icons/` | App icons for the manifest/home screen. |
| `assets/data.json` | Source of truth for the Cyber Essentials question set (curated from the official `.xlsx`). See [docs/data-schema.md](docs/data-schema.md). Edit this, not `data.js`. |
| `assets/data.js` | Generated from `assets/data.json` by `tools/build-data.js` — a plain JS variable, `window.CE_DATASET`. Loaded as a classic script, before the module entry point. |
| `docs/data-schema.md` | Documents the `assets/data.json` structure and the invariants a reviewer should check after any update. |
| `tools/build-data.js` | Regenerates `assets/data.js` from `assets/data.json`. Run after every edit to the dataset. |
| `assets/style.css` | Styling. |
| `assets/js/app.js` | Entry point (`<script type="module">`) — wires the other modules together and handles the cross-cutting UI (new/delete assessment, JSON import/export, print). |
| `assets/js/model.js` | Pure domain logic: branching/visibility rules, per-question compliance status, per-section and overall summaries. No DOM, no storage. |
| `assets/js/storage.js` | `localStorage` read/write for assessments. |
| `assets/js/assessments.js` | Assessment records: in-memory list, current selection, and the sidebar list of saved assessments. |
| `assets/js/framework.js` | Builds the section/question tree, renders each answer control (Yes/No, free text, single/multi-choice, lettered options), and applies branching visibility. |
| `assets/js/dashboard.js` | Progress bar, compliance summary and per-section breakdown. |
| `assets/js/ui-shell.js` | Chrome with no domain knowledge: toast, the generic confirm dialog, sidebar collapse, and theme preference. |
| `assets/js/dom.js` | The single set of DOM element references shared by every module. |
| `assets/js/utils.js` | `uid`/`nowIso`/`debounce` — small helpers with no dependencies. |
| `assets/js/download.js` | Shared "save an object as a downloaded `.json` file" helper. |

## Features

- All 107 questions from the official question set, with guidance,
  embedded "CE Requirement" text, and further-guidance links, grouped by
  control theme (and sub-theme, e.g. Administrative Accounts within User
  Access Control).
- The question set's own conditional/branching logic — questions that only
  apply based on an earlier answer (e.g. legal entity details, only shown
  if you said you have more than one) are hidden until relevant.
- A compliance flag per question, where the question set states an explicit
  CE Requirement with an implied compliant answer (e.g. "block unauthenticated
  inbound connections by default" — answering "yes, we allow them" is
  flagged). Questions the official document calls out as an automatic fail
  (e.g. missing critical security updates within 14 days) are marked
  accordingly.
- Dashboard: overall completion progress, a list of any flagged
  non-compliant answers (with a jump link to each), and a per-section
  progress breakdown.
- Multiple named, saved assessments (e.g. one per organisation/renewal).
- Export/import assessments as JSON.
- Print / save as PDF (use your browser's print dialog).
- Installable, offline-capable Progressive Web App.

## A note on the compliance flags

Cyber Essentials is a pass/fail scheme, not a percentage score — this tool
does not attempt to compute an overall "score". Instead, it flags
individual answers that appear to fall short of an explicit requirement
stated in the question set, so you can address them before applying. Many
questions (organisation details, scope descriptions, free-text process
explanations) have no single "correct" answer and are never flagged — they
exist to document your setup for the human assessor. Treat the flags as a
useful checklist, not a certification verdict; the actual assessment is
carried out by an accredited Cyber Essentials assessor via IASME.

## Updating the question set

If IASME publish a revised question set, re-run the extraction against the
new `.xlsx` and hand-curate the result into `assets/data.json` following
[docs/data-schema.md](docs/data-schema.md) — question numbering, wording,
branching logic and compliant-answer direction can all change between
versions, so review every change against the previous `data.json` by hand.
After editing `assets/data.json`, regenerate `assets/data.js` and commit
both files together:

```
node tools/build-data.js
```
