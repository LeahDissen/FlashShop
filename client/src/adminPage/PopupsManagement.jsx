import { useCallback, useEffect, useState } from "react";
import { FaBullhorn, FaCheckCircle, FaExclamationCircle, FaPlus, FaTrash } from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";
import { Link } from "react-router-dom";
import { createPopup, deletePopup, getAllPopups, updatePopup } from "../api/popups";
import SmartImageInput from "../components/SmartImageInput";

const inputClass = "w-full border border-gray-200 rounded-xl p-3 text-right focus:ring-2 focus:ring-[#f2665e]/30 focus:border-[#f2665e] outline-none";

/** העמודים שאפשר לכוון אליהם פופאפ; ריק = כל האתר */
const PAGE_OPTIONS = [
    { value: "/", label: "דף הבית" },
    { value: "/products", label: "מוצרים" },
    { value: "/photo-development", label: "פיתוח תמונות" },
    { value: "/tips", label: "בלוג" },
    { value: "/cart", label: "סל קניות" },
];

const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

const emptyForm = () => ({
    title: "",
    body: "",
    imageUrl: "",
    ctaText: "",
    ctaUrl: "",
    pages: [],
    delaySeconds: 3,
    showOncePerSession: true,
    isActive: true,
    startsAt: "",
    endsAt: "",
    sortOrder: 0,
});

const describeSchedule = (popup) => {
    if (!popup.startsAt && !popup.endsAt) return "תמיד";
    const from = popup.startsAt ? new Date(popup.startsAt).toLocaleDateString("he-IL") : "…";
    const to = popup.endsAt ? new Date(popup.endsAt).toLocaleDateString("he-IL") : "…";
    return `${from} – ${to}`;
};

