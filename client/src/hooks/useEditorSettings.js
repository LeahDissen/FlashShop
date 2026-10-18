import { useEffect, useState } from 'react';
import { getEditorSettings } from '../api/editorSettings';
import { DEFAULT_EDITOR_SETTINGS, mergeEditorSettings } from '../constants/editorSettingsDefaults';
import { registerCustomFonts } from '../utils/customFonts';

let cachedSettings = null;
let inflightRequest = null;

const fetchSettingsOnce = () => {
    if (cachedSettings) return Promise.resolve(cachedSettings);
    if (!inflightRequest) {
        inflightRequest = getEditorSettings()
            .then((data) => {
                cachedSettings = mergeEditorSettings(data);
                // Fonts the admin uploaded are available everywhere the settings are used (product editor and photo editor)
                registerCustomFonts(cachedSettings.textToolbar?.fonts);
                return cachedSettings;
            })
            .finally(() => {
                inflightRequest = null;
            });
    }
    return inflightRequest;
};

/** Clears the cache after saving in the dashboard */
export const invalidateEditorSettingsCache = () => {
    cachedSettings = null;
};

/**
 * Loads the editor settings the admin defines (sizes, fonts, colors and texts).
 * Until the request returns, the defaults are returned so the editor always works.
 */
export const useEditorSettings = () => {
    const [settings, setSettings] = useState(cachedSettings || DEFAULT_EDITOR_SETTINGS);
    const [loading, setLoading] = useState(!cachedSettings);

    useEffect(() => {
        let cancelled = false;

        fetchSettingsOnce()
            .then((data) => {
                if (!cancelled) setSettings(data);
            })
            .catch((err) => {
                console.warn('Failed to load editor settings, using defaults', err);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, []);

    return { settings, loading };
};
