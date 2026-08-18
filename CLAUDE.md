# Notes for AI agents working on this repo

This is a fully static app (see README.md) that follows Semantic Versioning
with a hand-maintained `CHANGELOG.md` and a version string shown in the UI.
Both are easy to forget mid-task — check this list before opening a PR.

## Every change that a user of the app would notice

- [ ] Bump the version in **both** places — they must match:
  - `CHANGELOG.md` — add a new `## [x.y.z] - YYYY-MM-DD` section at the top
    (above the previous latest release), following [Keep a
    Changelog](https://keepachangelog.com/en/1.1.0/): `Added` / `Changed` /
    `Fixed` / `Removed` subsections, newest first.
  - `index.html` — the `<p class="version-tag">vX.Y.Z</p>` line.
- [ ] If the change touches any file listed in `sw.js`'s `APP_SHELL` array
  (or adds/removes one), bump `CACHE_VERSION` in `sw.js` too — otherwise
  users who installed the app offline keep serving stale cached files
  after the update.
- [ ] Pick the version bump by semver: breaking change (e.g. the app no
  longer works the way it used to, a stored assessment/data format changes
  incompatibly) → major; new capability or non-breaking behaviour change →
  minor; bug fix only → patch.
- [ ] A pure refactor with zero observable difference (rename a variable,
  reformat) doesn't need a version bump or changelog entry. When in doubt —
  e.g. it changed what ships even if the UI looks the same — bump it.

## Editing the Cyber Essentials question set

- [ ] Never hand-edit `assets/data.js` — edit `assets/data.json` (schema in
  `docs/data-schema.md`) and regenerate with `node tools/build-data.js`.
  Commit both files in the same commit.
- [ ] Question and guidance text must be reproduced verbatim (whitespace
  normalised only) from the official IASME question set — don't paraphrase.
- [ ] If IASME publish a revised question set (new `.xlsx`), re-extract and
  hand-review the *entire* diff against the previous `data.json` before
  replacing it — question numbering, wording, branching logic
  (`dependsOn`) and compliant-answer direction (`compliantAnswer`) can all
  change between versions, and none of that is safe to assume unchanged.
- [ ] `compliantAnswer` should only be set where the question set states an
  explicit "CE Requirement" implying one correct answer — leave it `null`
  for informational/descriptive questions (organisation details, free-text
  process explanations) rather than guessing.

## General

- [ ] This app has no build step for its own runtime code (`assets/js/`) —
  don't introduce one. `tools/build-data.js` is a dev-only maintenance
  script, not part of what ships to the browser.
- [ ] The app must be served over `http(s)://`, not opened via `file://`
  (native ES module imports are blocked from the filesystem). Don't "fix"
  this by reintroducing a bundler or reverting to non-module scripts.
- [ ] This is an unofficial, third-party tool — never imply it's the actual
  IASME/NCSC certification process, and keep the attribution in README.md
  and the footer intact.
