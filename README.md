# HideAchievements

A minimal [Millennium](https://steambrew.app/) **plugin** that adds toggles for hiding achievement-related UI elements.

<img width="1572" height="650" alt="image" src="https://github.com/user-attachments/assets/ecc7baa0-98f6-4708-9377-5c2ba7853483" />


## What it controls

Each of these has **Show / Hide / On hover** options (except the mini bar, which is Show / Hide only):

- Activity feed
- Achievements section
- Trading Cards section
- Mini achievements progress bar (next to the Play button)
- In-game overlay achievements (Show / Hide only): the Achievements taskbar button and the "Your Achievements" section in the Game Overview window

"On hover" keeps the section's header visible but collapses the contents; hovering the section expands it.

Defaults are set to **On hover** (or **Hide** for the mini bar).

## Installation

1. Download a release (or build from source, see below).
2. Drop the plugin folder into `<Steam>\millennium\plugins\`.
3. Restart Steam and enable **HideAchievements** in Millennium's settings.

Settings live in Millennium settings → Plugins → HideAchievements.

## Building from source

```
npm install
npm run build   # or `npm run dev` while developing
```

This produces `.millennium/Dist/index.js`. To package a release zip (type check + prod build + bundle into `release/`):

```powershell
./build.ps1
``` For development, junction the repo into the plugins folder so builds are picked up directly:

```powershell
New-Item -ItemType Junction -Path "C:\Program Files (x86)\Steam\millennium\plugins\hide-achievements" -Target "<path to this repo>"
```

After a rebuild, reload plugins (or restart Steam) to pick up changes.

## How it works

The plugin's frontend runs in Steam's shared JS context and hooks every main Steam window via `Millennium.AddWindowCreateHook`. In each window it runs a debounced MutationObserver (`frontend/taggers.ts`) that tags game-page sections with stable class names — Steam's own class names are hashed build artifacts that change with every update — and injects a `<style>` element (`frontend/styles.ts`) generated from your settings.

Each section is identified by structural fingerprints:

| Section | Fingerprint |
| --- | --- |
| Activity feed | An outer `[role="region"]` with a direct `<h2>` child, containing inner `[role="region"]` elements with `<h4>` date headers. |
| Achievements section | A `[role="region"]` containing both an `X/Y` fraction in its text and a width-styled element whose percentage matches `X/Y × 100`. |
| Trading Cards section | A `[role="region"]` containing `[role="listitem"]` children with images from Steam's `/economy/image/` CDN. |
| Mini achievements bar | A `[role="progressbar"]` whose `aria-valuenow` matches a nearby `X/Y` fraction's percentage. |

The Achievements/Mini bar fingerprints use math (fraction's value must equal the rendered percentage within 1%) to avoid false positives.

Tagging is also gated on `isGamePage()`, a check for the `input[name="fileuploadhero"]` element that only exists on game pages.

The in-game overlay needs no tagging: its windows (`desktopoverlay_…`, `GameOverview_…`) register in the same popup manager, and its elements carry stable identifiers — the taskbar button has Valve's semantic `Achievements` component class, and the Game Overview section has `data-rbd-draggable-id="Achievements"`.

This makes the detection language-agnostic — no text labels are matched, so it works in every Steam UI language.

## Adding more sections

To add another toggleable section:

1. Write a new tagger function in `frontend/taggers.ts` that identifies the section structurally and adds a stable class (e.g. `mil-region-whatever`), and call it from `applyTags()`. Add the key to `SectionKey`.
2. Add the class and (optionally) hover support in `frontend/styles.ts` (`CLASS` map and `buildCss`).
3. Add a default in `DEFAULTS` and a `SectionSetting` entry in `frontend/index.tsx`.
