// Settings persistence via the Lua backend (GetSettings/SaveSettings RPCs
// writing settings.json in the plugin folder). Millennium's built-in
// pluginConfig API is too new for Millennium 3.2.x, so we follow the same
// roll-your-own pattern as hltb-millennium-plugin.
import { callable } from '@steambrew/client';
import type { Modes } from './styles';

export const DEFAULTS: Modes = {
    activity: 'hover',
    achievements: 'hover',
    cards: 'hover',
    mini_achievements: 'hide',
    overlay: 'hide',
};

interface SettingsResponse {
    success: boolean;
    error?: string;
    data?: Partial<Modes>;
}

const GetSettingsRpc = callable<[], string>('GetSettings');
const SaveSettingsRpc = callable<[{ settings_json: string }], string>('SaveSettings');

export async function loadSettings(): Promise<Modes> {
    try {
        const resultJson = await GetSettingsRpc();
        const result: SettingsResponse = JSON.parse(resultJson);
        if (result.success && result.data) {
            return { ...DEFAULTS, ...result.data };
        }
        console.error('[HideAchievements] GetSettings unsuccessful:', result.error);
    } catch (e) {
        console.error('[HideAchievements] Failed to load settings:', e);
    }
    return { ...DEFAULTS };
}

export async function saveSettings(settings: Modes): Promise<void> {
    try {
        const resultJson = await SaveSettingsRpc({ settings_json: JSON.stringify(settings) });
        const result: SettingsResponse = JSON.parse(resultJson);
        if (!result.success) {
            console.error('[HideAchievements] SaveSettings unsuccessful:', result.error);
        }
    } catch (e) {
        console.error('[HideAchievements] Failed to save settings:', e);
    }
}
