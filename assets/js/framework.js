// Builds the section/question tree and applies per-question state to it.

import { dom } from './dom.js';
import { sections, questions, questionsForSection, isQuestionVisible, questionStatus } from './model.js';
import { getCurrent, setAnswer } from './assessments.js';
import { debounce } from './utils.js';
import { showToast } from './ui-shell.js';

const STATUS_LABEL = {
  unanswered: 'Not yet answered',
  compliant: 'Compliant',
  'non-compliant': 'Not compliant',
  answered: 'Answered',
};

function currentValue(answers, questionId) {
  const a = answers[questionId];
  return a ? a.value : undefined;
}

function currentNotes(answers, questionId) {
  const a = answers[questionId];
  return a ? a.notes || '' : '';
}

function renderLinks(links) {
  if (!links || links.length === 0) return '';
  const items = links
    .map((l) => `<a href="${l.url}" target="_blank" rel="noopener">${escapeHtml(l.text)}</a>`)
    .join('');
  return `<div class="guidance-links">${items}</div>`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// Ids sorted longest-first so e.g. "A1.10.1" matches before "A1.10".
const REFERENCEABLE_IDS = questions
  .map((q) => q.id)
  .filter((id) => /^A\d/.test(id))
  .sort((a, b) => b.length - a.length);
const QUESTION_ID_REGEX = new RegExp(
  `\\b(${REFERENCEABLE_IDS.map((id) => id.replace(/\./g, '\\.')).join('|')})\\b`,
  'g'
);

// Turns any other question id mentioned in (already-escaped) guidance text into a
// clickable link that jumps to that question's card, e.g. "see A5.4" -> a link to A5.4.
function linkQuestionReferences(escapedText, ownId) {
  if (REFERENCEABLE_IDS.length === 0) return escapedText;
  return escapedText.replace(QUESTION_ID_REGEX, (match) => {
    if (match === ownId) return match;
    return `<a href="#q-${match}" class="ref-link" data-jump-id="${match}">${match}</a>`;
  });
}

function buildAnswerControl(question, answers) {
  const value = currentValue(answers, question.id);
  const id = `q-${question.id}`;

  if (question.answerType === 'text') {
    return `<textarea id="${id}" class="answer-text" data-qid="${question.id}" rows="3"
      placeholder="Type your answer here...">${escapeHtml(value || '')}</textarea>`;
  }

  if (question.answerType === 'yesno') {
    return radioGroup(question.id, [
      { value: 'Yes', label: 'Yes' },
      { value: 'No', label: 'No' },
    ], value);
  }

  if (question.answerType === 'optinout') {
    return radioGroup(question.id, question.options, value);
  }

  if (question.answerType === 'lettered' || (question.answerType === 'choice' && !question.multiSelect)) {
    return radioGroup(question.id, question.options, value);
  }

  if (question.answerType === 'choice' && question.multiSelect) {
    return checkboxGroup(question.id, question.options, Array.isArray(value) ? value : []);
  }

  return '';
}

function radioGroup(qid, options, value) {
  return `<div class="option-group" role="radiogroup">
    ${options
      .map(
        (opt) => `<label class="option">
          <input type="radio" name="q-${qid}" data-qid="${qid}" value="${escapeHtml(opt.value)}"
            ${value === opt.value ? 'checked' : ''} />
          <span>${escapeHtml(opt.label)}</span>
        </label>`
      )
      .join('')}
  </div>`;
}

function checkboxGroup(qid, options, values) {
  return `<div class="option-group">
    ${options
      .map(
        (opt) => `<label class="option">
          <input type="checkbox" data-qid="${qid}" data-multi="true" value="${escapeHtml(opt.value)}"
            ${values.includes(opt.value) ? 'checked' : ''} />
          <span>${escapeHtml(opt.label)}</span>
        </label>`
      )
      .join('')}
  </div>`;
}

function buildQuestionCard(question, answers) {
  const status = questionStatus(question, answers);
  const notes = currentNotes(answers, question.id);
  const needsNotesField = question.answerType !== 'text';

  return `<div class="question-card status-${status}" id="q-${question.id}" data-qid="${question.id}">
    <div class="question-head">
      <span class="question-id">${question.id}</span>
      <span class="status-badge status-${status}">${STATUS_LABEL[status]}</span>
    </div>
    <p class="question-text">${escapeHtml(question.text)}</p>
    ${question.requirement ? `<p class="requirement">${escapeHtml(question.requirement)}</p>` : ''}
    ${question.guidance ? `<details class="guidance"><summary>Guidance</summary><p>${linkQuestionReferences(escapeHtml(question.guidance), question.id)}</p>${renderLinks(question.guidanceLinks)}</details>` : ''}
    <div class="answer-control">${buildAnswerControl(question, answers)}</div>
    ${
      needsNotesField
        ? `<textarea class="answer-notes" data-notes-for="${question.id}" rows="2"
             placeholder="Additional detail (optional)">${escapeHtml(notes)}</textarea>`
        : ''
    }
  </div>`;
}

function groupBySubsection(qs) {
  const groups = [];
  let lastKey = Symbol('none');
  for (const q of qs) {
    const key = q.subsection || null;
    if (key !== lastKey) {
      groups.push({ subsection: key, questions: [] });
      lastKey = key;
    }
    groups[groups.length - 1].questions.push(q);
  }
  return groups;
}

function buildSection(section, answers) {
  const qs = questionsForSection(section.id).filter((q) => isQuestionVisible(q, answers));
  const groups = groupBySubsection(qs);

  const body = groups
    .map(
      (g) => `
      ${g.subsection ? `<h3 class="subsection-title">${escapeHtml(g.subsection)}</h3>` : ''}
      ${g.questions.map((q) => buildQuestionCard(q, answers)).join('')}
    `
    )
    .join('');

  return `<section class="framework-section" id="section-${section.id}">
    <h2>${section.id === 'ATT' ? '' : section.id + ' &middot; '}${escapeHtml(section.title)}</h2>
    <p class="section-description">${escapeHtml(section.description)}</p>
    ${renderLinks(section.links)}
    <div class="section-body">${body}</div>
  </section>`;
}

// Jumps to another question's card when a guidance reference link (or the
// dashboard's non-compliant list) is clicked. Delegated once on document
// since question cards are re-created on every render.
export function initQuestionJumps() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-jump-id]');
    if (!link) return;
    event.preventDefault();
    const target = document.getElementById(`q-${link.dataset.jumpId}`);
    if (!target) {
      showToast(`${link.dataset.jumpId} isn't currently shown — it depends on a different answer.`);
      return;
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    target.classList.add('highlight');
    setTimeout(() => target.classList.remove('highlight'), 1600);
  });
}

