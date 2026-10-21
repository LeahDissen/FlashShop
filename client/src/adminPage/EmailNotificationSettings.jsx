import { useEffect, useState } from "react";
import { FaEnvelope } from "react-icons/fa";
import { getEmailSettings, updateEmailSettings } from "../api/shopSettings";

const EMPTY = { notifications: { email: "", newOrder: true, newMessage: true }, replyToEmail: "" };

/**
 * Admin: where the shop owner gets alerts (a new order, a message from the site) and where customers'
 * replies to the site's emails go.
 */
export default function EmailNotificationSettings() {
    const [form, setForm] = useState(EMPTY);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        getEmailSettings()
            .then((data) => setForm({ ...EMPTY, ...data, notifications: { ...EMPTY.notifications, ...data.notifications } }))
            .catch(() => setMessage({ ok: false, text: "שגיאה בטעינת הגדרות המייל" }))
            .finally(() => setLoading(false));
    }, []);

    const patchNotifications = (fields) => setForm((prev) => ({ ...prev, notifications: { ...prev.notifications, ...fields } }));

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            setForm(await updateEmailSettings(form));
            setMessage({ ok: true, text: "הגדרות המייל נשמרו" });
        } catch (err) {
            setMessage({ ok: false, text: err.response?.data?.msg || "שגיאה בשמירה" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return null;

    return (
        <form onSubmit={save} className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4 mt-6" dir="rtl">
            <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FaEnvelope className="text-[#f2665e]" />
                    התראות וכתובות מייל
                </h2>
                <p className="text-sm text-gray-500 mt-1">לאן יישלחו אלייך התראות מהאתר, ולאן יגיעו תשובות של לקוחות למיילים שהאתר שולח.</p>
            </div>

            <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">מייל להתראות</span>
                <input
                    type="email"
                    dir="ltr"
                    value={form.notifications.email}
                    onChange={(e) => patchNotifications({ email: e.target.value })}
                    placeholder="name@gmail.com"
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm text-left"
                />
            </label>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.notifications.newOrder} onChange={(e) => patchNotifications({ newOrder: e.target.checked })} />
                    התראה על כל הזמנה חדשה (&quot;מחכה לכם הזמנה באתר&quot;)
                </label>
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.notifications.newMessage} onChange={(e) => patchNotifications({ newMessage: e.target.checked })} />
                    התראה על הודעה חדשה מטופס יצירת הקשר
                </label>
            </div>

            <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">כתובת לתשובות של לקוחות</span>
                <input
                    type="email"
                    dir="ltr"
                    value={form.replyToEmail}
                    onChange={(e) => setForm((prev) => ({ ...prev, replyToEmail: e.target.value }))}
                    placeholder="shop@flaash.co.il"
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm text-left"
                />
                <span className="block text-xs text-gray-500 mt-1">
                    כשלקוחה לוחצת &quot;השב&quot; על מייל מהאתר, התשובה תגיע לכתובת הזו. ריק = לכתובת שממנה האתר שולח.
                </span>
            </label>

            {message && <p className={`text-sm ${message.ok ? "text-green-700" : "text-red-600"}`}>{message.text}</p>}
            <button type="submit" disabled={saving} className="bg-[#f2665e] text-white font-bold px-6 py-2.5 rounded-xl hover:bg-[#d95248] disabled:opacity-50">
                {saving ? "שומר..." : "שמירת הגדרות המייל"}
            </button>
        </form>
    );
}
