/* RTPS Pro by PakkaScore — Original, MIT License
   Author: PakkaScore (PakkaScore@gmail.com)
   Source: https://github.com/PakkaScore/rtps-pro
   AMO: https://addons.mozilla.org/en-US/firefox/addon/rtps-pro/
   Always FREE — never asks for money on WhatsApp. Beware of paid copies demanding payment.
   Copyright (c) 2026 PakkaScore – content script (fill engine, draft recovery, toasts) */
var PAKKA_ORIGINAL_CONTENT = (typeof PAKKA_ORIGINAL_CONTENT !== 'undefined' && PAKKA_ORIGINAL_CONTENT) || { author: "PakkaScore", github: "PakkaScore/rtps-pro", amo: "rtps-pro", free: true, license: "MIT" };
if (typeof self !== 'undefined') self.PAKKA_ORIGINAL_CONTENT = PAKKA_ORIGINAL_CONTENT;
(function () {
  if (typeof window !== 'undefined' && window.__RTPS_PRO_LOADED__) return;
  if (typeof window !== 'undefined') window.__RTPS_PRO_LOADED__ = true;

  const TAG = '[RTPS Pro]';
  const HOST_OK = /serviceonline\.bihar\.gov\.in/.test(location.host);
  // 3.9.6 — usage tracking for review nudge (real profiles only) — fixes mobile pendingFill missing increment
  const historyLog = async (action, profile, form) => { try { const key='rtpsHistory'; const cur = (await chrome.storage.local.get(key))[key] || []; cur.unshift({ts: Date.now(), action, profile: (profile && profile.name || '').slice(0,50), form: (form || detectKind() || '').slice(0,30), url: location.href.slice(0,120)}); if (cur.length>20) cur.length=20; await chrome.storage.local.set({[key]: cur}); } catch {} };
  const usageInc = async (boxes, profile) => {
    try {
      historyLog('fill', profile, profile && profile.forms ? Object.keys(profile.forms)[0] : '').catch(()=>{});
      const isReal = !(profile && profile.example) && !/^📘/.test(profile && profile.name || '');
      if (!isReal) return;
      const k='usageStats';
      const cur = (await chrome.storage.local.get(k))[k] || { fills:0, boxes:0, saves:0, firstRealAt:0 };
      cur.fills = (cur.fills||0)+1;
      cur.boxes = (cur.boxes||0)+(boxes||0);
      if (!cur.firstRealAt) cur.firstRealAt = Date.now();
      await chrome.storage.local.set({ [k]: cur });
    } catch {}
  };
  // historyLog added above
  const IGNORE_VALUES = ['', 'select', 'please select', 'please_select', '--select--', 'select--', '-select-', 'चुनें', 'कृपया चुनें'];
  const SKIP_PATTERN = /captcha|otp|password|passwd|csrf|token|__viewstate|__eventvalidation|wordverification|word verification/i;
  // fields the portal computes itself – never save / fill
  const SITE_MANAGED = /apply\s*to\s*the\s*office|office\s*to\s*apply|photograph|choose file|कार्यालय/i;
  const SERVICE_NAMES = { '4630012': 'निवास (Residence)', '4640012': 'आय (Income)', '4650013': 'जाति (Caste)', '9330011': 'OBC-NCL केंद्र (GoI)', '10430013': 'EWS', 'ncl': 'NCL बिहार' };
  const SERVICE_KIND = { '4630012': 'residence', '4640012': 'income', '4650013': 'caste', '9330011': 'obc', '10430013': 'ews', 'ncl': 'ncl' };
  const KIND_NAMES = { caste: 'जाति (Caste)', income: 'आय (Income)', residence: 'निवास (Residence)', obc: 'OBC-NCL केंद्र (GoI)', ncl: 'NCL बिहार (State)', ews: 'EWS' };
  const kindOfForm = f => (f && (f.kind || SERVICE_KIND[f.serviceId])) || '';

  const settings = {
    autoDraft: true, fillDelay: 250, highlight: true, dependentWait: 6000
  };
  chrome.storage.sync.get('rtpsSettings', d => Object.assign(settings, d.rtpsSettings || {}));
  chrome.storage.onChanged.addListener((c, area) => {
    if (area === 'sync' && c.rtpsSettings) { Object.assign(settings, c.rtpsSettings.newValue || {}); }
  });

  /* ---------------- helpers ---------------- */
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const norm = s => String(s == null ? '' : s).toLowerCase().replace(/[\s_\-\/:*.()]+/g, '');
  const isIgnore = v => IGNORE_VALUES.includes(String(v == null ? '' : v).trim().toLowerCase());
  const visible = el => !!(el && el.offsetParent !== null && !el.disabled && !el.readOnly && getComputedStyle(el).visibility !== 'hidden');
  const rendered = el => !!(el && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none');
  const shown = el => { if (!el || el.disabled) return false; if (rendered(el)) return true; const l = (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) || el.closest('label'); return !!(l && rendered(l)); };
  // Form type is detected from the URL when possible, otherwise from the page's own headings —
  // portal deep links change often, so we never depend on a fixed URL.
  let baseline = null, lastPick = { borrowed: false, from: '' };
  setTimeout(() => { try { if (isFormPage()) baseline = extract().fields.length; } catch {} }, 800);
  // A real application form has the applicant-name fields; the homepage / dashboards do not.
  const isFormPage = () => /renderApplicationForm|serviceId=/i.test(location.href) ||
    (document.querySelectorAll('input[type=text],select').length > 10 && /Name of Applicant|आवेदक\s*\/?\s*आवेदिका|आवेदक का नाम/i.test(document.body.innerText.slice(0, 20000)));
  // Session timeout page: error.do + SESSION TIMED OUT + Relogin button (from your PDFs)
  const isSessionTimeoutPage = () => {
    const href = location.href || '';
    const ttl = document.title || '';
    const body = document.body ? (document.body.innerText || '') : '';
    if (/error\.do/i.test(href)) return true;
    if (/SESSION TIMED OUT/i.test(ttl)) return true;
    if (/SESSION TIMED OUT/i.test(body) && /Relogin/i.test(body)) return true;
    const relogin = document.getElementById('Relogin') || document.querySelector('button[onclick*=\"relogin\"], input[value*=\"Relogin\"], a[href*=\"relogin\"]');
    if (relogin) return true;
    return false;
  };
  let _kind = null;
  const pageText = () => (document.body ? document.body.innerText.slice(0, 4000) : '') + ' ' + document.title;
  // Which certificate form is this? Checked in order: specific forms (OBC/NCL/EWS) before the generic ones.
  const detectKind = () => {
    const u = (location.href.match(/serviceId=(\d+)/i) || [])[1];
    if (u && SERVICE_KIND[u]) return SERVICE_KIND[u];
    if (!isFormPage()) return '';
    if (_kind) return _kind;
    const t = pageText();
    if (/आर्थिक रूप से कमजोर|Economically Weaker/i.test(t)) _kind = 'ews';
    else if (/क्रीमी\s*लेयर|Creamy Layer|OBC\s*\(Non/i.test(t)) _kind = /भारत सरकार के प्रयोजनार्थ|Govt\.? of India|फॉर्म-VI\b/i.test(t) ? 'obc' : 'ncl';
    else if (/जाति प्रमाण|Caste Certificate/i.test(t)) _kind = 'caste';
    else if (/आय प्रमाण|Income Certificate/i.test(t)) _kind = 'income';
    else if (/निवास प्रमाण|आवासीय प्रमाण|Residen(ce|tial) Certificate/i.test(t)) _kind = 'residence';
    return _kind || '';
  };
  const serviceId = () => {
    const u = (location.href.match(/serviceId=(\d+)/i) || [])[1];
    if (u) return u;
    const k = detectKind();
    return k ? (Object.keys(SERVICE_KIND).find(id => SERVICE_KIND[id] === k) || k) : 'generic';
  };
  const serviceName = () => KIND_NAMES[detectKind()] || SERVICE_NAMES[serviceId()] || '';

  // caches — rebuilt whenever the DOM settles (gen bump). Big forms (OBC/NCL ≈ 200 inputs) made the O(fields×inputs) label scan take seconds.
  let gen = 0, fieldsCache = null, fieldsGen = -1; const labelCache = new WeakMap();
  const bump = () => { gen++; fieldsCache = null; };
  // is this field mandatory on the portal? (asterisk in its label, required attr, or a red "*" span in its form-group)
  const reqCache = new WeakMap();
  function isRequired(el) {
    const c = reqCache.get(el); if (c && c.g === gen) return c.v;
    let v = !!(el.required || el.getAttribute('aria-required') === 'true' || /\brequired\b|mandatory/i.test(el.className || ''));
    if (!v && el.type === 'checkbox') {
      // a checkbox is mandatory only if ITS OWN label carries the * (e.g. "I Agree *").
      // A group heading like "संलग्नक चुने: - *" means "tick at least one" and is counted once, as a group (see ping).
      const own = (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) || el.closest('label');
      v = !!(own && /\*/.test(own.textContent || ''));
      reqCache.set(el, { g: gen, v }); return v;
    }
    if (!v) {
      let lab = null;
      if (el.id) lab = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (!lab) { const box = el.closest('.form-group, td, .col-md-6, .col-sm-6, .col-md-4, .col-sm-4, .col-md-3, .col-md-12, div'); if (box) lab = box.querySelector('label, .control-label, .field-label'); }
      if (!lab && el.type === 'radio') { const first = el.form ? el.form.querySelector(`input[type=radio][name="${CSS.escape(el.name)}"]`) : null; const box = first && first.closest('.form-group, td, div'); lab = box && box.querySelector('label'); }
      if (lab) { const t = lab.textContent || ''; v = /\*/.test(t) || !!lab.querySelector('.required, .mandatory, .text-danger, .asterisk, [style*="red"]'); }
      if (!v) { const td = el.closest('td'); const pt = td && td.previousElementSibling; if (pt && /\*/.test(pt.textContent || '')) v = true; }
    }
    reqCache.set(el, { g: gen, v }); return v;
  }
  function labelOf(el) {
    const c = labelCache.get(el); if (c && c.g === gen) return c.t;
    const t = labelOfRaw(el); labelCache.set(el, { g: gen, t }); return t;
  }
  function labelOfRaw(el) {
    let txt = '';
    if (el.id) { const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`); if (l) txt = l.textContent; }
    if (!txt && el.getAttribute('aria-label')) txt = el.getAttribute('aria-label');
    if (!txt && el.closest('label')) txt = el.closest('label').textContent;
    if (!txt) {
      const box = el.closest('.form-group, td, .col-md-6, .col-sm-6, .col-md-4, .col-sm-4, .col-md-3, .col-md-12, .row, div');
      if (box) { const l = box.querySelector('label, .control-label, .field-label, b, strong'); if (l) txt = l.textContent; }
    }
    if (!txt && (el.type === 'radio' || el.type === 'checkbox')) {
      const n = el.nextSibling; if (n && n.textContent && n.textContent.trim()) txt = n.textContent;
    }
    if (!txt) { let p = el.previousElementSibling; while (p && !txt) { if (/^(LABEL|SPAN|B|STRONG|DIV)$/.test(p.tagName) && p.textContent.trim()) txt = p.textContent; p = p.previousElementSibling; } }
    if (!txt) { const col = el.parentElement; const prev = col && col.previousElementSibling; if (prev && /LABEL|DIV|TD|TH/.test(prev.tagName) && prev.textContent.trim().length < 120 && !prev.querySelector('input,select,textarea')) txt = prev.textContent; }
    if (!txt) { let n = el.previousSibling; while (n && !txt) { if (n.nodeType === 3 && n.textContent.trim().length > 1) txt = n.textContent; else if (n.nodeType === 1 && /^(BR|SPAN|LABEL|B|STRONG)$/.test(n.tagName) && n.textContent.trim()) txt = n.textContent; n = n.previousSibling; } }
    if (!txt) { const td = el.closest('td'); const pt = td && td.previousElementSibling; if (pt && pt.textContent.trim() && !pt.querySelector('input,select,textarea')) txt = pt.textContent; }
    if (!txt) { const box = el.closest('.form-group, td, div'); if (box && !box.querySelector('input:not([type=hidden]) ~ input, select ~ select')) { const t = Array.from(box.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent).join(' ').trim(); if (t.length > 1 && t.length < 120) txt = t; } }
    if (!txt) txt = el.placeholder || el.title || '';
    return txt.replace(/[*:\n\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
  }

  function allFields() {
    if (fieldsCache && fieldsGen === gen) return fieldsCache;
    fieldsGen = gen; return fieldsCache = allFieldsRaw();
  }
  function allFieldsRaw() {
    return Array.from(document.querySelectorAll('input:not([type=hidden]):not([type=button]):not([type=submit]):not([type=file]):not([type=image]):not([type=reset]), select, textarea'))
      .filter(el => { if (el.closest('#rtps-pro-toasts')) return false; const l = labelOf(el); return !SKIP_PATTERN.test(el.id || '') && !SKIP_PATTERN.test(el.name || '') && !SKIP_PATTERN.test(l) && !SITE_MANAGED.test(l); });
  }

  // halves of a bilingual label, normalised; drops bracketed hints like "(Required for delivery …)"
  // "Name of Applicant" (old forms) ≡ "Applicant's Name" (new forms) etc.
  const canonEn = x => x.toLowerCase().replace(/^\s*\d+\.\s*/, '').replace(/[*:]/g, '').trim()
    .replace(/^name of (the )?(applicant|father|mother|husband|wife)$/, '$2 name').replace(/^(applicant|father|mother|husband|wife)['’]?s? name$/, '$1 name')
    .replace(/^(mobile|email|aadhaar|aadhar)( no| number| id)?( of applicant)?$/, '$1');
  function labelParts(label) {
    return String(label || '').replace(/\([^)]*\)/g, ' ').split('/').map(x => norm(canonEn(x)).replace(/(number|no|num)$/,'')).filter(x => x.length >= 2);
  }
  function groupSig(name) { return Array.from(document.querySelectorAll(`input[type=radio][name="${CSS.escape(name)}"]`)).map(r => norm(labelOf(r))).join('|'); }
  function radioGroupOrdinal(el) {
    const sig = groupSig(el.name); const names = []; 
    for (const r of document.querySelectorAll('input[type=radio]')) { if (!names.includes(r.name) && groupSig(r.name) === sig) names.push(r.name); }
    return Math.max(0, names.indexOf(el.name));
  }

  /* ---------------- extract ---------------- */
  function extract() {
    bump();
    const fields = []; const seen = new Set(); const labelCount = {}; 
    for (const el of allFields()) {
      if (!visible(el) && el.type !== 'radio' && el.type !== 'checkbox') continue; // readOnly / disabled = site managed
      if ((el.type === 'radio' || el.type === 'checkbox') && !shown(el)) continue;   // option inside a collapsed / hidden section
      const rec = { id: el.id || '', name: el.name || '', label: labelOf(el), tag: el.tagName.toLowerCase(), type: (el.type || '').toLowerCase(), value: '', text: '', ord: 0 };
      // ordinal among same-label fields (Permanent vs Present address blocks share labels)
      if (el.type === 'radio') { rec.ord = radioGroupOrdinal(el); rec.group = el.name; }
      else { rec.ord = labelCount[rec.label] = (labelCount[rec.label] || 0); labelCount[rec.label]++; }
      if (rec.tag === 'select') {
        const o = el.options[el.selectedIndex];
        if (!o || isIgnore(o.text) || (o.value === '' || o.value === '0') && isIgnore(o.text)) continue;
        rec.value = o.value; rec.text = o.text.trim();
      } else if (rec.type === 'radio') {
        if (!el.checked) continue;
        rec.value = el.value; rec.text = rec.label;
      } else if (rec.type === 'checkbox') {
        rec.value = el.checked ? '1' : '0';
      } else {
        if (!el.value || isIgnore(el.value)) continue;
        rec.value = el.value;
      }
      const key = rec.id || rec.name || rec.label; if (!key) continue;
      const k2 = rec.type === 'radio' ? rec.name + '=' + rec.value : key;
      if (seen.has(k2)) continue; seen.add(k2);
      fields.push(rec);
    }
    return { schema: 2, serviceId: serviceId(), kind: detectKind(), serviceName: serviceName(), url: location.href, savedAt: new Date().toISOString(), fields };
  }

  /* ---------------- locate element for a record ---------------- */
  function candidates(rec) {
    let list = [];
    if (rec.id) { const e = document.getElementById(rec.id); if (e) list.push(e); }
    if (rec.name) list.push(...document.getElementsByName(rec.name));
    if (rec.label && /aadhaar|aadhar|आधार/i.test(rec.label) && rec.tag !== 'select') {
      for (const el of allFields()) {
        if (el.tagName !== 'INPUT' || !/^(text|tel|number)?$/.test(el.type) || list.includes(el)) continue;
        const hay = ((el.id || '') + ' ' + (el.name || '') + ' ' + (el.placeholder || '') + ' ' + (el.className || '')).toLowerCase();
        if (/aadha|adhar|uid/.test(hay) || +el.getAttribute('maxlength') === 12 || /^आधार/.test(labelOf(el))) list.push(el);
      }
    }
    if (rec.label) {
      const want = norm(rec.label); let byLabel = [];
      const wantParts = labelParts(rec.label);
      for (const el of allFields()) {
        if (list.includes(el)) continue;
        const lab = labelOf(el), l = norm(lab);
        if (!l) continue;
        if (l === want || ((l.includes(want) || want.includes(l)) && Math.min(l.length, want.length) >= 3)) { byLabel.push(el); continue; }
        // bilingual half match: either the Hindi or the English half identical (e.g. "Ward No." vs "Ward Number")
        const lp = labelParts(lab);
        if (lp.some(x => wantParts.includes(x))) { byLabel.push(el); continue; }
        // one side has a single-language label ("पिन कोड") that equals one half of the other ("पिन कोड / Pin Code")
        if (lp.length === 1 && wantParts.includes(lp[0])) byLabel.push(el);
      }
      // last resort: English keyword of the label inside id/name/placeholder (e.g. "aadhaar")
      if (!byLabel.length) {
        let kw = (rec.label.split('/').pop() || '').toLowerCase().replace(/[^a-z]+/g, ' ').trim().split(' ').filter(w => w.length > 3);
        if (/aadhaar|aadhar|आधार/i.test(rec.label)) kw = ['aadha'];
        if (kw.length) for (const el of allFields()) { const hay = ((el.id || '') + ' ' + (el.name || '') + ' ' + (el.placeholder || '') + ' ' + (el.title || '') + ' ' + (el.getAttribute('aria-label') || '') + ' ' + (el.className || '')).toLowerCase().replace('aadhar', 'aadha').replace('aadhaar', 'aadha'); if (kw.every(w => hay.includes(w))) byLabel.push(el); }
        // Aadhaar-specific structural fallback: a 12-digit-capable text box right after the photo upload / before "Others" section
        if (!byLabel.length && /aadhaar|aadhar|आधार/i.test(rec.label)) {
          for (const el of allFields()) {
            if (el.tagName !== 'INPUT' || !/^(text|tel|number)?$/.test(el.type) || el.value) continue;
            const ml = +el.getAttribute('maxlength'); const box = el.closest('.form-group, td, div');
            const near = box ? (box.parentElement ? box.parentElement.textContent : box.textContent) : '';
            if (ml === 12 || /आधार|aadha/i.test(near)) { byLabel.push(el); break; }
          }
        }
      }
      const kindOk = el => (rec.tag === 'select') === (el.tagName === 'SELECT') && (rec.type !== 'radio') === (el.type !== 'radio') && (rec.type !== 'checkbox') === (el.type !== 'checkbox');
      byLabel = byLabel.filter(kindOk);
      const exact = byLabel.filter(el => norm(labelOf(el)) === want);
      const pool = exact.length ? exact : byLabel;
      if (rec.type !== 'radio' && rec.ord != null && pool[rec.ord]) list.push(pool[rec.ord]); else list.push(...pool);
    }
    const strict = list.filter(el => (rec.tag === 'select') === (el.tagName === 'SELECT') && (rec.type !== 'radio' || el.type === 'radio') && (rec.type !== 'checkbox' || el.type === 'checkbox'));
    if (strict.length || rec.type === 'radio' || rec.type === 'checkbox') return strict;
    // same label but the other widget type (select on one form, plain text box on another)
    const want = norm(rec.label || '');
    return want ? list.filter(el => (el.tagName === 'SELECT' || /^(text|tel|number|search)?$/.test(el.type)) && norm(labelOf(el)) === want) : [];
  }

  /* ---------------- fire events like a real user — framework-friendly (native setter) ---------------- */
  // Adapted from open-autofill: use native value setter so React/Vue/ServicePlus pick up change
  function setNativeValue(el, value) {
    try {
      const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const desc = Object.getOwnPropertyDescriptor(proto, 'value');
      if (desc && desc.set) {
        desc.set.call(el, value);
      } else {
        el.value = value;
      }
    } catch {
      el.value = value;
    }
    el.setAttribute('value', value);
  }
  function fire(el) {
    bump();
    try { el.focus(); } catch (e) {}
    for (const t of ['input', 'change']) el.dispatchEvent(new Event(t, { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    try { if (window.jQuery) window.jQuery(el).trigger('change'); } catch (e) {}
    const oc = el.getAttribute('onchange');
    if (oc) {
      try { if (/fillSecond/.test(oc) && typeof window.fillSecond === 'function') window.fillSecond(el.value, el.id); } catch (e) {}
      try { if (/triggerChange/.test(oc) && typeof window.triggerChange === 'function') window.triggerChange(el.name); } catch (e) {}
    }
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  function flash(el, ok) {
    if (!settings.highlight || !el) return;
    el.classList.add(ok ? 'rtps-pro-filled' : 'rtps-pro-failed');
    setTimeout(() => el.classList.remove('rtps-pro-filled', 'rtps-pro-failed'), 2500);
  }

  // split bilingual option text "बिहार / Bihar" → ['बिहार','bihar'] for matching either half
  const parts = t => String(t || '').split(/\s*[\/|(),-]\s*/).map(norm).filter(p => p.length > 1);
  // tiny Hindi⇄English glossary for common admin names so 'Danapur' matches 'दानापुर' on Hindi-only lists
  const GLOSS = { 'बिहार':'bihar','पटना':'patna','गया':'gaya','दानापुर':'danapur','बिहटा':'bihta','मनेर':'maner','बाढ़':'barh','फुलवारी शरीफ':'phulwari sharif','मुजफ्फरपुर':'muzaffarpur','भागलपुर':'bhagalpur','दरभंगा':'darbhanga','नालंदा':'nalanda','आरा':'ara','भोजपुर':'bhojpur','बक्सर':'buxar','छपरा':'chhapra','सारण':'saran','सीवान':'siwan','गोपालगंज':'gopalganj','मोतिहारी':'motihari','बेतिया':'bettiah','सीतामढ़ी':'sitamarhi','मधुबनी':'madhubani','समस्तीपुर':'samastipur','बेगूसराय':'begusarai','खगड़िया':'khagaria','सहरसा':'saharsa','मधेपुरा':'madhepura','सुपौल':'supaul','पूर्णिया':'purnia','कटिहार':'katihar','अररिया':'araria','किशनगंज':'kishanganj','मुंगेर':'munger','जमुई':'jamui','लखीसराय':'lakhisarai','शेखपुरा':'sheikhpura','नवादा':'nawada','औरंगाबाद':'aurangabad','रोहतास':'rohtas','सासाराम':'sasaram','कैमूर':'kaimur','जहानाबाद':'jehanabad','अरवल':'arwal','वैशाली':'vaishali','हाजीपुर':'hajipur','शिवहर':'sheohar','बांका':'banka','यादव':'yadav','कुर्मी':'kurmi','ब्राह्मण':'brahmin','राजपूत':'rajput','भूमिहार':'bhumihar','कायस्थ':'kayastha','चमार':'chamar','दुसाध':'dusadh','पासवान':'paswan','मुसहर':'musahar','तेली':'teli','नाई':'nai','कहार':'kahar','अहीर':'ahir','गृहिणी':'housewife','छात्र':'student','किसान':'farmer','व्यवसाय':'business','सरकारी सेवा':'govt service','अन्य':'other','श्री':'shri','श्रीमती':'smt','कुमारी':'kumari','कुमार':'kumar','पुरुष':'male','स्त्री':'female','महिला':'female','ग्राम पंचायत':'village panchayat','नगर निगम':'municipal corporation','नगर परिषद':'municipality','नगर पंचायत':'town panchayat','स्थायी':'permanent','अस्थायी':'temporary','हिन्दू':'hindu','हिंदू':'hindu','मुस्लिम':'muslim','इस्लाम':'muslim','ईसाई':'christian','सिख':'sikh','बौद्ध':'buddhist','जैन':'jain','अन्य पिछड़ा वर्ग':'obc','अत्यंत पिछड़ा वर्ग':'ebc','अत्यन्त पिछड़ा वर्ग':'ebc','पिछड़ा वर्ग':'bc','अनुसूचित जाति':'sc','अनुसूचित जनजाति':'st','ब्राह्मण':'brahmin','ब्राह्मन':'brahmin','brahman':'brahmin' };
  const gloss = t => { let x = String(t || ''); for (const [h, e] of Object.entries(GLOSS)) x = x.split(h).join(' ' + e + ' '); return x; };
  function textMatch(optText, wanted) {
    if (norm(gloss(optText)) && norm(gloss(optText)) === norm(gloss(wanted))) return true;
    if (parts(gloss(optText)).some(x => parts(gloss(wanted)).includes(x))) return true;
    const a = norm(optText), b = norm(wanted); if (!a || !b) return false;
    if (a === b) return true;
    const pa = parts(optText), pb = parts(wanted);
    if (pa.some(x => pb.includes(x))) return true;
    return (a.includes(b) || b.includes(a)) && Math.min(a.length, b.length) > 2;
  }
  function selectOption(sel, rec) {
    const wv = String(rec.value), wt = rec.text || rec.value;
    const opts = Array.from(sel.options).filter(o => !isIgnore(o.text));
    let opt = opts.find(o => o.value === wv && wv !== '' && rec.value !== rec.text) ||
      opts.find(o => norm(o.text) === norm(wt)) ||
      opts.find(o => parts(o.text).some(x => parts(wt).includes(x))) ||
      opts.find(o => textMatch(o.text, wt));
    if (!opt) return false;
    if (sel.value === opt.value) return true;
    sel.value = opt.value; fire(sel); return true;
  }

  /* wait until a select has real options (dependent dropdowns loaded via ajax) */
  async function waitForOptions(sel, rec, timeout) {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) {
      const real = Array.from(sel.options).filter(o => !isIgnore(o.text));
      if (real.length && (real.some(o => o.value === String(rec.value)) || real.some(o => textMatch(o.text, rec.text || rec.value)))) return true;
      if (real.length && Date.now() - t0 > 1500) return true; // options present but not ours – stop waiting
      await sleep(150);
    }
    return false;
  }

  /* after changing a select, wait until DOM settles (dependents repopulated) */
  async function settle(max) {
    return new Promise(res => {
      let timer = setTimeout(done, 400), hard = setTimeout(done, max);
      const mo = new MutationObserver(recs => { if (recs.every(r => r.target.closest && r.target.closest('#rtps-pro-toasts'))) return; clearTimeout(timer); timer = setTimeout(done, 400); });
      mo.observe(document.body, { childList: true, subtree: true });
      function done() { clearTimeout(timer); clearTimeout(hard); mo.disconnect(); bump(); res(); }
    });
  }

  /* ---------------- fill ---------------- */
  let filling = false;
  async function fill(profile, progress) {
    if (filling) throw new Error('Fill already in progress');
    filling = true; bump(); lastPick = { borrowed: false, from: '' };
    const fields = normalizeProfile(profile);
    const report = { filled: 0, skipped: 0, absent: 0, failed: [], total: fields.length, saved: fields.length };
    // order: document order of currently existing elements, unknown ones last
    const order = allFields();
    fields.sort((a, b) => idx(a) - idx(b));
    function idx(r) { const c = candidates(r)[0]; const i = c ? order.indexOf(c) : -1; return i < 0 ? 99999 : i; }

    let done = 0; const pending = [];
    for (const rec of fields) {
      done++; progress && progress({ done, total: fields.length, label: rec.label || rec.name || rec.id });
      const ok = await fillOne(rec);
      if (ok === null) pending.push(rec); else if (ok === 'skip') report.skipped++; else ok ? report.filled++ : report.failed.push(rec.label || rec.name || rec.id);
    }
    // second pass for elements that appeared after dependent changes (hard IDs etc.)
    for (let pass = 0; pass < 4 && pending.length; pass++) {
      await settle(2500); await sleep(200);
      for (const rec of pending.splice(0)) {
        const ok = await fillOne(rec);
        if (ok === null) { if (pass === 3) { if (candidates(rec).some(shown)) report.failed.push(rec.label || rec.name || rec.id); else report.absent = (report.absent || 0) + 1; } else pending.push(rec); }
        else if (ok === 'skip') report.skipped++; else ok ? report.filled++ : report.failed.push(rec.label || rec.name || rec.id);
      }
    }
    filling = false;
    const manual = report.failed.map(x => String(x).split('/')[0].trim()).slice(0, 5).join(', ');
    report.total -= report.absent || 0;
    const T = (k, v) => (self.I18N ? I18N.t(k, v) : k);
    report.borrowed = lastPick.borrowed; report.borrowedFrom = lastPick.from;
    let msg = T('t_filled', { f: report.filled, t: report.total });
    if (report.skipped) msg += ' · ' + T('t_auto', { n: report.skipped });
    if (report.failed.length) msg += ' · ' + T('t_manual', { l: manual + (report.failed.length > 5 ? '…' : '') });
    if (lastPick.borrowed) msg += ' · ' + T('t_borrowed', { k: lastPick.from });
    toast(msg, report.failed.length || lastPick.borrowed ? 'warn' : 'ok', [], report.failed.length || lastPick.borrowed ? 12000 : 4000);
    if (report.failed.length) console.info(TAG, 'not found:', report.failed.join(', '));
    return report;
  }

  async function fillOne(rec) {
    const els = candidates(rec);
    if (!els.length) return null;
    if (rec.type === 'radio') {
      let group = els.filter(e => e.type === 'radio');
      // several identical radio groups (e.g. Local Body type in Permanent & Present address) → pick by ordinal
      const names = []; group.forEach(e => { if (!names.includes(e.name)) names.push(e.name); });
      if (names.length > 1) { const pick = names[rec.ord || 0] || names[0]; group = group.filter(e => e.name === pick); }
      const wv = String(rec.value), wt = norm(rec.text || rec.label);
      const want = rec.text || rec.label;
      const r = (rec.value !== rec.text && group.find(e => e.value === wv)) || group.find(e => norm(labelOf(e)) === wt) || group.find(e => textMatch(labelOf(e), want));
      if (!r) return false;
      if (!r.checked) { r.click(); r.checked = true; fire(r); }
      flash(r, true); await settle(settings.dependentWait); return true;
    }
    const el = els.find(visible) || els[0];
    if (!visible(el)) return (el.readOnly || el.disabled) && el.offsetParent !== null ? 'skip' : null;
    if (rec.type === 'checkbox') {
      const want = rec.value === '1' || rec.value === 'true' || rec.value === 'checked';
      if (el.checked !== want) { el.click(); if (el.checked !== want) { el.checked = want; fire(el); } flash(el, true); await settle(settings.dependentWait); }
      else flash(el, true);
      return true;
    }
    if (rec.tag === 'select') {
      await waitForOptions(el, rec, settings.dependentWait);
      const real = Array.from(el.options).filter(o => !isIgnore(o.text));
      if (!real.length) return null; // dependent list not loaded yet (e.g. Category after Religion/Caste) → retry in a later pass
      const ok = selectOption(el, rec); flash(el, ok);
      if (ok) await settle(settings.dependentWait);
      return ok;
    }
    if (rec.tag === 'select' && el.tagName !== 'SELECT') { const t = String(rec.text || rec.value); const en = t.split('/').map(x => x.trim()).find(x => /^[A-Za-z]/.test(x)) || t; if (el.value !== en) { setNativeValue(el, en); fire(el); } flash(el, true); return true; }
    if (el.value === rec.value) { flash(el, true); return true; }
    if (isDateField(el, rec)) { await setDate(el, rec.value); flash(el, true); return true; }
    setNativeValue(el, rec.value); fire(el); flash(el, true);
    await sleep(settings.fillDelay / 5); return true;
  }
  const isDateField = (el, rec) => /date|dob|birth|तिथि/i.test((el.id || '') + ' ' + (el.name || '') + ' ' + (el.className || '') + ' ' + (rec.label || '')) || el.classList.contains('hasDatepicker');
  // Portal uses a jQuery-UI style picker (dd/mm/yyyy). Typing works, but the picker opens on focus and may rewrite the value on blur —
  // so we set it through the picker API when present, then close it and confirm the value stuck.
  async function setDate(el, val) {
    const v = String(val).trim();
    setNativeValue(el, v);
    try { if (window.jQuery && window.jQuery.fn && window.jQuery.fn.datepicker) { const $ = window.jQuery; const m = v.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/); if (m) $(el).datepicker('setDate', new Date(+m[3], +m[2] - 1, +m[1])); else $(el).datepicker('setDate', v); } } catch {}
    el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
    try { if (window.jQuery) window.jQuery(el).trigger('change'); } catch {}
    await sleep(120);
    try { if (window.jQuery && window.jQuery.fn && window.jQuery.fn.datepicker) window.jQuery(el).datepicker('hide'); } catch {}
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }));
    try { el.blur(); } catch {}
    document.querySelectorAll('.ui-datepicker, .datepicker-dropdown, .bootstrap-datetimepicker-widget, .datepicker.dropdown-menu, div.datepicker').forEach(d => { if (!/^(INPUT|SELECT|TEXTAREA)$/.test(d.tagName) && !d.contains(el)) d.style.display = 'none'; });
    await sleep(80);
    if (el.value !== v) { setNativeValue(el, v); el.dispatchEvent(new Event('change', { bubbles: true })); }
    bump();
  }

  // choose the saved form that matches the open page: same kind → same serviceId → closest generic (caste/income/residence share most fields)
  function pickForm(forms) {
    const k = detectKind(), sid = serviceId(), list = Object.entries(forms);
    lastPick = { borrowed: false, from: '' };
    const byKind = list.find(([, f]) => kindOfForm(f) === k);
    if (byKind) return byKind[1];
    if (forms[sid]) return forms[sid];
    const pref = { caste: ['obc', 'ncl', 'residence', 'income'], income: ['residence', 'caste', 'ews'], residence: ['income', 'caste', 'ews'], obc: ['ncl', 'caste'], ncl: ['obc', 'caste'], ews: ['residence', 'income', 'caste'] }[k] || [];
    let f = null; for (const alt of pref) { f = list.find(([, f]) => kindOfForm(f) === alt); if (f) break; }
    if (!f && list[0]) f = list[0];
    if (!f) return {};
    lastPick = { borrowed: true, from: KIND_NAMES[kindOfForm(f[1])] || kindOfForm(f[1]) || f[0] };
    return f[1];
  }
  // Form-specific declarations are never copied between forms: income boxes, tax, purpose, evidence, property sections, residence type, EWS choice.
  const FORM_SPECIFIC = /आय|income|कर\b|tax|उद्देश्य|purpose|शपथ|affidavit|form-?\s*[ivx]+|प्रमाण[- ]?पत्र|certificate|सम्पत्ति|संपत्ति|property|भूमि|land|building|भवन|plantation|बागान|पद\b|post\b|service|सेवा|नियुक्ति|appointment|वेतन|pay|निवास का प्रकार|type of residence|\(क\)|\(ख\)|सूचीबद्ध|सिंचित|irrigated|एकड़|acre|प्रतिशत|%|इस्तेमाल|old issued|पुराना/i;
  const BASIC_ALWAYS = /डाक ?घर|post office|प्रारूप|format|भाषा|language|थाना|police station|पंचायत|panchayat|वार्ड|ward|ग्राम|village|मोहल्ला|पिन|pin|जिला|district|अनुमंडल|sub-?division|प्रखंड|block|राज्य|state|होल्डिंग|holding|सर्किल|circle|नाम|name|आधार|aadha|मोबाइल|mobile|ईमेल|email|जन्म|birth|लिंग|gender|अभिवादन|salutation|धर्म|religion|वर्ग|category|जाति|caste|पेशा|profession|occupation|निकाय|local body|सहमत|agree/i;
  const isFormSpecific = r => { const t = String(r.label || '') + ' ' + String(r.group || ''); return FORM_SPECIFIC.test(t) && !BASIC_ALWAYS.test(t.replace(/\([^)]*\)/g, '')); };
  /* accept new schema, or legacy {label_key: value} objects from older extension */
  function normalizeProfile(p) {
    if (p && p.forms && !p.fields) p = pickForm(p.forms);
    if (p && Array.isArray(p.fields)) { let fl = p.fields.map(f => ({ ...f })); if (lastPick.borrowed) { const n = fl.length; fl = fl.filter(r => !isFormSpecific(r)); lastPick.dropped = n - fl.length; } return fl; }
    const fd = (p && p.formData) || p || {};
    return Object.entries(fd).filter(([k, v]) => v && !isIgnore(v)).map(([k, v]) => ({
      id: '', name: '', label: k.replace(/_/g, ' '), tag: 'any', type: 'text', value: String(v), text: String(v)
    })).map(r => ({ ...r, tag: undefined }));
  }

  try { new MutationObserver(recs => { if (recs.some(r => !(r.target.closest && r.target.closest('#rtps-pro-toasts')))) bump(); }).observe(document.documentElement, { childList: true, subtree: true }); } catch {}

  /* ---------------- draft auto-save / recovery ---------------- */
  const draftKey = () => 'draft:' + serviceId();
  let draftTimer = null;
  function scheduleDraft() {
    if (!settings.autoDraft || filling) return;
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
      const snap = extract();
      if (snap.fields.length < 2) return;
      chrome.storage.local.set({ [draftKey()]: snap });
    }, 800);
  }
  document.addEventListener('input', scheduleDraft, true);
  document.addEventListener('change', scheduleDraft, true);

  async function offerDraftRestore() {
    const d = (await chrome.storage.local.get(draftKey()))[draftKey()];
    if (!d || !d.fields || d.fields.length < 2) return;
    if (!d.savedAt || Date.now() - new Date(d.savedAt) > 7 * 864e5) { chrome.storage.local.remove(draftKey()); return; } // 7-day expiry
    if (extract().fields.length > 3) return; // form already has data
    const age = Math.round((Date.now() - new Date(d.savedAt)) / 60000);
    const T = (k, v) => (self.I18N ? I18N.t(k, v) : k);
    toast(T('t_draft', { m: age, n: d.fields.length }), 'info', [
      { label: T('t_restore'), act: () => fill(d) },
      { label: T('t_discard'), act: () => chrome.storage.local.remove(draftKey()) }
    ], 15000);
  }

  /* ---------------- UI: toasts ---------------- */
  function toast(msg, kind = 'ok', actions = [], ttl = 4000) {
    let host = document.getElementById('rtps-pro-toasts');
    if (!host) { host = document.createElement('div'); host.id = 'rtps-pro-toasts'; document.documentElement.appendChild(host); }
    const t = document.createElement('div'); t.className = 'rtps-pro-toast ' + kind;
    t.innerHTML = `<span></span>`; t.firstChild.textContent = msg;
    for (const a of actions) { const b = document.createElement('button'); b.textContent = a.label; b.onclick = () => { a.act(); t.remove(); }; t.appendChild(b); }
    const x = document.createElement('button'); x.textContent = '✕'; x.className = 'x'; x.onclick = () => t.remove(); t.appendChild(x);
    host.appendChild(t); setTimeout(() => t.remove(), ttl);
  }

  async function getProfiles() { return (await chrome.storage.local.get('rtpsProfiles')).rtpsProfiles || {}; }
  async function saveProfile(name) {
    if (!name) { toast(self.I18N ? I18N.t('t_name') : 'Enter a profile name', 'warn'); return false; }
    const profiles = await getProfiles(); const data = extract();
    if (data.fields.length < 2) { toast(self.I18N ? I18N.t('t_empty') : 'Form is empty', 'warn'); return false; }
    const existing = profiles[name] || { name, createdAt: new Date().toISOString(), forms: {} };
    for (const k of Object.keys(existing.forms)) if (kindOfForm(existing.forms[k]) && kindOfForm(existing.forms[k]) === data.kind) delete existing.forms[k];
    existing.forms[/^\d+$/.test(data.serviceId) ? data.serviceId : (data.kind || data.serviceId)] = data; existing.updatedAt = data.savedAt; delete existing.example;
    profiles[name] = existing;
    await chrome.storage.local.set({ rtpsProfiles: profiles, lastProfile: name });
    chrome.storage.local.remove(draftKey()); // saved for real → draft no longer needed
    if (!profiles[name].example) { const m = (await chrome.storage.local.get('backupMeta')).backupMeta || { saves: 0, lastExport: 0 }; m.saves = (m.saves || 0) + 1; await chrome.storage.local.set({ backupMeta: m }); }
    toast(self.I18N ? I18N.t('t_saved', { n: name, c: data.fields.length }) : `saved ${name}`, 'ok'); return true;
  }

  try { self.I18N && I18N.init(); chrome.storage.onChanged.addListener(ch => { if (ch.lang && self.I18N) I18N.init(); }); } catch {}

  /* ---------------- messaging ---------------- */
  chrome.runtime.onMessage.addListener((req, sender, respond) => {
    (async () => {
      switch (req.action) {
        case 'ping': {
          const ex = extract().fields.length;
          // baseline = fields the portal fills by itself (State, defaults, radios); we only count what the user/AutoFill adds
          if (baseline === null || ex < baseline) baseline = ex;
          const groups = new Set(); let total = 0;
          // mandatory (*) fields: how many exist, how many are already answered — this is what the popup shows
          let reqTotal = 0, reqFilled = 0, optFilled = 0; const missing = [];
          const hasValue = el => el.tagName === 'SELECT' ? (() => { const o = el.options[el.selectedIndex]; return !!(o && !isIgnore(o.text) && o.value !== ''); })() : el.type === 'checkbox' ? el.checked : el.type === 'radio' ? !!(el.form || document).querySelector(`input[type=radio][name="${CSS.escape(el.name)}"]:checked`) : !!(el.value && !isIgnore(el.value));
          for (const el of allFields()) {
            if (!visible(el) && el.type !== 'radio' && el.type !== 'checkbox') continue;
            if ((el.type === 'radio' || el.type === 'checkbox') && !shown(el)) continue;
            if (el.type === 'radio') { if (groups.has(el.name)) continue; groups.add(el.name); }
            if (el.type === 'file' || el.type === 'hidden' || /captcha|word/i.test(el.id + el.name)) continue;
            total++;
            let req = isRequired(el), has = hasValue(el);
            if (el.type === 'checkbox' && !req) {
              const grp = el.closest('.form-group, fieldset, td, .row'); const others = grp ? grp.querySelectorAll('input[type=checkbox]') : [];
              if (others.length > 1) {
                const head = grp.querySelector(':scope > label:not(:has(input)), :scope > .control-label, :scope > b, :scope > strong, :scope > span');
                if (head && /\*/.test(head.textContent || '')) {
                  if (groups.has(grp)) { total--; continue; } // count the group once
                  groups.add(grp); req = true; has = !!grp.querySelector('input[type=checkbox]:checked');
                  if (!has && missing.length < 8) { missing.push(head.textContent.replace(/[*:\-]/g, '').split('/')[0].trim().slice(0, 40)); reqTotal++; continue; }
                }
              }
            }
            if (req) { reqTotal++; if (has) reqFilled++; else if (missing.length < 8) { let lb = labelOf(el); if (el.type === 'radio') { const box = el.closest('.form-group, td, div'); const gl = box && box.parentElement && box.parentElement.querySelector('label:not(:has(input))'); const outer = el.closest('.form-group'); const ol = outer && outer.querySelector(':scope > label'); lb = (ol && ol.textContent) || (gl && gl.textContent) || lb; } missing.push(lb.replace(/[*:]/g, '').split('/')[0].replace(/^\d+\.\s*/, '').trim().slice(0, 40)); } }
            else if (has) optFilled++;
          }
          return respond({ ok: true, isForm: isFormPage(), isSessionTimeout: isSessionTimeoutPage(), serviceId: serviceId(), kind: detectKind(), serviceName: serviceName(), fieldCount: Math.max(0, ex - baseline), total: Math.max(1, total - baseline), raw: ex, rawTotal: total, reqTotal, reqFilled, optFilled, missing });
        }
        case 'extract': return respond({ ok: true, data: extract() });
        case 'fill': {
          const forms = req.profile.forms || {}; const src = Object.keys(forms).length ? pickForm(forms) : req.profile;
          const rep = await fill(src, pr => chrome.runtime.sendMessage({ action: 'fillProgress', ...pr }).catch(() => {}));
          return respond({ ok: true, report: rep });
        }
        case 'saveToProfile': return respond({ ok: await saveProfile(req.name) });
        case 'clearForm': {
          for (const el of allFields()) { if (!visible(el)) continue; if (el.type === 'checkbox' || el.type === 'radio') el.checked = false; else if (el.tagName === 'SELECT') el.selectedIndex = 0; else el.value = ''; }
          await new Promise(r => setTimeout(r, 400)); // let the portal restore its own defaults
          baseline = null; clearTimeout(draftTimer); chrome.storage.local.remove(draftKey());
          return respond({ ok: true });
        }
        default: return; // not for us (e.g. fillProgress broadcasts)
      }
    })().catch(e => respond({ ok: false, error: e.message }));
    return true;
  });

  /* ---------------- pending fill (mobile: popup closes, page fills when it wakes) ---------------- */
  let pendingBusy = false;
  async function runPendingFill() {
    if (pendingBusy || !HOST_OK || document.visibilityState !== 'visible') return;
    let pf; try { ({ pendingFill: pf } = await chrome.storage.local.get('pendingFill')); } catch { return; }
    if (!pf || !pf.profile) return;
    if (Date.now() - (pf.ts || 0) > 3 * 60e3) { chrome.storage.local.remove('pendingFill'); return; }
    if (pf.url && pf.url.split('#')[0] !== location.href.split('#')[0] && !isFormPage()) return;
    pendingBusy = true;
    try {
      await chrome.storage.local.remove('pendingFill');
      const forms = pf.profile.forms || {}; const src = Object.keys(forms).length ? pickForm(forms) : pf.profile;
      const rep = await fill(src, () => {}); // fill() shows the result toast itself
      try { await usageInc(rep.filled||rep.total||0, pf.profile); } catch {}
    } catch (e) { console.warn(TAG, 'pending fill failed', e); }
    pendingBusy = false;
  }
  try {
    chrome.storage.onChanged.addListener((ch, area) => { if (area === 'local' && ch.pendingFill && ch.pendingFill.newValue) runPendingFill(); });
    document.addEventListener('visibilitychange', () => runPendingFill());
    window.addEventListener('focus', () => runPendingFill());
    window.addEventListener('pageshow', () => runPendingFill());
  } catch {}

  /* ---------------- session timeout handling (from PDFs) ---------------- */
  function handleSessionTimeout() {
    if (!isSessionTimeoutPage()) return false;
    const T = (k,v)=> (self.I18N ? I18N.t(k,v) : k);
    const msg = T('t_session') + ' ' + T('t_session_sub');
    toast(msg, 'warn', [{ label: T('t_relogin'), act: () => { location.href = 'https://serviceonline.bihar.gov.in/'; } }], 15000);
    // Also enhance the native Relogin button if present — ensure it goes to homepage
    const btn = document.getElementById('Relogin') || document.querySelector('button');
    if (btn && /Relogin/i.test(btn.textContent||'')) {
      btn.addEventListener('click', (e)=> { e.preventDefault(); location.href='https://serviceonline.bihar.gov.in/'; });
    }
    return true;
  }

  /* ---------------- boot ---------------- */
  function boot() {
    if (!HOST_OK) return;
    setTimeout(() => {
      if (handleSessionTimeout()) { runPendingFill(); return; }
      if (isFormPage()) offerDraftRestore();
      runPendingFill();
    }, 800);
  }
  if (document.readyState === 'complete' || document.readyState === 'interactive') boot(); else document.addEventListener('DOMContentLoaded', boot);
  console.log(TAG, 'ready · service', serviceId(), detectKind(), isSessionTimeoutPage() ? 'SESSION_TIMEOUT' : '');
})();
