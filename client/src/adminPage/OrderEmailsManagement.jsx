import { useCallback, useEffect, useState } from "react";
import { FaCheckCircle, FaEnvelope, FaExclamationCircle } from "react-icons/fa";
import { Link } from "react-router-dom";
import { getOrderEmailTemplates, updateOrderEmailTemplate } from "../api/orders";
import { STATUS_OPTIONS } from "./orderStatus";

const inputClass = "w-full border border-gray-200 rounded-xl p-3 text-right focus:ring-2 focus:ring-[#f2665e]/30 focus:border-[#f2665e] outline-none";

const statusLabel = (status) => STATUS_OPTIONS.find((option) => option.value === status)?.label || status;

/** עריכת נוסח המייל האוטומטי שהלקוח מקבל בכל סטטוס הזמנה */
export default function OrderEmailsManagement() {
    const [templates, setTemplates] = useState([]);
    const [placeholders, setPlaceholders] = useState([]);
    const [activeStatus, setActiveStatus] = useState("processing");
    const [form, setForm] = useState({ subject: "", body: "", enabled: true });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    const loadTemplates = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getOrderEmailTemplates();
            setTemplates(data.templates || []);
            setPlaceholders(data.placeholders || []);
        } catch (err) {
            console.error(err);
            setMessage({ type: "error", text: "שגיאה בטעינת נוסחי המיילים" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTemplates();
    }, [loadTemplates]);

    useEffect(() => {
        const template = templates.find((item) => item.status === activeStatus);
        if (template) {
            setForm({ subject: template.subject, body: template.body, enabled: template.enabled !== false });
        }
    }, [templates, activeStatus]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: "", text: "" });
        try {
            const saved = await updateOrderEmailTemplate(activeStatus, form);
            setTemplates((prev) => prev.map((item) => (item.status === saved.status ? saved : item)));
            setMessage({ type: "success", text: `הנוסח לסטטוס "${statusLabel(activeStatus)}" נשמר` });
        } catch (err) {
            setMessage({ type: "error", text: err.response?.data?.msg || "שגיאה בשמירת הנוסח" });
        } finally {
            setSaving(false);
        }
    };

    const insertPlaceholder = (key) => {
        setForm((prev) => ({ ...prev, body: `${prev.body}{{${key}}}` }));
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans" dir="rtl">
            <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <FaEnvelope className="text-[#f2665e]" />
                        מיילים ללקוחות
                    </h1>
                    <p className="text-gray-500 mt-1">
                        הלקוח מקבל מייל אוטומטי כשההזמנה מתקבלת ובכל שינוי סטטוס. כאן עורכים את הנוסח לכל סטטוס.
                    </p>
                </div>
                <Link
                    to="/ordersmanagement"
                    className="text-[#f2665e] font-bold p-2 gap-2 rounded-lg hover:bg-[#f2665e]/10 flex items-center no-underline"
                >
                    <span>חזרה לניהול הזמנות</span>
                    <span aria-hidden="true">←</span>
                </Link>
            </div>

            {message.text && (
                <div className={`max-w-4xl mx-auto mb-4 p-4 rounded-xl flex items-center gap-3 ${
                    message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                    {message.type === "success" ? <FaCheckCircle /> : <FaExclamationCircle />}
                    <span>{message.text}</span>
                </div>
            )}

            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
                <nav className="md:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-3 h-fit flex md:flex-col gap-2 overflow-x-auto">
                    {STATUS_OPTIONS.map(({ value, label, icon: Icon }) => {
                        const template = templates.find((item) => item.status === value);
                        const isActive = activeStatus === value;
                        return (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setActiveStatus(value)}
                                className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${
                                    isActive ? "bg-[#f2665e] text-white" : "text-gray-700 hover:bg-gray-100"
                                }`}
                            >
                                <span className="flex items-center gap-2"><Icon /> {label}</span>
                                {template && template.enabled === false && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${isActive ? "bg-white/20" : "bg-gray-100 text-gray-500"}`}>כבוי</span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                <form onSubmit={handleSave} className="md:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                    {loading ? (
                        <p className="text-gray-500">טוען...</p>
                    ) : (
                        <>
                            <h2 className="text-xl font-bold text-gray-800">
                                מייל לסטטוס: {statusLabel(activeStatus)}
                            </h2>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.enabled}
                                    onChange={(e) => setForm((prev) => ({ ...prev, enabled: e.target.checked }))}
                                    className="rounded"
                                />
                                <span className="text-sm text-gray-700">לשלוח מייל זה ללקוח</span>
                            </label>

                            <label className="block">
                                <span className="block text-sm font-medium text-gray-700 mb-1">נושא</span>
                                <input
                                    type="text"
                                    value={form.subject}
                                    onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                                    className={inputClass}
                                />
                            </label>

                            <label className="block">
                                <span className="block text-sm font-medium text-gray-700 mb-1">גוף המייל</span>
                                <textarea
                                    value={form.body}
                                    onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
                                    className={`${inputClass} min-h-[220px]`}
                                />
                            </label>

                            <div>
                                <span className="block text-xs text-gray-500 mb-2">לחיצה מוסיפה לגוף המייל שדה שמתמלא אוטומטית:</span>
                                <div className="flex flex-wrap gap-2">
                                    {placeholders.map(({ key, label }) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => insertPlaceholder(key)}
                                            className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium"
                                        >
                                            {label} <span className="font-mono text-gray-400" dir="ltr">{`{{${key}}}`}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#f2665e] text-white font-bold hover:bg-[#d95248] disabled:opacity-50"
                            >
                                {saving ? "שומר..." : "שמירת הנוסח"}
                            </button>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
}
