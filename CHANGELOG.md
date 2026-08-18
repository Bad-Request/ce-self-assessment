# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses [Semantic Versioning](https://semver.org/).

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
