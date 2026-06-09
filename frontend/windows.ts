import { Millennium } from '@steambrew/client';
import { startTagging } from './taggers';
import { applyStyles, removeStyles, STYLE_ID, Modes, WindowKind } from './styles';

interface HookedWindow {
    win: Window;
    doc: Document;
    kind: WindowKind;
    stopTagging: () => void;
    onUnload: () => void;
}

const kindFor = (name: string): WindowKind | null => {
    if (name.startsWith('SP ')) return 'main';
    // In-game overlay surfaces: the overlay root (taskbar) and the Game
    // Overview panel. Both register in g_PopupManager like regular popups.
    if (/^(desktopoverlay_|GameOverview_)/.test(name)) return 'overlay';
    return null;
};

// Attaches the tagging observer and style element to every Steam main
// window ("SP Desktop_uid0" etc.) — the game page DOM lives there, not in
// SharedJSContext where this code runs.
export class WindowManager {
    private hooked: HookedWindow[] = [];
    private disposed = false;

    constructor(private getModes: () => Modes) {}

    start(): void {
        // AddWindowCreateHook also invokes the callback for every already-open
        // popup, so plugin (re)loads after the main window exists are covered.
        // There is no unregister API — after dispose() the stale callback
        // no-ops via the disposed flag.
        Millennium.AddWindowCreateHook?.((context: any) => {
            if (this.disposed) return;
            const kind = context?.m_strName ? kindFor(context.m_strName) : null;
            if (!kind) return;
            const win: Window | undefined = context.m_popup;
            const doc: Document | undefined = win?.document;
            if (!doc?.body) return;
            if (doc.getElementById(STYLE_ID)) return;
            this.attach(win!, doc, kind);
        });
    }

    private attach(win: Window, doc: Document, kind: WindowKind): void {
        // Overlay windows need no tagging — their selectors are static.
        const stopTagging = kind === 'main' ? startTagging(doc) : () => {};
        applyStyles(doc, this.getModes(), kind);
        const entry: HookedWindow = {
            win,
            doc,
            kind,
            stopTagging,
            onUnload: () => this.detach(entry),
        };
        win.addEventListener('unload', entry.onUnload);
        this.hooked.push(entry);
    }

    private detach(entry: HookedWindow): void {
        entry.stopTagging();
        try {
            removeStyles(entry.doc);
            entry.win.removeEventListener('unload', entry.onUnload);
        } catch {
            // window/document already torn down
        }
        this.hooked = this.hooked.filter(e => e !== entry);
    }

    refreshStyles(): void {
        for (const entry of [...this.hooked]) {
            try {
                applyStyles(entry.doc, this.getModes(), entry.kind);
            } catch {
                this.detach(entry);
            }
        }
    }

    dispose(): void {
        this.disposed = true;
        for (const entry of [...this.hooked]) this.detach(entry);
    }
}
