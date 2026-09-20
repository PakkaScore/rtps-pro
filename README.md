<p align="center"><img src="icon-128.png" width="88" alt="RTPS Pro"></p>
<h1 align="center">RTPS Pro <sub>by PakkaScore</sub></h1>
<p align="center">Bihar RTPS फ़ॉर्म एक बार सेव करें — अगली बार एक टैप में Auto‑fill।<br>
<sub>Save a Bihar RTPS certificate form once, auto‑fill it next time in one tap.</sub></p>

<p align="center">
<a href="https://addons.mozilla.org/firefox/addon/rtps-pro/"><img alt="Firefox Add-ons" src="https://img.shields.io/amo/v/rtps-pro?label=Firefox%20Add-ons&color=FF7139"></a>
<a href="../../releases/latest"><img alt="Kiwi / Chrome zip" src="https://img.shields.io/github/v/release/PakkaScore/rtps-pro?label=Kiwi%20%2F%20Chrome%20zip&color=F0A500"></a>
<img alt="Privacy" src="https://img.shields.io/badge/data-stays%20on%20device-16a34a">
</p>

## Install

| Browser | How |
|---|---|
| **Firefox** (Android / desktop) ⭐ recommended | [Get Firefox](https://www.firefox.com/en-US/) → open [**Add to Firefox**](https://addons.mozilla.org/firefox/addon/rtps-pro/) → **Add** |
| **Quetta** or **Kiwi** (Android) | [Get Quetta](https://play.google.com/store/apps/details?id=net.quetta.browser) (Play Store) or [Kiwi](https://github.com/kiwibrowser/src.next/releases/tag/14310011181) → download [`rtps-pro.zip`](../../releases/latest/download/rtps-pro.zip) → Extensions → Developer mode → **(from .zip/.crx/.user.js)** → choose the zip |
| **Chrome / Edge** (desktop) | Unzip [`rtps-pro.zip`](../../releases/latest/download/rtps-pro.zip) → `chrome://extensions` → Developer mode → **Load unpacked** |

> **Why Firefox?** Chrome sometimes shows *"Your connection is not private"* on serviceonline.bihar.gov.in; Firefox opens it fine, and the RTPS portal itself recommends Firefox.

## Use

1. Open any RTPS form on `serviceonline.bihar.gov.in` and fill it.
2. **Before Submit** → open RTPS Pro → **New profile** → **Save from this form**.
3. Next time: open form → pick profile → **Auto‑fill**. Only photo & captcha remain.

Works for जाति · आय · निवास · OBC‑NCL (केंद्र) · NCL (बिहार) · EWS. Two fictitious example profiles are bundled for a quick test — never submit them.

<details><summary>Features</summary>

- Dependent dropdowns handled (State → District → Sub‑division → Block → Panchayat)
- Multiple profiles, rename / duplicate / edit any field
- Live counter: filled / mandatory
- Draft auto‑save while typing, restore after session timeout
- Export / Import JSON backup
- हिन्दी / English UI, automatic dark mode
- Never presses Submit, uploads photos, or solves captcha
</details>

**Privacy:** 100 % on‑device. No server, no account, no analytics, no network requests.

### Help

For guides and troubleshooting, see [**RTPS Pro Help & Guides**](https://pakkascore.blogspot.com/search/label/RTPS%20Pro).

<sub>MIT License · New RTPS fields are picked up automatically on the next Save — no update needed.</sub>
