import { useEffect, useState } from "react";
import { FaStore } from "react-icons/fa";
import { getShopSettings, updateShopSettings } from "../api/shopSettings";

/**
 * Admin: open or close the shop to the public. While closed, visitors see a "coming soon" page with the
 * message below, and only the logged-in admin sees (and edits) the site.
 */
export default function SiteOpenSettings() {
    const [closed, setClosed] = useState(false);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState(null);

    useEffect(() => {
        getShopSettings()
            .then((data) => {
                setClosed(Boolean(data.siteClosed));
                setMessage(data.closedMessage || "");
            })
            .finally(() => setLoading(false));
    }, []);

    const save = async (nextClosed) => {
        setSaving(true);
        setNotice(null);
        try {
            const saved = await updateShopSettings({ siteClosed: nextClosed, closedMessage: message });
            setClosed(Boolean(saved.siteClosed));
            setMessage(saved.closedMessage || "");
            setNotice({ ok: true, text: saved.siteClosed ? "האתר סגור לציבור. רק את רואה אותו כשאת מחוברת." : "האתר פתוח לכולם 🎉" });
        } catch (err) {
            setNotice({ ok: false, text: err.response?.data?.msg || "שגיאה בשמירה" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return null;

    return (
        <section className={`max-w-3xl mx-auto rounded-2xl shadow-sm border p-6 space-y-4 mb-6 ${closed ? "bg-amber-50 border-amber-200" : "bg-white border-gray-100"}`} dir="rtl">
            <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FaStore className="text-[#f2665e]" />
                    {closed ? "האתר סגור לציבור" : "האתר פתוח לכולם"}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                    כשהאתר סגור, מבקרים רואים דף &quot;בקרוב&quot; ולא יכולים להזמין. את, כשאת מחוברת, רואה ועורכת הכול כרגיל.
                </p>
            </div>
            <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">ההודעה למבקרים כשהאתר סגור</span>
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="האתר בהכנה ויפתח בקרוב 💛"
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm h-20"
                />
            </label>
            <div className="flex flex-wrap gap-3">
                <button
                    type="button"
                    disabled={saving}
                    onClick={() => save(!closed)}
                    className={`font-bold px-6 py-2.5 rounded-xl text-white disabled:opacity-50 ${closed ? "bg-green-600 hover:bg-green-700" : "bg-[#f2665e] hover:bg-[#d95248]"}`}
                >
                    {saving ? "שומר..." : closed ? "פתיחת האתר לכולם" : "סגירת האתר לציבור"}
                </button>
                {closed && (
                    <button type="button" disabled={saving} onClick={() => save(true)} className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-white disabled:opacity-50">
                        שמירת ההודעה
                    </button>
                )}
            </div>
            {notice && <p className={`text-sm ${notice.ok ? "text-green-700" : "text-red-600"}`}>{notice.text}</p>}
        </section>
    );
}
