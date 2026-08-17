// Pure domain logic for the Cyber Essentials dataset: branching visibility,
// per-question compliance, and per-section/overall summaries.
// No DOM, no storage.

const DATASET = window.CE_DATASET;

export const sections = DATASET.sections;
export const questions = DATASET.questions;

const questionsById = new Map(questions.map((q) => [q.id, q]));
const questionsBySection = new Map(sections.map((s) => [s.id, []]));
for (const q of questions) {
  questionsBySection.get(q.section).push(q);
}

export function getQuestion(id) {
  return questionsById.get(id);
}

export function questionsForSection(sectionId) {
  return questionsBySection.get(sectionId) || [];
}

function answerValue(answers, questionId) {
  const a = answers[questionId];
  return a ? a.value : undefined;
}

// Evaluate whether a question's dependsOn rule currently holds.
export function isQuestionVisible(question, answers) {
  const dep = question.dependsOn;
  if (!dep) return true;
  const parent = questionsById.get(dep.questionId);
  if (!parent || !isQuestionVisible(parent, answers)) return false;
  const value = answerValue(answers, dep.questionId);
  if (value === undefined || value === null) return false;
  if ('equals' in dep) {
    return value === dep.equals;
  }
  if ('includes' in dep) {
    return Array.isArray(value) ? value.includes(dep.includes) : value === dep.includes;
  }
  return true;
}

export function isAnswered(question, answers) {
  const a = answers[question.id];
  if (!a) return false;
  if (Array.isArray(a.value)) return a.value.length > 0;
  return a.value !== undefined && a.value !== null && String(a.value).trim() !== '';
}

// 'unanswered' | 'compliant' | 'non-compliant' | 'answered'
export function questionStatus(question, answers) {
  if (!isAnswered(question, answers)) return 'unanswered';
  if (question.compliantAnswer) {
    const value = answerValue(answers, question.id);
    return value === question.compliantAnswer ? 'compliant' : 'non-compliant';
  }
  return 'answered';
}

// Summarise one section: counts + list of non-compliant questions (visible only).
export function summariseSection(sectionId, answers) {
  const qs = questionsForSection(sectionId).filter((q) => isQuestionVisible(q, answers));
  let answeredCount = 0;
  let compliantCount = 0;
  let nonCompliant = [];
  for (const q of qs) {
    const status = questionStatus(q, answers);
    if (status !== 'unanswered') answeredCount += 1;
    if (status === 'compliant') compliantCount += 1;
    if (status === 'non-compliant') nonCompliant.push(q);
  }
  return {
    total: qs.length,
    answered: answeredCount,
    compliant: compliantCount,
    nonCompliant,
    complete: answeredCount === qs.length && qs.length > 0,
  };
}

export function summariseAssessment(answers) {
  const perSection = {};
  let total = 0;
  let answered = 0;
  let nonCompliant = [];
  let automaticFails = [];
  for (const s of sections) {
    const summary = summariseSection(s.id, answers);
    perSection[s.id] = summary;
    total += summary.total;
    answered += summary.answered;
    nonCompliant = nonCompliant.concat(summary.nonCompliant);
  }
  automaticFails = nonCompliant.filter((q) => q.automaticFail);
  return {
    perSection,
    total,
    answered,
    percentComplete: total === 0 ? 0 : Math.round((answered / total) * 100),
    nonCompliant,
    automaticFails,
    readyToSubmit: answered === total && total > 0,
    likelyCompliant: nonCompliant.length === 0,
  };
}
