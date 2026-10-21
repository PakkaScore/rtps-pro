# RTPS Pro by PakkaScore

Free, open-source auto-save & auto-fill helper for **serviceonline.bihar.gov.in**
(जाति / आय / निवास certificate forms). 100 % local – no server, no analytics, no donation nags.

**Always FREE — never asks for money on WhatsApp. Beware of paid copies demanding payment.**

Website: [https://pakkascore.blogspot.com](https://pakkascore.blogspot.com)
Source: https://github.com/PakkaScore/rtps-pro
AMO: https://addons.mozilla.org/en-US/firefox/addon/rtps-pro/ (by PakkaScore, MIT)

## Official Distribution

- **Firefox (Android/desktop):** https://addons.mozilla.org/en-US/firefox/addon/rtps-pro/ — by PakkaScore, MIT License
- **Chrome/Kiwi/Quetta:** https://github.com/PakkaScore/rtps-pro/releases — rtps-pro.zip — always FREE
- **Guides:** https://pakkascore.blogspot.com/search/label/RTPS%20Pro

⚠️ Any other AMO listing with same name but different author, or demanding payment on WhatsApp, is an unauthorized copy of this free tool. Original is always FREE. If you see paid demand, please Report this add-on on AMO.

MIT License — Copyright (c) 2026 PakkaScore


## v3.6.0 — Language switch
- **EN | हिं** toggle in the popup header and in Settings → Language. One language at a time (default हिन्दी); applies to popup, settings page and the on-page toasts. Form names stay bilingual because the portal shows them that way.
- All strings live in `i18n.js`.
- Counter: left = every field you filled, right = mandatory (*) count — `36/38`, `40/38`. Colour only reflects whether any mandatory box is still empty.

## v3.5.1
- **Mandatory-field counter.** The header pill now counts only fields marked * on the portal: `12/32 ★ · 20 left`, `40/38 ★ · Ready` (left = all fields filled incl. optional, right = mandatory count). A line under it names the first missing mandatory fields and shows `+N optional` for extras like Aadhaar/email. No progress bar / percentage (totals are approximate).
- **Clear form** is enabled only when the form has something to clear; **Restore example** only when an example was deleted.
- Clearer onboarding: fill → come back **before Submit** → New profile → Save → then Submit.

## v3.5.0 — "Soft Card" UI
- New popup design: warm cream theme, hero card with **fill-progress bar** (Empty / Partial / Ready), round avatar, 3×2 action tiles, saffron gradient Auto-fill. Automatic dark theme follows the phone setting. Settings page restyled to match. All actions and behaviour unchanged.

## v3.4.0
- **Per-form income & declarations.** Income boxes, tax radios, purpose, evidence/affidavit ticks, property sections, residence type and EWS choice are stored per form and are **never copied between forms**. Basic details (name, parents, DOB, Aadhaar, mobile, address chain, religion, category, caste, occupation) are shared, so a profile saved on one form still fills the basics of every other form; a bilingual toast tells you which boxes were left for you.
- Cross-form label synonyms ("Name of Applicant" ≡ "Applicant's Name").
- v3.3.2: DOB datepicker fix, Aadhaar/Religion/Panchayat/Category/income-rows on OBC-NCL/EWS, faster start on big forms.

## Install locally (unpacked)
1. Unzip `rtps-pro.zip` (or use the `rtps-pro/` folder).
2. Chrome → `chrome://extensions` → turn on **Developer mode** (top-right).
3. Click **Load unpacked** → select the `rtps-pro` folder.
4. Pin the icon. Open any RTPS form and you're ready.

> `.crx` files from outside the Web Store are blocked by Chrome on Windows/Mac, so "Load unpacked" is the reliable route. On Linux/ChromeOS you may also drag `rtps-pro.crx` onto `chrome://extensions`.

## Try it in 10 seconds – bundled example profile
A ready-made profile **📘 Example – Sita Devi** is pre-installed (all three forms: जाति / आय / निवास).
Open any real RTPS form → extension popup / floating panel → pick the example → **⚡ Auto-fill**.
It fills everything except the photo, "Apply to the Office" (site computes it) and the captcha.
It's sample data – don't submit it. Delete it or restore it any time (popup → **📘 Restore example profile**).

## Usage
| Action | How |
|---|---|
| Save a form | Fill it → popup → name → **💾 Save** (or `Alt+Shift+S`) |
| Auto-fill | Open form → popup → pick profile → **⚡ Auto-fill** (or `Alt+Shift+F`, or right-click menu) |
| Recover after refresh | A "draft found – Restore" toast appears automatically |
| On Kiwi / Android | Open the form tab, then tap the extension from the browser menu – the popup opens as a tab and finds the RTPS tab automatically |
| Edit saved values | popup → **✏️ Edit data** |
| Backup / move PC | popup → **Export** / **Import** (legacy extension backups also import) |

## What's improved vs. the original
| Area | Original (v1.0.0) | RTPS Pro |
|---|---|---|
| Field matching | label-keyword heuristics, hard-coded element IDs | id → name → label triple match; works for every field, not only a fixed list |
| Dependent dropdowns (State→District→Sub-div→Block, Caste→Sub-caste) | fixed 1.8 s sleeps | `MutationObserver` – waits until options actually load, retries newly appeared fields |
| Multi-form | one blob per profile | one profile stores **all three forms** separately |
| Draft recovery | ❌ | ✅ auto-saves while typing, offers restore after reload |
| In-page UI | ❌ | lightweight toasts + green/red field highlighting (no heavy overlays) |
| Shortcuts / context menu | ❌ | `Alt+Shift+F/S`, right-click menu |
| Profile editor | ❌ | full table editor, rename, duplicate |
| Fill report | count only | per-field progress bar + list of fields not found |
| Migration | – | auto-imports original extension's profiles & backup JSON |
| Popup | donation QR / UPI / social links | clean, dark-mode aware UI |

## Privacy
Only `storage`, `activeTab`, `scripting`, `contextMenus`; host access limited to `serviceonline.bihar.gov.in`.
Everything stays in `chrome.storage.local`.

## Disclaimer
Not affiliated with the Government of Bihar. Always review the form before submitting.

> "Service worker (Inactive)" on the extensions page is normal for Manifest V3 – the worker sleeps when idle and wakes instantly when you use the popup, shortcut or context menu.

## v3.0.0 — PakkaScore edition
- New UI following the PakkaScore identity (navy / saffron, Poppins + Inter, P-mark icon).
- Searchable profile picker with per-form ✓ badges; structured fill result card.
- Homepage-only navigation: the extension never deep-links to form URLs (they change often); the form type is detected from the page itself.
- Help page with the "never bookmark deep links" guidance.

## v3.3.0 — OBC-NCL (केंद्र), NCL (बिहार) and EWS forms
- Six form kinds: जाति, आय, निवास, OBC-NCL (Govt. of India, Form-VI, serviceId 9330011), NCL (Govt. of Bihar, Form-IX), EWS (serviceId 10430013).
- Forms are matched by *kind* (detected from the page heading) rather than fixed serviceIds, so profiles survive portal URL changes.
- Two bundled examples: **Sita Devi (OBC)** — जाति/आय/निवास/OBC/NCL — and **Rahul Sharma (EWS)** — आय/निवास/EWS.
