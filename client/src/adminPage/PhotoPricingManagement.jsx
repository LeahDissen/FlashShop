import { useEffect, useMemo, useState } from "react";
import { FiArrowLeft, FiPlus, FiTrash2 } from "react-icons/fi";
import { FaImages } from "react-icons/fa";
import { Link } from "react-router-dom";
import { getPhotoPricing, updatePhotoPricing } from "../api/photo";
import { PhotoPricingTableContent } from "../components/PhotoPricingTable";
import { formatPhotoSizeOptionLabel, getPhotoSizeCatalogEntry } from "../utils/printSizes";

const inputClass = "w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#f2665e]/30 focus:border-[#f2665e] outline-none";

/**
 * טבלת מדרגות: בכל שורה "מכמות" וערך (מחיר בש"ח או אחוז), עם הוספה ומחיקה.
 * @param {{ rows: object[], valueKey: string, valueLabel: string, valueStep: string, lockFirstRow?: boolean, onChange: Function }} props
 */
function TierRows({ rows, valueKey, valueLabel, valueStep, lockFirstRow = false, onChange }) {
    const updateRow = (index, field, value) =>
        onChange(rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
    const removeRow = (index) => onChange(rows.filter((_, i) => i !== index));
    const addRow = () => {
        const lastMin = rows.reduce((max, row) => Math.max(max, Number(row.minQuantity) || 0), 0);
        const lastValue = rows.at(-1)?.[valueKey] ?? "";
        onChange([...rows, { minQuantity: lastMin ? lastMin * 2 : 50, [valueKey]: lastValue }]);
    };

    return (
        <div className="space-y-2">
            {rows.map((row, index) => {
                const isLocked = lockFirstRow && index === 0;
                return (
                    <div key={index} className="flex items-end gap-3">
                        <label className="flex-1">
                            <span className="block text-xs font-medium text-gray-600 mb-1">מ-כמות</span>
                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={row.minQuantity}
                                disabled={isLocked}
                                onChange={(e) => updateRow(index, "minQuantity", e.target.value)}
                                className={`${inputClass} disabled:bg-gray-50 disabled:text-gray-500`}
                            />
                        </label>
                        <label className="flex-1">
                            <span className="block text-xs font-medium text-gray-600 mb-1">{valueLabel}</span>
                            <input
                                type="number"
                                min="0"
                                step={valueStep}
                                value={row[valueKey]}
                                onChange={(e) => updateRow(index, valueKey, e.target.value)}
                                className={inputClass}
                            />
                        </label>
                        <button
                            type="button"
                            onClick={() => removeRow(index)}
                            disabled={isLocked}
                            className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:invisible"
                            aria-label="מחיקת מדרגה"
                        >
                            <FiTrash2 />
                        </button>
                    </div>
                );
            })}
            <button
                type="button"
                onClick={addRow}
                className="inline-flex items-center gap-2 text-sm font-bold text-[#f2665e] hover:bg-[#f2665e]/10 px-3 py-2 rounded-lg"
            >
                <FiPlus /> הוספת מדרגה
            </button>
        </div>
    );
}

const sectionClass = "bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3";

/** עריכת מחירון פיתוח התמונות: מדרגות מחיר בש"ח לכל גודל, והנחות על אלבום */
export default function PhotoPricingManagement() {
    const [pricing, setPricing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    useEffect(() => {
        getPhotoPricing()
            .then(setPricing)
            .catch(() => setMessage({ type: "error", text: "שגיאה בטעינת המחירון" }));
    }, []);

    const updateSizeTiers = (size, tiers) => setPricing((prev) => ({
        ...prev,
        sizes: prev.sizes.map((entry) => (entry.size === size ? { ...entry, tiers } : entry)),
    }));

    /** תצוגה מקדימה: אותה טבלה שהלקוח רואה, רק משורות מלאות */
    const previewPricing = useMemo(() => {
        if (!pricing) return null;
        return {
            ...pricing,
            sizes: pricing.sizes.map((entry) => ({
                ...entry,
                tiers: entry.tiers
                    .filter((t) => t.minQuantity !== "" && t.price !== "")
                    .map((t) => ({ minQuantity: Number(t.minQuantity), price: Number(t.price) }))
                    .filter((t) => Number.isFinite(t.minQuantity) && Number.isFinite(t.price)),
            })),
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
                        לכל גודל: מחיר לתמונה בש&quot;ח לפי כמות ההדפסות מאותו גודל. החישוב בהזמנה נעשה אוטומטית.
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
                    {pricing.sizes.map(({ size, tiers }) => (
                        <section key={size} className={sectionClass}>
                            <h2 className="text-lg font-bold text-gray-800">
                                {formatPhotoSizeOptionLabel(getPhotoSizeCatalogEntry(size))}
                            </h2>
                            <p className="text-sm text-gray-500">
                                השורה הראשונה היא המחיר הרגיל (מתמונה אחת). כל שורה נוספת: מכמה תמונות מהגודל הזה, ומה המחיר לתמונה.
                            </p>
                            <TierRows
                                rows={tiers}
                                valueKey="price"
                                valueLabel="מחיר לתמונה (₪)"
                                valueStep="0.01"
                                lockFirstRow
                                onChange={(next) => updateSizeTiers(size, next)}
                            />
                        </section>
                    ))}

                    <section className={sectionClass}>
                        <h2 className="text-lg font-bold text-gray-800">כך הלקוחות יראו את המחירים</h2>
                        <PhotoPricingTableContent pricing={previewPricing} />
                    </section>

                    <section className={sectionClass}>
                        <h2 className="text-lg font-bold text-gray-800">הנחה על אלבום</h2>
                        <p className="text-sm text-gray-500">מכמה תמונות (סך כל ההדפסות בהזמנה) הלקוח מקבל הצעה להנחה על אלבום, ובכמה אחוזים.</p>
                        <TierRows
                            rows={pricing.albumDiscountTiers}
                            valueKey="percent"
                            valueLabel="הנחה (%)"
                            valueStep="1"
                            onChange={(next) => setPricing((prev) => ({ ...prev, albumDiscountTiers: next }))}
                        />
                    </section>

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
