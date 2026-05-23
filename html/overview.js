/* overview.js – Logik für overview.html */

const STATUSES = ['Beworben', 'Interview', 'Warten', 'Abgelehnt', 'Angebot'];
let allApplications = [];

/* ── Boot ── */
loadAll();

async function loadAll() {
  try {
    allApplications = await fetchApplications();
    renderKPIs(allApplications);
    applyFilters();
  } catch (e) {
    document.getElementById('tableBody').innerHTML =
      `<tr><td colspan="6"><div class="empty-state">
        <div class="empty-icon">⚠️</div>
        Fehler beim Laden – läuft der Server?
      </div></td></tr>`;
  }
}

/* ── KPIs ── */
function renderKPIs(data) {
  const total      = data.length;
  const byStatus   = countBy(data, 'status');
  const interviews = byStatus['Interview'] || 0;
  const angebote   = byStatus['Angebot']   || 0;
  const abgelehnt  = byStatus['Abgelehnt'] || 0;
  const rate       = total > 0 ? Math.round((interviews / total) * 100) : 0;

  document.getElementById('kpiGrid').innerHTML = `
    <div class="kpi-card">
      <div class="kpi-label">Gesamt</div>
      <div class="kpi-value">${total}</div>
      <div class="kpi-sub">Bewerbungen</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Interview</div>
      <div class="kpi-value" style="color:var(--s-interview-c)">${interviews}</div>
      <div class="kpi-sub">${rate} % Einladungsrate</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Angebote</div>
      <div class="kpi-value" style="color:var(--s-angebot-c)">${angebote}</div>
      <div class="kpi-sub">erhalten</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Abgelehnt</div>
      <div class="kpi-value" style="color:var(--s-abgelehnt-c)">${abgelehnt}</div>
      <div class="kpi-sub">Absagen</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Offen</div>
      <div class="kpi-value">${(byStatus['Beworben'] || 0) + (byStatus['Warten'] || 0)}</div>
      <div class="kpi-sub">ausstehend</div>
    </div>
  `;
}

function countBy(arr, key) {
  return arr.reduce((acc, item) => {
    acc[item[key]] = (acc[item[key]] || 0) + 1;
    return acc;
  }, {});
}

/* ── Filter & Sort ── */
function applyFilters() {
  const q      = document.getElementById('searchInput').value.toLowerCase();
  const status = document.getElementById('filterStatus').value;
  const sort   = document.getElementById('sortBy').value;

  let filtered = allApplications.filter(a => {
    const matchQ = !q ||
      (a.company  || '').toLowerCase().includes(q) ||
      (a.jobtitle || '').toLowerCase().includes(q);
    const matchS = !status || a.status === status;
    return matchQ && matchS;
  });

  filtered.sort((a, b) => {
    if (sort === 'company')  return (a.company || '').localeCompare(b.company || '');
    if (sort === 'app_date') return b.app_date.localeCompare(a.app_date);
    return b.created_at.localeCompare(a.created_at);
  });

  renderTable(filtered);

  const cnt = document.getElementById('resultCount');
  cnt.textContent = filtered.length < allApplications.length
    ? `${filtered.length} von ${allApplications.length} Bewerbungen`
    : `${allApplications.length} Bewerbungen gesamt`;
}

