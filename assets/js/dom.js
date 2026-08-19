// Single set of DOM element references shared by every module.

export const dom = {
  sidebar: document.getElementById('sidebar'),
  assessmentList: document.getElementById('assessment-list'),
  newAssessmentBtn: document.getElementById('new-assessment-btn'),
  deleteAssessmentBtn: document.getElementById('delete-assessment-btn'),
  exportBtn: document.getElementById('export-btn'),
  importBtn: document.getElementById('import-btn'),
  importInput: document.getElementById('import-input'),
  printBtn: document.getElementById('print-btn'),
  themeToggleBtn: document.getElementById('theme-toggle-btn'),
  sidebarToggleBtn: document.getElementById('sidebar-toggle-btn'),

  orgNameInput: document.getElementById('org-name-input'),

  dashboard: document.getElementById('dashboard'),
  progressFill: document.getElementById('progress-fill'),
  progressLabel: document.getElementById('progress-label'),
  complianceSummary: document.getElementById('compliance-summary'),
  sectionBars: document.getElementById('section-bars'),

  framework: document.getElementById('framework'),

  toast: document.getElementById('toast'),
  confirmDialog: document.getElementById('confirm-dialog'),
  confirmMessage: document.getElementById('confirm-message'),
  confirmOkBtn: document.getElementById('confirm-ok-btn'),
  confirmCancelBtn: document.getElementById('confirm-cancel-btn'),

  emptyState: document.getElementById('empty-state'),
  appMain: document.getElementById('app-main'),

  backToTopBtn: document.getElementById('back-to-top-btn'),
};
