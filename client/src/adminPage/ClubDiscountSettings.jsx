import { useEffect, useState } from "react";
import { FaEdit, FaGift } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { getShopSettings, updateShopSettings } from "../api/shopSettings";
import { useProducts } from "../hooks/useProducts";
import useAppStore from "../store/appStore";

const EMPTY_GIFT = { enabled: false, productId: "", discountType: "percent", value: 100, emailSubject: "", emailBody: "" };

/**
 * Club settings in the admin: the join gift (product, discount, on/off, its email)
 * and the text shown at checkout to customers who are not club members yet.
 * Product discounts for members are set per product, in products management.
 */
export default function ClubDiscountSettings() {
    const { products } = useProducts();
    const [gift, setGift] = useState(EMPTY_GIFT);
    const [notMemberText, setNotMemberText] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const setClubOpen = useAppStore((state) => state.setClubOpen);

    /** Opens the club popup in edit mode, right here (the same as "עריכת דפים" > "עריכת פופ-אפ מועדון") */
    const editClubPopup = () => {
        setClubOpen(true);
        navigate(location.pathname, { state: { autoEdit: true, targetEndpoint: "club" }, replace: true });
    };

    useEffect(() => {
        getShopSettings()
            .then((data) => {
                setGift({ ...EMPTY_GIFT, ...(data.clubGift || {}) });
                setNotMemberText(data.notMemberText || "");
            })
            .catch(() => setMessage({ ok: false, text: "שגיאה בטעינת הגדרות המועדון" }))
            .finally(() => setLoading(false));
    }, []);

    const patchGift = (fields) => setGift((prev) => ({ ...prev, ...fields }));

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            const saved = await updateShopSettings({ clubGift: { ...gift, value: Number(gift.value) }, notMemberText });
            setGift({ ...EMPTY_GIFT, ...saved.clubGift });
            setNotMemberText(saved.notMemberText || "");
            setMessage({ ok: true, text: "הגדרות המועדון נשמרו." });
        } catch (err) {
            setMessage({ ok: false, text: err.response?.data?.msg || "השמירה נכשלה" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return null;

    return (
        <form onSubmit={save} className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5 mt-6" dir="rtl">
            <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FaGift className="text-[#f2665e]" />
                    מועדון לקוחות: מתנת הצטרפות והנחות
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    כל ההנחות באתר הן לחברות מועדון. האתר מזהה חברה לפי המייל של החשבון שאיתו היא מתחברת לתשלום.
                    הנחה על מוצר מגדירים בעריכת המוצר, בניהול המוצרים.
                </p>
            </div>

            <div className="rounded-xl bg-[#fff5f4] border border-[#f2665e]/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-sm text-gray-700">
                    <span className="font-semibold block">חלונית ההצטרפות ומייל ההצטרפות</span>
                    הטקסטים בחלונית, ההודעה שמופיעה אחרי ההצטרפות, ומייל ההצטרפות האוטומטי (עם קובץ PDF במתנה, בלי קוד).
                </p>
                <button
                    type="button"
                    onClick={editClubPopup}
                    className="shrink-0 inline-flex items-center gap-2 bg-[#f2665e] text-white text-sm font-bold px-4 py-2 rounded-full hover:bg-[#d95248]"
                >
                    <FaEdit /> עריכת החלונית והמייל
                </button>
            </div>

            <fieldset className="space-y-3 border border-gray-100 rounded-xl p-4">
                <legend className="px-1 font-semibold text-gray-800">מתנת הצטרפות</legend>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input type="checkbox" checked={gift.enabled} onChange={(e) => patchGift({ enabled: e.target.checked })} />
                    המתנה פעילה (מצטרפות חדשות מקבלות קוד מתנה במייל)
                </label>
                <div>
                    <label htmlFor="gift-product" className="block text-sm font-medium text-gray-700 mb-1">המוצר שעליו חלה המתנה</label>
                    <select
                        id="gift-product"
                        value={gift.productId}
                        onChange={(e) => patchGift({ productId: e.target.value })}
                        className="w-full p-2 border rounded-lg"
                    >
                        <option value="">בחרי מוצר</option>
                        {products.map((product) => (
                            <option key={product._id} value={product._id}>{product.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                    <div>
                        <label htmlFor="gift-type" className="block text-sm font-medium text-gray-700 mb-1">סוג ההנחה</label>
                        <select id="gift-type" value={gift.discountType} onChange={(e) => patchGift({ discountType: e.target.value })} className="p-2 border rounded-lg">
                            <option value="percent">אחוז הנחה</option>
                            <option value="price">מחיר אחרי ההנחה</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="gift-value" className="block text-sm font-medium text-gray-700 mb-1">
                            {gift.discountType === "percent" ? "אחוז (100 = מתנה)" : "מחיר בש\"ח"}
                        </label>
                        <input
                            id="gift-value"
                            type="number"
                            min="0"
                            max={gift.discountType === "percent" ? 100 : undefined}
                            step="0.01"
                            value={gift.value}
                            onChange={(e) => patchGift({ value: e.target.value })}
                            className="w-32 p-2 border rounded-lg"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="gift-subject" className="block text-sm font-medium text-gray-700 mb-1">נושא מייל המתנה</label>
                    <input id="gift-subject" type="text" value={gift.emailSubject} onChange={(e) => patchGift({ emailSubject: e.target.value })} placeholder="מתנת הצטרפות למועדון 🎁" className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                    <label htmlFor="gift-body" className="block text-sm font-medium text-gray-700 mb-1">נוסח מייל המתנה</label>
                    <textarea
                        id="gift-body"
                        rows={5}
                        value={gift.emailBody}
                        onChange={(e) => patchGift({ emailBody: e.target.value })}
                        placeholder={"היי {{name}},\nשמחים שהצטרפת! מחכה לך מתנה: {{product}}.\nקוד המתנה שלך: {{code}}"}
                        className="w-full p-2 border rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        אפשר להשתמש ב-<code dir="ltr">{"{{name}}"}</code> (שם), <code dir="ltr">{"{{product}}"}</code> (המוצר) ו-<code dir="ltr">{"{{code}}"}</code> (הקוד).
                        מייל ההצטרפות הרגיל נשלח בנוסף, ועורכים אותו בפופאפ המועדון.
                    </p>
                </div>
            </fieldset>

            <div>
                <label htmlFor="not-member-text" className="block text-sm font-medium text-gray-700 mb-1">ההודעה בתשלום ללקוחה שעדיין לא במועדון</label>
                <textarea
                    id="not-member-text"
                    rows={2}
                    value={notMemberText}
                    onChange={(e) => setNotMemberText(e.target.value)}
                    placeholder="את עדיין לא חברת מועדון. ההצטרפות בחינם, וחברות מועדון נהנות מהמבצעים באתר."
                    className="w-full p-2 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">מוצגת רק כשיש בסל שלה הנחה לחברות, יחד עם הסכום שתחסוך וכפתור הצטרפות.</p>
            </div>

            {message && <p className={`text-sm ${message.ok ? "text-green-700" : "text-red-600"}`}>{message.text}</p>}
            <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl bg-[#f2665e] text-white font-bold hover:bg-[#d95248] disabled:opacity-60">
                {saving ? "שומר..." : "שמירת הגדרות המועדון"}
            </button>
        </form>
    );
}
