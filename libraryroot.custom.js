// HideAchievements - tags Steam game page sections with stable classes
// so the option CSS files can target them despite Steam's hashed class names
// and across all UI languages.

// ---------- Helpers ----------

const fractionToPercent = (text) => {
    const m = text.match(/(\d+)\s*\/\s*(\d+)/);
    if (!m) return null;
    const n = parseInt(m[1], 10);
    const d = parseInt(m[2], 10);
    return d === 0 ? null : (n / d) * 100;
};

const roughlyEqual = (a, b, tol = 1) => Math.abs(a - b) <= tol;

// Only run the taggers on game pages. The hero/logo file inputs are
// unique to game pages (used for custom banner art) and aren't affected
// by class-name hashing or i18n.
const isGamePage = () =>
    document.querySelector('input[name="fileuploadhero"]') !== null;

// ---------- Taggers ----------

// Activity region: outer [role=region] with a direct h2 child,
// containing an inner [role=region] whose header is an h4 (the date).
const tagActivity = () => {
    document.querySelectorAll('h4').forEach(h4 => {
        const innerRegion = h4.closest('[role="region"]');
        if (!innerRegion) return;
        const outerRegion = innerRegion.parentElement?.closest('[role="region"]');
        if (!outerRegion || outerRegion.classList.contains('mil-region-activity')) return;
        if (outerRegion.querySelector(':scope > h2')) {
            outerRegion.classList.add('mil-region-activity');
        }
    });
};

// Achievements region: a [role=region] containing a width-styled element
// where the width % matches a nearby "X/Y" fraction's percentage.
const tagAchievementsRegion = () => {
    document.querySelectorAll('[role="region"]').forEach(region => {
        if (region.classList.contains('mil-region-achievements')) return;

        const fracPct = fractionToPercent(region.textContent || '');
        if (fracPct === null) return;

        const widthEls = region.querySelectorAll('[style*="width"]');
        for (const widthEl of widthEls) {
            const m = widthEl.style.width.match(/^(\d+(?:\.\d+)?)\s*%$/);
            if (!m) continue;
            const widthPct = parseFloat(m[1]);
            if (roughlyEqual(fracPct, widthPct, 1)) {
                region.classList.add('mil-region-achievements');
                return;
            }
        }
    });
};

// Trading Cards region: a [role=region] containing [role=listitem]
// children, where at least one listitem has an <img> from Steam's
// economy image CDN.
const tagCardsRegion = () => {
    document.querySelectorAll('[role="region"]').forEach(region => {
        if (region.classList.contains('mil-region-cards')) return;
        const listitems = region.querySelectorAll('[role="listitem"]');
        if (listitems.length === 0) return;
        for (const li of listitems) {
            if (li.querySelector('img[src*="/economy/image/"]')) {
                region.classList.add('mil-region-cards');
                return;
            }
        }
    });
};

// Mini achievements bar: a [role=progressbar] whose aria-valuenow matches
// the percentage of a nearby "X/Y" fraction in the DOM. Tag the nearest
// ancestor that contains the fraction text.
const tagMiniAchievements = () => {
    document.querySelectorAll('[role="progressbar"]').forEach(pb => {
        if (pb.closest('.mil-mini-achievements')) return;
        const v = parseFloat(pb.getAttribute('aria-valuenow'));
        if (isNaN(v)) return;

        let el = pb.parentElement;
        for (let i = 0; i < 4 && el; i++, el = el.parentElement) {
            const pct = fractionToPercent(el.textContent || '');
            if (pct !== null && roughlyEqual(pct, v, 1)) {
                const target = el.parentElement?.parentElement ?? el;
                target.classList.add('mil-mini-achievements');
                return;
            }
        }
    });
};

// ---------- Driver ----------

const apply = () => {
    if (!isGamePage()) return;
    tagActivity();
    tagAchievementsRegion();
    tagCardsRegion();
    tagMiniAchievements();
};

// Debounced observer - Steam's React UI mutates frequently.
let timer;
new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(apply, 100);
}).observe(document.body, { childList: true, subtree: true });

apply();
