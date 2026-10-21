/* RTPS Pro by PakkaScore — Original, MIT License
   Author: PakkaScore — Always FREE, never asks for money on WhatsApp
   Source: https://github.com/PakkaScore/rtps-pro
   Copyright (c) 2026 PakkaScore – background service worker */
const PAKKA_ORIGINAL_BG = { author: "PakkaScore", github: "PakkaScore/rtps-pro", amo: "rtps-pro", free: true, license: "MIT" };
const RTPS_URL = 'https://serviceonline.bihar.gov.in/';

const DRAFT_TTL = 7 * 864e5;
async function purgeDrafts() {
  const all = await chrome.storage.local.get(null); const old = [];
  for (const [k, v] of Object.entries(all)) if (k.startsWith('draft:') && (!v || !v.savedAt || Date.now() - new Date(v.savedAt) > DRAFT_TTL)) old.push(k);
  if (old.length) await chrome.storage.local.remove(old);
}
chrome.runtime.onStartup.addListener(purgeDrafts);
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  purgeDrafts();
  chrome.contextMenus.removeAll(() => {
  chrome.contextMenus.create({ id: 'rtps-fill', title: '⚡ RTPS Pro: Auto-fill with last profile', contexts: ['page', 'editable'], documentUrlPatterns: [RTPS_URL + '*'] });
  chrome.contextMenus.create({ id: 'rtps-save', title: '💾 RTPS Pro: Save form to last profile', contexts: ['page', 'editable'], documentUrlPatterns: [RTPS_URL + '*'] });
  });
  // migrate profiles stored in the older biharRtpProfiles format, if present
  const { biharRtpProfiles, rtpsProfiles } = await chrome.storage.local.get(['biharRtpProfiles', 'rtpsProfiles']);
  if (biharRtpProfiles && !rtpsProfiles) {
    const out = {};
    for (const [name, p] of Object.entries(biharRtpProfiles)) out[name] = legacyToProfile(name, p);
    await chrome.storage.local.set({ rtpsProfiles: out });
  }
  await seedExampleProfile(false);
});

function legacyToProfile(name, p) {
  const sid = ((p.url || '').match(/serviceId=(\d+)/) || [])[1] || 'legacy';
  const fields = Object.entries(p.formData || {}).map(([k, v]) => ({ id: '', name: '', label: k.replace(/_/g, ' '), type: 'text', value: String(v), text: String(v) }));
  return { name, createdAt: p.savedAt || new Date().toISOString(), updatedAt: p.savedAt, forms: { [sid]: { schema: 2, serviceId: sid, url: p.url, savedAt: p.savedAt, fields } } };
}

async function activeRtpsTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
  if (tab && tab.url && tab.url.startsWith(RTPS_URL)) return tab;
  const all = await chrome.tabs.query({ url: RTPS_URL + '*' }).catch(() => []);
  all.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
  return all.find(t => /serviceId=/.test(t.url)) || all[0] || null;
}

async function send(tabId, msg) {
  try { return await chrome.tabs.sendMessage(tabId, msg); }
  catch (e) {
    await chrome.scripting.insertCSS({ target: { tabId }, files: ['content.css'] }).catch(() => {});
    await chrome.scripting.executeScript({ target: { tabId }, files: ['i18n.js', 'content.js'] });
    await new Promise(r => setTimeout(r, 300));
    return chrome.tabs.sendMessage(tabId, msg);
  }
}

/* 3.9.6 — usage tracking for review nudge: count fills only for real profiles (not examples) */
const usageStore = {
  async incFill(boxes, isReal) {
    if (!isReal) return;
    try {
      const key = 'usageStats';
      const cur = (await chrome.storage.local.get(key))[key] || { fills:0, boxes:0, saves:0, firstRealAt:0 };
      cur.fills = (cur.fills||0)+1;
      cur.boxes = (cur.boxes||0)+(boxes||0);
      if (!cur.firstRealAt) cur.firstRealAt = Date.now();
      await chrome.storage.local.set({ [key]: cur });
    } catch {}
  }
};

