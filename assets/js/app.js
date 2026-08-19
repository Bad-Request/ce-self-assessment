import { dom } from './dom.js';
import { showToast, confirmDialog, initTheme, initSidebar, initBackToTop } from './ui-shell.js';
import { downloadJson } from './download.js';
import {
  initAssessments,
  getCurrent,
  createAssessment,
  deleteAssessment,
  selectAssessment,
  renameCurrent,
  renderAssessmentList,
} from './assessments.js';
import { renderFramework, setOnAnswerChange } from './framework.js';
import { renderDashboard } from './dashboard.js';

function renderAll() {
  const current = getCurrent();
  const hasCurrent = Boolean(current);
  dom.emptyState.hidden = hasCurrent;
  dom.appMain.hidden = !hasCurrent;

  renderAssessmentList((id) => {
    selectAssessment(id);
    renderAll();
  });

  if (!hasCurrent) return;

  dom.orgNameInput.value = current.name || '';
  renderFramework();
  renderDashboard();
}

setOnAnswerChange(({ skipFrameworkRerender } = {}) => {
  renderAssessmentList((id) => {
    selectAssessment(id);
    renderAll();
  });
  renderDashboard();
  if (!skipFrameworkRerender) {
    // radio/checkbox changes may reveal or hide dependent questions
    renderFramework();
  }
});

function wireHeader() {
  dom.newAssessmentBtn.addEventListener('click', () => {
    const name = window.prompt('Name this assessment (e.g. your organisation name):', '');
    if (name === null) return;
    createAssessment(name.trim() || 'New assessment');
    renderAll();
    showToast('New assessment created');
  });

  dom.deleteAssessmentBtn.addEventListener('click', async () => {
    const current = getCurrent();
    if (!current) return;
    const ok = await confirmDialog(`Delete "${current.name}"? This cannot be undone.`);
    if (!ok) return;
    deleteAssessment(current.id);
    renderAll();
    showToast('Assessment deleted');
  });

  dom.orgNameInput.addEventListener('change', () => {
    renameCurrent(dom.orgNameInput.value.trim() || 'Untitled assessment');
    renderAssessmentList((id) => {
      selectAssessment(id);
      renderAll();
    });
  });

  dom.exportBtn.addEventListener('click', () => {
    const current = getCurrent();
    if (!current) return;
    const safeName = (current.name || 'assessment').replace(/[^a-z0-9-_]+/gi, '_');
    downloadJson(current, `cyber-essentials-${safeName}.json`);
    showToast('Assessment exported');
  });

  dom.importBtn.addEventListener('click', () => dom.importInput.click());

  dom.importInput.addEventListener('change', async () => {
    const file = dom.importInput.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const { importAssessment } = await import('./assessments.js');
      importAssessment(data);
      renderAll();
      showToast('Assessment imported');
    } catch (err) {
      console.error(err);
      showToast('Import failed — not a valid assessment file');
    } finally {
      dom.importInput.value = '';
    }
  });

  dom.printBtn.addEventListener('click', () => window.print());
}

function init() {
  initTheme();
  initSidebar();
  initBackToTop();
  initAssessments();
  wireHeader();
  renderAll();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch((err) => console.error('SW registration failed', err));
    });
  }
}

init();
