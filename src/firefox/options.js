/* RTPS Pro by PakkaScore — Original, MIT License — Always FREE, never asks for money on WhatsApp
   Source: https://github.com/PakkaScore/rtps-pro — Copyright (c) 2026 PakkaScore */
(async () => { await I18N.init(); I18N.apply(); document.querySelectorAll('#langsw button').forEach(b => b.onclick = async () => { await I18N.set(b.dataset.lang); I18N.apply(); }); })();
const $ = id => document.getElementById(id);
const DEF = { autoDraft: true, highlight: true, dependentWait: 6000, fillDelay: 250 };
let profiles = {}, curP = '', curF = '', advanced = false;

function msg(t) { const m = $('msg'); m.textContent = t; m.style.display = 'block'; clearTimeout(msg.t); msg.t = setTimeout(() => m.style.display = 'none', 2500); }

/* settings */
async function loadSettings() {
  const s = Object.assign({}, DEF, (await (chrome.storage.sync || chrome.storage.local).get('rtpsSettings')).rtpsSettings || {});
  $('autoDraft').checked = s.autoDraft; $('highlight').checked = s.highlight; $('dependentWait').value = s.dependentWait;
}
async function saveSettings() {
  await (chrome.storage.sync || chrome.storage.local).set({ rtpsSettings: { ...DEF, autoDraft: $('autoDraft').checked, highlight: $('highlight').checked, dependentWait: +$('dependentWait').value || 6000 } });
  msg(I18N.lang === 'hi' ? 'सेटिंग्स सेव हुईं' : 'Settings saved');
}
for (const id of ['autoDraft', 'highlight', 'dependentWait']) $(id).addEventListener('change', saveSettings);
$('btnShortcuts').onclick = () => chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }).catch(() => msg(I18N.lang === 'hi' ? 'chrome://extensions/shortcuts स्वयं खोलें' : 'Open chrome://extensions/shortcuts manually'));
document.addEventListener('click', e => { const a = e.target.closest('#lnkRtps'); if (a) { e.preventDefault(); chrome.tabs.create({ url: 'https://serviceonline.bihar.gov.in/' }); } });

