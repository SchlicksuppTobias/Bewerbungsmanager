/* ═══════════════════════════════════════════
   app.js – shared utilities & API layer
   ═══════════════════════════════════════════ */

const API = 'api.php';

/* ── Escape HTML ── */
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Toast ── */
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `show ${type}`;
  setTimeout(() => { t.className = ''; }, 3200);
}

/* ── API: fetch all applications ── */
async function fetchApplications() {
  const res  = await fetch(API);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

/* ── API: save new application ── */
async function postApplication(data) {
  const res  = await fetch(API, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json;
}

/* ── Badge HTML helper ── */
function badgeHtml(status) {
  return `<span class="badge badge-${esc(status)}">${esc(status)}</span>`;
}

/* ── Collapsible contact block (used on index.html) ── */
function toggleContact() {
  const toggle = document.getElementById('contactToggle');
  const body   = document.getElementById('contactBody');
  if (!toggle || !body) return;
  toggle.classList.toggle('open');
  body.classList.toggle('open');
}

/* ── API: update status ── */
async function patchStatus(id, status) {
  const res  = await fetch(API, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ id, status }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json;
}
