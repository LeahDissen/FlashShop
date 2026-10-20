/** A members-only sale on the product: percent off, or the final price after the discount */
export default function MemberDiscountField({ type, value, onChange }) {
    return (
        <div className="mt-3 space-y-2">
            <label htmlFor="member-discount-type" className="block text-sm font-medium text-gray-700">מבצע לחברות מועדון</label>
            <select
                id="member-discount-type"
                value={type}
                onChange={(e) => onChange({ memberDiscountType: e.target.value })}
                className="w-full p-2 border rounded-lg"
            >
                <option value="">אין מבצע</option>
                <option value="percent">אחוז הנחה</option>
                <option value="price">מחיר סופי אחרי ההנחה</option>
            </select>
            {type && (
                <input
                    type="number"
                    min="0"
                    max={type === 'percent' ? 100 : undefined}
                    step="0.01"
                    value={value}
                    onChange={(e) => onChange({ memberDiscountValue: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    placeholder={type === 'percent' ? 'למשל 20 (אחוז)' : 'למשל 39.90 (ש"ח)'}
                    aria-label="ערך ההנחה"
                />
            )}
            <p className="text-xs text-gray-500">
                המחיר הרגיל מוצג לכולם עם תג &quot;מוצר במבצע&quot;. ההנחה ניתנת בתשלום לחברות מועדון בלבד.
            </p>
        </div>
    );
}
