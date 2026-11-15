import { useRef, useState } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import SmartImageInput from '../../components/SmartImageInput';
import { SIZE_PRESETS, variantCombinations, variantLabel } from '../../utils/productVariants';

const MAX_COLORS = 20;
const MAX_SIZES = 30;

const stockKey = (color, size) => `${color}|${size}`;

/**
 * Colors, sizes and stock tracking of a product. With colors/sizes and tracking on, a stock count per
 * combination (e.g. "לבן · M"); the price is the same for all of them.
 * @param {{ value: { trackStock: boolean, colors: object[], sizes: string[], variantStock: object[] }, onChange: Function }} props
 */
export default function VariantsField({ value, onChange }) {
    const { trackStock, colors, sizes, variantStock } = value;
    const [sizeInput, setSizeInput] = useState('');
    // A stable key per color row, so removing a row doesn't hand its photo upload to the next one
    const rowIds = useRef([]);
    const nextId = useRef(0);
    while (rowIds.current.length < colors.length) rowIds.current.push(nextId.current++);
    rowIds.current.length = colors.length;
    const stockMap = new Map(variantStock.map((row) => [stockKey(row.color, row.size), row.stock]));
    const combinations = variantCombinations(colors.filter((c) => c.name.trim()), sizes);
    const hasOptions = colors.some((c) => c.name.trim()) || sizes.length > 0;

    const updateColor = (index, patch) => onChange({ colors: colors.map((c, i) => (i === index ? { ...c, ...patch } : c)) });
    const addSizes = (list) => {
        const next = [...sizes];
        list.map((s) => String(s).trim()).filter(Boolean).forEach((s) => { if (!next.includes(s)) next.push(s); });
        onChange({ sizes: next.slice(0, MAX_SIZES) });
    };
    const setStock = (color, size, stock) => {
        const rows = combinations.map((combo) => ({
            ...combo,
            stock: combo.color === color && combo.size === size ? stock : (stockMap.get(stockKey(combo.color, combo.size)) ?? 0),
        }));
        onChange({ variantStock: rows });
    };

    return (
        <div className="space-y-3 rounded-xl border border-gray-200 p-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input type="checkbox" checked={trackStock} onChange={(e) => onChange({ trackStock: e.target.checked })} />
                ניהול מלאי אוטומטי
            </label>
            <p className="text-xs text-gray-500 -mt-2">
                {trackStock
                    ? (hasOptions
                        ? 'המלאי יורד לבד בכל הזמנה ששולמה. מלאי לכל צבע ומידה מוזן בטבלה למטה.'
                        : 'המלאי יורד לבד בכל הזמנה ששולמה, לפי שדה "מלאי" למעלה. כשמגיע ל-0 המוצר מסומן "אזל".')
                    : 'כבוי: המוצר תמיד זמין להזמנה, והמלאי לא מתעדכן.'}
            </p>

            <div>
                <p className="text-sm font-medium text-gray-700">צבעים (לא חובה)</p>
                <p className="text-xs text-gray-500 mb-1.5">הלקוחה בוחרת צבע. המחיר זהה לכל הצבעים. תמונה: המוצר בצבע הזה (לא חובה).</p>
                <div className="space-y-2">
                    {colors.map((color, index) => (
                        <div key={rowIds.current[index]} className="rounded-lg border border-gray-100 p-2 space-y-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={color.hex || '#FFFFFF'}
                                    onChange={(e) => updateColor(index, { hex: e.target.value })}
                                    className="h-9 w-10 shrink-0 cursor-pointer rounded border"
                                    aria-label="גוון הצבע"
                                />
                                <input
                                    value={color.name}
                                    onChange={(e) => updateColor(index, { name: e.target.value })}
                                    placeholder="שם הצבע, לדוגמה: לבן"
                                    className="flex-1 min-w-0 p-2 border rounded-lg"
                                />
                                <button
                                    type="button"
                                    onClick={() => { rowIds.current.splice(index, 1); onChange({ colors: colors.filter((_, i) => i !== index) }); }}
                                    className="shrink-0 p-2.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
                                    aria-label="מחיקת צבע"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                            <SmartImageInput
                                value={color.image || ''}
                                onChange={(url) => updateColor(index, { image: url })}
                                placeholder="תמונה בצבע הזה (לא חובה)"
                                className="w-full p-2 border rounded-lg"
                                previewClassName="h-16 w-16 rounded-lg border border-gray-200 object-contain bg-gray-50 shrink-0"
                            />
                        </div>
                    ))}
                </div>
                {colors.length < MAX_COLORS && (
                    <button
                        type="button"
                        onClick={() => onChange({ colors: [...colors, { name: '', hex: '#FFFFFF', image: '' }] })}
                        className="mt-2 text-sm font-bold text-[#f2665e] hover:text-[#d95248] flex items-center gap-1.5"
                    >
                        <FaPlus className="text-xs" /> הוספת צבע
                    </button>
                )}
            </div>

            <div>
                <p className="text-sm font-medium text-gray-700">מידות (לא חובה)</p>
                <div className="flex flex-wrap gap-1.5 my-1.5">
                    {sizes.map((size) => (
                        <span key={size} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium">
                            {size}
                            <button
                                type="button"
                                onClick={() => onChange({ sizes: sizes.filter((s) => s !== size) })}
                                className="text-gray-400 hover:text-red-500"
                                aria-label={`הסרת מידה ${size}`}
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        value={sizeInput}
                        onChange={(e) => setSizeInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key !== 'Enter') return;
                            e.preventDefault();
                            addSizes(sizeInput.split(','));
                            setSizeInput('');
                        }}
                        placeholder="מידה (אפשר כמה, מופרדות בפסיק)"
                        className="flex-1 min-w-0 p-2 border rounded-lg text-sm"
                    />
                    <button
                        type="button"
                        onClick={() => { addSizes(sizeInput.split(',')); setSizeInput(''); }}
                        className="shrink-0 px-3 rounded-lg border border-[#f2665e]/40 text-[#f2665e] text-sm font-bold"
                    >
                        הוספה
                    </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 text-xs">
                    <button type="button" onClick={() => addSizes(SIZE_PRESETS.adults)} className="rounded-lg border px-2 py-1 hover:bg-gray-50">
                        + מידות מבוגרים ({SIZE_PRESETS.adults.join(', ')})
                    </button>
                    <button type="button" onClick={() => addSizes(SIZE_PRESETS.kids)} className="rounded-lg border px-2 py-1 hover:bg-gray-50">
                        + מידות ילדים ({SIZE_PRESETS.kids.join(', ')})
                    </button>
                </div>
            </div>

            {trackStock && hasOptions && (
                <div>
                    <p className="text-sm font-medium text-gray-700 mb-1.5">מלאי לכל צבע ומידה</p>
                    <div className="grid grid-cols-2 gap-2">
                        {combinations.map(({ color, size }) => (
                            <label key={stockKey(color, size)} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-2 py-1.5 text-xs">
                                <span className="truncate">{variantLabel({ color, size })}</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={stockMap.get(stockKey(color, size)) ?? 0}
                                    onChange={(e) => setStock(color, size, Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                                    className="w-16 p-1 border rounded text-center bg-white"
                                />
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
