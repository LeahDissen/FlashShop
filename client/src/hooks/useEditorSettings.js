import { useEffect, useState } from 'react';
import { getEditorSettings } from '../api/editorSettings';
import { DEFAULT_EDITOR_SETTINGS, mergeEditorSettings } from '../constants/editorSettingsDefaults';

let cachedSettings = null;
let inflightRequest = null;

const fetchSettingsOnce = () => {
    if (cachedSettings) return Promise.resolve(cachedSettings);
    if (!inflightRequest) {
        inflightRequest = getEditorSettings()
            .then((data) => {
                cachedSettings = mergeEditorSettings(data);
                return cachedSettings;
            })
            .finally(() => {
                inflightRequest = null;
            });
    }
    return inflightRequest;
};

/** מאפס את המטמון אחרי שמירה בלוח הבקרה */
export const invalidateEditorSettingsCache = () => {
    cachedSettings = null;
};

/**
 * טוען את הגדרות העורך שהמנהלת מגדירה (מידות, גופנים, צבעים וטקסטים).
 * עד שהבקשה חוזרת, מוחזרות ברירות המחדל כדי שהעורך יעבוד תמיד.
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
