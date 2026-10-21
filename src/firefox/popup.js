/* RTPS Pro by PakkaScore — Original, MIT License
   Author: PakkaScore (PakkaScore@gmail.com)
   Source: https://github.com/PakkaScore/rtps-pro
   AMO: https://addons.mozilla.org/en-US/firefox/addon/rtps-pro/
   Always FREE — never asks for money on WhatsApp. Beware of paid copies demanding payment.
   Copyright (c) 2026 PakkaScore – popup */
const $ = id => document.getElementById(id);
const RTPS = 'https://serviceonline.bihar.gov.in/';          // homepage only — never deep-link to forms
// form kinds (order = display order)
const KINDS = ['caste', 'income', 'residence', 'obc', 'ncl', 'ews'];
const KIND_SHORT = { caste: 'जाति', income: 'आय', residence: 'निवास', obc: 'OBC', ncl: 'NCL', ews: 'EWS' };
const T = (k, v) => I18N.t(k, v);
const KIND_LONG = new Proxy({}, { get: (_, k) => KINDS.includes(k) ? T('kind_' + k) : undefined });
const SID_KIND = { '4650013': 'caste', '4640012': 'income', '4630012': 'residence', '9330011': 'obc', '10430013': 'ews', 'ncl': 'ncl' };
const kindOf = f => (f && (f.kind || SID_KIND[f.serviceId])) || '';
const kindsOf = p => { const set = new Set(); for (const f of Object.values((p && p.forms) || {})) { const k = kindOf(f); if (k) set.add(k); } return set; };
const pageKind = () => (pageInfo && (pageInfo.kind || SID_KIND[pageInfo.serviceId])) || '';
let tab = null, pageOk = false, pageInfo = null, selected = '', profiles = {}, staticTip = null;
/* Pakka Tip — partial fill: form open, selected (non-example) profile lacks this form but has another saved → explain borrow + update. Dismissable per profile+form. */
const BORROW_PREF = { caste: ['obc', 'ncl', 'residence', 'income'], income: ['residence', 'caste', 'ews'], residence: ['income', 'caste', 'ews'], obc: ['ncl', 'caste'], ncl: ['obc', 'caste'], ews: ['residence', 'income', 'caste'] };
let tipDismissed = {};
function renderPartialTip() {
  const tipEl = $('tip');
  if (staticTip) return; // homepage / no-form tips take precedence
  const k = pageKind(); const p = profiles[selected];
  let show = false, html = '';
  if (k && p && !p.example && pageOk && pageInfo && pageInfo.isForm !== false) {
    const ks = kindsOf(p);
    if (!ks.has(k) && ks.size) {
      const src = (BORROW_PREF[k] || []).find(x => ks.has(x)) || [...ks][0];
      const key = selected + '|' + k;
      if (!tipDismissed[key]) { show = true; html = T('tip_partial', { k: KIND_SHORT[k], s: KIND_SHORT[src], n: displayName(selected) }); }
    }
  }
  setCls(tipEl, 'hidden', !show); setCls(tipEl, 'dismissable', show); setCls($('tipClose'), 'hidden', !show);
  if (show) setHTML('tipBody', html);
}
const tipDismissedReady = chrome.storage.local.get('tipDismissed').then(r => { tipDismissed = r.tipDismissed || {}; });

const store = {
  async profiles() { return (await chrome.storage.local.get('rtpsProfiles')).rtpsProfiles || {}; },
  async setProfiles(p) { return chrome.storage.local.set({ rtpsProfiles: p }); },
  async last() { return (await chrome.storage.local.get('lastProfile')).lastProfile || ''; },
  async setLast(n) { return chrome.storage.local.set({ lastProfile: n }); }
};
// 3.9.6 — usage stats + review meta (100% local, no network)
const usageStore = {
  async get() { return (await chrome.storage.local.get('usageStats')).usageStats || { fills: 0, boxes: 0, saves: 0, firstRealAt: 0 }; },
  async set(u) { return chrome.storage.local.set({ usageStats: u }); },
  async incFill(boxes, isReal) {
    if (!isReal) return;
    const u = await this.get();
    u.fills = (u.fills||0)+1;
    u.boxes = (u.boxes||0)+ (boxes||0);
    if (!u.firstRealAt) u.firstRealAt = Date.now();
    await this.set(u);
    return u;
  },
  async incSave(isReal) {
    if (!isReal) return;
    const u = await this.get();
    u.saves = (u.saves||0)+1;
    if (!u.firstRealAt) u.firstRealAt = Date.now();
    await this.set(u);
    return u;
  }
};
const reviewStore = {
  async get() { return (await chrome.storage.local.get('reviewMeta')).reviewMeta || { firefox: { shown:0, lastShown:0, snoozedAt:0, dismissed:false, rated:false }, edge: { shown:0, lastShown:0, snoozedAt:0, dismissed:false, rated:false }, github: { shown:0, lastShown:0, snoozedAt:0, dismissed:false, starred:false } }; },
  async set(r) { return chrome.storage.local.set({ reviewMeta: r }); }
};
const IS_FIREFOX = /Firefox|Fenix/i.test(navigator.userAgent);
const IS_EDGE = /Edg\//i.test(navigator.userAgent);
let usageStats = { fills:0, boxes:0, saves:0, firstRealAt:0 };
let reviewMeta = { firefox: { shown:0, lastShown:0, snoozedAt:0, dismissed:false, rated:false }, edge: { shown:0, lastShown:0, snoozedAt:0, dismissed:false, rated:false }, github: { shown:0, lastShown:0, snoozedAt:0, dismissed:false, starred:false } };
const svg = (id, cls = 'i sm') => `<svg class="${cls}"><use href="#${id}"/></svg>`;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const _htmlCache = new WeakMap();
const renderHTML = (el, html) => {
  if (_htmlCache.get(el) === html) return;
  _htmlCache.set(el, html);
  const doc = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html');
  el.replaceChildren(...Array.from(doc.body.childNodes).map(n => document.importNode(n, true)));
};

const initials = n => (n || '?').replace(/^📘\s*/, '').replace(/Example\s*[–-]\s*/i, '').replace(/\(.*?\)/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
const displayName = n => n.replace(/^📘\s*Example\s*[–-]\s*/i, '');
const ago = iso => { if (!iso) return ''; const d = (Date.now() - new Date(iso)) / 864e5; return d < 1 ? T('today') : d < 2 ? T('yesterday') : d < 30 ? T('days_ago', { n: Math.floor(d) }) : new Date(iso).toLocaleDateString(I18N.lang === 'hi' ? 'hi-IN' : 'en-IN'); };

function status(msg, kind = 'ok', ms = 3500) {
  const s = $('status'); s.textContent = msg; s.className = 'status ' + kind;
  clearTimeout(status.t); status.t = setTimeout(() => s.className = 'status', ms);
}
async function send(msg) {
  if (!tab) throw new Error('no tab');
  try { return await chrome.tabs.sendMessage(tab.id, msg); }
  catch { return chrome.runtime.sendMessage({ action: 'sendToTab', tabId: tab.id, msg }); }
}
async function findRtpsTab() {
  const [active] = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
  if (active && active.url && active.url.startsWith(RTPS)) return active;
  const all = await chrome.tabs.query({ url: RTPS + '*' }).catch(() => []);
  if (!all.length) return null;
  all.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0) || (b.active - a.active));
  return all.find(t => /serviceId=|renderApplicationForm/.test(t.url)) || all[0];
}

