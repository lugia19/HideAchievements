import type { SectionKey } from './taggers';

export type SectionMode = 'show' | 'hide' | 'hover';
export type ModeKey = SectionKey | 'overlay';
export type Modes = Record<ModeKey, SectionMode>;

// 'main' = desktop/library windows (game pages, tagged classes);
// 'overlay' = in-game overlay windows (stable semantic selectors, no tagging).
export type WindowKind = 'main' | 'overlay';

export const STYLE_ID = 'hide-achievements-styles';

const CLASS: Record<SectionKey, string> = {
    activity: 'mil-region-activity',
    achievements: 'mil-region-achievements',
    cards: 'mil-region-cards',
    mini_achievements: 'mil-mini-achievements',
};

const hideCss = (cls: string): string => `.${cls} { display: none !important; }`;

// Collapse contents but keep the h2 header; reveal on hover.
const hoverCss = (cls: string): string => `
.${cls} > *:not(h2) {
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    transition: max-height 0.4s ease, opacity 0.2s ease;
}
.${cls}:hover > *:not(h2) {
    max-height: 5000px;
    opacity: 1;
}`;

// Overlay taskbar button (button.Achievements is a stable Valve component
// class, not a hashed artifact; the .tool-tip-source wrapper removes the
// gap it would leave) and the "Your Achievements" section in Game Overview
// (data-rbd-draggable-id is the section's programmatic drag-reorder id).
const OVERLAY_HIDE_CSS = `
.tool-tip-source:has(> button.Achievements) { display: none !important; }
[data-rbd-draggable-id="Achievements"] { display: none !important; }`;

export const buildOverlayCss = (modes: Modes): string =>
    modes.overlay === 'hide' ? OVERLAY_HIDE_CSS : '';

export const buildCss = (modes: Modes): string =>
    (Object.keys(CLASS) as SectionKey[])
        .map(key => {
            const mode = modes[key];
            if (mode === 'hide') return hideCss(CLASS[key]);
            // The mini achievements bar has no header to keep, so it has no hover mode.
            if (mode === 'hover' && key !== 'mini_achievements') return hoverCss(CLASS[key]);
            return '';
        })
        .filter(Boolean)
        .join('\n');

export const applyStyles = (doc: Document, modes: Modes, kind: WindowKind): void => {
    let el = doc.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!el) {
        el = doc.createElement('style');
        el.id = STYLE_ID;
        doc.head.appendChild(el);
    }
    el.textContent = kind === 'overlay' ? buildOverlayCss(modes) : buildCss(modes);
};

export const removeStyles = (doc: Document): void => {
    doc.getElementById(STYLE_ID)?.remove();
};
