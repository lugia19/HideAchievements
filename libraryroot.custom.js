// HideAchievements - tags Steam game page sections with stable classes
// so the option CSS files can target them despite Steam's hashed class names.

const tagRegion = (text, className) => {
    document.querySelectorAll('[role="region"]').forEach(region => {
        if (region.classList.contains(className)) return;
        const h = region.querySelector('h2');
        if (h?.textContent.trim().startsWith(text)) {
            region.classList.add(className);
        }
    });
};

const tagMiniAchievements = () => {
    document.querySelectorAll('[role="progressbar"]').forEach(pb => {
        let el = pb.parentElement;
        for (let i = 0; i < 4 && el; i++, el = el.parentElement) {
            if (el.classList.contains('mil-mini-achievements')) return;
            const hasLabel = Array.from(el.children).some(
                c => c.textContent.trim() === 'Achievements'
            );
            if (hasLabel) {
                el.classList.add('mil-mini-achievements');
                return;
            }
        }
    });
};

const apply = () => {
    tagRegion('Activity', 'mil-region-activity');
    tagRegion('Achievements', 'mil-region-achievements');
    tagRegion('Trading Cards', 'mil-region-cards');
    tagMiniAchievements();
};

// Debounced observer - Steam's React UI mutates frequently
let timer;
new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(apply, 100);
}).observe(document.body, { childList: true, subtree: true });

apply();
