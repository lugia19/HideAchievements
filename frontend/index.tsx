import { definePlugin, IconsModule, Field, Dropdown } from '@steambrew/client';
import { useState } from 'react';
import { WindowManager } from './windows';
import { DEFAULTS, loadSettings, saveSettings } from './settings';
import type { Modes, SectionMode } from './styles';

const THREE_WAY = [
    { data: 'show', label: 'Show' },
    { data: 'hide', label: 'Hide' },
    { data: 'hover', label: 'On hover' },
];
const TWO_WAY = THREE_WAY.slice(0, 2);

// Effective modes, read lazily by the WindowManager. Seeded from the
// backend settings file at plugin load, updated by the settings panel.
const currentModes: Modes = { ...DEFAULTS };
const manager = new WindowManager(() => currentModes);

function setMode(key: keyof Modes, value: SectionMode): void {
    currentModes[key] = value;
    manager.refreshStyles();
    void saveSettings(currentModes);
}

interface SectionSettingProps {
    configKey: keyof Modes;
    label: string;
    description: string;
    options: Array<{ data: string; label: string }>;
}

const SectionSetting = ({ configKey, label, description, options }: SectionSettingProps) => {
    const [value, setValue] = useState<SectionMode>(currentModes[configKey]);

    return (
        <Field label={label} description={description} bottomSeparator="standard">
            <Dropdown
                rgOptions={options}
                selectedOption={value}
                onChange={opt => {
                    setValue(opt.data as SectionMode);
                    setMode(configKey, opt.data as SectionMode);
                }}
            />
        </Field>
    );
};

const SettingsContent = () => (
    <>
        <SectionSetting
            configKey="activity"
            label="Activity feed"
            description="Visibility of the Activity feed section on game pages."
            options={THREE_WAY}
        />
        <SectionSetting
            configKey="achievements"
            label="Achievements section"
            description="Visibility of the Achievements section on game pages."
            options={THREE_WAY}
        />
        <SectionSetting
            configKey="cards"
            label="Trading Cards section"
            description="Visibility of the Trading Cards section on game pages."
            options={THREE_WAY}
        />
        <SectionSetting
            configKey="mini_achievements"
            label="Mini achievements bar"
            description="The compact achievements progress bar next to the Play button."
            options={TWO_WAY}
        />
        <SectionSetting
            configKey="overlay"
            label="Overlay achievements"
            description="The Achievements button and Your Achievements section in the in-game overlay."
            options={TWO_WAY}
        />
    </>
);

export default definePlugin(() => {
    // Hook windows first so none are missed; styles refresh once stored
    // settings arrive from the backend.
    manager.start();
    loadSettings().then(stored => {
        console.log('[HideAchievements] settings loaded:', JSON.stringify(stored));
        Object.assign(currentModes, stored);
        manager.refreshStyles();
    });

    return {
        title: 'HideAchievements',
        icon: <IconsModule.Settings />,
        content: <SettingsContent />,
        onDismount() {
            manager.dispose();
        },
    };
});
