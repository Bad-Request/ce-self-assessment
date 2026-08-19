# Cyber Essentials dataset schema — `assets/data.json`

`assets/data.json` is the source of truth for the IASME Cyber Essentials
question set content shown in the app (Danzell / 2026 question set, v16.3,
in force from April 2026). It is curated from the official
`.xlsx` question set published by IASME — see [../README.md](../README.md)
for attribution and licensing notes.

It is **not** loaded directly by the browser — run `node tools/build-data.js`
after editing it, which regenerates `assets/data.js` (the `window.CE_DATASET`
global the app actually loads). Commit both files together.

## Shape

```
{
  "sections": Section[],
  "questions": Question[]
}
```

### Section

One of the question set's control themes (`A1`–`A8`) plus a final
attestation section.

| Field | Type | Notes |
|---|---|---|
| `id` | string | `"A1"`–`"A8"`, or `"ATT"` for Attestation. |
| `title` | string | e.g. `"Firewalls"`. |
| `description` | string | The section's intro paragraph(s) from the question set. |
| `links` | `{text, url}[]` | "Knowledge Hub" / FAQ links shown at the top of the section. |

### Question

A single numbered question (e.g. `A4.2`, `A7.14`).

| Field | Type | Notes |
|---|---|---|
| `id` | string | e.g. `"A4.2"`. Matches the question set's own numbering. |
| `section` | string | The owning `Section.id`. |
| `subsection` | string \| null | Finer grouping within a section, e.g. `"Administrative Accounts"` within `A7`. Purely for display grouping. |
| `text` | string | The question wording, verbatim. |
| `guidance` | string | The guidance/help text, verbatim, including any embedded "CE Requirement:" sentence. |
| `guidanceLinks` | `{text, url}[]` | Further-guidance hyperlinks associated with this question. |
| `answerType` | `"yesno" \| "text" \| "choice" \| "lettered" \| "optinout"` | See below. |
| `options` | `{value, label}[]` | Present for `choice`, `lettered`, `optinout`. Empty otherwise. |
| `multiSelect` | boolean | If true, more than one option may be selected (e.g. A8.1 "A and/or B", A1.10 "select two", A5.5 where more than one authentication option may be in use). Applies to `choice` and `lettered` alike. |
| `requirement` | string \| null | The extracted "CE Requirement: …" sentence from `guidance`, where present, surfaced separately for quick reference. |
| `compliantAnswer` | `"Yes" \| "No" \| null` | For `yesno` questions where the question set's CE Requirement implies a specific compliant answer. `null` means informational/no single correct answer (e.g. organisation details, free-text process descriptions). |
| `automaticFail` | boolean (optional) | Set on the handful of questions the question set explicitly calls out as an automatic fail if answered non-compliantly (e.g. `A6.4`, 14-day critical patching). |
| `dependsOn` | object \| null | Branching rule — this question is only shown when the condition holds. See below. |

### `answerType` values

- `yesno` — a straight Yes/No question.
- `text` — free-text notes (the question set's "Notes" type).
- `choice` — single- or multi-select from a labelled option list (`options`, `multiSelect`).
- `lettered` — the question set's "Options A, B, C…" style, where each option is a distinct control approach (e.g. password policy option A/B/C/D/E). Some lettered options require accompanying free text (handled in the UI, not the schema — the app always offers a notes field alongside a lettered answer).
- `optinout` — the one Opt-In/Opt-Out question (cyber insurance).

### `dependsOn`

Encodes the question set's "Question Logic" column (originally free text,
hand-curated into a structured rule here). Three shapes:

- `{"questionId": "A2.1", "equals": "partial"}` — shown only if that question's
  answer equals the given value exactly (compares against the option `value`
  for `choice`/`lettered`, or `"Yes"`/`"No"` for `yesno`).
- `{"questionId": "A8.1", "includes": "A"}` — shown only if the given option
  value is among the (possibly multiple) selected values on a `multiSelect`
  question.
- `null` — always shown (no branching).

A question with a `dependsOn` that doesn't currently hold is hidden and its
answer (if any was previously given) is not counted towards progress or
compliance.

## Invariants a reviewer should check before committing an update

- Every `answerType` of `choice` or `lettered` has a non-empty `options` array.
- Every `dependsOn.questionId` refers to a real `Question.id` that appears
  *before* the dependent question in the question set's own numbering.
- `compliantAnswer` is only set on `yesno` questions.
- Question and guidance text should be reproduced verbatim from the official
  question set (whitespace-normalised only) — do not paraphrase, since the
  app's guidance panel is relied on as-is.
- If IASME publish a revised question set, re-run the extraction against the
  new `.xlsx` and diff the resulting `data.json` against the previous version
  by hand before replacing it — question numbering, branching logic and
  compliant-answer direction can all change between versions.
