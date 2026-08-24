// Progress bar, compliance summary and per-section breakdown.

import { dom } from './dom.js';
import { sections, summariseAssessment, flaggedQuestions } from './model.js';
import { getCurrent } from './assessments.js';

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

export function renderDashboard() {
  const assessment = getCurrent();
  if (!dom.dashboard) return;
  if (!assessment) {
    dom.progressFill.style.width = '0%';
    dom.progressLabel.textContent = '';
    dom.complianceSummary.innerHTML = '';
    dom.sectionBars.innerHTML = '';
    return;
  }

  const summary = summariseAssessment(assessment.answers);

  dom.progressFill.style.width = `${summary.percentComplete}%`;
  dom.progressLabel.textContent = `${summary.answered} / ${summary.total} questions answered (${summary.percentComplete}%)`;

  let complianceHtml;
  if (summary.answered === 0) {
    complianceHtml = `<p class="compliance-note">Answer some questions to see a compliance summary.</p>`;
  } else if (summary.nonCompliant.length === 0 && summary.warnings.length === 0) {
    complianceHtml = `<p class="compliance-note compliance-ok">No compliance issues flagged so far${
      summary.readyToSubmit ? ' — all questions answered.' : ' in the questions answered so far.'
    }</p>`;
  } else {
    complianceHtml = '';
    if (summary.nonCompliant.length > 0) {
      complianceHtml += `
        <p class="compliance-note compliance-warn">
          ${summary.nonCompliant.length} question${summary.nonCompliant.length === 1 ? '' : 's'} flagged as not compliant with Cyber Essentials requirements
          ${summary.automaticFails.length > 0 ? `, including ${summary.automaticFails.length} automatic-fail item${summary.automaticFails.length === 1 ? '' : 's'}` : ''}.
        </p>
        <ul class="non-compliant-list">
          ${summary.nonCompliant
            .map(
              (q) => `<li><a href="#q-${q.id}" data-jump-id="${q.id}">${q.id}${q.automaticFail ? ' <span class="auto-fail-badge">automatic fail</span>' : ''}</a> — ${escapeHtml(q.text.split('\n')[0])}</li>`
            )
            .join('')}
        </ul>`;
    }
    if (summary.warnings.length > 0) {
      complianceHtml += `
        <p class="compliance-note compliance-caution">
          ${summary.warnings.length} question${summary.warnings.length === 1 ? '' : 's'} need${summary.warnings.length === 1 ? 's' : ''} a follow-up answer to confirm compliance.
        </p>
        <ul class="warning-list">
          ${summary.warnings
            .map((q) => `<li><a href="#q-${q.id}" data-jump-id="${q.id}">${q.id}</a> — ${escapeHtml(q.text.split('\n')[0])}</li>`)
            .join('')}
        </ul>`;
    }
  }

  const flagged = flaggedQuestions(assessment.answers, assessment.flags);
  if (flagged.length > 0) {
    complianceHtml += `
      <p class="compliance-note compliance-flagged">
        ${flagged.length} question${flagged.length === 1 ? '' : 's'} flagged for follow-up.
      </p>
      <ul class="flagged-list">
        ${flagged
          .map((q) => `<li><a href="#q-${q.id}" data-jump-id="${q.id}">${q.id}</a> — ${escapeHtml(q.text.split('\n')[0])}</li>`)
          .join('')}
      </ul>`;
  }

  dom.complianceSummary.innerHTML = complianceHtml;

  dom.sectionBars.innerHTML = sections
    .map((s) => {
      const secSummary = summary.perSection[s.id];
      if (secSummary.total === 0) return '';
      const pct = secSummary.total === 0 ? 0 : Math.round((secSummary.answered / secSummary.total) * 100);
      const flagClass = secSummary.nonCompliant.length > 0 ? ' has-issues' : secSummary.warnings.length > 0 ? ' has-warnings' : '';
      return `<a class="section-bar-row${flagClass}" href="#section-${s.id}">
        <span class="section-bar-label">${s.id === 'ATT' ? s.title : `${s.id} ${s.title}`}</span>
        <span class="section-bar-track"><span class="section-bar-fill" style="width:${pct}%"></span></span>
        <span class="section-bar-count">${secSummary.answered}/${secSummary.total}</span>
      </a>`;
    })
    .join('');
}
