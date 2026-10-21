import { FaPlus, FaTrash } from 'react-icons/fa';

/** Quantity discounts: a price per unit for each quantity range (the last range may be open, "50+") */
export default function PriceTiersEditor({ enabled, tiers, onToggle, onChangeTier, onAddTier, onRemoveTier }) {
    return (
        <div className="rounded-lg border border-dashed border-[#f2665e]/40 bg-[#fff5f4] p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <p className="text-sm font-bold text-gray-800">מדרגות מחיר לפי כמות</p>
                    <p className="text-xs text-gray-500 mt-0.5">הנחות כמות — אופציונלי</p>
                </div>
                {!enabled && (
                    <button
                        type="button"
                        onClick={onToggle}
                        className="text-sm font-bold text-[#f2665e] hover:text-[#d95248] flex items-center gap-1.5 shrink-0"
                    >
                        <FaPlus className="text-xs" />
                        הוסף מדרגות מחיר
                    </button>
                )}
            </div>

            {enabled && (
                <div className="space-y-2">
                    <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs font-medium text-gray-600 px-1">
                        <span>מינימום</span>
                        <span>מקסימום</span>
                        <span>מחיר ליחידה (₪)</span>
                        <span className="w-8" />
                    </div>
                    <p className="text-[11px] text-gray-500 px-1">
                        במדרגה האחרונה ניתן להשאיר מקסימום ריק — יוצג ללקוח כ&quot;50+&quot; / &quot;50 ומעלה&quot;
                    </p>
                    {tiers.map((tier, index) => {
                        const isLastTier = index === tiers.length - 1;
                        return (
                            <div key={tier.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                                <input
                                    type="number"
                                    min="1"
                                    value={tier.minQuantity}
                                    onChange={(e) => onChangeTier(tier.id, 'minQuantity', e.target.value)}
                                    placeholder="מ-"
                                    className="w-full p-2 border rounded-lg text-sm bg-white"
                                    required
                                />
                                <input
                                    type="number"
                                    min="1"
                                    value={tier.maxQuantity}
                                    onChange={(e) => onChangeTier(tier.id, 'maxQuantity', e.target.value)}
                                    placeholder={isLastTier ? 'ומעלה' : 'עד'}
                                    title={isLastTier ? 'השאירו ריק למדרגה פתוחה (למשל 50 ומעלה)' : undefined}
                                    className="w-full p-2 border rounded-lg text-sm bg-white"
                                    required={!isLastTier}
                                />
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={tier.unitPrice}
                                    onChange={(e) => onChangeTier(tier.id, 'unitPrice', e.target.value)}
                                    placeholder="₪"
                                    className="w-full p-2 border rounded-lg text-sm bg-white"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => onRemoveTier(tier.id)}
                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                    title="מחק מדרגה"
                                >
                                    <FaTrash className="text-xs" />
                                </button>
                            </div>
                        );
                    })}
                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onAddTier}
                            className="text-sm font-bold text-[#f2665e] hover:text-[#d95248] flex items-center gap-1.5"
                        >
                            <FaPlus className="text-xs" />
                            הוסף מדרגה
                        </button>
                        <button
                            type="button"
                            onClick={onToggle}
                            className="text-sm font-bold text-gray-500 hover:text-gray-700"
                        >
                            בטל מדרגות
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
