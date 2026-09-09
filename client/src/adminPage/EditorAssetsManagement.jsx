import { useCallback, useEffect, useState } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaImage, FaPlus, FaThLarge, FaTrash } from 'react-icons/fa';
import { FiArrowLeft } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import {
    createEditorAsset,
    deleteEditorAsset,
    getEditorAssets,
    updateEditorAsset,
} from '../api/editorAssets';
import { invalidateEditorAssetsCache } from '../hooks/useEditorAssets';
import SmartImageInput from '../components/SmartImageInput';

const TABS = [
    { id: 'shape', label: 'צורות' },
    { id: 'elementBackground', label: 'תמונות רקע (אלמנטים)' },
    { id: 'canvasBackground', label: 'תמונות רקע (קנבס)' },
    { id: 'graphic', label: 'גרפיקות' },
    { id: 'icon', label: 'אייקונים' },
];

const emptyForm = (category) => ({
    title: '',
    src: '',
    content: '',
    isActive: true,
    sortOrder: 0,
    category,
});

const inputClass = 'w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#f2665e]';

export default function EditorAssetsManagement() {
    const [category, setCategory] = useState('shape');
    const [assets, setAssets] = useState([]);
    const [form, setForm] = useState(emptyForm('shape'));
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const loadAssets = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getEditorAssets(true);
            setAssets(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'שגיאה בטעינת רכיבי העורך' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAssets();
    }, [loadAssets]);

    const resetForm = (nextCategory = category) => {
        setEditingId(null);
        setForm(emptyForm(nextCategory));
    };

    const handleTabChange = (nextCategory) => {
        setCategory(nextCategory);
        resetForm(nextCategory);
        setMessage({ type: '', text: '' });
    };

    const visibleAssets = assets
        .filter((asset) => asset.category === category)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    const handleEdit = (asset) => {
        setEditingId(asset._id);
        setForm({
            title: asset.title || '',
            src: asset.src || '',
            content: asset.content || '',
            isActive: asset.isActive !== false,
            sortOrder: asset.sortOrder || 0,
            category: asset.category,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!confirm('למחוק פריט זה מהספרייה?')) return;
        try {
            await deleteEditorAsset(id);
            invalidateEditorAssetsCache();
            if (editingId === id) resetForm();
            await loadAssets();
            setMessage({ type: 'success', text: 'הפריט נמחק' });
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: err?.response?.data?.msg || 'שגיאה במחיקת הפריט' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const title = form.title.trim();
        if (!title) {
            setMessage({ type: 'error', text: 'יש להזין שם לפריט' });
            return;
        }

        const payload = {
            category,
            title,
            isActive: form.isActive,
            sortOrder: Number(form.sortOrder) || 0,
        };

        if (category === 'shape') {
            payload.content = form.content.trim();
            payload.src = form.src.trim();
            payload.type = payload.content ? 'shape' : 'image';
            if (!payload.content && !payload.src) {
                setMessage({ type: 'error', text: 'יש להעלות תמונה או להדביק SVG לצורה' });
                return;
            }
        } else {
            payload.type = 'image';
            payload.src = form.src.trim();
            if (!payload.src) {
                setMessage({ type: 'error', text: 'יש להעלות תמונה או להדביק כתובת' });
                return;
            }
        }

        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            if (editingId) {
                await updateEditorAsset(editingId, payload);
                setMessage({ type: 'success', text: 'הפריט עודכן בהצלחה' });
            } else {
                await createEditorAsset(payload);
                setMessage({ type: 'success', text: 'הפריט נוסף בהצלחה' });
            }
            resetForm();
            invalidateEditorAssetsCache();
            await loadAssets();
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: err?.response?.data?.msg || 'שגיאה בשמירת הפריט' });
        } finally {
            setSaving(false);
        }
    };

    const isShapeTab = category === 'shape';

    return (
        <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
            <div className="max-w-6xl mx-auto mb-8 flex justify-between items-center gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <FaThLarge className="text-[#f2665e]" />
                        ניהול רכיבי עיצוב עצמי
                    </h1>
                    <p className="text-gray-500 mt-1">
                        הוספה, עריכה ומחיקה של צורות, רקעים, גרפיקות ואייקונים בספריית העורך.
                    </p>
                </div>
                <Link
                    to="/editpages"
                    className="text-[#f2665e] font-bold p-2 gap-2 rounded-lg hover:bg-[#f2665e]/10 flex items-center no-underline"
                >
                    <span>חזרה לעריכת דפים</span>
                    <FiArrowLeft className="text-xl" />
                </Link>
            </div>

            <div className="max-w-6xl mx-auto mb-6 flex flex-wrap gap-2">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => handleTabChange(tab.id)}
                        className={`px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
                            category === tab.id
                                ? 'bg-[#f2665e] text-white shadow-sm'
                                : 'bg-white text-gray-600 border border-gray-100 hover:border-[#f2665e]/40'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {message.text && (
                <div className={`max-w-6xl mx-auto mb-6 flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
                    message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                }`}>
                    {message.type === 'error' ? <FaExclamationCircle /> : <FaCheckCircle />}
                    {message.text}
                </div>
            )}

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
                <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FaPlus className="text-[#f2665e]" />
                        {editingId ? 'עריכת פריט' : 'הוספת פריט חדש'}
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">שם לתצוגה</label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                                className={inputClass}
                                placeholder="לדוגמה: עיגול / פרח / רקע נקודות"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {isShapeTab ? 'תמונה / SVG' : 'תמונה'}
                            </label>
                            <SmartImageInput
                                value={form.src}
                                onChange={(src) => setForm((prev) => ({ ...prev, src }))}
                                placeholder="הדביקו URL או העלו תמונה"
                            />
                        </div>

                        {isShapeTab && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">קוד SVG (מומלץ לצורות)</label>
                                <textarea
                                    value={form.content}
                                    onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                                    className={`${inputClass} min-h-[120px] font-mono text-xs ltr`}
                                    dir="ltr"
                                    placeholder='<svg viewBox="0 0 100 100" ...>'
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    אם ממלאים SVG, הוא ישמש כצורה בעורך. אפשר גם להעלות קובץ תמונה בלבד.
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">סדר תצוגה</label>
                                <input
                                    type="number"
                                    value={form.sortOrder}
                                    onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
                                    className={inputClass}
                                />
                            </div>
                            <div className="flex items-end pb-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.isActive}
                                        onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                                        className="rounded"
                                    />
                                    <span className="text-sm text-gray-700">פעיל בספרייה</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 py-2.5 rounded-xl bg-[#f2665e] text-white font-bold hover:bg-[#d95248] disabled:opacity-50"
                            >
                                {saving ? 'שומר...' : editingId ? 'עדכון פריט' : 'הוספת פריט'}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={() => resetForm()}
                                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
                                >
                                    ביטול
                                </button>
                            )}
                        </div>
                    </div>
                </form>

                <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">
                        {TABS.find((tab) => tab.id === category)?.label} ({visibleAssets.length})
                    </h2>

                    {loading ? (
                        <p className="text-gray-500 text-center py-12">טוען...</p>
                    ) : visibleAssets.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <FaImage className="mx-auto text-4xl mb-3 opacity-40" />
                            <p>אין פריטים בקטגוריה זו עדיין.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto">
                            {visibleAssets.map((asset) => (
                                <div
                                    key={asset._id}
                                    className={`border rounded-xl overflow-hidden p-3 flex flex-col ${
                                        editingId === asset._id ? 'border-[#f2665e] ring-2 ring-[#f2665e]/30' : 'border-gray-100'
                                    }`}
                                >
                                    <div className="w-full h-24 rounded-lg overflow-hidden mb-3 flex items-center justify-center border border-gray-100 bg-gray-50">
                                        <img
                                            src={asset.src}
                                            alt={asset.title}
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    </div>
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h3 className="font-bold text-gray-800 text-sm">{asset.title}</h3>
                                        <span className={`text-[10px] px-2 py-0.5 rounded ${
                                            asset.isActive === false ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-700'
                                        }`}>
                                            {asset.isActive === false ? 'מוסתר' : 'פעיל'}
                                        </span>
                                    </div>
                                    <div className="mt-auto flex justify-end gap-2 pt-2 border-t border-gray-100">
                                        <button
                                            type="button"
                                            onClick={() => handleEdit(asset)}
                                            className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium"
                                        >
                                            עריכה
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(asset._id)}
                                            className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium"
                                            aria-label="מחק פריט"
                                        >
                                            <FaTrash className="inline ml-1" size={10} />
                                            מחיקה
                                        </button>
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
