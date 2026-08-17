// Chrome with no domain knowledge: toast, confirm dialog, sidebar collapse, theme.

import { dom } from './dom.js';

let toastTimer = null;

export function showToast(message) {
  if (!dom.toast) return;
  dom.toast.textContent = message;
  dom.toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => dom.toast.classList.remove('visible'), 2600);
}

export function confirmDialog(message) {
  return new Promise((resolve) => {
    if (!dom.confirmDialog) {
      resolve(window.confirm(message));
      return;
    }
    dom.confirmMessage.textContent = message;
    dom.confirmDialog.showModal();

    const cleanup = () => {
      dom.confirmOkBtn.removeEventListener('click', onOk);
      dom.confirmCancelBtn.removeEventListener('click', onCancel);
    };
    const onOk = () => {
      cleanup();
      dom.confirmDialog.close();
      resolve(true);
    };
    const onCancel = () => {
      cleanup();
      dom.confirmDialog.close();
      resolve(false);
    };
    dom.confirmOkBtn.addEventListener('click', onOk);
    dom.confirmCancelBtn.addEventListener('click', onCancel);
  });
}

const THEME_KEY = 'ce-self-assessment.theme';

export function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  dom.themeToggleBtn?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
  });
}

export function initSidebar() {
  dom.sidebarToggleBtn?.addEventListener('click', () => {
    dom.sidebar?.classList.toggle('collapsed');
  });
}
