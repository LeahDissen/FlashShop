import { useCallback, useEffect, useState } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaImage, FaPlus, FaTrash } from 'react-icons/fa';
import { FiArrowLeft } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import {
    createDesignFrame,
    deleteDesignFrame,
    getDesignFrames,
    updateDesignFrame,
} from '../api/designFrames';
import {
    createFrameCategory,
    deleteFrameCategory,
    getFrameCategories,
    updateFrameCategory,
} from '../api/frameCategories';
import { getEditorSettings } from '../api/editorSettings';
import SmartImageInput from '../components/SmartImageInput';
import { DROPZONE_PRESETS, normalizeDropzones } from '../utils/dropzoneUtils';
import { detectEmptyPhotoSlots } from '../utils/detectEmptyPhotoSlots';
import { DEFAULT_EDITOR_SETTINGS } from '../constants/editorSettingsDefaults';

const ASPECT_RATIO_PRESETS = ['1:1', '4:3', '3:4', '16:9', '9:16', '3:1', '2:1'];

const ORIENTATION_OPTIONS = [
    { value: 'any', label: 'מתאים לשניהם' },
    { value: 'landscape', label: 'לרוחב' },
    { value: 'portrait', label: 'לאורך' },
];

const orientationFromDimensions = (width, height) => {
    if (!(width > 0) || !(height > 0)) return 'any';
    if (width > height) return 'landscape';
    if (height > width) return 'portrait';
    return 'any';
};

const createEmptyZone = (index) => ({
    id: `zone_${index + 1}`,
    x: 5,
    y: 5,
    width: 40,
    height: 40,
    clipType: 'rect',
    clipPath: '',
    label: `חלון ${index + 1}`,
});

const loadImageDimensions = (url) =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = reject;
        img.src = url;
    });

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));

const ratioFromDimensions = (width, height) => {
    const w = Math.round(width);
    const h = Math.round(height);
    if (!w || !h) return '1:1';
    const divisor = gcd(w, h);
    return `${w / divisor}:${h / divisor}`;
};

const emptyForm = {
    title: '',
    imageUrl: '',
    thumbnailUrl: '',
    category: 'כללי',
    aspectRatio: '1:1',
    printSizeKey: '',
    orientation: 'any',
    isFixedOverlay: true,
    layoutType: 'single_overlay',
    dropzones: [],
    isActive: true,
    sortOrder: 0,
};

