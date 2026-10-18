import { useEffect, useMemo, useState } from "react";
import { FiArrowLeft, FiPlus, FiTrash2 } from "react-icons/fi";
import { FaImages } from "react-icons/fa";
import { Link } from "react-router-dom";
import { getPhotoPricing, updatePhotoPricing } from "../api/photo";
import { PhotoPricingTableContent } from "../components/PhotoPricingTable";
import { formatPhotoSizeOptionLabel, getPhotoSizeCatalogEntry } from "../utils/printSizes";

const inputClass = "w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#f2665e]/30 focus:border-[#f2665e] outline-none";

/** Tier table (starting quantity + percent) with adding and removing rows */
function TierEditor({ title, description, tiers, percentKey, onChange }) {
    const updateTier = (index, field, value) =>
        onChange(tiers.map((tier, i) => (i === index ? { ...tier, [field]: value } : tier)));
    const removeTier = (index) => onChange(tiers.filter((_, i) => i !== index));
    const addTier = () => {
        const lastMin = tiers.reduce((max, t) => Math.max(max, Number(t.minQuantity) || 0), 0);
        onChange([...tiers, { minQuantity: lastMin ? lastMin * 2 : 50, [percentKey]: 0 }]);
    };

    return (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
            <div>
                <h2 className="text-lg font-bold text-gray-800">{title}</h2>
                <p className="text-sm text-gray-500">{description}</p>
            </div>
            {tiers.map((tier, index) => (
                <div key={index} className="flex items-end gap-3">
                    <label className="flex-1">
                        <span className="block text-xs font-medium text-gray-600 mb-1">מ-כמות</span>
                        <input
                            type="number"
                            min="1"
                            step="1"
                            value={tier.minQuantity}
                            onChange={(e) => updateTier(index, "minQuantity", e.target.value)}
                            className={inputClass}
                        />
                    </label>
                    <label className="flex-1">
                        <span className="block text-xs font-medium text-gray-600 mb-1">הנחה (%)</span>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={tier[percentKey]}
                            onChange={(e) => updateTier(index, percentKey, e.target.value)}
                            className={inputClass}
                        />
                    </label>
                    <button
                        type="button"
                        onClick={() => removeTier(index)}
                        className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        aria-label="מחיקת מדרגה"
                    >
                        <FiTrash2 />
                    </button>
                </div>
            ))}
            <button
                type="button"
                onClick={addTier}
                className="inline-flex items-center gap-2 text-sm font-bold text-[#f2665e] hover:bg-[#f2665e]/10 px-3 py-2 rounded-lg"
            >
                <FiPlus /> הוספת מדרגה
            </button>
        </section>
    );
}

/** Photo development price list editor: price per size, quantity discounts and album discounts */
export default function PhotoPricingManagement() {
    const [pricing, setPricing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    useEffect(() => {
        getPhotoPricing()
            .then(setPricing)
            .catch(() => setMessage({ type: "error", text: "שגיאה בטעינת המחירון" }));
    }, []);

    const update = (field, value) => setPricing((prev) => ({ ...prev, [field]: value }));

    /** Preview: the same table the customer sees, from the form values */
    const previewPricing = useMemo(() => {
        if (!pricing) return null;
        const toNumbers = (list, keys) => list
            .map((item) => Object.fromEntries(Object.entries(item).map(([k, v]) => [k, keys.includes(k) ? Number(v) : v])))
            .filter((item) => keys.every((k) => Number.isFinite(item[k])));
        return {
            sizes: toNumbers(pricing.sizes, ["price"]),
            quantityTiers: toNumbers(pricing.quantityTiers, ["minQuantity", "discountPercent"]),
            albumDiscountTiers: [],
        };
    }, [pricing]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: "", text: "" });
        try {
            setPricing(await updatePhotoPricing(pricing));
            setMessage({ type: "success", text: "המחירון נשמר. המחירים בעמוד פיתוח התמונות מתעדכנים מיד." });
        } catch (err) {
            setMessage({ type: "error", text: err.response?.data?.msg || "שגיאה בשמירת המחירון" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans" dir="rtl">
            <div className="max-w-3xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <FaImages className="text-[#f2665e]" />
                        מחירי פיתוח תמונות
                    </h1>
                    <p className="text-gray-500 mt-1">
                        מחיר לתמונה לכל גודל, והנחות לפי כמות התמונות בהזמנה. החישוב נעשה אוטומטית.
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

            {!pricing ? (
                <p className="max-w-3xl mx-auto text-gray-500">{message.text || "טוען..."}</p>
            ) : (
                <form onSubmit={handleSave} className="max-w-3xl mx-auto space-y-6">
                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">מחיר לתמונה לפי גודל</h2>
                            <p className="text-sm text-gray-500">המחיר הרגיל לתמונה אחת, לפני הנחת כמות.</p>
                        </div>
                        {pricing.sizes.map((entry, index) => (
                            <label key={entry.size} className="flex items-center gap-3">
                                <span className="flex-1 text-sm text-gray-700">
                                    {formatPhotoSizeOptionLabel(getPhotoSizeCatalogEntry(entry.size))}
                                </span>
                                <span className="w-36 flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={entry.price}
                                        onChange={(e) => update("sizes", pricing.sizes.map((s, i) => (
                                            i === index ? { ...s, price: e.target.value } : s
                                        )))}
                                        className={inputClass}
                                    />
                                    <span className="text-gray-500">₪</span>
                                </span>
                            </label>
                        ))}
                    </section>

                    <TierEditor
                        title="הנחות לפי כמות"
                        description="מכמה תמונות (סך כל ההדפסות בהזמנה) מתחילה כל הנחה, ובכמה אחוזים. ההנחה חלה על כל הגדלים."
                        tiers={pricing.quantityTiers}
                        percentKey="discountPercent"
                        onChange={(tiers) => update("quantityTiers", tiers)}
                    />

                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-3">כך הלקוחות יראו את המחירים</h2>
                        <PhotoPricingTableContent pricing={previewPricing} />
                    </section>

                    <TierEditor
                        title="הנחה על אלבום"
                        description="מכמה תמונות הלקוח מקבל הצעה להנחה על אלבום, ובכמה אחוזים."
                        tiers={pricing.albumDiscountTiers}
                        percentKey="percent"
                        onChange={(tiers) => update("albumDiscountTiers", tiers)}
                    />

                    {message.text && (
                        <p className={`text-sm font-medium ${message.type === "error" ? "text-red-600" : "text-green-700"}`}>
                            {message.text}
                        </p>
                    )}
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full sm:w-auto px-8 py-3 bg-[#f2665e] hover:bg-[#d95248] text-white font-bold rounded-xl disabled:opacity-50"
                    >
                        {saving ? "שומר..." : "שמירת המחירון"}
                    </button>
                </form>
            )}
        </div>
    );
}