let rerenderCallback = null;

export function setOnAnswerChange(cb) {
  rerenderCallback = cb;
}

export function renderFramework() {
  const assessment = getCurrent();
  if (!dom.framework) return;
  if (!assessment) {
    dom.framework.innerHTML = '';
    return;
  }
  dom.framework.innerHTML = sections.map((s) => buildSection(s, assessment.answers)).join('');
  attachHandlers(assessment.answers);
}

// Keyed per question so typing in one field doesn't cancel a pending save
// for another (a single shared debounce would silently drop whichever
// field's save got pre-empted before its timer fired).
const textSaveDebouncers = new Map();

function debouncedTextSave(qid, value, notes) {
  if (!textSaveDebouncers.has(qid)) {
    textSaveDebouncers.set(
      qid,
      debounce((v, n) => {
        setAnswer(qid, v, n);
        rerenderCallback?.({ skipFrameworkRerender: true });
      }, 350)
    );
  }
  textSaveDebouncers.get(qid)(value, notes);
}

function attachHandlers() {
  dom.framework.querySelectorAll('input[type="radio"]').forEach((el) => {
    el.addEventListener('change', () => {
      const qid = el.dataset.qid;
      const notesEl = dom.framework.querySelector(`[data-notes-for="${qid}"]`);
      setAnswer(qid, el.value, notesEl ? notesEl.value : undefined);
      rerenderCallback?.({});
    });
  });

  dom.framework.querySelectorAll('input[type="checkbox"][data-multi]').forEach((el) => {
    el.addEventListener('change', () => {
      const qid = el.dataset.qid;
      const group = dom.framework.querySelectorAll(`input[type="checkbox"][data-qid="${qid}"]`);
      const values = Array.from(group)
        .filter((c) => c.checked)
        .map((c) => c.value);
      const notesEl = dom.framework.querySelector(`[data-notes-for="${qid}"]`);
      setAnswer(qid, values, notesEl ? notesEl.value : undefined);
      rerenderCallback?.({});
    });
  });

  dom.framework.querySelectorAll('textarea.answer-text').forEach((el) => {
    el.addEventListener('input', () => {
      debouncedTextSave(el.dataset.qid, el.value, undefined);
    });
  });

  dom.framework.querySelectorAll('textarea.answer-notes').forEach((el) => {
    el.addEventListener('input', () => {
      const qid = el.dataset.notesFor;
      const answers = getCurrent().answers;
      const existingValue = answers[qid] ? answers[qid].value : undefined;
      debouncedTextSave(qid, existingValue, el.value);
    });
  });
}