function setFillState(info) {
  const el = $('ctxRight'); const note = $('reqNote');
  if (!info || !info.total) { el.textContent = ''; el.className = ''; note.classList.add('hidden'); return; }
  // Count only mandatory (*) fields — the ones the portal will refuse without. Optional extras (Aadhaar, email…) are shown separately, never as a percentage.
  const rt = info.reqTotal || 0, rf = info.reqFilled || 0, opt = info.optFilled || 0, n = info.fieldCount || 0, t = info.total;
  const has = rt > 0;
  // left number = everything answered (mandatory + optional), right number = how many the portal insists on (★). 40/38 is normal and good.
  const filled = has ? rf + opt : n, need = has ? rt : t, left = has ? rt - rf : Math.max(0, t - n);
  let cls, html, ttl = '';
  if (filled === 0) { cls = 'dim'; html = `0/${need} ★ · ${T('st_empty')}`; }
  else if (has && left === 0) { cls = 'ok'; html = `${svg('i-check')}${filled}/${need} ★ · ${T('st_ready')}`; ttl = T('ready_title'); }
  else if (!has && n >= t * 0.9) { cls = 'ok'; html = `${svg('i-check')}${filled}/${need} · ${T('st_ready')}`; }
  else { cls = 'mid'; html = `${filled}/${need} ★ · ${T('st_left', { n: left })}`; }
  if (el.className !== cls) el.className = cls; renderHTML(el, html); if (el.title !== ttl) el.title = ttl;
  const miss = (info.missing || []).slice(0, 4).join(', ');
  note.classList.remove('hidden');
  const nh = has
    ? (left === 0 ? T('note_done', { f: filled, r: rf, o: opt })
                  : T('note_left', { n: left }) + (miss ? `: <i>${esc(miss)}${(info.missing || []).length > 4 ? '…' : ''}</i>` : '') + (opt ? ` &nbsp;·&nbsp; ${T('note_opt', { n: opt })}` : ''))
    : T('note_plain', { n, t });
  renderHTML(note, nh);
}

let initRun = 0, firstPaint = true;

/* change-only DOM setters: nothing is touched unless the value really differs → no flicker on re-sync / language switch */
const setText = (id, v) => { const el = $(id); if (el.textContent !== v) el.textContent = v; };
const setHTML = (id, v) => renderHTML($(id), v);
const setCls = (el, c, on) => { if (el.classList.contains(c) !== !!on) el.classList.toggle(c, !!on); };
const setDis = (id, on) => { const el = $(id); if (el.disabled !== !!on) el.disabled = !!on; };
const IS_MOBILE = /Android|Mobile/i.test(navigator.userAgent);
let IS_TAB_PAGE = false;
async function init() {
  try { await initInner(); } catch (e) { console.warn('[RTPS Pro] init', e); } finally { if (firstPaint) { firstPaint = false; document.body.classList.add('ready'); } }
}
async function initInner() {
  const run = ++initRun; await tipDismissedReady;
  try { const me = await chrome.tabs.getCurrent(); if (me) { IS_TAB_PAGE = true; document.body.classList.add('as-tab'); } } catch {}
  // Firefox for Android shows the popup as a full-screen view (not a tab): treat it like a tab so the layout fills the screen
  if (IS_MOBILE || window.innerWidth > 420) document.body.classList.add('as-tab');
  if (!('ontouchstart' in window)) document.body.classList.add('has-kb');
  // 1) gather state first (async) — the old UI stays exactly as it is meanwhile
  const newTab = await findRtpsTab();
  let info = null;
  if (newTab) { tab = newTab; try { info = await send({ action: 'ping' }); } catch { info = null; } }
  if (run !== initRun) return; // a newer init superseded this one
  tab = newTab; pageOk = !!tab; pageInfo = info;
  profiles = await store.profiles();
  const last = await store.last();
  usageStats = await usageStore.get();
  reviewMeta = await reviewStore.get();
  if (!profiles[selected]) selected = profiles[last] ? last : (Object.keys(profiles)[0] || '');
  if (run !== initRun) return;
  // 2) paint once, change-only
  I18N.apply();
  // 3.9.6 integrity check (100% local, no network) — if manifest author/homepage changed, warn
  try {
    const mf = chrome.runtime.getManifest();
    const isOrig = (mf.author||'').includes('PakkaScore') && (mf.homepage_url||'').includes('pakkascore.blogspot.com');
    if (!isOrig) {
      console.warn('[RTPS Pro] Possible modified copy');
      // show subtle official notice in help strip sub
      setTimeout(()=> {
        const hs = document.querySelector('#lnkHelp small');
        if (hs) hs.textContent = I18N.t('rv_official');
      }, 200);
    }
  } catch {}
  const ctx = $('ctx');
  const k = pageKind();
  const isForm = pageOk && pageInfo && pageInfo.isForm !== false && (k || pageInfo.total > 10);
  const isTimeout = pageOk && pageInfo && pageInfo.isSessionTimeout;
  let title, sub, on = false, tip = null, fillDis = false, saveDis = false, clearDis = true, showOpen = false;
  if (isTimeout) { title = T('t_session_title'); sub = T('t_session_sub'); fillDis = saveDis = true; showOpen = true; tip = T('t_session'); on = false; }
  else if (!pageOk) { title = T('no_form'); sub = T('no_form_sub'); fillDis = saveDis = true; showOpen = true; tip = T('tip_default'); }
  else if (!pageInfo) { title = T('rtps_page'); sub = T('rtps_reload'); on = true; }
  else if (!isForm) { title = T('home_open'); sub = T('home_open_sub'); fillDis = saveDis = true; tip = T('tip_home'); }
  else { title = KIND_LONG[k] || T('form_generic'); sub = k ? T('form_sub') : 'serviceonline.bihar.gov.in'; on = true; clearDis = !((pageInfo.fieldCount || 0) > 0); }
  setCls(ctx, 'on', on); setText('ctxTitle', title); setText('ctxSub', sub);
  setDis('btnFill', fillDis); setDis('btnSave', saveDis); setDis('btnClear', clearDis);
  setCls($('btnOpenRtps'), 'hidden', !showOpen); setCls($('btnFill'), 'primary', !showOpen);
  if (isTimeout) {
    // Relogin button on portal redirects to homepage — our Open button does same
    const ob = $('btnOpenRtps');
    if (ob) {
      const spans = ob.querySelectorAll('span span');
      if (spans[0]) spans[0].textContent = T('t_relogin');
      if (spans[1]) spans[1].textContent = 'serviceonline.bihar.gov.in';
    }
  }
  staticTip = tip; setCls($('tipClose'), 'hidden', true); setCls($('tip'), 'dismissable', false); setCls($('tip'), 'hidden', !tip); if (tip) setHTML('tipBody', tip);
  if (isForm) setFillState(pageInfo); else { setText('ctxRight', ''); $('ctxRight').className = ''; setCls($('reqNote'), 'hidden', true); }
  renderCurrent(); renderList($('search').value); renderBackupNudge(); renderReviewNudge();
}
async function refresh() {
  profiles = await store.profiles();
  const last = await store.last();
  usageStats = await usageStore.get();
  reviewMeta = await reviewStore.get();
  if (!profiles[selected]) selected = profiles[last] ? last : (Object.keys(profiles)[0] || '');
  renderCurrent(); renderList($('search').value); renderBackupNudge(); renderReviewNudge();
}
function formBadges(p, big) {
  const ks = kindsOf(p);
  // big (selected-profile card): show how many fields each saved form holds, e.g. "निवास 22" — a low number = saved half-done
    const cnt = {}; if (big) for (const f of Object.values((p && p.forms) || {})) { const k = kindOf(f); if (k) cnt[k] = (f.fields || []).length; }
    return KINDS.map(k => ks.has(k) ? `<span class="bdg ok">${svg('i-check', 'i')}${KIND_SHORT[k]}${big && cnt[k] ? `<b>${cnt[k]}</b>` : ''}</span>` : (big ? '' : `<span class="bdg">${KIND_SHORT[k]}</span>`)).join('');
}
function renderCurrent() {
  const p = profiles[selected];
  const p0 = profiles[selected];
  // Always ensure delete button not stuck glowing after deletion/refresh
  try { const db = $('btnDelCard'); if (db) { db.dataset.armed = ''; db.classList.remove('armed'); if (db._armTimer) { clearTimeout(db._armTimer); db._armTimer = null; } if (db._disarm) { document.removeEventListener('click', db._disarm, true); db._disarm = null; } } } catch {}
  const canUpdate = p0 && !p0.example;
  setCls($('saverow'), 'solo', !canUpdate);
  if (canUpdate) {
    // Issue-1 fix (3.9.5): decide readiness from what is ACTUALLY on the page right now (mandatory fields, else raw count),
    // never from the delta vs. the injection-time baseline — that baseline is wrong after Firefox restores a discarded tab
    // with the form already filled (fieldCount = 0 although the form is full).
    const rf = pageInfo ? (pageInfo.reqFilled || 0) : 0, rt = pageInfo ? (pageInfo.reqTotal || 0) : 0;
    const raw = pageInfo ? (pageInfo.raw || 0) : 0, rawT = pageInfo ? (pageInfo.rawTotal || 0) : 0;
    const n = rt ? rf + (pageInfo.optFilled || 0) : raw, t = rt || rawT;
    const ready = pageOk && pageInfo && pageInfo.isForm !== false && (rt ? rf / rt >= 0.5 : (rawT && raw / rawT >= 0.5) || raw >= 5);
    setDis('btnSave', !ready);
    setText('saveLbl', T('update_x', { n: displayName(selected) }));
    setText('saveSub', ready ? T('update_sub_ok', { n }) : (pageOk ? T('update_sub_fill') : T('update_sub_open')));
  }
  // onboarding card: only example (or nothing) saved yet
  const real = Object.keys(profiles).filter(n => !profiles[n].example).length;
  setCls($('howto'), 'hidden', real > 0);
  // Restore example only makes sense once an example has been deleted
  const examplesPresent = Object.values(profiles).filter(p => p.example).length;
  setDis('btnExample', examplesPresent >= 2);
  const et = examplesPresent >= 2 ? T('restore_disabled') : ''; if ($('btnExample').title !== et) $('btnExample').title = et;
  const wrap=$('picker').querySelector('.prof-wrap');
  if (!p) { renderPartialTip(); setText('avatar', '?'); $('avatar').className = 'av'; setText('pName', T('no_profile')); setText('pMeta', T('no_profile_sub')); setHTML('pBadges', ''); if(wrap) wrap.classList.add('no-profile'); return; }
  if(wrap) wrap.classList.remove('no-profile');
  // 3.9.9 fix: allow actions even on example profiles — user can duplicate example to test, edit it, delete it (Restore example exists for recovery)
  setDis('btnDupCard', !selected); setDis('btnEditCard', !selected); setDis('btnDelCard', !selected);
  setText('avatar', initials(selected)); const ac = 'av' + (p.example ? '' : ' n'); if ($('avatar').className !== ac) $('avatar').className = ac;
  setText('pName', displayName(selected));
  const f = Object.values(p.forms || {})[0] || {}; const g = k => (f.fields || []).find(x => new RegExp(k, 'i').test(x.label || ''));
  const parts = [];
  if (p.example) parts.push((p.note ? p.note.split('.')[0].replace(/^[^–]*–\s*/, '') : T('example')) + ' · ' + T('example_meta'));
  else { for (const k of ['^district|जिला', 'block|प्रखंड|अंचल']) { const x = g(k); if (x && x.text) parts.push(x.text); } if (!parts.length) parts.push(T('fields_n', { n: Object.values(p.forms || {}).reduce((a, f) => a + (f.fields || []).length, 0) })); parts.push(T('updated', { t: ago(p.updatedAt || p.createdAt) })); }
  setText('pMeta', parts.join(' · '));
  setHTML('pBadges', (p.example ? `<span class="bdg ex">${T('example').toUpperCase()}</span>` : '') + formBadges(p, true));
  renderPartialTip();
}
function renderList(q = '') {
  const names = Object.keys(profiles).sort((a, b) => (profiles[b].updatedAt || '').localeCompare(profiles[a].updatedAt || ''));
  const ql = q.trim().toLowerCase();
  const rows = names.filter(n => !ql || n.toLowerCase().includes(ql)).map(n => {
    const p = profiles[n], ks = kindsOf(p); const dots = KINDS.map(k => `<i class="${ks.has(k) ? 'on' : ''}" title="${KIND_SHORT[k]}"></i>`).join('');
    return `<div class="item${n === selected ? ' sel' : ''}" data-n="${esc(n)}"><span class="av${p.example ? '' : ' n'}">${esc(initials(n))}</span><span><b>${esc(displayName(n))}</b><small>${p.example ? T('example') : ago(p.updatedAt || p.createdAt)}</small></span><span class="dots">${dots}</span></div>`;
  });
  const lh = rows.join('') || `<div class="empty">${names.length ? T('no_match') : T('no_profiles')}</div>`;
  renderHTML($('items'), lh);
  const ph = T('search_ph', { n: names.length }); if ($('search').placeholder !== ph) $('search').placeholder = ph;
  searchRow.classList.toggle('hidden', names.length < 4 && !ql);
  $('items').querySelectorAll('.item').forEach(el => el.onclick = async () => { selected = el.dataset.n; await store.setLast(selected); toggleList(false); renderCurrent(); renderList(); });
}
function toggleList(open) {
  const o = open === undefined ? $('list').classList.contains('hidden') : open;
  $('list').classList.toggle('hidden', !o); $('picker').classList.toggle('open', o);
  if (!o) $('search').blur();
}
$('curProf').onclick = () => toggleList(); $('btnChange').onclick = () => toggleList();
$('search').oninput = e => renderList(e.target.value);
// search bar only shown when there are enough profiles to need it
const searchRow = $('search').parentElement;