/* editor */
async function loadProfiles() {
  profiles = (await chrome.storage.local.get('rtpsProfiles')).rtpsProfiles || {};
  const names = Object.keys(profiles).sort();
  $('emptyHint').style.display = names.length ? 'none' : '';
  $('profileSel').replaceChildren(...names.map(n => Object.assign(document.createElement('option'), { textContent: n })));
  if (!profiles[curP]) curP = names[0] || '';
  $('profileSel').value = curP; renderForms();
}
function renderForms() {
  const forms = curP ? profiles[curP].forms || {} : {};
  const ids = Object.keys(forms);
  $('formSel').replaceChildren(...ids.map(id => {
    const o = document.createElement('option');
    o.value = id; o.textContent = (forms[id].serviceName || 'Form ' + id) + ' (' + (forms[id].fields || []).length + ')';
    return o;
  }));
  if (!forms[curF]) curF = ids[0] || '';
  $('formSel').value = curF; renderTable();
}
function renderTable() {
  const box = $('fields'); box.innerHTML = '';
  const fields = curP && curF ? profiles[curP].forms[curF].fields : [];
  const types = ['text', 'select', 'radio', 'checkbox', 'textarea', 'number', 'email', 'tel', 'date'];
  fields.forEach((f, i) => {
    const d = document.createElement('div'); d.className = 'fld' + (advanced ? ' open' : '');
    const kind = f.tag === 'select' ? 'select' : (f.type || 'text');
    renderHTML(d, `<div class="top"><span class="lab" title="${esc(f.label || '')}">${esc(f.label || '(no label)')}</span><span class="kind">${esc(kind)}</span><button data-adv="${i}" title="ID / name / type">⋯</button><button class="danger" data-del="${i}">✕</button></div>
      <div class="val"><input data-k="value" value="${esc(f.value || '')}" placeholder="Value"><input data-k="text" value="${esc(f.text || '')}" placeholder="Display text (dropdowns)" style="flex:.8"></div>
      <div class="adv"><span><label>Label</label><input data-k="label" value="${esc(f.label || '')}"></span><span><label>Type</label><select data-k="type">${types.map(t => `<option ${t === kind ? 'selected' : ''}>${t}</option>`).join('')}</select></span><span><label>ID</label><input data-k="id" value="${esc(f.id || '')}"></span><span><label>Name</label><input data-k="name" value="${esc(f.name || '')}"></span></div>`);
    box.appendChild(d);
  });
  box.querySelectorAll('[data-adv]').forEach(b => b.onclick = () => b.closest('.fld').classList.toggle('open'));
}
$('btnAdv').onclick = () => { advanced = !advanced; renderTable(); };
function collect() {
  const rows = [...$('fields').querySelectorAll('.fld')];
  return rows.map(tr => {
    const g = k => tr.querySelector(`[data-k="${k}"]`).value;
    const type = g('type');
    return { label: g('label'), id: g('id'), name: g('name'), tag: type === 'select' ? 'select' : type === 'textarea' ? 'textarea' : 'input', type: type === 'select' ? 'select-one' : type, value: g('value'), text: g('text') };
  });
}
$('profileSel').onchange = e => { curP = e.target.value; curF = ''; renderForms(); };
$('formSel').onchange = e => { curF = e.target.value; renderTable(); };
$('fields').addEventListener('click', e => { if (e.target.dataset.del != null) { profiles[curP].forms[curF].fields = collect(); profiles[curP].forms[curF].fields.splice(+e.target.dataset.del, 1); renderTable(); } });
$('btnAddRow').onclick = () => { if (!curP) return; profiles[curP].forms[curF].fields = collect(); profiles[curP].forms[curF].fields.push({ label: '', id: '', name: '', tag: 'input', type: 'text', value: '', text: '' }); renderTable(); };
$('btnSaveEdits').onclick = async () => {
  if (!curP || !curF) return;
  profiles[curP].forms[curF].fields = collect().filter(f => f.label || f.id || f.name);
  profiles[curP].updatedAt = new Date().toISOString();
  await chrome.storage.local.set({ rtpsProfiles: profiles }); msg(I18N.lang === 'hi' ? 'प्रोफ़ाइल सेव हुई' : 'Profile saved'); renderForms();
};
$('btnRename').onclick = async () => {
  const n = prompt(I18N.lang === 'hi' ? 'नया नाम:' : 'New name:', curP); if (!n || n === curP || profiles[n]) return;
  profiles[n] = { ...profiles[curP], name: n }; delete profiles[curP]; curP = n;
  await chrome.storage.local.set({ rtpsProfiles: profiles }); loadProfiles();
};
$('btnDuplicate').onclick = async () => {
  const n = prompt(I18N.lang === 'hi' ? 'कॉपी का नाम:' : 'Name for the copy:', curP + ' (copy)'); if (!n || profiles[n]) return;
  profiles[n] = JSON.parse(JSON.stringify({ ...profiles[curP], name: n })); delete profiles[n].example; curP = n;
  await chrome.storage.local.set({ rtpsProfiles: profiles }); loadProfiles();
};
$('btnDeleteProfile').onclick = async () => { if (curP && confirm(I18N.lang === 'hi' ? `"${curP}" हटाएँ?` : `Delete "${curP}"?`)) { delete profiles[curP]; curP = ''; await chrome.storage.local.set({ rtpsProfiles: profiles }); loadProfiles(); } };

