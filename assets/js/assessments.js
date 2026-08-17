// Assessment records: in-memory list, current selection, sidebar list of saved assessments.

import { dom } from './dom.js';
import { loadAssessments, saveAssessments } from './storage.js';
import { uid, nowIso, debounce } from './utils.js';
import { summariseAssessment } from './model.js';

let assessments = [];
let currentId = null;

const persist = debounce(() => saveAssessments(assessments), 300);

export function getAssessments() {
  return assessments;
}

export function getCurrent() {
  return assessments.find((a) => a.id === currentId) || null;
}

export function initAssessments() {
  assessments = loadAssessments();
  if (assessments.length > 0) {
    currentId = assessments[0].id;
  }
}

export function createAssessment(name) {
  const assessment = {
    id: uid(),
    name: name || 'New assessment',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    answers: {},
  };
  assessments.unshift(assessment);
  currentId = assessment.id;
  persist();
  return assessment;
}

export function deleteAssessment(id) {
  assessments = assessments.filter((a) => a.id !== id);
  if (currentId === id) {
    currentId = assessments.length > 0 ? assessments[0].id : null;
  }
  persist();
}

export function selectAssessment(id) {
  currentId = id;
}

export function renameCurrent(name) {
  const a = getCurrent();
  if (!a) return;
  a.name = name;
  a.updatedAt = nowIso();
  persist();
}

export function setAnswer(questionId, value, notes) {
  const a = getCurrent();
  if (!a) return;
  a.answers[questionId] = { value, notes };
  a.updatedAt = nowIso();
  persist();
}

export function clearAnswer(questionId) {
  const a = getCurrent();
  if (!a) return;
  delete a.answers[questionId];
  a.updatedAt = nowIso();
  persist();
}

export function importAssessment(data) {
  const assessment = {
    id: uid(),
    name: data.name || 'Imported assessment',
    createdAt: data.createdAt || nowIso(),
    updatedAt: nowIso(),
    answers: data.answers && typeof data.answers === 'object' ? data.answers : {},
  };
  assessments.unshift(assessment);
  currentId = assessment.id;
  persist();
  return assessment;
}

export function renderAssessmentList(onSelect) {
  if (!dom.assessmentList) return;
  dom.assessmentList.innerHTML = '';
  for (const a of assessments) {
    const summary = summariseAssessment(a.answers);
    const li = document.createElement('li');
    li.className = 'assessment-item' + (a.id === currentId ? ' active' : '');
    li.dataset.id = a.id;

    const name = document.createElement('span');
    name.className = 'assessment-name';
    name.textContent = a.name || 'Untitled assessment';

    const pct = document.createElement('span');
    pct.className = 'assessment-pct';
    pct.textContent = `${summary.percentComplete}%`;

    li.append(name, pct);
    li.addEventListener('click', () => onSelect(a.id));
    dom.assessmentList.appendChild(li);
  }
}