async function saveTo(name) {
  if (!name) return status(T('s_type_name'), 'err');
  const r = await send({ action: 'saveToProfile', name }).catch(() => null);
  if (!r || !r.ok) return status(T('s_read_fail'), 'err');
  $('newProfileName').value = ''; closeSheet(); selected = name; await store.setLast(name);
  // 3.9.6 track saves for review nudge — only real profiles
  try { const isReal = !(profiles[name] && profiles[name].example) && !/^📘/.test(name); await usageStore.incSave(isReal); usageStats = await usageStore.get(); } catch {}
  toggleList(false); await refresh();
  status(T('s_saved', { n: displayName(name) }));
}
/* ---- 3.9.5 identity guard: "is the data on the page really this profile's person?" ----
   Keys (priority): Aadhaar → mobile → applicant name + father's name. Compared in memory only; nothing new is stored. */
const norm = s => (s || '').toString().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const digits = s => (s || '').toString().replace(/\D/g, '');
function identityOf(fields) {
  const id = { aadhaar: '', mobile: '', name: '', father: '' };
  for (const f of fields || []) {
    const l = (f.label || '').toLowerCase(), v = (f.value || f.text || '').trim(); if (!v || f.tag === 'select') continue;
    if (!id.aadhaar && /aadhaar|aadhar|आधार/.test(l) && digits(v).length === 12) id.aadhaar = digits(v);
    else if (!id.mobile && /mobile|मोबाइल/.test(l) && digits(v).length === 10) id.mobile = digits(v);
    else if (!id.name && /^name of applicant|applicant'?s name/.test(l)) id.name = norm(v);
    else if (!id.father && /^name of father|father'?s name/.test(l)) id.father = norm(v);
  }
  return id;
}
function profileIdentity(p) { const all = []; for (const f of Object.values((p && p.forms) || {})) all.push(...(f.fields || [])); return identityOf(all); }
// returns 'match' | 'mismatch' | 'unknown'
function compareIdentity(a, b) {
  let agree = 0, disagree = 0;
  for (const k of ['aadhaar', 'mobile']) if (a[k] && b[k]) (a[k] === b[k] ? agree++ : disagree++);
  if (a.name && b.name) { const same = a.name === b.name || a.name.startsWith(b.name) || b.name.startsWith(a.name); if (same) { if (a.father && b.father) (a.father === b.father ? agree++ : disagree++); else agree++; } else disagree++; }
  if (disagree) return 'mismatch'; if (agree) return 'match'; return 'unknown';
}
function pageWho(id) { return id.name ? id.name.replace(/\b\p{L}/gu, c => c.toUpperCase()) : (id.mobile ? '…' + id.mobile.slice(-4) : ''); }
async function pageIdentity() { try { const r = await send({ action: 'extract' }); return identityOf(r && r.data && r.data.fields); } catch { return identityOf([]); } }
function confirmUpdate(name) {
  const k = pageKind(), f = Object.values(profiles[name].forms || {}).find(x => kindOf(x) === k);
  const n = pageInfo ? Math.max(pageInfo.fieldCount || 0, (pageInfo.reqFilled || 0) + (pageInfo.optFilled || 0)) : 0;
  return f ? T('s_replace', { k: KIND_SHORT[k] || '', n: displayName(name), a: (f.fields || []).length, b: n }) : T('s_add', { k: KIND_SHORT[k] || '', n: displayName(name) });
}
$('btnSave').onclick = async () => {
  if (!selected || profiles[selected].example) return openSheet();
  const pid = await pageIdentity(), verdict = compareIdentity(pid, profileIdentity(profiles[selected]));
  if (verdict === 'mismatch') {
    // who on the page matches an existing (non-example) profile? offer it as the natural fix
    const better = Object.keys(profiles).find(nm => nm !== selected && !profiles[nm].example && compareIdentity(pid, profileIdentity(profiles[nm])) === 'match');
    return openGuard(selected, pageWho(pid), better);
  }
  let q = confirmUpdate(selected); if (verdict === 'unknown' && pid.name) q += '\n\n' + T('g_unknown', { p: pageWho(pid) });
  if (!confirm(q)) return; saveTo(selected);
};
/* mismatch sheet: right profile (if found) · new profile · override (2nd explicit tap) */
function openGuard(sel, who, better) {
  const g = $('gsheet'); g.classList.remove('hidden'); $('sheetBg').classList.remove('hidden');
  renderHTML($('gMsg'), T('g_msg', { p: esc(who || '?'), s: esc(displayName(sel)) }));
  const b = $('gBetter'); if (better) { b.classList.remove('hidden'); setText('gBetterLbl', T('update_x', { n: displayName(better) })); b.onclick = async () => { closeGuard(); selected = better; await store.setLast(better); await refresh(); if (!confirm(confirmUpdate(better))) return; saveTo(better); }; } else b.classList.add('hidden');
  $('gNew').onclick = () => { closeGuard(); openSheet(); };
  const o = $('gOverride'); o.dataset.armed = ''; setText('gOverrideLbl', T('g_override', { s: displayName(sel) })); setText('gOverrideSub', T('g_override_sub'));
  o.onclick = () => { if (!o.dataset.armed) { o.dataset.armed = '1'; o.classList.add('armed'); setText('gOverrideLbl', T('g_override2', { s: displayName(sel) })); setText('gOverrideSub', T('g_override2_sub', { p: who || '?' })); return; } closeGuard(); saveTo(sel); };
  $('gCancel').onclick = closeGuard;
}
function closeGuard() { const g = $('gsheet'); g.classList.add('hidden'); $('sheetBg').classList.add('hidden'); const o = $('gOverride'); o.dataset.armed = ''; o.classList.remove('armed'); }
$('btnNew').onclick = openSheet;
async function openSheet() {
  $('sheet').classList.remove('hidden'); $('sheetBg').classList.remove('hidden');
  const st = $('sheetState'); st.className = 'fstate'; $('btnSaveNew').disabled = false; sheetBlocked = false;
  if (!pageOk) { st.className = 'fstate bad'; st.textContent = T('sheet_noform'); $('btnSaveNew').disabled = true; sheetBlocked = true; return; }
  try { pageInfo = await send({ action: 'ping' }); } catch { pageInfo = null; }
  const n = pageInfo ? (pageInfo.raw || pageInfo.fieldCount || 0) : 0, k = pageKind();
  if (!pageInfo || pageInfo.isForm === false) { st.className = 'fstate bad'; st.textContent = T('sheet_notform'); $('btnSaveNew').disabled = true; sheetBlocked = true; }
  else if (Math.max(pageInfo.fieldCount || 0, pageInfo.raw || 0, (pageInfo.reqFilled || 0) + (pageInfo.optFilled || 0)) < 3) { st.className = 'fstate warn'; renderHTML(st, svg('i-alert') + T('sheet_empty', { n })); }
  else renderHTML(st, svg('i-check') + T('sheet_ok', { k: KIND_SHORT[k] || 'RTPS', n }));
  idHints = null; pageDup = '';
  try { const r = await send({ action: 'extract' }); idHints = identityHints(r && r.data); const pid = identityOf(r && r.data && r.data.fields);
    if (pid.aadhaar || pid.mobile) pageDup = Object.keys(profiles).find(nm => !profiles[nm].example && compareIdentity(pid, profileIdentity(profiles[nm])) === 'match' && (pid.aadhaar && profileIdentity(profiles[nm]).aadhaar === pid.aadhaar || pid.mobile && profileIdentity(profiles[nm]).mobile === pid.mobile)) || ''; } catch {}
  checkNewName();
}
let pageDup = ''; // existing profile that already holds this page's Aadhaar/mobile
// pull disambiguators (birth year, last-4 of mobile, village) out of the open form — used only for name suggestions, never stored
function identityHints(data) {
  const h = {}; if (!data || !data.fields) return h;
  for (const f of data.fields) {
    const l = (f.label || '').toLowerCase(), v = (f.value || f.text || '').trim(); if (!v) continue;
    if (!h.year && /जन्म|birth|dob/.test(l)) { const m = v.match(/(19|20)\d{2}/); if (m) h.year = m[0]; }
    if (!h.mob4 && /mobile|मोबाइल/.test(l) && /^\d{10}$/.test(v.replace(/\D/g, ''))) h.mob4 = v.replace(/\D/g, '').slice(-4);
    if (!h.village && /^(ग्राम|village|गाँव)/.test(l) && !/panchayat|पंचायत/.test(l) && v.length <= 20) h.village = v.split('/')[0].trim();
  }
  return h;
}
function closeSheet() { $('sheet').classList.add('hidden'); $('sheetBg').classList.add('hidden'); $('newProfileName').blur(); $('newProfileName').classList.remove('bad'); const b = $('nameCheck'); if (b) { b.className = 'ncheck hidden'; } }
function closeDupSheet() { $('dupSheet').classList.add('hidden'); $('sheetBg').classList.add('hidden'); const inp=$('dupName'); if(inp){ inp.blur(); inp.classList.remove('bad'); } const b=$('dupCheck'); if(b){ b.className='ncheck hidden'; } }
$('sheetCancel').onclick = closeSheet;
$('dupCancel').onclick = closeDupSheet;
$('sheetBg').onclick = () => { closeSheet(); closeX(); closeGuard(); closeDupSheet(); };
/* Issue-2 fix (3.9.5): a New-profile name must be unique — like an e-mail sign-up. Existing name → red line + suggestions
   (name + birth year / name + last-4 mobile / name + village), no silent merge. Same person → use the Update button. */
let idHints = null, sheetBlocked = false; // idHints: { year, mob4, village } from the open form, filled lazily
function nameTaken(n) { const k = n.toLowerCase(); return Object.keys(profiles).some(x => x.toLowerCase() === k); }
function nameSuggestions(n) {
  const out = []; const h = idHints || {};
  if (h.year) out.push(`${n} ${h.year}`);
  if (h.mob4) out.push(`${n} ${h.mob4}`);
  if (h.village) out.push(`${n} (${h.village})`);
  if (!out.length) out.push(`${n} 2`);
  return out.filter(s => !nameTaken(s)).slice(0, 3);
}
function checkNewName() {
  const n = $('newProfileName').value.trim(), box = $('nameCheck'), inp = $('newProfileName');
  if (!n || !nameTaken(n)) {
    inp.classList.remove('bad'); $('btnSaveNew').disabled = !!sheetBlocked;
    if (pageDup && n) { box.className = 'ncheck warn'; renderHTML(box, `<div class="nc-msg">${svg('i-info', 'i sm')}<span>${T('name_dup_id', { n: esc(displayName(pageDup)) })}</span></div><div class="nc-same"><button type="button" class="link" id="ncDup">${T('update_x', { n: esc(displayName(pageDup)) })} →</button></div>`);
      const d = $('ncDup'); if (d) d.onclick = async () => { closeSheet(); selected = pageDup; await store.setLast(pageDup); await refresh(); $('btnSave').click(); }; }
    else { box.className = 'ncheck hidden'; renderHTML(box, ''); }
    return true;
  }
  inp.classList.add('bad'); $('btnSaveNew').disabled = true;
  const sug = nameSuggestions(n).map(s => `<button type="button" class="sug" data-n="${esc(s)}">${esc(s)}</button>`).join('');
  box.className = 'ncheck';
  renderHTML(box, `<div class="nc-msg">${svg('i-alert', 'i sm')}<span>${T('name_taken', { n: esc(n) })}</span></div>` +
    `<div class="nc-same"><button type="button" class="link" id="ncUpdate">${T('name_same_person')}</button></div>` +
    (sug ? `<div class="nc-sug"><small>${T('name_try')}</small>${sug}</div>` : ''));
  box.querySelectorAll('.sug').forEach(b => b.onclick = () => { inp.value = b.dataset.n; checkNewName(); inp.focus(); });
  const u = $('ncUpdate'); if (u) u.onclick = () => { closeSheet(); selected = Object.keys(profiles).find(x => x.toLowerCase() === n.toLowerCase()) || selected; store.setLast(selected).then(refresh).then(() => { const b = $('btnSave'); if (!b.disabled) b.click(); else status(T('update_sub_fill'), 'err'); }); };
  return false;
}
$('newProfileName').addEventListener('input', checkNewName);
$('btnSaveNew').onclick = () => { const n = $('newProfileName').value.trim(); if (!n) { $('newProfileName').focus(); return status(T('s_type_name'), 'err'); } if (!checkNewName()) { $('newProfileName').focus(); return; } saveTo(n); };
$('newProfileName').addEventListener('keydown', e => { if (e.key === 'Enter') $('btnSaveNew').click(); });

let resTimer = null;
function showResult(kind, title, sub, items) {
  const r = $('result'); r.className = 'result ' + kind;
  clearTimeout(resTimer); r.classList.remove('fade');
  // success fades out by itself after 6 s; warnings/errors stay until closed (they list what to fix)
  if (kind === 'ok') resTimer = setTimeout(() => { r.classList.add('fade'); setTimeout(() => r.classList.add('hidden'), 450); }, 6000);
  $('resTitle').textContent = title; $('resSub').textContent = sub || '';
  renderHTML($('resList'), (items || []).map(t => `<div>${svg(kind === 'err' ? 'i-x' : 'i-alert')}${esc(t)}</div>`).join(''));
  renderHTML($('resIco'), svg(kind === 'err' ? 'i-x' : kind === 'warn' ? 'i-alert' : 'i-check', 'i'));
  $('resHelp').classList.toggle('hidden', kind === 'ok');
}
$('resClose').onclick = () => $('result').classList.add('hidden');
$('tipClose').onclick = async () => { const key = selected + '|' + pageKind(); tipDismissed[key] = Date.now(); await chrome.storage.local.set({ tipDismissed }); renderPartialTip(); };

$('btnFill').onclick = async () => {
  if (!selected) { toggleList(true); return status(T('s_pick'), 'err'); }
  const p = profiles[selected]; if (!p) return;
  const prog = $('progress'); prog.classList.remove('hidden'); $('result').classList.add('hidden'); $('btnFill').disabled = true;
  prog.querySelector('.bar i').style.width = '0'; $('progTxt').textContent = '…'; $('progLbl').textContent = T('preparing');
  const t0 = Date.now(); await store.setLast(selected);
  const asTab = document.body.classList.contains('as-tab') || IS_MOBILE || !tab.active;
  if (IS_MOBILE && !IS_TAB_PAGE) {
    // Firefox Android: the RTPS tab stays frozen while this popup view is open, so hand the job to the background,
    // bring the form tab to the front and close the popup; the page shows the result toast itself.
    // Leave a "pending fill" note in storage; the content script picks it up the moment the page wakes up (visibilitychange / storage.onChanged).
    await chrome.storage.local.set({ pendingFill: { tabId: tab.id, url: tab.url || '', profile: p, ts: Date.now() } });
    await chrome.tabs.update(tab.id, { active: true }).catch(() => {});
    setTimeout(() => window.close(), 150); return;
  }
  const r = await chrome.runtime.sendMessage({ action: 'startFill', tabId: tab.id, profile: p, focusTab: asTab }).catch(e => ({ ok: false, error: e.message }));
  $('btnFill').disabled = false; prog.classList.add('hidden');
  if (!r || !r.ok) { showResult('err', T('fill_fail'), (r && r.error) || T('fill_fail_sub')); $('result').classList.remove('hidden'); return; }
  const rep = r.report, secs = ((Date.now() - t0) / 1000).toFixed(1);
  const items = rep.failed.slice(0, 5).map(f => f + ' — ' + T('res_manual')); if (rep.failed.length > 5) items.push(T('res_more', { n: rep.failed.length - 5 }));
  if (rep.borrowed) items.unshift(T('borrowed', { k: rep.borrowedFrom }));
  // portal-changed hint: this profile already knows this form (not borrowed) yet ≥5 saved fields could not be placed / were missing
  else { const miss = rep.failed.length + (rep.absent || 0); if (miss >= 5 && miss >= 0.3 * (rep.saved || rep.total || 1)) items.push(T('changed_hint', { n: displayName(selected) })); }
  showResult(rep.failed.length ? 'warn' : 'ok', T('res_ok', { f: rep.filled, t: rep.total }), T('res_in', { s: secs }) + (rep.skipped ? ' · ' + T('res_auto', { n: rep.skipped }) : '') + ' · ' + T('res_yours'), items);
  $('result').classList.remove('hidden');
  // 3.9.6 track fills for review nudge — only real profiles, not examples
  try { const isReal = !(p.example) && !/^📘/.test(selected); if (isReal) { await usageStore.incFill(rep.filled||rep.total||0, true); usageStats = await usageStore.get(); renderReviewNudge(); } } catch {}
  try { pageInfo = await send({ action: 'ping' }); setFillState(pageInfo); } catch {}
};
chrome.runtime.onMessage.addListener(m => {
  if (m.action === 'fillProgress') { $('progress').querySelector('.bar i').style.width = Math.round(m.done / m.total * 100) + '%'; $('progTxt').textContent = `${m.done}/${m.total}`; $('progLbl').textContent = m.label || ''; }
});

// --- 3.9.6: profile card actions (Duplicate / Edit / Delete) + optimized tools ---
async function deleteCurrent() {
  if (!selected) return status(T('s_pick_del'), 'err');
  const btn = $('btnDelCard');
  // Robust armed handling: clear any pending timeouts/listeners first
  const clearArmed = () => {
    try { if (btn._armTimer) clearTimeout(btn._armTimer); } catch {}
    btn._armTimer = null;
    btn.dataset.armed = '';
    btn.classList.remove('armed');
    btn.innerHTML = `<svg class="i sm"><use href="#i-trash"/></svg><span data-i="del_short"></span>`;
    try { I18N.apply(btn); } catch {}
    try { if (btn._disarm) document.removeEventListener('click', btn._disarm, true); } catch {}
    btn._disarm = null;
  };

  // First tap — arm with light glow + short "Delete?"
  if (!btn.dataset.armed) {
    // Clear any leftover
    try { if (btn._disarm) document.removeEventListener('click', btn._disarm, true); } catch {}
    btn.dataset.armed = '1';
    btn.classList.add('armed');
    btn.innerHTML = `<svg class="i sm"><use href="#i-trash"/></svg><span>${T('del_confirm')}</span>`;
    status(T('s_del_q', { n: displayName(selected) }), 'warn', 2500);
    const disarm = (e) => {
      if (!e || !btn.contains(e.target)) {
        if (btn.dataset.armed) {
          clearArmed();
        }
      }
    };
    btn._disarm = disarm;
    // Add disarm listener after short delay to avoid immediate trigger from current click
    btn._armTimer = setTimeout(() => {
      btn._armTimer = null;
      document.addEventListener('click', disarm, true);
    }, 120);
    return;
  }
  // Second tap — actually delete, always clear armed first
  clearArmed();
  try {
    const profs = await store.profiles();
    const delName = selected;
    if (!profs[selected]) return status(T('s_pick_del'), 'err');
    delete profs[selected];
    await store.setProfiles(profs);
    selected = '';
    await refresh();
    // Ensure button is definitely disarmed after refresh (renderCurrent may have re-enabled)
    try {
      const b = $('btnDelCard');
      if (b) {
        b.dataset.armed = '';
        b.classList.remove('armed');
        b.innerHTML = `<svg class="i sm"><use href="#i-trash"/></svg><span data-i="del_short"></span>`;
        try { I18N.apply(b); } catch {}
      }
    } catch {}
    status(T('s_deleted'));
    try { const hist = (await chrome.storage.local.get('rtpsHistory')).rtpsHistory || []; hist.unshift({ts: Date.now(), action: 'delete', profile: delName, form: '', url: ''}); if (hist.length>20) hist.length=20; await chrome.storage.local.set({rtpsHistory: hist}); } catch {}
  } catch (e) {
    console.error('Delete failed', e);
    status('Delete failed: ' + e.message, 'err');
    // Ensure not stuck glowing on error
    clearArmed();
  }
}


$('btnClear').onclick = async () => { if (confirm(T('s_clear_q'))) { await send({ action: 'clearForm' }); $('result').classList.add('hidden'); status(T('s_cleared')); try { pageInfo = await send({ action: 'ping' }); setFillState(pageInfo); $('btnClear').disabled = !(pageInfo && pageInfo.fieldCount > 0); } catch {} } };
async function openOptions(hash = '') {
  const url = chrome.runtime.getURL('options.html') + hash;
  if (IS_MOBILE) { location.replace(url + (hash ? '&' : '#') + 'from=popup'); return; }
  const open = await chrome.tabs.query({ url: chrome.runtime.getURL('options.html') + '*' }).catch(() => []);
  if (open && open[0]) { await chrome.tabs.update(open[0].id, { active: true, url }).catch(() => {}); if (open[0].windowId != null && chrome.windows) chrome.windows.update(open[0].windowId, { focused: true }).catch(() => {}); }
  else await chrome.tabs.create({ url });
  if (!IS_TAB_PAGE) window.close();
}
function editCurrent() { if (!selected) return status(T('s_pick'), 'err'); openOptions('#editor=' + encodeURIComponent(selected)); }

// Duplicate: family copy — same address, new name, personal fields cleared for safety
function suggestedDupName(base) {
  // Clean copy markers
  let clean = displayName(base).replace(/\s*\(copy\)|\s*कॉपी/gi,'').trim();
  // Iteratively strip all trailing numeric suffixes to get true root: "Name 2 2" -> "Name", "Name (2)" -> "Name", "Name - 3" -> "Name"
  let root = clean;
  let lastNum = 1;
  // Extract numbers from end repeatedly
  while (true) {
    let m = root.match(/^(.*?)(?:\s+(\d+)|\s+\((\d+)\)|\s+-\s*(\d+))\s*$/);
    if (!m) break;
    root = (m[1] || '').trim();
    let num = parseInt(m[2] || m[3] || m[4] || '1', 10);
    if (!isNaN(num)) lastNum = Math.max(lastNum, num);
    if (!root) { root = clean.replace(/\s+\d+.*$/, '').trim() || clean; break; }
  }
  if (!root) root = clean;
  // Find next free number starting from lastNum+1, but also check from 2 to ensure no gaps missed if user deleted middle
  // Prefer lastNum+1 to keep sequence, fallback to smallest free >=2
  let candidates = [];
  for (let i = lastNum + 1; i < 100; i++) candidates.push(`${root} ${i}`);
  for (let i = 2; i <= lastNum; i++) candidates.push(`${root} ${i}`);
  for (let cand of candidates) {
    if (!nameTaken(cand)) return cand;
  }
  // Fallback with timestamp to guarantee uniqueness
  return `${root} ${Date.now().toString().slice(-4)}`;
}
function openDupSheet() {
  if (!selected || !profiles[selected]) return status(T('s_pick'), 'err');
  // 3.9.9: allow duplicate even for example profiles — user can test feature
  $('dupSheet').classList.remove('hidden'); $('sheetBg').classList.remove('hidden');
  const inp=$('dupName'); const base=selected;
  inp.value=suggestedDupName(base);
  $('dupState').className='fstate hidden';
  checkDupName();
  setTimeout(()=>inp.focus(),100);
  inp.select();
}
function checkDupName() {
  const n=$('dupName').value.trim(), box=$('dupCheck'), inp=$('dupName');
  if(!n){ inp.classList.remove('bad'); $('btnDupSave').disabled=true; box.className='ncheck hidden'; return false; }
  if(!nameTaken(n)){
    inp.classList.remove('bad'); $('btnDupSave').disabled=false;
    box.className='ncheck hidden'; renderHTML(box,'');
    return true;
  }
  inp.classList.add('bad'); $('btnDupSave').disabled=true;
  // For duplicate sheet, suggest next free numbers based on root of n, not birth year
  let dupSugs = [];
  try {
    let clean = n.replace(/\s*\(copy\)|\s*कॉपी/gi,'').trim();
    let root = clean;
    while (true) {
      let m = root.match(/^(.*?)(?:\s+(\d+)|\s+\((\d+)\)|\s+-\s*(\d+))\s*$/);
      if (!m) break;
      root = (m[1] || '').trim();
      if (!root) break;
    }
    if (!root) root = clean.replace(/\s+\d+.*$/, '').trim() || clean;
    for (let i = 2; i < 100 && dupSugs.length < 3; i++) {
      let cand = `${root} ${i}`;
      if (!nameTaken(cand) && cand.toLowerCase() !== n.toLowerCase()) dupSugs.push(cand);
    }
  } catch {}
  const sug = dupSugs.map(s=>`<button type="button" class="sug" data-n="${esc(s)}">${esc(s)}</button>`).join('');
  box.className='ncheck';
  renderHTML(box, `<div class="nc-msg">${svg('i-alert','i sm')}<span>${T('name_taken',{n:esc(n)})}</span></div>` + (sug?`<div class="nc-sug"><small>${T('name_try')}</small>${sug}</div>`:'' ));
  box.querySelectorAll('.sug').forEach(b=> b.onclick=()=>{ inp.value=b.dataset.n; checkDupName(); inp.focus(); });
  return false;
}
async function doDuplicate() {
  const newName=$('dupName').value.trim();
  if(!newName) return status(T('s_type_name'),'err');
  if(!checkDupName()){ $('dupName').focus(); return; }
  const src=profiles[selected];
  if(!src) return;
  const copy=JSON.parse(JSON.stringify(src));
  copy.name=newName; copy.createdAt=new Date().toISOString(); copy.updatedAt=copy.createdAt; delete copy.example;
  // For family copy, keep forms but user will edit name/mobile etc in editor — we keep everything, as address is shared, safer to keep all and let user edit personal fields
  profiles[newName]=copy;
  await store.setProfiles(profiles);
  closeDupSheet();
  selected=newName; await store.setLast(newName); await refresh();
  status(T('dup_done',{n:displayName(newName)}));
}
$('dupName').addEventListener('input', checkDupName);
$('btnDupSave').onclick = doDuplicate;
$('dupName').addEventListener('keydown', e=>{ if(e.key==='Enter') doDuplicate(); });

// Card action buttons
$('btnDupCard').onclick = openDupSheet;
$('btnEditCard').onclick = editCurrent;
$('btnDelCard').onclick = deleteCurrent;
$('btnOptions').onclick = () => openOptions();
let openingRtps = false;
async function openRtps() {
  if (openingRtps) return; openingRtps = true;
  try {
    const all = await chrome.tabs.query({ url: RTPS + '*' }).catch(() => []);
    if (all.length) {
      const t = all.find(x => x.active) || all[0];
      await chrome.tabs.update(t.id, { active: true }).catch(() => {});
      if (t.windowId != null && chrome.windows) chrome.windows.update(t.windowId, { focused: true }).catch(() => {});
    } else await chrome.tabs.create({ url: RTPS, active: true });
    if (!IS_TAB_PAGE || IS_MOBILE) setTimeout(() => window.close(), 100);
  } finally { setTimeout(() => { openingRtps = false; }, 1500); }
}
const HELP_URL = 'https://pakkascore.github.io/rtps-pro/';
async function openHelp(e) {
  if (e) e.preventDefault();
  const open = await chrome.tabs.query({ url: 'https://pakkascore.github.io/*' }).catch(() => []);
  const t = open.find(x => (x.url || '').includes('rtps-pro')) || open[0];
  if (t) await chrome.tabs.update(t.id, { active: true, url: HELP_URL }).catch(() => {}); else await chrome.tabs.create({ url: HELP_URL, active: true });
  if (!IS_TAB_PAGE || IS_MOBILE) setTimeout(() => window.close(), 100);
}
$('lnkHelp').onclick = openHelp; $('resHelp').onclick = openHelp;
$('btnOpenRtps').onclick = openRtps;
$('lnkBrand').onclick = e => { e.preventDefault(); chrome.tabs.create({ url: 'https://pakkascore.blogspot.com' }); };
$('btnExample').onclick = async () => { await chrome.runtime.sendMessage({ action: 'restoreExample' }); selected = '📘 Example – Sita Devi (OBC)'; await store.setLast(selected); await refresh(); status(T('s_restored')); };

/* ---------- export (this profile / all) + backup bookkeeping ---------- */
const BK_MIN_SAVES = 3;           // nudge after this many saves without an export
async function bkMeta() { return (await chrome.storage.local.get('backupMeta')).backupMeta || { saves: 0, lastExport: 0, snoozedAt: 0 }; }
function downloadJSON(obj, file) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
async function doExport(names) {
  const all = await store.profiles(); const pick = {}; for (const n of names) if (all[n]) pick[n] = all[n];
  if (!Object.keys(pick).length) return status(T('s_nothing'), 'err');
  const one = names.length === 1 ? displayName(names[0]).replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') : '';
  downloadJSON({ app: 'RTPS Pro by PakkaScore', version: 2, exportedAt: new Date().toISOString(), profiles: pick }, `rtps-pro-${one || 'backup'}-${new Date().toISOString().slice(0, 10)}.json`);
  const m = await bkMeta(); await chrome.storage.local.set({ backupMeta: { ...m, saves: 0, lastExport: Date.now(), snoozedAt: 0 } });
  setCls($('bk'), 'hidden', true);
  status(one ? T('s_backup_one', { n: displayName(names[0]) }) : T('s_backup'));
}
function closeX() { $('xsheet').classList.add('hidden'); $('sheetBg').classList.add('hidden'); }
$('xCancel').onclick = closeX;
$('btnExport').onclick = async () => {
  const all = await store.profiles(); const names = Object.keys(all);
  if (!names.length) return status(T('s_nothing'), 'err');
  if (names.length === 1 || !selected || !all[selected]) return doExport(names);
  setText('xOneName', displayName(selected)); setText('xAllLbl', T('exp_all', { n: names.length }));
  $('xOne').onclick = () => { closeX(); doExport([selected]); };
  $('xAll').onclick = () => { closeX(); doExport(names); };
  $('xsheet').classList.remove('hidden'); $('sheetBg').classList.remove('hidden');
};
/* gentle reminder: shown after BK_MIN_SAVES saves since the last export (or since "Later") and only when real profiles exist */
async function renderBackupNudge() {
  const m = await bkMeta(); const real = Object.values(profiles).some(p => !p.example);
  const since = m.snoozedAt ? (m.savesAtSnooze || 0) : 0; const n = (m.saves || 0) - since;
  const show = real && n >= BK_MIN_SAVES;
  if (show) {
    const d = m.lastExport ? Math.floor((Date.now() - m.lastExport) / 864e5) : 0;
    setText('bkBody', m.lastExport ? T('bk_body_old', { d, n: m.saves }) : T('bk_body', { n: m.saves }));
  }
  setCls($('bk'), 'hidden', !show);
}
// 3.9.6 — review nudges: Firefox rating after 2 fills + 100 boxes + 1 real profile, GitHub star after 1000 boxes
async function renderReviewNudge() {
  const realCount = Object.values(profiles).filter(p=>!p.example).length;
  const fills = usageStats.fills||0, boxes = usageStats.boxes||0;
  const now = Date.now();
  const rm = reviewMeta;
  // Ensure edge exists for old installs
  if (!rm.edge) rm.edge = { shown:0, lastShown:0, snoozedAt:0, dismissed:false, rated:false };
  if (!rm.firefox) rm.firefox = { shown:0, lastShown:0, snoozedAt:0, dismissed:false, rated:false };
  if (!rm.github) rm.github = { shown:0, lastShown:0, snoozedAt:0, dismissed:false, starred:false };
  const hideAll = () => { setCls($('rvFirefox'),'hidden',true); setCls($('rvEdge'),'hidden',true); setCls($('rvGithub'),'hidden',true); };
  // if backup nudge is showing, don't show review at same time to avoid clutter — backup takes priority
  if (!$('bk').classList.contains('hidden')) { hideAll(); return; }
  // Firefox rating: 2+ fills, 100+ boxes, 1+ real profile, is Firefox, not dismissed/rated, snoozed >7 days, shown <3 times
  const canFirefox = IS_FIREFOX && realCount>=1 && fills>=2 && boxes>=100 && !rm.firefox.dismissed && !rm.firefox.rated && (now - (rm.firefox.snoozedAt||0) > 7*864e5) && (rm.firefox.shown||0) < 3;
  // Edge rating: same logic, only on Edge browser, zip file
  const canEdge = IS_EDGE && realCount>=1 && fills>=2 && boxes>=100 && !rm.edge.dismissed && !rm.edge.rated && (now - (rm.edge.snoozedAt||0) > 7*864e5) && (rm.edge.shown||0) < 3;
  // GitHub star: 1000+ boxes, not dismissed/starred, snoozed >14 days, shown <3 times, and store nudges not showing
  const canGithub = realCount>=1 && boxes>=1000 && !rm.github.dismissed && !rm.github.starred && (now - (rm.github.snoozedAt||0) > 14*864e5) && (rm.github.shown||0) < 3;
  if (canFirefox) {
    setText('rvBody', T('rv_body', { f: fills, b: boxes, p: realCount }));
    setCls($('rvFirefox'),'hidden',false);
    setCls($('rvEdge'),'hidden',true);
    setCls($('rvGithub'),'hidden',true);
    if (!rm.firefox.lastShown || now - rm.firefox.lastShown > 3600*1000) {
      rm.firefox.shown = (rm.firefox.shown||0)+1; rm.firefox.lastShown = now; reviewStore.set(rm);
    }
    return;
  }
  if (canEdge) {
    setText('rvBodyEdge', T('rv_body_edge', { f: fills, b: boxes, p: realCount }));
    setCls($('rvEdge'),'hidden',false);
    setCls($('rvFirefox'),'hidden',true);
    setCls($('rvGithub'),'hidden',true);
    if (!rm.edge.lastShown || now - rm.edge.lastShown > 3600*1000) {
      rm.edge.shown = (rm.edge.shown||0)+1; rm.edge.lastShown = now; reviewStore.set(rm);
    }
    return;
  }
  if (canGithub) {
    setText('ghBody', T('gh_body', { b: boxes }));
    setCls($('rvGithub'),'hidden',false);
    setCls($('rvFirefox'),'hidden',true);
    setCls($('rvEdge'),'hidden',true);
    if (!rm.github.lastShown || now - rm.github.lastShown > 3600*1000) {
      rm.github.shown = (rm.github.shown||0)+1; rm.github.lastShown = now; reviewStore.set(rm);
    }
    return;
  }
  hideAll();
}
function openReview(url, type) {
  chrome.tabs.create({ url });
  // mark as rated/starred and dismiss
  (async()=>{
    const rm = await reviewStore.get();
    if (type==='firefox') { rm.firefox.rated = true; rm.firefox.dismissed = true; }
    if (type==='edge') { if (!rm.edge) rm.edge = { shown:0, lastShown:0, snoozedAt:0, dismissed:false, rated:false }; rm.edge.rated = true; rm.edge.dismissed = true; }
    if (type==='github') { rm.github.starred = true; rm.github.dismissed = true; }
    await reviewStore.set(rm);
    reviewMeta = rm;
    renderReviewNudge();
  })();
  if (!IS_TAB_PAGE) setTimeout(()=>window.close(), 200);
}
$('bkNow').onclick = () => $('btnExport').click();
$('bkLater').onclick = async () => { const m = await bkMeta(); await chrome.storage.local.set({ backupMeta: { ...m, snoozedAt: Date.now(), savesAtSnooze: m.saves || 0 } }); setCls($('bk'), 'hidden', true); };
// Review nudges handlers
$('rvNow').onclick = () => openReview('https://addons.mozilla.org/en-US/firefox/addon/rtps-pro/reviews/', 'firefox');
$('rvLater').onclick = async () => { const rm = await reviewStore.get(); rm.firefox.snoozedAt = Date.now(); await reviewStore.set(rm); reviewMeta = rm; setCls($('rvFirefox'),'hidden',true); };
$('rvNever').onclick = async () => { const rm = await reviewStore.get(); rm.firefox.dismissed = true; await reviewStore.set(rm); reviewMeta = rm; setCls($('rvFirefox'),'hidden',true); };
$('rvClose').onclick = async () => { const rm = await reviewStore.get(); rm.firefox.snoozedAt = Date.now(); await reviewStore.set(rm); reviewMeta = rm; setCls($('rvFirefox'),'hidden',true); };
$('rvEdgeNow').onclick = () => openReview('https://microsoftedge.microsoft.com/addons/detail/gdicmdfikcnmgajipklnfmkjfcdmlbki', 'edge');
$('rvEdgeLater').onclick = async () => { const rm = await reviewStore.get(); if (!rm.edge) rm.edge = { shown:0, lastShown:0, snoozedAt:0, dismissed:false, rated:false }; rm.edge.snoozedAt = Date.now(); await reviewStore.set(rm); reviewMeta = rm; setCls($('rvEdge'),'hidden',true); };
$('rvEdgeNever').onclick = async () => { const rm = await reviewStore.get(); if (!rm.edge) rm.edge = { shown:0, lastShown:0, snoozedAt:0, dismissed:false, rated:false }; rm.edge.dismissed = true; await reviewStore.set(rm); reviewMeta = rm; setCls($('rvEdge'),'hidden',true); };
$('rvEdgeClose').onclick = async () => { const rm = await reviewStore.get(); if (!rm.edge) rm.edge = { shown:0, lastShown:0, snoozedAt:0, dismissed:false, rated:false }; rm.edge.snoozedAt = Date.now(); await reviewStore.set(rm); reviewMeta = rm; setCls($('rvEdge'),'hidden',true); };
$('ghNow').onclick = () => openReview('https://github.com/PakkaScore/rtps-pro', 'github');
$('ghLater').onclick = async () => { const rm = await reviewStore.get(); rm.github.snoozedAt = Date.now(); await reviewStore.set(rm); reviewMeta = rm; setCls($('rvGithub'),'hidden',true); };
$('ghNever').onclick = async () => { const rm = await reviewStore.get(); rm.github.dismissed = true; await reviewStore.set(rm); reviewMeta = rm; setCls($('rvGithub'),'hidden',true); };
$('ghClose').onclick = async () => { const rm = await reviewStore.get(); rm.github.snoozedAt = Date.now(); await reviewStore.set(rm); reviewMeta = rm; setCls($('rvGithub'),'hidden',true); };
$('btnImport').onclick = () => $('importFile').click();
$('importFile').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const j = JSON.parse(await f.text()); const inc = j.profiles || j; const cur = await store.profiles(); let n = 0;
    for (const [name, p] of Object.entries(inc)) {
      if (p && typeof p === 'object' && p.forms && typeof p.forms === 'object') cur[name] = { ...p, name };
      else if (p && p.formData) {
        const sid = ((p.url || '').match(/serviceId=(\d+)/) || [])[1] || 'legacy';
        cur[name] = { name, createdAt: p.savedAt, updatedAt: p.savedAt, forms: { [sid]: { schema: 2, serviceId: sid, url: p.url, savedAt: p.savedAt, fields: Object.entries(p.formData).map(([k, v]) => ({ id: '', name: '', label: k.replace(/_/g, ' '), type: 'text', value: String(v), text: String(v) })) } } };
      } else continue;
      n++;
    }
    await store.setProfiles(cur); await refresh(); status(T('s_imported', { n }));
  } catch { status(T('s_invalid'), 'err'); }
  e.target.value = '';
};