async function run(cmd) {
  const tab = await activeRtpsTab();
  if (!tab) return notify('Open a form on serviceonline.bihar.gov.in first');
  const { rtpsProfiles = {}, lastProfile } = await chrome.storage.local.get(['rtpsProfiles', 'lastProfile']);
  if (!lastProfile || (cmd === 'fill-last-profile' && !rtpsProfiles[lastProfile])) return notify('No profile used yet – open the RTPS Pro popup and pick one');
  if (cmd === 'fill-last-profile') {
    const prof = rtpsProfiles[lastProfile];
    const r = await send(tab.id, { action: 'fill', profile: prof });
    if (r && r.report) {
      setBadge(`${r.report.filled}`);
      // track for review nudge — context menu fill (background)
      try { const isReal = !(prof && prof.example) && !/^📘/.test(lastProfile); await usageStore.incFill(r.report.filled||r.report.total||0, isReal); } catch {}
    }
  }
  if (cmd === 'save-current-form') await send(tab.id, { action: 'saveToProfile', name: lastProfile });
}

chrome.commands.onCommand.addListener(run);
chrome.contextMenus.onClicked.addListener(info => run({ 'rtps-fill': 'fill-last-profile', 'rtps-save': 'save-current-form' }[info.menuItemId]));

function notify(message) {
  setBadge('!'); console.warn('[RTPS Pro]', message);
}
function setBadge(text) {
  chrome.action.setBadgeBackgroundColor({ color: '#16a34a' });
  chrome.action.setBadgeText({ text });
  setTimeout(() => chrome.action.setBadgeText({ text: '' }), 4000);
}

chrome.runtime.onMessage.addListener((m, s, respond) => {
  if (m.action === 'fillProgress') return;
  if (m.action === 'sendToTab') { send(m.tabId, m.msg).then(respond).catch(e => respond({ ok: false, error: e.message })); return true; }
  if (m.action === 'startFill') {
    (async () => {
      if (m.focusTab) await chrome.tabs.update(m.tabId, { active: true }).catch(() => {});
      // Background tabs are frozen on Android (Firefox especially): wake the page and wait for the content script to answer.
      let awake = false;
      for (let i = 0; i < 80 && !awake; i++) {
        awake = await send(m.tabId, { action: 'ping' }).then(r => !!r).catch(() => false);
        if (!awake) await new Promise(res => setTimeout(res, 250));
      }
      const r = await send(m.tabId, { action: 'fill', profile: m.profile });
      if (r && r.report) setBadge(String(r.report.filled));
      respond(r);
    })().catch(e => respond({ ok: false, error: e.message }));
    return true;
  }
});

/* Bundled example profile so users can test Auto-fill immediately without saving anything first */
async function seedExampleProfile(force) {
  const { rtpsProfiles = {}, exampleSeeded } = await chrome.storage.local.get(['rtpsProfiles', 'exampleSeeded']);
  if (!force && exampleSeeded === 2) return false;
  // remove older example versions, then seed the two current examples
  for (const k of Object.keys(rtpsProfiles)) if (rtpsProfiles[k] && rtpsProfiles[k].example) delete rtpsProfiles[k];
  let first = '';
  for (const f of ['example-sita.json', 'example-rahul.json']) { const ex = await (await fetch(chrome.runtime.getURL(f))).json(); rtpsProfiles[ex.name] = ex; first = first || ex.name; }
  const last = (await chrome.storage.local.get('lastProfile')).lastProfile;
  await chrome.storage.local.set({ rtpsProfiles, exampleSeeded: 2, lastProfile: rtpsProfiles[last] ? last : first });
  return true;
}
chrome.runtime.onMessage.addListener((m, s, respond) => {
  if (m.action === 'restoreExample') { seedExampleProfile(true).then(() => respond({ ok: true })); return true; }
});