/* ── Table ── */
function renderTable(data) {
  const tbody = document.getElementById('tableBody');

  if (!data.length) {
    tbody.innerHTML = `
      <tr><td colspan="6">
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          Keine Bewerbungen gefunden.
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(a => `
    <tr onclick="openDrawer(${a.id})">
      <td class="td-company">${esc(a.company)}</td>
      <td class="td-title">${esc(a.jobtitle) || '<span style="opacity:.4">—</span>'}</td>
      <td class="td-date">${formatDate(a.app_date)}</td>
      <td onclick="event.stopPropagation()">${statusDropdown(a.id, a.status)}</td>
      <td class="td-contact">${esc(a.contact_name) || '<span style="opacity:.4">—</span>'}</td>
      <td class="td-link">
        ${a.link
          ? `<a href="${esc(a.link)}" target="_blank" onclick="event.stopPropagation()">↗ Link</a>`
          : ''}
      </td>
    </tr>
  `).join('');
}

/* ── Status dropdown (inline in table & drawer) ── */
function statusDropdown(id, current, extraClass = '') {
  const options = STATUSES.map(s =>
    `<option value="${s}" ${s === current ? 'selected' : ''}>${s}</option>`
  ).join('');
  return `
    <select
      class="status-select badge badge-${esc(current)} ${extraClass}"
      data-id="${id}"
      data-current="${esc(current)}"
      onchange="handleStatusChange(this)"
    >${options}</select>`;
}

/* ── Status change handler ── */
async function handleStatusChange(sel) {
  const id      = Number(sel.dataset.id);
  const prev    = sel.dataset.current;
  const next    = sel.value;

  // Optimistic UI update
  sel.className = `status-select badge badge-${next}`;
  sel.dataset.current = next;

  // Update local cache
  const app = allApplications.find(a => a.id == id);
  if (app) app.status = next;

  // Sync drawer badge if open for same entry
  const drawerSel = document.getElementById(`drawer-status-${id}`);
  if (drawerSel) {
    drawerSel.value = next;
    drawerSel.className = `status-select badge badge-${next} drawer-status-select`;
    drawerSel.dataset.current = next;
  }

  // Re-render KPIs silently
  renderKPIs(allApplications);

  try {
    await patchStatus(id, next);
    showToast(`Status geändert: ${next}`, 'success');
  } catch (e) {
    // Rollback
    sel.value = prev;
    sel.className = `status-select badge badge-${prev}`;
    sel.dataset.current = prev;
    if (app) app.status = prev;
    renderKPIs(allApplications);
    showToast('Fehler beim Speichern.', 'error');
  }
}

/* ── Drawer ── */
function openDrawer(id) {
  const a = allApplications.find(x => x.id == id);
  if (!a) return;

  document.getElementById('dCompany').textContent = a.company || '—';
  document.getElementById('dTitle').textContent   = a.jobtitle || 'Kein Jobtitel angegeben';

  const hasContact = a.contact_name || a.contact_email || a.contact_phone || a.contact_position;

  document.getElementById('drawerBody').innerHTML = `
    <div class="drawer-section">
      <div class="drawer-section-title">Stelle</div>
      <div class="drawer-row">
        <span class="dr-label">Status</span>
        <span class="dr-val">
          ${statusDropdown(a.id, a.status, 'drawer-status-select').replace(
            'data-id=', `id="drawer-status-${a.id}" data-id=`
          )}
        </span>
      </div>
      ${row('Datum',    formatDate(a.app_date))}
      ${row('Jobtitel', esc(a.jobtitle))}
      ${a.link ? row('Link', `<a href="${esc(a.link)}" target="_blank">Stellenanzeige ↗</a>`, true) : ''}
    </div>

    ${hasContact ? `
    <div class="drawer-section">
      <div class="drawer-section-title">Ansprechpartner</div>
      ${row('Name',     esc(a.contact_name))}
      ${row('Position', esc(a.contact_position))}
      ${a.contact_email
        ? row('E-Mail', `<a href="mailto:${esc(a.contact_email)}">${esc(a.contact_email)}</a>`, true)
        : ''}
      ${row('Telefon',  esc(a.contact_phone))}
    </div>` : ''}

    ${a.notes ? `
    <div class="drawer-section">
      <div class="drawer-section-title">Notizen</div>
      <div class="drawer-notes">${esc(a.notes)}</div>
    </div>` : ''}

    <div class="drawer-section">
      <div class="drawer-section-title">Meta</div>
      ${row('Erfasst am', formatDateTime(a.created_at))}
    </div>
  `;

  document.getElementById('drawerOverlay').classList.add('open');
  document.getElementById('drawer').classList.add('open');
}

function closeDrawer() {
  document.getElementById('drawerOverlay').classList.remove('open');
  document.getElementById('drawer').classList.remove('open');
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeDrawer();
});

/* ── Helpers ── */
function row(label, value, raw = false) {
  if (!value) return '';
  return `
    <div class="drawer-row">
      <span class="dr-label">${label}</span>
      <span class="dr-val">${raw ? value : esc(value)}</span>
    </div>`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(dtStr) {
  if (!dtStr) return '—';
  const d = new Date(dtStr);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' · '
    + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}
