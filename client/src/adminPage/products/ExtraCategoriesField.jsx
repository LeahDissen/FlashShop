/** More categories the product also appears under (the main category above decides how it is designed and sold) */
export default function ExtraCategoriesField({ mainCategory, value = [], allCategories, onChange }) {
    const options = allCategories.filter((cat) => cat.value !== mainCategory);
    const toggle = (category) => onChange(
        value.includes(category) ? value.filter((c) => c !== category) : [...value, category],
    );

    return (
        <div>
            <p className="block text-sm font-medium text-gray-700">קטגוריות נוספות (לא חובה)</p>
            <p className="text-xs text-gray-500 mb-1.5">המוצר יופיע גם בקטגוריות האלה בחנות.</p>
            <div className="flex flex-wrap gap-2">
                {options.map((cat) => {
                    const checked = value.includes(cat.value);
                    return (
                        <label
                            key={cat.value}
                            className={`cursor-pointer select-none text-xs px-3 py-1.5 rounded-full border transition ${
                                checked ? 'bg-[#f2665e] text-white border-[#f2665e]' : 'bg-white text-gray-700 border-gray-200 hover:border-[#f2665e]'
                            }`}
                        >
                            <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggle(cat.value)} />
                            {cat.label}
                        </label>
                    );
                })}
            </div>
        </div>
    );
}
