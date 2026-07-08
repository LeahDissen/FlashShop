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
import SmartImageInput from '../components/SmartImageInput';

const ASPECT_RATIO_PRESETS = ['1:1', '4:3', '3:4', '16:9', '9:16', '3:1', '2:1'];

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
    isActive: true,
    sortOrder: 0,
};

export default function DesignFramesManagement() {
    const [frames, setFrames] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [categoryName, setCategoryName] = useState('');
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [categoryMessage, setCategoryMessage] = useState({ type: '', text: '' });

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [framesData, categoriesData] = await Promise.all([
                getDesignFrames(true),
                getFrameCategories(),
            ]);
            setFrames(framesData);
            setCategories(categoriesData);
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

        const payload = {
            title: form.title.trim(),
            imageUrl: form.imageUrl.trim(),
            thumbnailUrl: (form.thumbnailUrl || form.imageUrl).trim(),
            category: form.category,
            aspectRatio: form.aspectRatio.trim(),
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
            isActive: frame.isActive !== false,
            sortOrder: frame.sortOrder || 0,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
                                    className={`border rounded-xl overflow-hidden ${
                                        editingId === frame._id ? 'border-[#f2665e] ring-2 ring-[#f2665e]/30' : 'border-gray-100'
                                    }`}
                                >
                                    <div className="aspect-video bg-gray-100 flex items-center justify-center p-2">
                                        <img
                                            src={frame.thumbnailUrl || frame.imageUrl}
                                            alt={frame.title}
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    </div>
                                    <div className="p-3">
                                        <div className="flex justify-between items-start gap-2">
                                            <div>
                                                <h3 className="font-bold text-gray-800 text-sm">{frame.title}</h3>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {frame.category} · {frame.aspectRatio}
                                                    {!frame.isActive && ' · מוסתר'}
                                                </p>
                                            </div>
                                            <div className="flex gap-1 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEdit(frame)}
                                                    className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                                                >
                                                    עריכה
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(frame._id)}
                                                    className="p-1.5 rounded text-red-500 hover:bg-red-50"
                                                    aria-label="מחק"
                                                >
                                                    <FaTrash size={14} />
                                                </button>
                                            </div>
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
