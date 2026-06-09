# HideAchievements — developer notes

Millennium plugin that hides achievement-related UI in the Steam client. See README.md for user-facing docs.

## Build & install

- `npm install`, then `npm run dev` (or `npm run build` for prod) → `.millennium/Dist/index.js` via `millennium-ttc`.
- ttc does no type checking; run `npx tsc --noEmit` separately.
- For local dev, junction this repo into the plugins folder (no admin needed):
  `New-Item -ItemType Junction -Path "C:\Program Files (x86)\Steam\millennium\plugins\hide-achievements" -Target <repo>`
- Frontend-only changes: reload plugin. Backend (`backend/main.lua`) changes: restart Steam.
- Plugin log: `<Steam>\millennium\logs\hide-achievements_log.log` (backend `logger` only — frontend `console.log` does NOT land there; use the browser console / CDP instead).

## Architecture gotchas

- The frontend bundle runs in **SharedJSContext**, a headless page. Its `document` is empty — all visible UI lives in popup windows registered in `g_PopupManager`. `Millennium.AddWindowCreateHook` fires for every popup (including already-open ones at plugin load); get the DOM via `context.m_popup.document`.
- Window names seen in `g_PopupManager`: main desktop = `SP Desktop_uid0`; in-game overlay root (taskbar, clock, Exit game) = `desktopoverlay_uid<pid>`; overlay Game Overview panel = `GameOverview_«rpf»_uid<pid>`; plus `friendslist_uid…`, `contextmenu_…`.
- Millennium's `pluginConfig`/`usePluginConfig` APIs require a newer Millennium than 3.2.x — they fail with a JSON type error. Settings instead go through Lua backend RPCs (`GetSettings`/`SaveSettings` → `settings.json` in the plugin folder), the same pattern as hltb-millennium-plugin.
- Steam's hashed CSS classes (`_3ZLaTx…`) churn every update — never target them. Stable anchors: semantic component classes (`button.Achievements`, `DialogButton`, `tool-tip-source`), `role`/`data-*` attributes (`data-rbd-draggable-id="Achievements"`), and structural fingerprints (see README).

## Debugging Steam UI via CDP (Chrome DevTools Protocol)

Steam's whole UI is CEF (embedded Chrome); every window is an HTML page that can be remotely scripted.

1. **Enable**: create an empty file `<Steam>\.cef-enable-remote-debugging`, restart Steam. CEF then serves CDP on `http://localhost:8080`.
2. **Enumerate pages**: `http://localhost:8080/json` lists every target (page) with a WebSocket debugger URL. Each F12 DevTools window is bound to ONE target — if an element seems "uninspectable", it lives in a different target.
3. **Run JS in any target**: use `cdp-eval.mjs` (repo root):
   - `node cdp-eval.mjs` — list targets
   - `node cdp-eval.mjs SharedJSContext "<expr>"` — evaluate inline (promises awaited, result returned by value)
   - `node cdp-eval.mjs SharedJSContext file:query.js` — evaluate a script file (avoids shell-quoting pain; keep a scratch `query.js`, gitignored)
4. **Reach every window from one place**: evaluate in `SharedJSContext` and use `g_PopupManager` — all popups are same-origin windows, so their DOMs are directly scriptable:
   ```js
   [...g_PopupManager.GetPopups()].map(p => p.m_strName)            // list windows
   [...g_PopupManager.GetPopups()].find(p => p.m_strName.startsWith('desktopoverlay'))
       .m_popup.document.querySelectorAll('button')                  // query another window's DOM
   ```
   This is the same access path the plugin uses at runtime, so CSS/selector experiments done this way are faithful: inject a `<style>` into a popup's `document.head` via CDP, confirm visually, then ship the same CSS in the plugin.
