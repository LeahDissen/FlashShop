import { useCallback, useEffect, useState } from "react";
import { FaCheckCircle, FaExclamationCircle, FaLink } from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";
import { Link } from "react-router-dom";
import { getShopSettings, updateShopSettings } from "../api/shopSettings";

export default function ShopSettingsManagement() {
    const [paymentLinkUrl, setPaymentLinkUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    const loadSettings = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getShopSettings();
            setPaymentLinkUrl(data.paymentLinkUrl || "");
        } catch (err) {
            console.error(err);
            setMessage({ type: "error", text: "שגיאה בטעינת ההגדרות" });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: "", text: "" });
        try {
            const saved = await updateShopSettings({ paymentLinkUrl: paymentLinkUrl.trim() });
            setPaymentLinkUrl(saved.paymentLinkUrl || "");
            setMessage({ type: "success", text: "הקישור נשמר. כפתור התשלום בחנות מתעדכן מיד." });
        } catch (err) {
            setMessage({
                type: "error",
                text: err.response?.data?.msg || "שגיאה בשמירת הקישור",
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans" dir="rtl">
            <div className="max-w-3xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <FaLink className="text-[#f2665e]" />
                        הגדרות תשלום
                    </h1>
                    <p className="text-gray-500 mt-1">
                        כאן אפשר לעדכן את קישור התשלום המאובטח שהלקוחות רואים בקופה.
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

            <form onSubmit={handleSave} className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                {loading ? (
                    <p className="text-gray-500">טוען הגדרות...</p>
                ) : (
                    <>
                        <label className="block">
                            <span className="block text-sm font-medium text-gray-700 mb-1">קישור תשלום מאובטח</span>
                            <input
                                type="url"
                                dir="ltr"
                                value={paymentLinkUrl}
                                onChange={(e) => setPaymentLinkUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full border border-gray-200 rounded-lg p-3 text-left text-sm focus:outline-none focus:border-[#f2665e]"
                            />
                            <span className="block text-xs text-gray-500 mt-1">
                                הלקוחות יועברו לקישור הזה בלחיצה על «מעבר לתשלום מאובטח». אפשר להשאיר ריק עד שיהיה קישור מוכן.
                            </span>
                        </label>

                        {message.text && (
                            <p
                                className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
                                    message.type === "success"
                                        ? "bg-green-50 text-green-700"
                                        : "bg-red-50 text-red-700"
                                }`}
                            >
                                {message.type === "success" ? <FaCheckCircle /> : <FaExclamationCircle />}
                                {message.text}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full sm:w-auto px-6 py-3 bg-[#f2665e] text-white font-bold rounded-xl hover:bg-[#d95248] disabled:opacity-60"
                        >
                            {saving ? "שומר..." : "שמירת הקישור"}
                        </button>
                    </>
                )}
            </form>
        </div>
    );
}
