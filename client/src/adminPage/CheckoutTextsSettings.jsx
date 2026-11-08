import { useEffect, useState } from "react";
import { FaFileContract } from "react-icons/fa";
import { getPage, updatePage } from "../api/pages";
import { DEFAULT_CHECKOUT_TEXTS, mergeCheckoutTexts } from "../constants/checkoutTexts";

const FIELDS = [
    { key: "pickupNotice", label: "הודעה באיסוף עצמי", rows: 4 },
    { key: "deliveryNotice", label: "הודעה במשלוח (זמני הכנה ומשלוח)", rows: 3 },
    { key: "termsCheckboxText", label: "הטקסט ליד תיבת הסימון בקופה", rows: 1 },
    { key: "termsTitle", label: "כותרת תקנון האתר", rows: 1 },
    { key: "termsContent", label: "תקנון האתר (נפתח בחלון מהקופה)", rows: 12 },
];

/** Admin: the pickup / delivery notices and the site terms the customer must accept at checkout ("checkout" CMS page) */
export default function CheckoutTextsSettings() {
    const [texts, setTexts] = useState(DEFAULT_CHECKOUT_TEXTS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState(null);

    useEffect(() => {
        getPage("checkout")
            .then((data) => setTexts(mergeCheckoutTexts(data)))
            .finally(() => setLoading(false));
    }, []);

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        setNotice(null);
        try {
            await updatePage("checkout", texts);
            setNotice({ ok: true, text: "הטקסטים של הקופה נשמרו." });
        } catch (err) {
            setNotice({ ok: false, text: err.response?.data?.msg || "השמירה נכשלה" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return null;

    return (
        <form id="checkout-texts" onSubmit={save} className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4 mt-6" dir="rtl">
            <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FaFileContract className="text-[#f2665e]" />
                    קופה: זמני אספקה ותקנון האתר
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    ההודעה מופיעה בקופה לפי מה שהלקוח בחר: איסוף עצמי או משלוח. לפני התשלום הלקוח חייב לסמן שקרא את התקנון.
                </p>
            </div>
            {FIELDS.map(({ key, label, rows }) => (
                <label key={key} className="block">
                    <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
                    {rows === 1 ? (
                        <input
                            type="text"
                            value={texts[key]}
                            onChange={(e) => setTexts((prev) => ({ ...prev, [key]: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg p-2.5 text-sm"
                        />
                    ) : (
                        <textarea
                            rows={rows}
                            value={texts[key]}
                            onChange={(e) => setTexts((prev) => ({ ...prev, [key]: e.target.value }))}
                            className="w-full border border-gray-200 rounded-lg p-2.5 text-sm leading-relaxed"
                        />
                    )}
                </label>
            ))}
            {notice && <p className={`text-sm font-medium ${notice.ok ? "text-green-700" : "text-red-600"}`}>{notice.text}</p>}
            <button type="submit" disabled={saving} className="px-8 py-2.5 bg-[#f2665e] hover:bg-[#d95248] text-white font-bold rounded-xl disabled:opacity-50">
                {saving ? "שומר..." : "שמירה"}
            </button>
        </form>
    );
}
