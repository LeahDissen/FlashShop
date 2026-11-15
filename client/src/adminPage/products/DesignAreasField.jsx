import { FaPlus, FaTrash } from 'react-icons/fa';

const MAX_DESIGN_AREAS = 4;

/**
 * More areas the customer may design besides the main print area (e.g. a shirt's back or sleeve),
 * each with its own size. Designing them is optional for the customer and does not change the price.
 */
export default function DesignAreasField({ value = [], onChange }) {
    const update = (index, patch) => onChange(value.map((area, i) => (i === index ? { ...area, ...patch } : area)));

    return (
        <div>
            <p className="block text-sm font-medium text-gray-700">שטחי עיצוב נוספים (לא חובה)</p>
            <p className="text-xs text-gray-500 mb-1.5">
                למשל &quot;גב&quot; או &quot;שרוול&quot;. משטח ההדפסה שלמעלה הוא העיצוב הראשי. הלקוחה יכולה לעצב גם את השטחים האלה, והמחיר לא משתנה.
            </p>
            <div className="space-y-2">
                {value.map((area, index) => (
                    // Index keys: plain controlled inputs, nothing per-row survives a removal
                    <div key={index} className="flex items-end gap-2">
                        <label className="flex-1 min-w-0 text-xs text-gray-600">
                            שם השטח
                            <input
                                value={area.name}
                                onChange={(e) => update(index, { name: e.target.value })}
                                placeholder="גב"
                                className="w-full p-2 border rounded-lg text-sm"
                            />
                        </label>
                        <label className="w-20 text-xs text-gray-600">
                            רוחב (ס&quot;מ)
                            <input
                                type="number"
                                min="1"
                                value={area.printWidth}
                                onChange={(e) => update(index, { printWidth: e.target.value })}
                                className="w-full p-2 border rounded-lg text-sm"
                            />
                        </label>
                        <label className="w-20 text-xs text-gray-600">
                            גובה (ס&quot;מ)
                            <input
                                type="number"
                                min="1"
                                value={area.printHeight}
                                onChange={(e) => update(index, { printHeight: e.target.value })}
                                className="w-full p-2 border rounded-lg text-sm"
                            />
                        </label>
                        <button
                            type="button"
                            onClick={() => onChange(value.filter((_, i) => i !== index))}
                            className="shrink-0 p-2.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
                            aria-label="מחיקת שטח"
                        >
                            <FaTrash />
                        </button>
                    </div>
                ))}
            </div>
            {value.length < MAX_DESIGN_AREAS && (
                <button
                    type="button"
                    onClick={() => onChange([...value, { name: '', printWidth: 20, printHeight: 30 }])}
                    className="mt-2 text-sm font-bold text-[#f2665e] hover:text-[#d95248] flex items-center gap-1.5"
                >
                    <FaPlus className="text-xs" /> הוספת שטח עיצוב
                </button>
            )}
        </div>
    );
}