/* backup */
$('btnExport').onclick = () => {
  const blob = new Blob([JSON.stringify({ app: 'RTPS Pro', version: 2, exportedAt: new Date().toISOString(), profiles }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `rtps-pro-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
  chrome.storage.local.get('backupMeta').then(({ backupMeta: m = {} }) => chrome.storage.local.set({ backupMeta: { ...m, saves: 0, lastExport: Date.now(), snoozedAt: 0 } }));
};
$('btnImport').onclick = () => $('importFile').click();
$('importFile').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const j = JSON.parse(await f.text()); const inc = j.profiles || j; let added = 0, skipped = 0, merged = [];
    const existingNames = new Set(Object.keys(profiles).map(n => n.toLowerCase()));
    for (const [name, p] of Object.entries(inc)) {
      if (existingNames.has(name.toLowerCase())) { skipped++; continue; }
      if (p && typeof p === 'object' && p.forms && typeof p.forms === 'object') { profiles[name] = { ...p, name }; added++; merged.push(name); existingNames.add(name.toLowerCase()); }
      else if (p && p.formData) {
        const sid = ((p.url || '').match(/serviceId=(\d+)/) || [])[1] || 'legacy';
        profiles[name] = { name, createdAt: p.savedAt, updatedAt: p.savedAt, forms: { [sid]: { schema: 2, serviceId: sid, url: p.url, savedAt: p.savedAt, fields: Object.entries(p.formData).map(([k, v]) => ({ id: '', name: '', label: k.replace(/_/g, ' '), tag: 'input', type: 'text', value: String(v), text: String(v) })) } } }; added++; merged.push(name); existingNames.add(name.toLowerCase());
      }
    }
    await chrome.storage.local.set({ rtpsProfiles: profiles }); loadProfiles();
    if (added && skipped) msg(I18N.lang === 'hi' ? `${added} जोड़े, ${skipped} छोड़े (नाम पहले से है)` : `Added ${added}, Skipped ${skipped} (duplicate name)`);
    else if (added) msg(I18N.t('s_imported', { n: added }));
    else if (skipped) msg(I18N.lang === 'hi' ? 'सभी नाम पहले से हैं — कोई नया नहीं जोड़ा' : 'All names already exist — nothing added');
    try { const hist = (await chrome.storage.local.get('rtpsHistory')).rtpsHistory || []; hist.unshift({ts: Date.now(), action: 'import', profile: merged.join(', ').slice(0,100), form: `${added} added`, url: ''}); if (hist.length>20) hist.length=20; await chrome.storage.local.set({rtpsHistory: hist}); } catch {}
  } catch { msg(I18N.lang === 'hi' ? 'गलत फ़ाइल' : 'Invalid file'); }
  e.target.value = '';
};

/* history — lightweight, metadata only */
async function loadHistory() {
  const { rtpsHistory = [] } = await chrome.storage.local.get('rtpsHistory');
  const list = $('historyList'), empty = $('historyEmpty');
  list.innerHTML = '';
  if (!rtpsHistory.length) { empty.style.display = ''; return; }
  empty.style.display = 'none';
  for (const h of rtpsHistory) {
    const d = document.createElement('div');
    d.className = 'fld';
    const date = new Date(h.ts).toLocaleString(I18N.lang === 'hi' ? 'hi-IN' : 'en-IN', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'});
    const action = h.action === 'fill' ? (I18N.lang==='hi' ? 'भरा' : 'Filled') : h.action === 'save' ? (I18N.lang==='hi' ? 'सेव' : 'Saved') : h.action === 'import' ? (I18N.lang==='hi' ? 'इम्पोर्ट' : 'Import') : h.action;
    d.innerHTML = `<div class="top"><span class="lab">${esc(h.profile||'')} — ${esc(h.form||'')}</span><span class="kind">${esc(action)} • ${esc(date)}</span></div><small style="color:var(--mut)">${esc(h.url||'').slice(0,80)}</small>`;
    list.appendChild(d);
  }
}
$('btnClearHistory')?.addEventListener('click', async () => {
  if (confirm(I18N.lang==='hi' ? 'हिस्ट्री हटाएँ?' : 'Clear history?')) {
    await chrome.storage.local.remove('rtpsHistory');
    loadHistory();
  }
});


$('btnWipe').onclick = async () => { if (confirm(I18N.lang === 'hi' ? 'सारी प्रोफ़ाइल, ड्राफ़्ट और सेटिंग्स हटाएँ? यह वापस नहीं हो सकता।' : 'Delete ALL profiles, drafts and settings? This cannot be undone.')) { const lang = I18N.lang; await chrome.storage.local.clear(); await (chrome.storage.sync || chrome.storage.local).clear(); await chrome.storage.local.set({ lang }); await chrome.runtime.sendMessage({ action: 'restoreExample' }).catch(() => {}); await loadProfiles(); loadSettings(); msg(I18N.lang === 'hi' ? 'सारा डेटा हटा दिया गया' : 'All data deleted'); } };

function renderHTML(el, html) {
    var doc = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html');
    el.replaceChildren.apply(el, Array.from(doc.body.childNodes).map(function(n){ return document.importNode(n, true); }));
}

function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

/* boot */
if (location.hash.includes('welcome')) $('welcome').classList.remove('hidden');
const m = location.hash.match(/editor=([^&]*)/); if (m) curP = decodeURIComponent(m[1]);
loadSettings(); loadProfiles(); loadHistory();

/* sidebar nav highlight */
/* tabs: one section at a time */
const SECTIONS = ['settings', 'editor', 'backup', 'history', 'help'];
function showTab(t) {
  if (!SECTIONS.includes(t)) t = 'settings';
  SECTIONS.forEach(id => $(id).classList.toggle('hidden', id !== t));
  document.querySelectorAll('.nav').forEach(a => a.classList.toggle('on', a.dataset.t === t));
  window.scrollTo(0, 0);
}
document.querySelectorAll('.nav').forEach(a => a.addEventListener('click', e => { e.preventDefault(); history.replaceState(null, '', '#' + a.dataset.t); showTab(a.dataset.t); }));
showTab(location.hash.includes('editor') ? 'editor' : location.hash.includes('welcome') ? 'settings' : (location.hash.replace('#', '').replace(/(^|&)from=popup/, '').replace(/^&/, '') || 'settings'));
if (!('ontouchstart' in window)) document.querySelectorAll('.kb-only').forEach(e => e.classList.remove('hidden'));

// opened inside the popup view (mobile): show a back arrow that returns to the popup
if (/[#&]from=popup/.test(location.hash)) {
  const bb = document.getElementById('backPop');
  if (bb) { bb.classList.remove('hidden'); bb.onclick = () => { location.replace(chrome.runtime.getURL('popup.html')); }; }
}