export default function PopupsManagement() {
    const [popups, setPopups] = useState([]);
    const [form, setForm] = useState(emptyForm());
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    const loadPopups = useCallback(async () => {
        setLoading(true);
        try {
            setPopups(await getAllPopups());
        } catch (err) {
            console.error(err);
            setMessage({ type: "error", text: "שגיאה בטעינת הפופאפים" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPopups();
    }, [loadPopups]);

    const resetForm = () => {
        setEditingId(null);
        setForm(emptyForm());
    };

    const handleEdit = (popup) => {
        setEditingId(popup._id);
        setForm({
            title: popup.title || "",
            body: popup.body || "",
            imageUrl: popup.imageUrl || "",
            ctaText: popup.ctaText || "",
            ctaUrl: popup.ctaUrl || "",
            pages: popup.pages || [],
            delaySeconds: popup.delaySeconds ?? 3,
            showOncePerSession: popup.showOncePerSession !== false,
            isActive: popup.isActive !== false,
            startsAt: toDateInput(popup.startsAt),
            endsAt: toDateInput(popup.endsAt),
            sortOrder: popup.sortOrder || 0,
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const togglePage = (value) => {
        setForm((prev) => ({
            ...prev,
            pages: prev.pages.includes(value) ? prev.pages.filter((p) => p !== value) : [...prev.pages, value],
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) {
            setMessage({ type: "error", text: "יש להזין כותרת" });
            return;
        }
        setSaving(true);
        setMessage({ type: "", text: "" });
        try {
            const payload = {
                ...form,
                title: form.title.trim(),
                delaySeconds: Number(form.delaySeconds) || 0,
                sortOrder: Number(form.sortOrder) || 0,
                startsAt: form.startsAt || null,
                endsAt: form.endsAt || null,
            };
            if (editingId) {
                await updatePopup(editingId, payload);
                setMessage({ type: "success", text: "הפופאפ עודכן" });
            } else {
                await createPopup(payload);
                setMessage({ type: "success", text: "הפופאפ נוצר" });
            }
            resetForm();
            await loadPopups();
        } catch (err) {
            setMessage({ type: "error", text: err.response?.data?.msg || "שגיאה בשמירה" });
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (popup) => {
        try {
            await updatePopup(popup._id, { ...popup, isActive: !popup.isActive });
            await loadPopups();
        } catch (err) {
            setMessage({ type: "error", text: err.response?.data?.msg || "שגיאה בעדכון" });
        }
    };

    const handleDelete = async (popup) => {
        if (!confirm(`למחוק את הפופאפ "${popup.title}"?`)) return;
        try {
            await deletePopup(popup._id);
            if (editingId === popup._id) resetForm();
            await loadPopups();
        } catch (err) {
            setMessage({ type: "error", text: err.response?.data?.msg || "שגיאה במחיקה" });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans" dir="rtl">
            <div className="max-w-6xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <FaBullhorn className="text-[#f2665e]" />
                        פופאפים באתר
                    </h1>
                    <p className="text-gray-500 mt-1">
                        הודעות שקופצות ללקוחות — מבצעים, הודעות חשובות, קורסים. בוחרים באילו עמודים, אחרי כמה שניות, ובאילו תאריכים.
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

            {message.text && (
                <div className={`max-w-6xl mx-auto mb-4 p-4 rounded-xl flex items-center gap-3 ${
                    message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                    {message.type === "success" ? <FaCheckCircle /> : <FaExclamationCircle />}
                    <span>{message.text}</span>
                </div>
            )}

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
                <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit space-y-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FaPlus className="text-[#f2665e]" />
                        {editingId ? "עריכת פופאפ" : "פופאפ חדש"}
                    </h2>

                    <label className="block">
                        <span className="block text-sm font-medium text-gray-700 mb-1">כותרת</span>
                        <input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className={inputClass} placeholder="למשל: 20% הנחה על מגנטים השבוע!" />
                    </label>

                    <label className="block">
                        <span className="block text-sm font-medium text-gray-700 mb-1">טקסט</span>
                        <textarea value={form.body} onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))} className={`${inputClass} min-h-[100px]`} />
                    </label>

                    <div>
                        <span className="block text-sm font-medium text-gray-700 mb-1">תמונה (אופציונלי)</span>
                        <SmartImageInput value={form.imageUrl} onChange={(imageUrl) => setForm((p) => ({ ...p, imageUrl }))} placeholder="הדביקו URL או העלו תמונה" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                            <span className="block text-sm font-medium text-gray-700 mb-1">טקסט כפתור</span>
                            <input type="text" value={form.ctaText} onChange={(e) => setForm((p) => ({ ...p, ctaText: e.target.value }))} className={inputClass} placeholder="לכל המוצרים" />
                        </label>
                        <label className="block">
                            <span className="block text-sm font-medium text-gray-700 mb-1">קישור הכפתור</span>
                            <input type="text" dir="ltr" value={form.ctaUrl} onChange={(e) => setForm((p) => ({ ...p, ctaUrl: e.target.value }))} className={inputClass} placeholder="/products" />
                        </label>
                    </div>

                    <div>
                        <span className="block text-sm font-medium text-gray-700 mb-1">באילו עמודים? (ריק = בכל האתר)</span>
                        <div className="flex flex-wrap gap-2">
                            {PAGE_OPTIONS.map((option) => (
                                <label key={option.value} className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer select-none ${
                                    form.pages.includes(option.value) ? "bg-[#f2665e] text-white border-[#f2665e]" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                                }`}>
                                    <input type="checkbox" className="hidden" checked={form.pages.includes(option.value)} onChange={() => togglePage(option.value)} />
                                    {option.label}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                            <span className="block text-sm font-medium text-gray-700 mb-1">עולה אחרי (שניות)</span>
                            <input type="number" min="0" max="600" value={form.delaySeconds} onChange={(e) => setForm((p) => ({ ...p, delaySeconds: e.target.value }))} className={inputClass} />
                        </label>
                        <label className="block">
                            <span className="block text-sm font-medium text-gray-700 mb-1">סדר (נמוך = קודם)</span>
                            <input type="number" value={form.sortOrder} onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))} className={inputClass} />
                        </label>
                        <label className="block">
                            <span className="block text-sm font-medium text-gray-700 mb-1">מתאריך</span>
                            <input type="date" value={form.startsAt} onChange={(e) => setForm((p) => ({ ...p, startsAt: e.target.value }))} className={inputClass} />
                        </label>
                        <label className="block">
                            <span className="block text-sm font-medium text-gray-700 mb-1">עד תאריך</span>
                            <input type="date" value={form.endsAt} onChange={(e) => setForm((p) => ({ ...p, endsAt: e.target.value }))} className={inputClass} />
                        </label>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.showOncePerSession} onChange={(e) => setForm((p) => ({ ...p, showOncePerSession: e.target.checked }))} className="rounded" />
                        <span className="text-sm text-gray-700">להציג פעם אחת בביקור (אחרי סגירה לא יקפוץ שוב עד הביקור הבא)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} className="rounded" />
                        <span className="text-sm text-gray-700">פעיל</span>
                    </label>

                    <div className="flex gap-2 pt-2">
                        <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[#f2665e] text-white font-bold hover:bg-[#d95248] disabled:opacity-50">
                            {saving ? "שומר..." : editingId ? "עדכון" : "יצירה"}
                        </button>
                        {editingId && (
                            <button type="button" onClick={resetForm} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50">
                                ביטול
                            </button>
                        )}
                    </div>
                </form>

                <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">הפופאפים ({popups.length})</h2>
                    {loading ? (
                        <p className="text-gray-500 text-center py-12">טוען...</p>
                    ) : popups.length === 0 ? (
                        <p className="text-gray-400 text-center py-12">אין פופאפים עדיין. הראשון שלך מחכה בטופס משמאל.</p>
                    ) : (
                        <ul className="space-y-3">
                            {popups.map((popup) => (
                                <li key={popup._id} className={`border rounded-xl p-4 flex gap-4 items-start ${editingId === popup._id ? "border-[#f2665e] ring-2 ring-[#f2665e]/30" : "border-gray-100"}`}>
                                    {popup.imageUrl && (
                                        <img src={popup.imageUrl} alt="" className="w-20 h-20 rounded-lg object-cover border border-gray-100 shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-bold text-gray-800">{popup.title}</h3>
                                            <span className={`text-[10px] px-2 py-0.5 rounded ${popup.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                                {popup.isActive ? "פעיל" : "כבוי"}
                                            </span>
                                        </div>
                                        {popup.body && <p className="text-sm text-gray-500 line-clamp-2 mt-1">{popup.body}</p>}
                                        <p className="text-xs text-gray-400 mt-2">
                                            {popup.pages?.length ? popup.pages.map((p) => PAGE_OPTIONS.find((o) => o.value === p)?.label || p).join(", ") : "כל האתר"}
                                            {" · "}אחרי {popup.delaySeconds ?? 0} שנ׳
                                            {" · "}{describeSchedule(popup)}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-1 shrink-0">
                                        <button type="button" onClick={() => handleEdit(popup)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium">עריכה</button>
                                        <button type="button" onClick={() => handleToggleActive(popup)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium">
                                            {popup.isActive ? "כיבוי" : "הפעלה"}
                                        </button>
                                        <button type="button" onClick={() => handleDelete(popup)} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium">
                                            <FaTrash className="inline ml-1" size={10} />מחיקה
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