export default function DesignFramesManagement() {
    const [frames, setFrames] = useState([]);
    const [categories, setCategories] = useState([]);
    const [printSizes, setPrintSizes] = useState(DEFAULT_EDITOR_SETTINGS.framePrintSizes);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [categoryMessage, setCategoryMessage] = useState({ type: '', text: '' });
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [categoryName, setCategoryName] = useState('');
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [detectingSlots, setDetectingSlots] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [framesData, categoriesData, settingsData] = await Promise.all([
                getDesignFrames(true),
                getFrameCategories(),
                getEditorSettings().catch(() => null),
            ]);
            setFrames(framesData);
            setCategories(categoriesData);
            if (settingsData?.framePrintSizes?.length) {
                setPrintSizes(settingsData.framePrintSizes);
            }
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'שגיאה בטעינת נתונים' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleImageUrlChange = async (url) => {
        setForm((prev) => ({ ...prev, imageUrl: url, thumbnailUrl: url || prev.thumbnailUrl }));
        if (!url) return;

        try {
            const { width, height } = await loadImageDimensions(url);
            setForm((prev) => ({
                ...prev,
                aspectRatio: ratioFromDimensions(width, height),
                orientation: orientationFromDimensions(width, height),
            }));
        } catch {
            // keep manual aspect ratio
        }
    };

    const resetForm = () => {
        setForm(emptyForm);
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.imageUrl.trim() || !form.aspectRatio.trim()) {
            setMessage({ type: 'error', text: 'יש למלא שם, תמונה ויחס גובה-רוחב' });
            return;
        }

        setSaving(true);
        setMessage({ type: '', text: '' });

        const layoutType = form.layoutType === 'multi_dropzone' ? 'multi_dropzone' : 'single_overlay';
        const dropzones = layoutType === 'multi_dropzone' ? normalizeDropzones(form.dropzones) : [];

        if (layoutType === 'multi_dropzone' && dropzones.length === 0) {
            setMessage({ type: 'error', text: 'למסגרת קולאז׳ יש להגדיר לפחות חלון תמונה אחד' });
            setSaving(false);
            return;
        }

        const payload = {
            title: form.title.trim(),
            imageUrl: form.imageUrl.trim(),
            thumbnailUrl: (form.thumbnailUrl || form.imageUrl).trim(),
            category: form.category,
            aspectRatio: form.aspectRatio.trim(),
            printSizeKey: form.printSizeKey,
            orientation: form.orientation,
            isFixedOverlay: form.isFixedOverlay,
            layoutType,
            dropzones,
            isActive: form.isActive,
            sortOrder: Number(form.sortOrder) || 0,
        };

        try {
            if (editingId) {
                await updateDesignFrame(editingId, payload);
                setMessage({ type: 'success', text: 'המסגרת עודכנה בהצלחה' });
            } else {
                await createDesignFrame(payload);
                setMessage({ type: 'success', text: 'המסגרת נוספה בהצלחה' });
            }
            resetForm();
            await loadData();
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: err?.response?.data?.msg || 'שגיאה בשמירת המסגרת' });
        } finally {
            setSaving(false);
        }
    };

    const resetCategoryForm = () => {
        setCategoryName('');
        setEditingCategoryId(null);
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        const name = categoryName.trim();
        if (!name) {
            setCategoryMessage({ type: 'error', text: 'יש להזין שם קטגוריה' });
            return;
        }

        setCategoryMessage({ type: '', text: '' });
        try {
            if (editingCategoryId) {
                await updateFrameCategory(editingCategoryId, { name });
                setCategoryMessage({ type: 'success', text: 'הקטגוריה עודכנה' });
            } else {
                await createFrameCategory({ name });
                setCategoryMessage({ type: 'success', text: 'הקטגוריה נוספה' });
            }
            resetCategoryForm();
            await loadData();
        } catch (err) {
            setCategoryMessage({
                type: 'error',
                text: err?.response?.data?.msg || 'שגיאה בשמירת הקטגוריה',
            });
        }
    };

    const handleEditCategory = (category) => {
        setEditingCategoryId(category._id);
        setCategoryName(category.name);
    };

    const handleDeleteCategory = async (id) => {
        if (!confirm('האם למחוק קטגוריה זו?')) return;
        try {
            await deleteFrameCategory(id);
            if (editingCategoryId === id) resetCategoryForm();
            await loadData();
            setCategoryMessage({ type: 'success', text: 'הקטגוריה נמחקה' });
        } catch (err) {
            setCategoryMessage({
                type: 'error',
                text: err?.response?.data?.msg || 'שגיאה במחיקת הקטגוריה',
            });
        }
    };

    const handleEdit = (frame) => {
        setEditingId(frame._id);
        setForm({
            title: frame.title || '',
            imageUrl: frame.imageUrl || '',
            thumbnailUrl: frame.thumbnailUrl || frame.imageUrl || '',
            category: frame.category || 'כללי',
            aspectRatio: frame.aspectRatio || '1:1',
            printSizeKey: frame.printSizeKey || '',
            orientation: frame.orientation || 'any',
            isFixedOverlay: frame.isFixedOverlay !== false,
            layoutType: frame.layoutType === 'multi_dropzone' ? 'multi_dropzone' : 'single_overlay',
            dropzones: normalizeDropzones(frame.dropzones || []),
            isActive: frame.isActive !== false,
            sortOrder: frame.sortOrder || 0,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const applyPreset = (presetId) => {
        const preset = DROPZONE_PRESETS.find((p) => p.id === presetId);
        if (!preset) return;
        setForm((prev) => ({
            ...prev,
            layoutType: 'multi_dropzone',
            dropzones: normalizeDropzones(preset.dropzones),
        }));
    };

    const updateZone = (index, field, value) => {
        setForm((prev) => {
            const dropzones = [...(prev.dropzones || [])];
            dropzones[index] = {
                ...dropzones[index],
                [field]: field === 'label' || field === 'id' || field === 'clipType' || field === 'clipPath'
                    ? value
                    : Number(value),
            };
            return { ...prev, dropzones };
        });
    };

    const addZone = () => {
        setForm((prev) => ({
            ...prev,
            layoutType: 'multi_dropzone',
            dropzones: [...(prev.dropzones || []), createEmptyZone(prev.dropzones?.length || 0)],
        }));
    };

    const removeZone = (index) => {
        setForm((prev) => ({
            ...prev,
            dropzones: (prev.dropzones || []).filter((_, i) => i !== index),
        }));
    };

    const detectSlotsFromImage = async () => {
        if (!form.imageUrl) {
            setMessage({ type: 'error', text: 'יש להעלות תמונת מסגרת לפני זיהוי חלונות' });
            return;
        }
        setDetectingSlots(true);
        setMessage({ type: '', text: '' });
        try {
            const slots = await detectEmptyPhotoSlots(form.imageUrl);
            if (!slots.length) {
                setMessage({
                    type: 'error',
                    text: 'לא נמצאו ריבועים ריקים. ודאו שיש חלונות לבנים ברורים בתמונה.',
                });
                return;
            }
            setForm((prev) => ({
                ...prev,
                layoutType: 'multi_dropzone',
                dropzones: normalizeDropzones(slots),
            }));
            setMessage({
                type: 'success',
                text: `זוהו ${slots.length} חלונות תמונה אוטומטית`,
            });
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'שגיאה בזיהוי חלונות מהתמונה' });
        } finally {
            setDetectingSlots(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('האם למחוק מסגרת זו?')) return;
        try {
            await deleteDesignFrame(id);
            if (editingId === id) resetForm();
            await loadData();
            setMessage({ type: 'success', text: 'המסגרת נמחקה' });
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'שגיאה במחיקת המסגרת' });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
            <div className="max-w-6xl mx-auto mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">ניהול מסגרות עיצוב גלובליות</h1>
                    <p className="text-gray-500 mt-1">מסגרות אלו זמינות לכל המוצרים בעורך העיצוב</p>
                </div>
                <Link
                    to="/admindashboard"
                    className="text-[#f2665e] font-bold p-2 gap-2 rounded-lg hover:bg-[#f2665e]/10 flex items-center no-underline"
                >
                    <span>חזרה ללוח הבקרה</span>
                    <FiArrowLeft className="text-xl" />
                </Link>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FaPlus className="text-[#f2665e]" />
                            {editingId ? 'עריכת מסגרת' : 'הוספת מסגרת חדשה'}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">שם המסגרת</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-lg p-2.5"
                                    placeholder="לדוגמה: מסגרת פרח ורודה"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">תמונת מסגרת (PNG/SVG)</label>
                                <SmartImageInput
                                    value={form.imageUrl}
                                    onChange={handleImageUrlChange}
                                    placeholder="הדביקו URL או העלו תמונה"
                                />
                                {form.imageUrl && (
                                    <button
                                        type="button"
                                        onClick={detectSlotsFromImage}
                                        disabled={detectingSlots}
                                        className="mt-2 w-full py-2 rounded-lg border border-[#f2665e] text-[#f2665e] text-sm font-bold hover:bg-red-50 disabled:opacity-50"
                                    >
                                        {detectingSlots ? 'מזהה חלונות...' : 'זהה ריבועים ריקים להעלאת תמונות'}
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה</label>
                                    <select
                                        value={form.category}
                                        onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                                        className="w-full border border-gray-200 rounded-lg p-2.5"
                                    >
                                        {categories.map((cat) => (
                                            <option key={cat._id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">יחס גובה-רוחב</label>
                                    <input
                                        type="text"
                                        value={form.aspectRatio}
                                        onChange={(e) => setForm((p) => ({ ...p, aspectRatio: e.target.value }))}
                                        className="w-full border border-gray-200 rounded-lg p-2.5 ltr"
                                        placeholder="4:3"
                                        list="aspect-ratio-presets"
                                    />
                                    <datalist id="aspect-ratio-presets">
                                        {ASPECT_RATIO_PRESETS.map((r) => (
                                            <option key={r} value={r} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">תיקיית מידה</label>
                                    <select
                                        value={form.printSizeKey}
                                        onChange={(e) => setForm((p) => ({ ...p, printSizeKey: e.target.value }))}
                                        className="w-full border border-gray-200 rounded-lg p-2.5"
                                    >
                                        <option value="">כל המידות</option>
                                        {printSizes.map((size) => (
                                            <option key={size.key} value={size.key}>{size.label}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        מידות התיקיות נערכות במסך "הגדרות עורך התמונות".
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">כיוון המסגרת</label>
                                    <select
                                        value={form.orientation}
                                        onChange={(e) => setForm((p) => ({ ...p, orientation: e.target.value }))}
                                        className="w-full border border-gray-200 rounded-lg p-2.5"
                                    >
                                        {ORIENTATION_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        מזוהה אוטומטית מהתמונה, וניתן לשנות ידנית.
                                    </p>
                                </div>
                            </div>

                            <label className="flex items-start gap-2 cursor-pointer rounded-xl bg-gray-50 border border-gray-100 p-3">
                                <input
                                    type="checkbox"
                                    checked={form.isFixedOverlay}
                                    onChange={(e) => setForm((p) => ({ ...p, isFixedOverlay: e.target.checked }))}
                                    className="rounded mt-0.5"
                                />
                                <span className="text-sm text-gray-700">
                                    שכבת Overlay קבועה
                                    <span className="block text-xs text-gray-500">
                                        המסגרת נפרסת על כל משטח העיצוב והלקוח לא יכול להזיז או לשנות את גודלה.
                                    </span>
                                </span>
                            </label>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">סדר תצוגה</label>
                                    <input
                                        type="number"
                                        value={form.sortOrder}
                                        onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))}
                                        className="w-full border border-gray-200 rounded-lg p-2.5"
                                    />
                                </div>
                                <div className="flex items-end pb-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={form.isActive}
                                            onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                                            className="rounded"
                                        />
                                        <span className="text-sm text-gray-700">פעילה בעורך</span>
                                    </label>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4 space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">סוג מסגרת</label>
                                    <select
                                        value={form.layoutType}
                                        onChange={(e) => {
                                            const layoutType = e.target.value;
                                            setForm((p) => ({
                                                ...p,
                                                layoutType,
                                                dropzones: layoutType === 'multi_dropzone'
                                                    ? (p.dropzones?.length ? p.dropzones : DROPZONE_PRESETS[0].dropzones)
                                                    : [],
                                            }));
                                        }}
                                        className="w-full border border-gray-200 rounded-lg p-2.5"
                                    >
                                        <option value="single_overlay">מסגרת רגילה (שכבת עיצוב)</option>
                                        <option value="multi_dropzone">קולאז׳ (כמה חלונות לתמונות)</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        בקולאז׳: העלו תמונה עם ריבועים ריקים (לבנים), לחצו על זיהוי אוטומטי, או הגדירו ידנית.
                                    </p>
                                </div>

                                {form.layoutType === 'multi_dropzone' && (
                                    <div className="space-y-3 rounded-xl bg-gray-50 border border-gray-100 p-3">
                                        <button
                                            type="button"
                                            onClick={detectSlotsFromImage}
                                            disabled={!form.imageUrl || detectingSlots}
                                            className="w-full py-2.5 rounded-xl bg-[#f2665e] text-white text-sm font-bold hover:bg-[#d95248] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {detectingSlots ? 'מזהה חלונות...' : 'זהה ריבועים ריקים מהתמונה'}
                                        </button>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">פריסה מוכנה</label>
                                            <div className="flex flex-wrap gap-2">
                                                {DROPZONE_PRESETS.map((preset) => (
                                                    <button
                                                        key={preset.id}
                                                        type="button"
                                                        onClick={() => applyPreset(preset.id)}
                                                        className="text-xs px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-[#f2665e] hover:text-[#f2665e]"
                                                    >
                                                        {preset.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-bold text-gray-800">
                                                חלונות תמונה ({form.dropzones?.length || 0})
                                            </h4>
                                            <button
                                                type="button"
                                                onClick={addZone}
                                                className="text-xs font-bold text-[#f2665e] hover:underline"
                                            >
                                                + הוסף חלון
                                            </button>
                                        </div>

                                        {(form.dropzones || []).map((zone, index) => (
                                            <div key={zone.id || index} className="bg-white rounded-lg border border-gray-200 p-3 space-y-2">
                                                <div className="flex items-center justify-between gap-2">
                                                    <input
                                                        type="text"
                                                        value={zone.label || ''}
                                                        onChange={(e) => updateZone(index, 'label', e.target.value)}
                                                        className="flex-1 border border-gray-200 rounded-md px-2 py-1 text-sm"
                                                        placeholder="שם חלון"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeZone(index)}
                                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                                        aria-label="מחק חלון"
                                                    >
                                                        <FaTrash size={12} />
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-4 gap-2 text-xs">
                                                    {['x', 'y', 'width', 'height'].map((field) => (
                                                        <label key={field} className="block">
                                                            <span className="text-gray-500 uppercase">{field} %</span>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                step="0.1"
                                                                value={zone[field]}
                                                                onChange={(e) => updateZone(index, field, e.target.value)}
                                                                className="w-full border border-gray-200 rounded-md px-1.5 py-1 mt-0.5"
                                                            />
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}

                                        {form.imageUrl && (form.dropzones || []).length > 0 && (
                                            <div className="relative w-full aspect-[3/4] max-h-64 bg-gray-200 rounded-lg overflow-hidden border border-gray-200">
                                                <img
                                                    src={form.imageUrl}
                                                    alt="תצוגת חלונות"
                                                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                                                />
                                                {(form.dropzones || []).map((zone) => (
                                                    <div
                                                        key={zone.id}
                                                        className="absolute border-2 border-[#f2665e] bg-[#f2665e]/20 text-[10px] font-bold text-[#f2665e] flex items-center justify-center"
                                                        style={{
                                                            left: `${zone.x}%`,
                                                            top: `${zone.y}%`,
                                                            width: `${zone.width}%`,
                                                            height: `${zone.height}%`,
                                                        }}
                                                    >
                                                        {zone.label || zone.id}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {message.text && (
                                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                                    message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                }`}>
                                    {message.type === 'success'
                                        ? <FaCheckCircle />
                                        : <FaExclamationCircle />}
                                    {message.text}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-[#f2665e] text-white font-bold py-2.5 rounded-lg hover:bg-[#d95248] disabled:opacity-50"
                                >
                                    {saving ? 'שומר...' : (editingId ? 'עדכון' : 'הוספה')}
                                </button>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-4 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                                    >
                                        ביטול
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-3">ניהול קטגוריות</h2>
                        <form onSubmit={handleCategorySubmit} className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={categoryName}
                                onChange={(e) => setCategoryName(e.target.value)}
                                placeholder="שם קטגוריה חדשה"
                                className="flex-1 border border-gray-200 rounded-lg p-2.5 text-sm"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 bg-gray-800 text-white text-sm font-bold rounded-lg hover:bg-gray-700"
                            >
                                {editingCategoryId ? 'עדכון' : 'הוסף'}
                            </button>
                            {editingCategoryId && (
                                <button
                                    type="button"
                                    onClick={resetCategoryForm}
                                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600"
                                >
                                    ביטול
                                </button>
                            )}
                        </form>

                        {categoryMessage.text && (
                            <p className={`text-sm mb-3 ${categoryMessage.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                                {categoryMessage.text}
                            </p>
                        )}

                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {categories.map((cat) => (
                                <div
                                    key={cat._id}
                                    className="flex items-center justify-between gap-2 p-2 rounded-lg border border-gray-100 hover:bg-gray-50"
                                >
                                    <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                                    <div className="flex gap-1">
                                        <button
                                            type="button"
                                            onClick={() => handleEditCategory(cat)}
                                            className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
                                        >
                                            עריכה
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteCategory(cat._id)}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                            aria-label="מחק קטגוריה"
                                        >
                                            <FaTrash size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">מסגרות קיימות ({frames.length})</h2>

                    {loading ? (
                        <p className="text-gray-500 text-center py-12">טוען...</p>
                    ) : frames.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <FaImage className="mx-auto text-4xl mb-3 opacity-40" />
                            <p>אין מסגרות עדיין. הוסיפי מסגרת ראשונה בטופס.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
                            {frames.map((frame) => (
                                <div
                                    key={frame._id}
                                    className={`border rounded-xl overflow-hidden p-4 flex flex-col justify-between ${
                                        editingId === frame._id ? 'border-[#f2665e] ring-2 ring-[#f2665e]/30' : 'border-gray-100'
                                    }`}
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-gray-800">{frame.title}</h3>
                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                                {frame.category}
                                            </span>
                                        </div>
                                        <div className="w-full h-36 bg-gray-50 rounded-lg overflow-hidden mb-3 flex items-center justify-center border border-gray-100">
                                            <img
                                                src={frame.thumbnailUrl || frame.imageUrl}
                                                alt={frame.title}
                                                className="max-h-full max-w-full object-contain"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        <span className="text-xs bg-[#f2665e]/10 text-[#f2665e] px-2 py-0.5 rounded">
                                            {printSizes.find((size) => size.key === frame.printSizeKey)?.label || 'כל המידות'}
                                        </span>
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                            {ORIENTATION_OPTIONS.find((o) => o.value === (frame.orientation || 'any'))?.label}
                                        </span>
                                        {frame.isFixedOverlay !== false && (
                                            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                                                Overlay קבוע
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                        <span className="text-xs text-gray-500">
                                            {frame.layoutType === 'multi_dropzone' ? 'קולאז׳' : 'מסגרת רגילה'}
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(frame)}
                                                className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium"
                                            >
                                                עריכה
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(frame._id)}
                                                className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium"
                                            >
                                                מחיקה
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}