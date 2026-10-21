import { FaPlus, FaTrash } from 'react-icons/fa';
import { DISPLAY_TYPE_LABELS } from '../../constants/productCategories';

/** The product's category: choose, remove from the list, or add a new one with its kind */
export default function CategoryField({ value, onChange, categoryMeta, categories }) {
    const {
        allCategories,
        savingCategory,
        showAddCategory,
        setShowAddCategory,
        closeAddCategory,
        newCategoryName,
        setNewCategoryName,
        newCategoryDisplayType,
        setNewCategoryDisplayType,
        addCategory,
        removeCategory,
    } = categories;

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700">קטגוריה *</label>
            <div className="flex gap-2 mt-1">
                <select
                    name="category"
                    value={value}
                    onChange={onChange}
                    className="flex-1 min-w-0 p-2 border rounded-lg bg-white"
                    required
                >
                    <option value="">— בחר קטגוריה —</option>
                    {allCategories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                            {cat.label}
                        </option>
                    ))}
                </select>
                <button
                    type="button"
                    onClick={() => removeCategory(value)}
                    disabled={!value || savingCategory}
                    className="shrink-0 p-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    title="הסר קטגוריה מהרשימה"
                >
                    <FaTrash />
                </button>
            </div>
            {categoryMeta && (
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{categoryMeta.hint}</p>
            )}

            {showAddCategory ? (
                <div className="mt-3 p-3 rounded-lg border border-dashed border-[#f2665e]/50 bg-[#fff9f8] space-y-2">
                    <p className="text-sm font-bold text-gray-800">קטגוריה חדשה</p>
                    <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="שם הקטגוריה"
                        className="w-full p-2 border rounded-lg text-sm bg-white"
                    />
                    <select
                        value={newCategoryDisplayType}
                        onChange={(e) => setNewCategoryDisplayType(e.target.value)}
                        className="w-full p-2 border rounded-lg bg-white text-sm"
                    >
                        {Object.entries(DISPLAY_TYPE_LABELS).map(([type, label]) => (
                            <option key={type} value={type}>{label}</option>
                        ))}
                    </select>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={addCategory}
                            disabled={savingCategory}
                            className="flex-1 py-1.5 rounded-lg text-sm font-bold text-white bg-[#f2665e] hover:bg-[#d95248] disabled:opacity-50"
                        >
                            שמור קטגוריה
                        </button>
                        <button
                            type="button"
                            onClick={closeAddCategory}
                            className="px-3 py-1.5 rounded-lg text-sm font-bold bg-gray-200 text-gray-700 hover:bg-gray-300"
                        >
                            ביטול
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setShowAddCategory(true)}
                    className="mt-2 text-sm font-bold text-[#f2665e] hover:text-[#d95248] flex items-center gap-1.5"
                >
                    <FaPlus className="text-xs" />
                    הוסף קטגוריה חדשה
                </button>
            )}
        </div>
    );
}
