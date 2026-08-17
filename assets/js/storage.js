// localStorage read/write for assessments. No DOM.

const KEY = 'ce-self-assessment.assessments.v1';

export function loadAssessments() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load assessments from storage', err);
    return [];
  }
}

export function saveAssessments(assessments) {
  try {
    localStorage.setItem(KEY, JSON.stringify(assessments));
    return true;
  } catch (err) {
    console.error('Failed to save assessments to storage', err);
    return false;
  }
}
