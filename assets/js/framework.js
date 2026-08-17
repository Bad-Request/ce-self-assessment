// Builds the section/question tree and applies per-question state to it.

import { dom } from './dom.js';
import { sections, questionsForSection, isQuestionVisible, questionStatus } from './model.js';
import { getCurrent, setAnswer } from './assessments.js';
import { debounce } from './utils.js';

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

  return `<div class="question-card status-${status}" data-qid="${question.id}">
    <div class="question-head">
      <span class="question-id">${question.id}</span>
      <span class="status-badge status-${status}">${STATUS_LABEL[status]}</span>
    </div>
    <p class="question-text">${escapeHtml(question.text)}</p>
    ${question.requirement ? `<p class="requirement">${escapeHtml(question.requirement)}</p>` : ''}
    ${question.guidance ? `<details class="guidance"><summary>Guidance</summary><p>${escapeHtml(question.guidance)}</p>${renderLinks(question.guidanceLinks)}</details>` : ''}
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

const debouncedTextSave = debounce((qid, value, notes) => {
  setAnswer(qid, value, notes);
  rerenderCallback?.({ skipFrameworkRerender: true });
}, 350);

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