document.querySelectorAll('#langsw button').forEach(b => b.onclick = async () => { 
  await I18N.set(b.dataset.lang, true); 
  // If delete button is armed, update its text to current language
  const delBtn = document.getElementById('btnDelCard');
  if (delBtn && delBtn.dataset.armed) {
    delBtn.innerHTML = `<svg class="i sm"><use href="#i-trash"/></svg><span>${I18N.t('del_confirm')}</span>`;
  }
  init(); 
});
I18N.init().then(() => init());
chrome.storage.onChanged.addListener(ch => { if (ch.lang && ch.lang.newValue !== I18N.lang) I18N.init().then(() => init()); });

/* --- keep the popup in sync when it stays open as a tab (Kiwi / Android) --- */
let syncT = null;
const resync = () => { clearTimeout(syncT); syncT = setTimeout(() => { if (!document.hidden && !$('progress').offsetParent && $('sheet').classList.contains('hidden') && $('xsheet').classList.contains('hidden') && $('dupSheet').classList.contains('hidden') && $('gsheet').classList.contains('hidden')) init(); }, 500); };
document.addEventListener('visibilitychange', () => { if (!document.hidden) resync(); });
window.addEventListener('focus', resync);
window.addEventListener('pageshow', resync);
if (chrome.tabs && chrome.tabs.onUpdated) chrome.tabs.onUpdated.addListener((id, info, t) => { if (info.status === 'complete' && t && t.url && t.url.startsWith(RTPS)) resync(); });
if (chrome.tabs && chrome.tabs.onActivated) chrome.tabs.onActivated.addListener(resync);
if (chrome.tabs && chrome.tabs.onRemoved) chrome.tabs.onRemoved.addListener(resync);
chrome.storage.onChanged.addListener(ch => { if (ch.rtpsProfiles) refresh(); });
