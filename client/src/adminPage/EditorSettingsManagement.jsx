import { useCallback, useEffect, useState } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaPlus, FaSlidersH, FaTrash } from 'react-icons/fa';
import { FiArrowLeft } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { getEditorSettings, updateEditorSettings } from '../api/editorSettings';
import { DEFAULT_EDITOR_SETTINGS, mergeEditorSettings } from '../constants/editorSettingsDefaults';
import { invalidateEditorSettingsCache } from '../hooks/useEditorSettings';

const Card = ({ title, description, children }) => (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        {description && <p className="text-sm text-gray-500 mt-1 mb-4">{description}</p>}
        <div className={description ? '' : 'mt-4'}>{children}</div>
    </section>
);

const Field = ({ label, hint, children }) => (
    <label className="block">
        <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
        {children}
        {hint && <span className="block text-xs text-gray-500 mt-1">{hint}</span>}
    </label>
);

const inputClass = 'w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#f2665e]';

const sizeKeyFromDimensions = (widthCm, heightCm) => `${widthCm}x${heightCm}`;

export default function EditorSettingsManagement() {
    const [form, setForm] = useState(DEFAULT_EDITOR_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [newColor, setNewColor] = useState('#f2665e');
    const [newFont, setNewFont] = useState('');

    const loadSettings = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getEditorSettings();
            setForm(mergeEditorSettings(data));
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

    const addFont = () => {
        const value = newFont.trim();
        if (!value) return;
        if (form.textToolbar.fonts.some((font) => font.value === value)) {
            setNewFont('');
            return;
        }
        patchSection('textToolbar', {
            fonts: [...form.textToolbar.fonts, { label: value, value }],
        });
        setNewFont('');
    };

    const removeFont = (value) => patchSection('textToolbar', {
        fonts: form.textToolbar.fonts.filter((font) => font.value !== value),
    });

    const addColor = () => {
        const color = newColor.toUpperCase();
        if (form.textToolbar.colorPresets.includes(color)) return;
        patchSection('textToolbar', {
            colorPresets: [...form.textToolbar.colorPresets, color],
        });
    };

    const removeColor = (color) => patchSection('textToolbar', {
        colorPresets: form.textToolbar.colorPresets.filter((c) => c !== color),
    });

    const handleSave = async (e) => {
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
            const saved = await updateEditorSettings({
                framePrintSizes: form.framePrintSizes,
                orientationLabels: form.orientationLabels,
                frameFolders: form.frameFolders,
                textToolbar: form.textToolbar,
                captionDefaults: form.captionDefaults,
                orientationPrompt: form.orientationPrompt,
                drive: form.drive,
            });
            setForm(mergeEditorSettings(saved));
            invalidateEditorSettingsCache();
            setMessage({ type: 'success', text: 'ההגדרות נשמרו בהצלחה' });
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: err?.response?.data?.msg || 'שגיאה בשמירת ההגדרות' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-gray-50 p-10 text-center text-gray-500">טוען הגדרות...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
            <div className="max-w-5xl mx-auto mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <FaSlidersH className="text-[#f2665e]" />
                        הגדרות עורך התמונות
                    </h1>
                    <p className="text-gray-500 mt-1">
                        מידות המסגרות, הגופנים, הצבעים והטקסטים שהלקוח רואה בעורך
                    </p>
                </div>
                <Link
                    to="/admindashboard"
                    className="text-[#f2665e] font-bold p-2 gap-2 rounded-lg hover:bg-[#f2665e]/10 flex items-center no-underline"
                >
                    <span>חזרה ללוח הבקרה</span>
                    <FiArrowLeft className="text-xl" />
                </Link>
            </div>

            <form onSubmit={handleSave} className="max-w-5xl mx-auto space-y-6">
                <Card
                    title="תיקיות מידות מסגרות"
                    description="כל מידה מוצגת ללקוח כתיקייה בעורך, ובתוכה מסגרות לרוחב ולאורך."
                >
                    <div className="space-y-3">
                        {form.framePrintSizes.map((size, index) => (
                            <div
                                key={`${size.key}-${index}`}
                                className="grid grid-cols-12 gap-3 items-end rounded-xl border border-gray-100 bg-gray-50 p-3"
                            >
                                <div className="col-span-12 sm:col-span-5">
                                    <Field label="תווית לתצוגה">
                                        <input
                                            type="text"
                                            value={size.label}
                                            onChange={(e) => updateSize(index, 'label', e.target.value)}
                                            className={inputClass}
                                        />
                                    </Field>
                                </div>
                                <div className="col-span-4 sm:col-span-2">
                                    <Field label="רוחב (ס״מ)">
                                        <input
                                            type="number"
                                            min="1"
                                            step="0.5"
                                            value={size.widthCm}
                                            onChange={(e) => updateSize(index, 'widthCm', e.target.value)}
                                            className={inputClass}
                                        />
                                    </Field>
                                </div>
                                <div className="col-span-4 sm:col-span-2">
                                    <Field label="גובה (ס״מ)">
                                        <input
                                            type="number"
                                            min="1"
                                            step="0.5"
                                            value={size.heightCm}
                                            onChange={(e) => updateSize(index, 'heightCm', e.target.value)}
                                            className={inputClass}
                                        />
                                    </Field>
                                </div>
                                <div className="col-span-3 sm:col-span-2 flex items-center gap-2 pb-2.5">
                                    <input
                                        type="checkbox"
                                        checked={size.isActive !== false}
                                        onChange={(e) => updateSize(index, 'isActive', e.target.checked)}
                                        className="rounded"
                                    />
                                    <span className="text-sm text-gray-700">פעילה</span>
                                </div>
                                <div className="col-span-1 flex justify-end pb-2.5">
                                    <button
                                        type="button"
                                        onClick={() => removeSize(index)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                        aria-label="מחק מידה"
                                    >
                                        <FaTrash size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={addSize}
                        className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#f2665e] hover:underline"
                    >
                        <FaPlus size={11} />
                        הוסף מידה
                    </button>
                </Card>

                <Card title="תוויות וטקסטים בבורר המסגרות">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="תווית כיוון לרוחב">
                            <input
                                type="text"
                                value={form.orientationLabels.landscape}
                                onChange={(e) => patchSection('orientationLabels', { landscape: e.target.value })}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="תווית כיוון לאורך">
                            <input
                                type="text"
                                value={form.orientationLabels.portrait}
                                onChange={(e) => patchSection('orientationLabels', { portrait: e.target.value })}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="כותרת המקטע">
                            <input
                                type="text"
                                value={form.frameFolders.title}
                                onChange={(e) => patchSection('frameFolders', { title: e.target.value })}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="הסבר מתחת לכותרת">
                            <input
                                type="text"
                                value={form.frameFolders.subtitle}
                                onChange={(e) => patchSection('frameFolders', { subtitle: e.target.value })}
                                className={inputClass}
                            />
                        </Field>
                        <div className="sm:col-span-2">
                            <Field label="הודעה כשאין מסגרות בתיקייה">
                                <input
                                    type="text"
                                    value={form.frameFolders.emptyText}
                                    onChange={(e) => patchSection('frameFolders', { emptyText: e.target.value })}
                                    className={inputClass}
                                />
                            </Field>
                        </div>
                    </div>
                </Card>

                <Card
                    title="סרגל הטקסט והכתוביות"
                    description="הגופנים, הצבעים וטווח הגדלים שהלקוח יכול לבחור לטקסט ולכתוביות."
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <span className="block text-sm font-medium text-gray-700 mb-2">גופנים</span>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {form.textToolbar.fonts.map((font) => (
                                    <span
                                        key={font.value}
                                        className="inline-flex items-center gap-2 text-sm bg-gray-100 text-gray-700 rounded-lg px-2.5 py-1.5"
                                        style={{ fontFamily: font.value }}
                                    >
                                        {font.label}
                                        <button
                                            type="button"
                                            onClick={() => removeFont(font.value)}
                                            className="text-red-500 hover:text-red-700"
                                            aria-label={`הסר את ${font.label}`}
                                        >
                                            <FaTrash size={10} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newFont}
                                    onChange={(e) => setNewFont(e.target.value)}
                                    placeholder="שם גופן, לדוגמה Heebo"
                                    className={inputClass}
                                />
                                <button
                                    type="button"
                                    onClick={addFont}
                                    className="px-4 py-2 bg-gray-800 text-white text-sm font-bold rounded-lg hover:bg-gray-700 whitespace-nowrap"
                                >
                                    הוסף
                                </button>
                            </div>
                        </div>

                        <div>
                            <span className="block text-sm font-medium text-gray-700 mb-2">צבעים מוכנים</span>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {form.textToolbar.colorPresets.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => removeColor(color)}
                                        className="w-8 h-8 rounded-md border border-gray-200 hover:ring-2 hover:ring-red-300 transition-all"
                                        style={{ backgroundColor: color }}
                                        title={`הסר ${color}`}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={newColor}
                                    onChange={(e) => setNewColor(e.target.value)}
                                    className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer"
                                />
                                <button
                                    type="button"
                                    onClick={addColor}
                                    className="px-4 py-2 bg-gray-800 text-white text-sm font-bold rounded-lg hover:bg-gray-700"
                                >
                                    הוסף צבע
                                </button>
                                <span className="text-xs text-gray-500">לחיצה על צבע קיים מסירה אותו</span>
                            </div>
                        </div>

                        <Field label="גודל גופן מינימלי">
                            <input
                                type="number"
                                min="1"
                                value={form.textToolbar.minFontSize}
                                onChange={(e) => patchSection('textToolbar', { minFontSize: Number(e.target.value) })}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="גודל גופן מקסימלי">
                            <input
                                type="number"
                                min="2"
                                value={form.textToolbar.maxFontSize}
                                onChange={(e) => patchSection('textToolbar', { maxFontSize: Number(e.target.value) })}
                                className={inputClass}
                            />
                        </Field>
                    </div>
                </Card>

                <Card title="ברירות מחדל לכתובית">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="טקסט הכפתור בעורך">
                            <input
                                type="text"
                                value={form.captionDefaults.buttonLabel}
                                onChange={(e) => patchSection('captionDefaults', { buttonLabel: e.target.value })}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="טקסט ברירת מחדל בכתובית">
                            <input
                                type="text"
                                value={form.captionDefaults.placeholder}
                                onChange={(e) => patchSection('captionDefaults', { placeholder: e.target.value })}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="גופן">
                            <select
                                value={form.captionDefaults.fontFamily}
                                onChange={(e) => patchSection('captionDefaults', { fontFamily: e.target.value })}
                                className={inputClass}
                            >
                                {form.textToolbar.fonts.map((font) => (
                                    <option key={font.value} value={font.value}>{font.label}</option>
                                ))}
                            </select>
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="גודל">
                                <input
                                    type="number"
                                    min="1"
                                    value={form.captionDefaults.fontSize}
                                    onChange={(e) => patchSection('captionDefaults', { fontSize: Number(e.target.value) })}
                                    className={inputClass}
                                />
                            </Field>
                            <Field label="צבע">
                                <input
                                    type="color"
                                    value={form.captionDefaults.color}
                                    onChange={(e) => patchSection('captionDefaults', { color: e.target.value })}
                                    className="w-full h-[42px] rounded-lg border border-gray-200 cursor-pointer"
                                />
                            </Field>
                        </div>
                    </div>
                </Card>

                <Card
                    title="הודעת התאמת כיוון"
                    description="ההודעה שמופיעה ללקוח כשכיוון התמונה לא תואם לכיוון המסגרת."
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="כותרת">
                            <input
                                type="text"
                                value={form.orientationPrompt.title}
                                onChange={(e) => patchSection('orientationPrompt', { title: e.target.value })}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="טקסט ההסבר">
                            <input
                                type="text"
                                value={form.orientationPrompt.body}
                                onChange={(e) => patchSection('orientationPrompt', { body: e.target.value })}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="כפתור סיבוב">
                            <input
                                type="text"
                                value={form.orientationPrompt.rotateLabel}
                                onChange={(e) => patchSection('orientationPrompt', { rotateLabel: e.target.value })}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="כפתור ביטול">
                            <input
                                type="text"
                                value={form.orientationPrompt.dismissLabel}
                                onChange={(e) => patchSection('orientationPrompt', { dismissLabel: e.target.value })}
                                className={inputClass}
                            />
                        </Field>
                    </div>
                </Card>

                <Card
                    title="שמירת עיצובים ב-Google Drive"
                    description="קבצי העיצוב הסופיים נשמרים בתיקייה נפרדת לכל הזמנה, והקישור מוצג בניהול ההזמנות."
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="שם תיקיית האב">
                            <input
                                type="text"
                                value={form.drive.rootFolderName}
                                onChange={(e) => patchSection('drive', { rootFolderName: e.target.value })}
                                className={inputClass}
                            />
                        </Field>
                        <Field
                            label="תבנית שם תיקיית הזמנה"
                            hint="{orderId} יוחלף במספר ההזמנה ו-{date} בתאריך."
                        >
                            <input
                                type="text"
                                value={form.drive.orderFolderTemplate}
                                onChange={(e) => patchSection('drive', { orderFolderTemplate: e.target.value })}
                                className={inputClass}
                            />
                        </Field>
                    </div>
                </Card>

                {message.text && (
                    <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                        message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                        {message.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
                        {message.text}
                    </div>
                )}

                <div className="sticky bottom-4 flex gap-3">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 bg-[#f2665e] text-white font-bold py-3 rounded-xl shadow-lg hover:bg-[#d95248] disabled:opacity-50"
                    >
                        {saving ? 'שומר...' : 'שמירת הגדרות'}
                    </button>
                    <button
                        type="button"
                        onClick={loadSettings}
                        className="px-6 py-3 bg-white border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50"
                    >
                        ביטול שינויים
                    </button>
                </div>
            </form>
        </div>
    );
}
