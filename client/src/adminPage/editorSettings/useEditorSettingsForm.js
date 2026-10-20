import { useCallback, useEffect, useRef, useState } from 'react';
import { getEditorSettings, updateEditorSettings } from '../../api/editorSettings';
import { DEFAULT_EDITOR_SETTINGS, mergeEditorSettings } from '../../constants/editorSettingsDefaults';
import { invalidateEditorSettingsCache } from '../../hooks/useEditorSettings';
import { uploadFontToCloudinary } from '../../utils/cloudinaryUpload';
import { fontFamilyFromFileName, registerCustomFonts } from '../../utils/customFonts';

const sizeKeyFromDimensions = (widthCm, heightCm) => `${widthCm}x${heightCm}`;

/** The fields sent to the server (the form also holds what the server adds, like ids and dates) */
const settingsPayload = (source) => ({
    framePrintSizes: source.framePrintSizes,
    orientationLabels: source.orientationLabels,
    frameFolders: source.frameFolders,
    textToolbar: source.textToolbar,
    captionDefaults: source.captionDefaults,
    orientationPrompt: source.orientationPrompt,
    drive: source.drive,
});

/**
 * The editor settings form: loading, editing (by section and the print sizes), saving, and uploading a
 * font file – which is saved on the spot.
 */
export function useEditorSettingsForm() {
    const [form, setForm] = useState(DEFAULT_EDITOR_SETTINGS);
    /** The settings as last saved on the server – a font upload saves on top of these, not the unsaved form */
    const savedSettingsRef = useRef(DEFAULT_EDITOR_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [fontUploading, setFontUploading] = useState(false);
    const [fontError, setFontError] = useState('');
    const [fontNotice, setFontNotice] = useState('');

    const loadSettings = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getEditorSettings();
            savedSettingsRef.current = mergeEditorSettings(data);
            setForm(savedSettingsRef.current);
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'שגיאה בטעינת ההגדרות' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    // Preview of uploaded fonts, even before saving
    useEffect(() => {
        registerCustomFonts(form.textToolbar.fonts);
    }, [form.textToolbar.fonts]);

    const patch = (updates) => setForm((prev) => ({ ...prev, ...updates }));

    const patchSection = (section, updates) => setForm((prev) => ({
        ...prev,
        [section]: { ...prev[section], ...updates },
    }));

    const updateSize = (index, field, value) => {
        setForm((prev) => {
            const framePrintSizes = [...prev.framePrintSizes];
            const next = { ...framePrintSizes[index], [field]: value };
            if (field === 'widthCm' || field === 'heightCm') {
                next[field] = Number(value);
                next.key = sizeKeyFromDimensions(next.widthCm, next.heightCm);
            }
            framePrintSizes[index] = next;
            return { ...prev, framePrintSizes };
        });
    };

    const addSize = () => patch({
        framePrintSizes: [
            ...form.framePrintSizes,
            {
                key: 'new-size',
                label: 'מידה חדשה',
                widthCm: 10,
                heightCm: 15,
                sortOrder: form.framePrintSizes.length,
                isActive: true,
            },
        ],
    });

    const removeSize = (index) => patch({
        framePrintSizes: form.framePrintSizes.filter((_, i) => i !== index),
    });

    /** Uploads a font file and adds it to the list; the font name is derived from the file name */
    const uploadFont = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        const value = fontFamilyFromFileName(file.name);
        if (!value) {
            setFontError('לא הצלחנו לזהות את שם הגופן מתוך שם הקובץ');
            return;
        }
        setFontUploading(true);
        setFontError('');
        setFontNotice('');
        try {
            const url = await uploadFontToCloudinary(file);
            const font = { label: value, value, url };
            const withFont = (fonts) => [...fonts.filter((f) => f.value !== value), font];
            // Saved right away (an uploaded font that waits for the page's save button is easy to lose),
            // on top of the last saved settings, so other unsaved edits on the page are neither saved nor lost
            const base = savedSettingsRef.current;
            const saved = mergeEditorSettings(await updateEditorSettings(settingsPayload({
                ...base,
                textToolbar: { ...base.textToolbar, fonts: withFont(base.textToolbar.fonts) },
            })));
            savedSettingsRef.current = saved;
            setForm((prev) => ({ ...prev, textToolbar: { ...prev.textToolbar, fonts: withFont(prev.textToolbar.fonts) } }));
            invalidateEditorSettingsCache();
            setFontNotice(`הגופן "${value}" הועלה ונשמר. הוא זמין עכשיו בעורך המוצרים ובעורך התמונות.`);
        } catch (error) {
            setFontError(error.message || 'העלאת הגופן נכשלה');
        } finally {
            setFontUploading(false);
        }
    };

    const save = async (e) => {
        e.preventDefault();

        if (form.framePrintSizes.length === 0) {
            setMessage({ type: 'error', text: 'יש להגדיר לפחות מידת הדפסה אחת' });
            return;
        }
        if (form.textToolbar.fonts.length === 0) {
            setMessage({ type: 'error', text: 'יש להשאיר לפחות גופן אחד' });
            return;
        }

        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            const saved = await updateEditorSettings(settingsPayload(form));
            savedSettingsRef.current = mergeEditorSettings(saved);
            setForm(savedSettingsRef.current);
            invalidateEditorSettingsCache();
            setMessage({ type: 'success', text: 'ההגדרות נשמרו בהצלחה' });
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: err?.response?.data?.msg || 'שגיאה בשמירת ההגדרות' });
        } finally {
            setSaving(false);
        }
    };

    return {
        form,
        loading,
        saving,
        message,
        loadSettings,
        patchSection,
        updateSize,
        addSize,
        removeSize,
        uploadFont,
        fontUploading,
        fontError,
        fontNotice,
        save,
    };
}
