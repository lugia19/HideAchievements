# HideAchievements

A minimal theme that adds toggles for hiding clutter on Steam game pages.

## What it controls

Each of these has **Show / Hide / On hover** options (except the mini bar, which is Show / Hide only):

- Activity feed
- Achievements section
- Trading Cards section
- Mini achievements progress bar (next to the Play button)

"On hover" keeps the section's header visible but collapses the contents; hovering the section expands it.

Defaults are set to **On hover** (or **Hide** for the mini bar).

## How it works

The JS file (`libraryroot.custom.js`) tags Steam's game-page sections with stable class names, because Steam's own class names are hashed build artifacts that change with every update.

Each section is identified by structural fingerprints:

| Section | Fingerprint |
| --- | --- |
| Activity feed | An outer `[role="region"]` with a direct `<h2>` child, containing inner `[role="region"]` elements with `<h4>` date headers. |
| Achievements section | A `[role="region"]` containing both an `X/Y` fraction in its text and a width-styled element whose percentage matches `X/Y × 100`. |
| Trading Cards section | A `[role="region"]` containing `[role="listitem"]` children with images from Steam's `/economy/image/` CDN. |
| Mini achievements bar | A `[role="progressbar"]` whose `aria-valuenow` matches a nearby `X/Y` fraction's percentage. |

The Achievements/Mini bar fingerprints use math (fraction's value must equal the rendered percentage within 1%) to avoid false positives.

The whole JS file is also gated on `isGamePage()`, a check for the `input[name="fileuploadhero"]` element that only exists on game pages.

## Adding more sections

To add another toggleable section:

1. Write a new tagger function in `libraryroot.custom.js` that identifies the section structurally and adds a stable class (e.g. `mil-region-whatever`).
2. Call it from `apply()`.
3. Make a folder under `elements/options/` with `hide.css` and (optionally) `hover.css` targeting `.mil-region-whatever`.
4. Add a new entry to `Conditions` in `skin.json` pointing at those CSS files.
