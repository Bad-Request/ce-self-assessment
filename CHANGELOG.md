# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses [Semantic Versioning](https://semver.org/).

## [1.2.3] - 2026-08-19

### Fixed

- A question's "Not yet answered" / "Answered" status badge now updates as
  soon as a free-text answer or notes field is saved, instead of staying
  stuck until something unrelated (e.g. answering a different question)
  forced a full re-render of the question list (issue #11).

## [1.2.2] - 2026-08-19

### Fixed

- Free-text answers (question notes and text-type answers) shared a single
  debounce timer across the whole form, so typing into one field and then
  switching to another within ~350ms silently discarded the first field's
  answer before it was ever saved — making the progress bars appear stuck
  as text answers went uncounted. Each question's field now debounces
  independently (issue #12).

## [1.2.1] - 2026-08-19

### Fixed

- A6.4.2 and A6.5.2 are now only shown when A6.4.1 and A6.5.1 (respectively)
  are answered "No" — previously they were always shown regardless of the
  auto-update answer (issue #13).

## [1.2.0] - 2026-08-19

### Added

- Where a question's guidance text references another question (e.g. "see
  A5.4"), it's now a clickable link that jumps straight to that question's
  card and briefly highlights it. If the referenced question isn't
  currently shown (its own branching condition isn't met), a toast
  explains why instead of jumping nowhere (issue #7).

### Fixed

- The dashboard's "flagged as not compliant" list now actually jumps to
  the specific question when clicked, using the same jump mechanism —
  previously it only linked to the top of the containing section.

## [1.1.0] - 2026-08-19

### Added

- A floating "back to top" button that appears once you've scrolled down
  the page and smooth-scrolls back to the top on click. Hidden when
  printing (issue #8).

## [1.0.1] - 2026-08-18

### Fixed

- The header icon no longer mismatches the site favicon — it now uses the
  same shield icon as the favicon/app icon instead of an unrelated star
  glyph (issue #5).
- Mobile layout: the sidebar toggle button now sits inside the header
  instead of floating over it, the sidebar no longer overlaps the header
  when expanded, and the theme/print buttons moved out of the header into
  the sidebar's new "Appearance" section, decluttering the header on small
  screens (issue #4).
- Light/dark theme now defaults to following the system/browser preference
  (`prefers-color-scheme`). The theme toggle still lets you explicitly
  override it, saved per-browser; previously the app always defaulted to
  light regardless of system preference (issue #3).

## [1.0.0] - 2026-08-18

### Added

- Initial release: a fully static, offline-first self-assessment tool for
  the IASME Cyber Essentials question set (Danzell / 2026 question set,
  v16.3), covering all 107 questions across Organisation, Scope of
  Assessment, Insurance, Firewalls, Secure Configuration, Security Update
  Management, User Access Control, Malware Protection, and Attestation.
- Question text, guidance, "CE Requirement" text and further-guidance links
  reproduced from the official question set, curated into
  `assets/data.json` (schema documented in `docs/data-schema.md`).
- The question set's own conditional/branching logic, so follow-up
  questions only appear when relevant to an earlier answer.
- Per-question compliance flagging against explicit CE Requirements, with
  automatic-fail items called out separately.
- Dashboard with overall completion progress, a jump-to list of flagged
  non-compliant answers, and a per-section progress breakdown.
- Multiple named, saved assessments; export/import as JSON; print/save as
  PDF.
- Installable, offline-capable Progressive Web App (manifest + service
  worker).
