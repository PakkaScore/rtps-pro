/* RTPS Pro by PakkaScore — Original, MIT License
   Author: PakkaScore (PakkaScore@gmail.com)
   Source: https://github.com/PakkaScore/rtps-pro
   AMO: https://addons.mozilla.org/en-US/firefox/addon/rtps-pro/
   Always FREE — never asks for money on WhatsApp. Beware of paid copies demanding payment.
   Copyright (c) 2026 PakkaScore — shared string table (EN / हिन्दी).
   Usage: await I18N.init(); I18N.t('key', {n: 3}); I18N.apply(document); I18N.set('hi')
   Static HTML: <span data-i="key"></span>, data-i-title, data-i-ph (placeholder). */
// Watermark — easy to search in copies, proves original — var to survive double-inject on Kiwi
var PAKKA_ORIGINAL = (typeof PAKKA_ORIGINAL !== 'undefined' && PAKKA_ORIGINAL) || { author: "PakkaScore", github: "PakkaScore/rtps-pro", amo: "rtps-pro", free: true, whatsapp: false, license: "MIT" };
// var watermark above survives double-inject; flag prevents re-init
if (typeof self !== 'undefined') self.PAKKA_ORIGINAL = PAKKA_ORIGINAL;
(function (root) {
  if (root && root.__RTPS_PRO_I18N_LOADED__) return;
  if (root) root.__RTPS_PRO_I18N_LOADED__ = true;
  const S = {
    /* ---------- shared ---------- */
    app_sub:          ['Bihar RTPS · AutoFill & Draft Saver', 'Bihar RTPS · AutoFill & Draft Saver'],
    kind_caste:       ['Caste Certificate · जाति', 'जाति प्रमाण-पत्र · Caste'],
    kind_income:      ['Income Certificate · आय', 'आय प्रमाण-पत्र · Income'],
    kind_residence:   ['Residential Certificate · निवास', 'निवास प्रमाण-पत्र · Residence'],
    kind_obc:         ['OBC-NCL (Govt. of India)', 'OBC-NCL (केंद्र सरकार)'],
    kind_ncl:         ['NCL (Govt. of Bihar)', 'NCL (बिहार सरकार)'],
    kind_ews:         ['EWS Certificate', 'EWS प्रमाण-पत्र'],
    data_local:       ['Data stays on this device', 'डेटा इसी डिवाइस पर रहता है'],
    /* ---------- popup: header / hero ---------- */
    detected:         ['Detected form', 'पहचाना गया फ़ॉर्म'],
    rtps_page:        ['RTPS page', 'RTPS पेज'],
    rtps_reload:      ['Reload the page if actions fail', 'काम न करे तो पेज रीलोड करें'],
    home_open:        ['RTPS homepage is open', 'RTPS होमपेज खुला है'],
    home_open_sub:    ['Open a certificate form first', 'पहले कोई प्रमाण-पत्र फ़ॉर्म खोलें'],
    form_generic:     ['RTPS application form', 'RTPS आवेदन फ़ॉर्म'],
    form_sub:         ['Block level · serviceonline.bihar.gov.in', 'अंचल स्तर · serviceonline.bihar.gov.in'],
    no_form:          ['No RTPS form open', 'कोई RTPS फ़ॉर्म खुला नहीं'],
    no_form_sub:      ['Open serviceonline.bihar.gov.in to begin', 'शुरू करने के लिए serviceonline.bihar.gov.in खोलें'],
    st_empty:         ['Empty', 'खाली'],
    st_ready:         ['Ready', 'तैयार'],
    st_left:          ['{n} left', '{n} बाकी'],
    ready_title:      ['All mandatory fields answered. Check photo & captcha, then submit.', 'सभी अनिवार्य फ़ील्ड भर दिए गए हैं। फोटो और कैप्चा जाँचकर Submit करें।'],
    note_done:        ['<b>{f}</b> filled = <b>{r}</b> mandatory ★ + <b>{o}</b> optional', '<b>{f}</b> भरे = <b>{r}</b> अनिवार्य ★ + <b>{o}</b> वैकल्पिक'],
    note_left:        ['<b>★ {n}</b> mandatory left', '<b>★ {n}</b> अनिवार्य बाकी'],
    note_opt:         ['{n} optional filled', '{n} वैकल्पिक भरे'],
    note_plain:       ['{n}/{t} fields filled', '{n}/{t} फ़ील्ड भरे'],
    /* ---------- popup: tip ---------- */
    tip_lbl:          ['Pakka Tip', 'पक्का टिप'],
    tip_default:      ['Try the built-in examples first: <b>Sita Devi</b> (OBC — Caste / Income / Residence / OBC / NCL) or <b>Rahul Sharma</b> (General — Income / Residence / EWS). Open a form, pick one, tap Auto-fill.',
                       'पहले बने-बनाए उदाहरण आज़माएँ: <b>Sita Devi</b> (OBC — जाति / आय / निवास / OBC / NCL) या <b>Rahul Sharma</b> (सामान्य — आय / निवास / EWS)। फ़ॉर्म खोलें, एक चुनें, Auto-fill दबाएँ।'],
    tip_home:         ['On the portal go to <b>Apply Online → RTPS Services → General Administration Department → Issuance of Caste / Income / Residential Certificate → Block Level</b>, then come back here and tap Auto-fill.',
                       'पोर्टल पर <b>ऑनलाइन आवेदन → लोक सेवाएँ → सामान्य प्रशासन विभाग → जाति / आय / आवासीय प्रमाण-पत्र का निर्गमन → अंचल स्तर पर</b> खोलें, फिर यहाँ आकर Auto-fill दबाएँ।'],
    tip_partial:      ['This profile has no <b>{k}</b> form saved, but basic details (name, address…) can be filled from your <b>{s}</b> form. Tap Auto-fill → fill the remaining boxes → come back <b>before Submit</b> and tap <b>Update {n}</b>. Next time this form fills completely too.',
                       'इस प्रोफ़ाइल में <b>{k}</b> फ़ॉर्म सेव नहीं है, पर <b>{s}</b> फ़ॉर्म से नाम‑पता जैसे मूल विवरण भरे जा सकते हैं। Auto-fill दबाएँ → बाकी बॉक्स खुद भरें → Submit से <b>पहले</b> यहाँ आकर <b>{n} अपडेट करें</b> दबाएँ। अगली बार यह फ़ॉर्म भी पूरा भरेगा।'],
    /* ---------- popup: profile ---------- */
    profile:          ['Profile', 'प्रोफ़ाइल'],
    change:           ['Change', 'बदलें'],
    no_profile:       ['No profile selected', 'कोई प्रोफ़ाइल चुनी नहीं गई'],
    no_profile_sub:   ['Save a form or pick an example', 'फ़ॉर्म सेव करें या उदाहरण चुनें'],
    example:          ['Example', 'उदाहरण'],
    example_meta:     ['sample data — do not submit', 'नमूना डेटा — Submit न करें'],
    search_ph:        ['Search {n} profiles…', '{n} प्रोफ़ाइल खोजें…'],
    no_match:         ['No match', 'कोई मेल नहीं'],
    no_profiles:      ['No profiles yet — fill a form and save it, or tap Restore example.', 'अभी कोई प्रोफ़ाइल नहीं — फ़ॉर्म भरकर सेव करें, या \'उदाहरण वापस लाएँ\' दबाएँ।'],
    fields_n:         ['{n} fields', '{n} फ़ील्ड'],
    updated:          ['updated {t}', 'अपडेट: {t}'],
    today:            ['today', 'आज'], yesterday: ['yesterday', 'कल'], days_ago: ['{n} days ago', '{n} दिन पहले'],
    /* ---------- popup: buttons ---------- */
    open_rtps:        ['Open RTPS website', 'RTPS वेबसाइट खोलें'],
    open_rtps_sub:    ['serviceonline.bihar.gov.in', 'serviceonline.bihar.gov.in'],
    autofill:         ['Auto-fill this form', 'यह फ़ॉर्म Auto-fill करें'],
    autofill_sub:     ['one tap · nothing is submitted', 'एक टैप · कुछ भी Submit नहीं होता'],
    update_x:         ['Update {n}', '{n} अपडेट करें'],
    update_sub_ok:    ['save this form\'s {n} fields', 'इस फ़ॉर्म के {n} फ़ील्ड सेव करें'],
    update_sub_fill:  ['fill the form first', 'पहले फ़ॉर्म भरें'],
    update_sub_open:  ['open a form first', 'पहले फ़ॉर्म खोलें'],
    new_profile:      ['New profile', 'नई प्रोफ़ाइल'],
    new_profile_sub:  ['save the open form under a name', 'खुले फ़ॉर्म को एक नाम से सेव करें'],
    export:           ['Export', 'Export'], export_sub: ['backup file', 'बैकअप फ़ाइल'],
    import:           ['Import', 'Import'], import_sub: ['from backup', 'बैकअप से'],
    clear_form:       ['Clear form', 'फ़ॉर्म खाली करें'], clear_sub: ['on the page', 'पेज पर'],
    restore_example:  ['Restore example', 'उदाहरण वापस लाएँ'], restore_sub: ['Sita & Rahul', 'Sita और Rahul'],
    restore_disabled: ['Both examples are already here', 'दोनों उदाहरण पहले से मौजूद हैं'],
    kb_hint:          ['<kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>F</kbd> fill · <kbd>S</kbd> save', '<kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>F</kbd> से भरें · <kbd>S</kbd> से सेव करें'],
    /* ---------- popup: how-to ---------- */
    howto_t:          ['Create your own profile', 'अपनी प्रोफ़ाइल बनाएँ'],
    howto_1:          ['Open any RTPS form (Caste / Income / Residence / OBC / NCL / EWS).', 'RTPS पर कोई भी फ़ॉर्म खोलें (जाति / आय / निवास / OBC / NCL / EWS)।'],
    howto_2:          ['Fill it completely with your real details — <b>do not press Submit yet</b>.', 'अपनी सही जानकारी से पूरा भरें — <b>अभी Submit न दबाएँ</b>।'],
    howto_3:          ['Switch back to this tab → tap <b>New profile</b> → type a name → <b>Save from this form</b>.', 'इस टैब पर वापस आएँ → <b>नई प्रोफ़ाइल</b> दबाएँ → नाम लिखें → <b>इस फ़ॉर्म से सेव करें</b>।'],
    howto_4:          ['Now go back to the form and Submit as usual.', 'अब फ़ॉर्म पर लौटकर सामान्य रूप से Submit करें।'],
    howto_warn:       ['⚠️ Save <b>before</b> Submit — after submission the page resets and nothing can be saved.', '⚠️ Submit से <b>पहले</b> सेव करें — Submit के बाद पेज खाली हो जाता है, फिर कुछ सेव नहीं हो सकता।'],
    howto_next:       ['Next time: pick that profile → Auto-fill.', 'अगली बार: वह प्रोफ़ाइल चुनें → Auto-fill।'],
    /* ---------- popup: progress / result ---------- */
    filling:          ['Filling…', 'भरा जा रहा है…'],
    preparing:        ['Preparing', 'तैयारी'],
    res_ok:           ['{f} of {t} filled', '{t} में से {f} भरे'],
    res_in:           ['in {s} s', '{s} सेकंड में'],
    res_auto:         ['{n} auto-set by site', '{n} साइट ने स्वयं भरे'],
    res_yours:        ['photo & captcha are yours', 'फोटो और कैप्चा आप भरें'],
    res_manual:       ['fill manually', 'खुद भरें'],
    res_more:         ['+{n} more', '+{n} और'],
    fill_fail:        ['Auto-fill failed', 'Auto-fill विफल'],
    fill_fail_sub:    ['Reload the form page and try again', 'फ़ॉर्म पेज रीलोड करके फिर कोशिश करें'],
    changed_hint:     ['Portal seems to have changed — fill the remaining boxes by hand once, then tap Update {n}. Next time everything will be filled again.',
                       'पोर्टल बदला लगता है — बाकी बॉक्स एक बार खुद भरें, फिर {n} अपडेट करें दबाएँ। अगली बार सब अपने-आप भर जाएगा।'],
    borrowed:         ['Basic details came from your {k} profile. Income / declaration boxes were left for you — save this form once to fill them next time.',
                       'बुनियादी जानकारी आपकी {k} प्रोफ़ाइल से भरी गई। आय / घोषणा वाले बॉक्स आपके लिए छोड़े गए — इस फ़ॉर्म को एक बार सेव करें, अगली बार वे भी भर जाएँगे।'],
    /* ---------- popup: sheet ---------- */
    sheet_t:          ['New profile', 'नई प्रोफ़ाइल'],
    sheet_p:          ['Saves everything currently typed in the open RTPS form under a name you choose.', 'खुले RTPS फ़ॉर्म में अभी भरी गई सारी जानकारी आपके चुने नाम से सेव होगी।'],
    name:             ['Name', 'नाम'],
    name_hint:        ['(applicant\'s name works best)', '(आवेदक का नाम सबसे अच्छा रहेगा)'],
    name_ph:          ['e.g. Ram Kumar', 'जैसे: राम कुमार'],
    cancel:           ['Cancel', 'रद्द करें'],
    save_from_form:   ['Save from this form', 'इस फ़ॉर्म से सेव करें'],
    sheet_noform:     ['No RTPS form open — open and fill a form first', 'कोई RTPS फ़ॉर्म खुला नहीं — पहले फ़ॉर्म खोलकर भरें'],
    sheet_notform:    ['This RTPS page is not a form', 'यह RTPS पेज फ़ॉर्म नहीं है'],
    sheet_empty:      ['Form looks empty ({n} fields) — fill it first, then save', 'फ़ॉर्म खाली लगता है ({n} फ़ील्ड) — पहले भरें, फिर सेव करें'],
    sheet_ok:         ['{k} form · {n} fields will be saved', '{k} फ़ॉर्म · {n} फ़ील्ड सेव होंगे'],
    /* ---------- popup: status messages ---------- */
    s_type_name:      ['Type a profile name first', 'पहले प्रोफ़ाइल का नाम लिखें'],
    s_read_fail:      ['Could not read the form — reload the page', 'फ़ॉर्म पढ़ा नहीं जा सका — पेज रीलोड करें'],
    s_saved:          ['Saved → {n}', 'सेव हो गया → {n}'],
    name_taken:       ['"{n}" is already used — choose another name', '"{n}" नाम पहले से इस्तेमाल में है — दूसरा नाम चुनें'],
    name_same_person: ['Same person? Update the existing profile instead →', 'वही व्यक्ति है? पुरानी प्रोफ़ाइल ही अपडेट करें →'],
    name_try:         ['Try:', 'ये आज़माएँ:'],
    name_dup_id:      ['This Aadhaar/mobile is already saved in "{n}" — same person?', 'यह आधार/मोबाइल पहले से "{n}" में सेव है — वही व्यक्ति है?'],
    g_t:              ['Different person?', 'अलग व्यक्ति?'],
    g_msg:            ['The form on the page belongs to <b>{p}</b>, but the selected profile is <b>{s}</b>. Saving would overwrite {s}\'s data with {p}\'s.', 'पेज पर <b>{p}</b> का डेटा है, पर प्रोफ़ाइल <b>{s}</b> चुनी है। सेव करने से {s} का डेटा {p} के डेटा से बदल जाएगा।'],
    g_better_sub:     ['matches the data on the page', 'पेज के डेटा से मेल खाती है'],
    g_new_sub:        ['save the page under a new name', 'पेज को नए नाम से सेव करें'],
    g_override:       ['Save into {s} anyway', 'फिर भी {s} में सेव करें'],
    g_override_sub:   ['e.g. correcting a family member\'s profile', 'जैसे परिवार के सदस्य की प्रोफ़ाइल सुधारना'],
    g_override2:      ['Tap again to confirm → {s}', 'पक्का? दोबारा दबाएँ → {s}'],
    g_override2_sub:  ['{p}\'s data will replace this form in {s}', '{p} का डेटा इस फ़ॉर्म की जगह लेगा'],
    g_unknown:        ['Could not verify identity — page shows: {p}. Is the profile name right?', 'पहचान जाँच नहीं हो सकी — पेज पर: {p}। प्रोफ़ाइल सही है?'],
    s_replace:        ['Replace the saved {k} data of "{n}" ({a} fields) with this form ({b} filled)?', '"{n}" का सेव किया हुआ {k} डेटा ({a} फ़ील्ड) इस फ़ॉर्म ({b} भरे) से बदलें?'],
    s_add:            ['Add this {k} form to "{n}"?', 'यह {k} फ़ॉर्म "{n}" में जोड़ें?'],
    s_pick:           ['Pick a profile first', 'पहले प्रोफ़ाइल चुनें'],
    s_pick_del:       ['Pick a profile to delete', 'हटाने के लिए प्रोफ़ाइल चुनें'],
    s_del_q:          ['Delete profile "{n}"?', 'प्रोफ़ाइल "{n}" हटाएँ?'],
    s_deleted:        ['Profile deleted', 'प्रोफ़ाइल हटाई गई'],
    s_clear_q:        ['Clear all fields on the form?', 'फ़ॉर्म के सभी फ़ील्ड खाली करें?'],
    s_cleared:        ['Form cleared', 'फ़ॉर्म खाली कर दिया गया'],
    s_restored:       ['Example restored', 'उदाहरण वापस आ गया'],
    s_nothing:        ['Nothing to export', 'Export के लिए कुछ नहीं'],
    s_backup:         ['Backup downloaded', 'बैकअप डाउनलोड हो गया'],
    s_backup_one:     ['Exported → {n}', 'Export हो गया → {n}'],
    exp_t:            ['Export', 'Export'],
    exp_p:            ['Save a JSON file you can import on another phone or after reinstalling.', 'एक JSON फ़ाइल सेव करें जिसे दूसरे फ़ोन पर या दोबारा इंस्टॉल के बाद Import कर सकें।'],
    exp_one:          ['Only this profile', 'सिर्फ़ यह प्रोफ़ाइल'],
    exp_all:          ['All profiles ({n})', 'सभी प्रोफ़ाइल ({n})'],
    exp_all_sub:      ['full backup', 'पूरा बैकअप'],
    bk_lbl:           ['Backup reminder', 'बैकअप रिमाइंडर'],
    bk_body:          ['You have saved {n} times but never exported. If the browser data is cleared, profiles are lost — export a backup now.', 'आपने {n} बार सेव किया है, पर कभी Export नहीं किया। ब्राउज़र डेटा साफ़ होने पर प्रोफ़ाइल मिट जाती हैं — अभी Export करें।'],
    bk_body_old:      ['Your last backup was {d} days ago and you have saved {n} times since. Export a fresh backup.', 'आपका पिछला बैकअप {d} दिन पहले का था और तब से {n} बार सेव किया है। नया बैकअप Export करें।'],
    bk_now:           ['Export now', 'Export now'],
    bk_later:         ['Later', 'बाद में'],
    s_imported:       ['Imported {n} profile(s)', '{n} प्रोफ़ाइल Import हुईं'],
    s_invalid:        ['Invalid backup file', 'गलत बैकअप फ़ाइल'],
    dup_t:            ['Duplicate profile', 'प्रोफ़ाइल की कॉपी'],
    dup_short:        ['Duplicate', 'डुप्लिकेट'],
    dup_p:            ['Creates a copy for another family member — same address, you edit name & personal details.', 'परिवार के दूसरे सदस्य के लिए कॉपी बनाता है — पता वही, नाम और व्यक्तिगत जानकारी आप बदलें।'],
    dup_ph:           ['e.g. Ram Kumar 2', 'जैसे: राम कुमार 2'],
    dup_done:         ['Duplicated → {n}', 'कॉपी बनी → {n}'],
    dup_same:         ['Same address, edit name later', 'पता वही, नाम बाद में बदलें'],
    del_t:            ['Delete', 'हटाएँ'],
    del_short:        ['Delete', 'हटाएँ'],
    del_confirm:      ['Delete?', 'हटाएँ?'],
    edit_t:           ['Edit', 'एडिट'],
    edit_short:       ['Edit', 'एडिट'],
    /* ---------- review nudges (3.9.6) ---------- */
    rv_t:             ['Enjoying RTPS Pro?', 'RTPS Pro पसंद आया?'],
    rv_body:          ['You have auto-filled {f} forms ({b} boxes) with {p} profile — your rating helps other students find this FREE tool.', 'आपने {p} प्रोफ़ाइल से {f} फ़ॉर्म ({b} बॉक्स) भरे हैं — आपकी रेटिंग से दूसरे छात्रों को यह FREE टूल मिलेगा।'],
    rv_body_edge:     ['You have auto-filled {f} forms on Edge — please rate 5 stars and write your experience to help others find this FREE tool.', 'आपने Edge पर {f} फ़ॉर्म भरे हैं — कृपया 5 स्टार रेट करें और अपना अनुभव लिखें ताकि दूसरों को यह FREE टूल मिल सके।'],
    rv_now:           ['⭐ Rate on Firefox', '⭐ Firefox पर रेट करें'],
    rv_now_edge:      ['⭐ Rate on Edge', '⭐ Edge पर रेट करें'],
    rv_later:         ['Later', 'बाद में'],
    rv_never:         ['Never ask', 'दोबारा न पूछें'],
    gh_t:             ['Support us with a star', 'स्टार देकर सपोर्ट करें'],
    gh_body:          ['You have filled {b}+ boxes — give us a star on GitHub, it keeps RTPS Pro free.', 'आपने {b}+ बॉक्स भरे हैं — GitHub पर स्टार दें, इससे RTPS Pro FREE बना रहेगा।'],
    gh_now:           ['⭐ Star on GitHub', '⭐ GitHub पर स्टार'],
    gh_later:         ['Later', 'बाद में'],
    gh_never:         ['Never ask', 'दोबारा न पूछें'],
    rv_official:      ['Official: always FREE, never asks for money. If someone demands payment, it is a fake copy — please report it.', 'असली: हमेशा FREE, कभी पैसे नहीं मांगता। अगर कोई पैसे मांगे तो वह नकली कॉपी है — कृपया रिपोर्ट करें।'],
    /* ---------- content script toasts ---------- */
    t_filled:         ['✅ {f}/{t} fields filled', '✅ {t} में से {f} फ़ील्ड भरे'],
    t_auto:           ['{n} auto-set by site', '{n} साइट ने स्वयं भरे'],
    t_manual:         ['fill manually: {l}', 'खुद भरें: {l}'],
    t_borrowed:       ['basic details taken from your {k} profile — income / declaration boxes left for you (save this form once to fill them next time)',
                       'बुनियादी जानकारी {k} प्रोफ़ाइल से भरी गई — आय / घोषणा वाले बॉक्स आपके लिए छोड़े गए (इस फ़ॉर्म को एक बार सेव करें, अगली बार ये भी भरेंगे)'],
    t_draft:          ['📝 Unsaved draft found ({m} min ago, {n} fields).', '📝 बिना सेव किया ड्राफ़्ट मिला ({m} मिनट पहले, {n} फ़ील्ड)।'],
    t_restore:        ['Restore', 'वापस लाएँ'], t_discard: ['Discard', 'छोड़ें'],
    t_name:           ['Enter / select a profile name', 'प्रोफ़ाइल का नाम लिखें / चुनें'],
    t_empty:          ['Form is empty – nothing to save', 'फ़ॉर्म खाली है – सेव करने को कुछ नहीं'],
    t_saved:          ['💾 "{n}" saved ({c} fields)', '💾 "{n}" सेव हो गया ({c} फ़ील्ड)'],
    t_session:        ['⏰ Session timed out — RTPS portal logged you out.', '⏰ Session खत्म — RTPS पोर्टल ने लॉगआउट कर दिया।'],
    t_session_sub:    ['Click Relogin or open RTPS homepage again.', 'Relogin दबाएँ या RTPS homepage फिर से खोलें।'],
    t_relogin:        ['Open RTPS Home', 'RTPS होमपेज खोलें'],
    t_session_title:  ['Session expired', 'Session खत्म'],
    /* ---------- options ---------- */
    o_sub:            ['Settings & profile editor', 'सेटिंग्स और प्रोफ़ाइल एडिटर'],
    help_q:           ['Need help?', 'मदद चाहिए?'],
    help_sub:         ['Official: always FREE, never asks for money. If someone demands payment, it is a fake copy — please report it.', 'असली: हमेशा FREE, कभी पैसे नहीं मांगता। अगर कोई पैसे मांगे तो वह नकली कॉपी है — कृपया रिपोर्ट करें।'],
    help_open:        ['Open guides', 'गाइड खोलें'],
    help_link:        ['Open guides ↗', 'गाइड खोलें ↗'],
    help_res:         ['Need help? Open guides', 'मदद चाहिए? गाइड खोलें'],
    o_settings:       ['Settings', 'सेटिंग्स'], o_profiles: ['Profiles', 'प्रोफ़ाइल'], o_backup: ['Backup', 'बैकअप'], o_history: ['History', 'हिस्ट्री'], o_help: ['Help', 'सहायता'],
    o_clear_history:  ['Clear history', 'हिस्ट्री हटाएँ'],
    o_history_note:   ['Last 20 fills/imports — metadata only, no values', 'पिछले 20 भराव/इम्पोर्ट — सिर्फ नाम/तारीख, वैल्यू नहीं'],
    o_history_empty:  ['No history yet — fill a form to see here', 'अभी कोई हिस्ट्री नहीं — फॉर्म भरें तो यहाँ दिखेगा'],
    o_lang:           ['Language', 'भाषा'], o_lang_sub: ['Applies to the popup, this page and on-page messages.', 'पॉपअप, यह पेज और फ़ॉर्म पर दिखने वाले संदेशों पर लागू होती है।'],
    o_draft:          ['Auto-save draft while typing', 'टाइप करते समय ड्राफ़्ट अपने-आप सेव हो'],
    o_draft_sub:      ['Recover your form after an accidental refresh / session timeout.', 'गलती से रीफ़्रेश या टाइम-आउट के बाद फ़ॉर्म वापस पाएँ।'],
    o_hl:             ['Highlight filled fields', 'भरे हुए फ़ील्ड हाइलाइट करें'],
    o_hl_sub:         ['Green outline on filled fields, red on failures.', 'भरे फ़ील्ड पर हरी रेखा, विफल पर लाल।'],
    o_wait:           ['Dependent dropdown wait (ms)', 'निर्भर ड्रॉपडाउन की प्रतीक्षा (ms)'],
    o_wait_sub:       ['Max wait for District → Sub-division → Block lists to load.', 'जिला → अनुमंडल → प्रखंड सूची लोड होने की अधिकतम प्रतीक्षा।'],
    o_kb:             ['Keyboard shortcuts', 'कीबोर्ड शॉर्टकट'], o_kb_change: ['Change', 'बदलें'],
    o_editor:         ['Profile editor', 'प्रोफ़ाइल एडिटर'],
    o_rename:         ['Rename', 'नाम बदलें'], o_dup: ['Duplicate', 'कॉपी बनाएँ'], o_del: ['Delete', 'हटाएँ'],
    o_addrow:         ['+ Add field', '+ फ़ील्ड जोड़ें'], o_savech: ['Save changes', 'बदलाव सेव करें'], o_adv: ['Advanced', 'एडवांस्ड'],
    o_adv_t:          ['Show ID / name / type for every field', 'हर फ़ील्ड का ID / name / type दिखाएँ'],
    o_empty:          ['No profiles yet. Save a form from the popup first.', 'अभी कोई प्रोफ़ाइल नहीं। पहले पॉपअप से फ़ॉर्म सेव करें।'],
    o_export:         ['Export all profiles (JSON)', 'सभी प्रोफ़ाइल Export करें (JSON)'], o_import: ['Import backup', 'बैकअप Import करें'], o_wipe: ['Delete ALL data', 'सारा डेटा हटाएँ'],
    o_import_note:    ['Import a backup file exported from RTPS Pro (from this or another phone).', 'RTPS Pro से Export की गई बैकअप फ़ाइल (इसी या दूसरे फोन की) Import करें।'],
    o_installed:      ['RTPS Pro by PakkaScore is installed!', 'RTPS Pro by PakkaScore इंस्टॉल हो गया!'],
    o_w1:             ['Open <a href="#" id="lnkRtps">serviceonline.bihar.gov.in</a> → <b>Apply Online → RTPS Services → General Administration Department → Issuance of Caste / Income / Residential Certificate → Block Level</b>.',
                       '<a href="#" id="lnkRtps">serviceonline.bihar.gov.in</a> खोलें → <b>ऑनलाइन आवेदन → लोक सेवाएँ → सामान्य प्रशासन विभाग → जाति / आय / आवासीय प्रमाण-पत्र का निर्गमन → अंचल स्तर पर</b>।'],
    o_w2:             ['In the popup pick an example — <b>Sita Devi (OBC)</b> for Caste / Income / Residence / OBC-NCL / NCL, or <b>Rahul Sharma (EWS)</b> for Income / Residence / EWS — and tap <b>Auto-fill</b> (sample data — don\'t submit!).',
                       'पॉपअप में उदाहरण चुनें — जाति / आय / निवास / OBC-NCL / NCL के लिए <b>Sita Devi (OBC)</b>, या आय / निवास / EWS के लिए <b>Rahul Sharma (EWS)</b> — और <b>Auto-fill</b> दबाएँ (नमूना डेटा — Submit न करें!)।'],
    o_w3:             ['For real use: fill the form once → open the popup <b>before Submit</b> → New profile → name → <b>Save</b>.', 'असली उपयोग: फ़ॉर्म एक बार भरें → <b>Submit से पहले</b> पॉपअप खोलें → <b>नई प्रोफ़ाइल</b> → नाम लिखें → <b>इस फ़ॉर्म से सेव करें</b>।'],
    o_w4:             ['Next time: open the form → <b>Auto-fill</b>. Only photo & captcha are left for you.', 'अगली बार: फ़ॉर्म खोलें → <b>Auto-fill</b>। सिर्फ़ फोटो और कैप्चा आपको भरना है।'],
    /* options: help (HTML blocks) */
    h_route_t:        ['How to reach the form', 'फ़ॉर्म तक कैसे पहुँचें'],
    h_route:          ['<b>Apply Online → RTPS Services → General Administration Department →</b> Issuance of <b>Caste / Income / Residential Certificate</b>, <b>Non Creamy Layer Certificate (For the purpose of Govt. of Bihar)</b>, <b>Non Creamy Layer Certificate (For the purpose of Govt. of India)</b> or <b>Economically Weaker Section Certificate</b> → <b>Block Level</b> (or Sub-Division / District Level as required).',
                       '<b>ऑनलाइन आवेदन → लोक सेवाएँ → सामान्य प्रशासन विभाग →</b> <b>जाति / आय / आवासीय प्रमाण-पत्र</b>, <b>क्रीमीलेयर रहित प्रमाण-पत्र (बिहार सरकार के प्रयोजनार्थ)</b>, <b>क्रीमीलेयर रहित प्रमाण-पत्र (भारत सरकार के प्रयोजनार्थ)</b> या <b>आर्थिक रूप से कमजोर वर्ग प्रमाण-पत्र</b> का निर्गमन → <b>अंचल स्तर पर</b> (या आवश्यकतानुसार अनुमंडल / जिला स्तर)।'],
    h_which_t:        ['Which NCL / EWS form?', 'कौन-सा NCL / EWS फ़ॉर्म?'],
    h_which:          ['<b>OBC (Govt. of India, Form-VI)</b> — central govt. jobs/exams (UPSC, SSC, railways, central universities). <b>NCL (Govt. of Bihar, Form-IX)</b> — Bihar state govt. jobs (BPSC etc.). BC/EBC applicants usually need both. <b>EWS</b> — General/unreserved-category families with income below the limit; not for BC/EBC/SC/ST.',
                       '<b>OBC (केंद्र, फॉर्म-VI)</b> — केंद्र सरकार की नौकरी/परीक्षा (UPSC, SSC, रेलवे, केंद्रीय विश्वविद्यालय) के लिए। <b>NCL (बिहार, फॉर्म-IX)</b> — बिहार राज्य सरकार की नौकरी (BPSC आदि) के लिए। पिछड़ा / अत्यंत पिछड़ा वर्ग को प्रायः दोनों चाहिए। <b>EWS</b> — सामान्य वर्ग के परिवारों के लिए, आय-सीमा के भीतर; BC/EBC/SC/ST के लिए नहीं।'],
    h_how_t:          ['How it works', 'यह कैसे काम करता है'],
    h_how:            ['RTPS Pro reads the labels of the open form and matches them to your saved profile — including dependent dropdowns (State → District → Sub-division → Block). Basic details (name, address, caste…) are shared across forms; income and declaration boxes are kept separately per form. It never types into photo, captcha or the declaration checkbox.',
                       'RTPS Pro खुले फ़ॉर्म के लेबल पढ़कर आपकी सेव की गई प्रोफ़ाइल से मिलाता है — राज्य → जिला → अनुमंडल → प्रखंड जैसे निर्भर ड्रॉपडाउन सहित। बुनियादी जानकारी (नाम, पता, जाति…) सभी फ़ॉर्म में साझा होती है; आय और घोषणा वाले बॉक्स हर फ़ॉर्म के लिए अलग रखे जाते हैं। फोटो, कैप्चा और घोषणा चेकबॉक्स कभी नहीं छूता।'],
    h_count_t:        ['What the counter means', 'काउंटर का मतलब'],
    h_count:          ['<b>40/38 ★</b> = you have filled 40 boxes; the portal insists on 38 (marked *). Green = every mandatory box answered. Extra optional boxes (Aadhaar, email…) are welcome, so the left number can exceed the right.',
                       '<b>40/38 ★</b> = आपने 40 बॉक्स भरे; पोर्टल को 38 (* वाले) अनिवार्य चाहिए। हरा = हर अनिवार्य बॉक्स भर गया। वैकल्पिक बॉक्स (आधार, ईमेल…) भरना अच्छा है, इसलिए बायाँ अंक दाएँ से ज़्यादा हो सकता है।'],
    h_deep_t:         ['Never bookmark deep links', 'फ़ॉर्म का सीधा लिंक बुकमार्क न करें'],
    h_deep:           ['Avoid saving links to specific application forms or download pages. Bookmark only the portal homepage (<b>serviceonline.bihar.gov.in</b>) and navigate to the form from there.',
                       'किसी खास आवेदन फ़ॉर्म या डाउनलोड पेज का लिंक सेव न करें। सिर्फ़ होमपेज (<b>serviceonline.bihar.gov.in</b>) बुकमार्क करें और वहाँ से फ़ॉर्म तक जाएँ।'],
    h_deep_warn:      ['Web links for applying for or downloading caste, residence and income certificates change frequently because of portal upgrades, server load distribution and security protocols. Government platforms handle millions of requests daily and continuously adjust their infrastructure — a saved deep link may stop working without notice. RTPS Pro therefore only ever opens the homepage and detects the form type from the page itself.',
                       'जाति, निवास और आय प्रमाण-पत्र के आवेदन/डाउनलोड लिंक पोर्टल अपग्रेड, सर्वर लोड और सुरक्षा कारणों से बार-बार बदलते हैं। सरकारी पोर्टल रोज़ लाखों अनुरोध संभालते हैं और अपना ढाँचा लगातार बदलते हैं — सेव किया हुआ सीधा लिंक बिना सूचना बंद हो सकता है। इसलिए RTPS Pro केवल होमपेज खोलता है और फ़ॉर्म का प्रकार पेज से ही पहचानता है।'],
    h_sw_t:           ['"Service worker (Inactive)"', '"Service worker (Inactive)" — यह सामान्य है'],
    h_sw:             ['Normal for Manifest V3 — Chrome sleeps the background worker when idle and wakes it instantly when you click the icon. Kiwi may also list an "ad blocking" notice on the Errors page for the popup — it is Kiwi\'s own filter, not an extension error.',
                       'Manifest V3 में सामान्य है — Chrome खाली समय में बैकग्राउंड वर्कर को सुला देता है और आइकन दबाते ही जगा देता है। Kiwi की Errors सूची में पॉपअप के लिए "ad blocking" नोटिस दिख सकता है — यह Kiwi का अपना फ़िल्टर है, एक्सटेंशन की गलती नहीं।'],
    h_priv_t:         ['Privacy', 'गोपनीयता'],
    h_priv:           ['All profiles are stored locally in your browser. Nothing is uploaded anywhere. Use Export for your own backup.', 'सभी प्रोफ़ाइल आपके ब्राउज़र में ही रहती हैं। कुछ भी कहीं अपलोड नहीं होता। अपने बैकअप के लिए Export का उपयोग करें।'],
    h_about_t:        ['About', 'परिचय'],
    h_about:          ['<b>RTPS Pro by PakkaScore</b> v{v} — free, open source, 100% on-device. Nothing is uploaded anywhere.<br><a href="https://pakkascore.blogspot.com/search/label/RTPS%20Pro" target="_blank" rel="noopener"><b>Help &amp; guides ↗</b></a> · <a href="https://addons.mozilla.org/firefox/addon/rtps-pro/" target="_blank" rel="noopener"><b>Firefox Add-ons ↗</b></a> · <a href="https://github.com/PakkaScore/rtps-pro/releases/latest" target="_blank" rel="noopener"><b>Latest version (GitHub) ↗</b></a>',
                       '<b>RTPS Pro by PakkaScore</b> v{v} — मुफ़्त, ओपन सोर्स, 100% आपके डिवाइस पर। कुछ भी कहीं अपलोड नहीं होता।<br><a href="https://pakkascore.blogspot.com/search/label/RTPS%20Pro" target="_blank" rel="noopener"><b>मदद और गाइड ↗</b></a> · <a href="https://addons.mozilla.org/firefox/addon/rtps-pro/" target="_blank" rel="noopener"><b>Firefox Add-ons ↗</b></a> · <a href="https://github.com/PakkaScore/rtps-pro/releases/latest" target="_blank" rel="noopener"><b>नया वर्ज़न (GitHub) ↗</b></a>']
  };

  let lang = 'hi';
  const idx = () => (lang === 'en' ? 0 : 1);
  function t(key, vars) {
    const row = S[key]; let s = row ? row[idx()] : key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split('{' + k + '}').join(String(v));
    return s;
  }
  function renderHTML(el, html) {
    const doc = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html');
    el.replaceChildren(...Array.from(doc.body.childNodes).map(function(n){ return document.importNode(n, true); }));
  }
    function apply(rootEl) {
    (rootEl || document).querySelectorAll('[data-i]').forEach(el => { const v = t(el.dataset.i, { v: (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) ? chrome.runtime.getManifest().version : '' }); if (el.dataset.iv !== v) { renderHTML(el, v); el.dataset.iv = v; } });
    (rootEl || document).querySelectorAll('[data-i-title]').forEach(el => { const v = t(el.dataset.iTitle); if (el.title !== v) el.title = v; });
    (rootEl || document).querySelectorAll('[data-i-ph]').forEach(el => { const v = t(el.dataset.iPh); if (el.placeholder !== v) el.placeholder = v; });
    if (document.documentElement.lang !== lang) document.documentElement.lang = lang;
    document.querySelectorAll('.langsw button').forEach(b => { const on = b.dataset.lang === lang; if (b.classList.contains('on') !== on) b.classList.toggle('on', on); });
  }
  async function init() {
    try { const r = await chrome.storage.local.get('lang'); if (r.lang === 'en' || r.lang === 'hi') lang = r.lang; else lang = 'hi'; } catch {}
    return lang;
  }
  async function set(l, silent) { lang = l === 'en' ? 'en' : 'hi'; try { await chrome.storage.local.set({ lang }); } catch {} if (!silent) apply(); }
  root.I18N = { t, apply, init, set, get lang() { return lang; } };
})(typeof self !== 'undefined' ? self : this);