import { FaPlus, FaTrash } from 'react-icons/fa';
import { CAPTION_CATEGORIES } from '../../constants/captionCategories';
import { DEFAULT_CAPTION_CATEGORY } from './productForm';

/** Caption ideas for a designed product, shown to customers on its "רעיונות לכיתובים" page */
export default function CaptionIdeasEditor({ captions, newCaption, onNewCaptionChange, onAdd, onRemove }) {
    return (
        <div className="rounded-lg border border-dashed border-[#f2665e]/40 bg-[#fff5f4] p-3 space-y-3">
            <div>
                <p className="text-sm font-bold text-gray-800">משפטים מתאימים לכיתוב</p>
                <p className="text-xs text-gray-500 mt-0.5">
                    לקוחות יראו את המשפטים בעמוד &quot;רעיונות לכיתובים&quot; למוצר זה
                </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">טקסט לכיתוב</label>
                    <input
                        type="text"
                        value={newCaption.text}
                        onChange={(e) => onNewCaptionChange({ text: e.target.value })}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                onAdd();
                            }
                        }}
                        placeholder='למשל: "תמיד ביחד"'
                        className="w-full p-2 border rounded-lg text-sm bg-white"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">קטגוריה</label>
                    <select
                        value={newCaption.category}
                        onChange={(e) => onNewCaptionChange({ category: e.target.value })}
                        className="w-full p-2 border rounded-lg text-sm bg-white"
                    >
                        {CAPTION_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>
            <button
                type="button"
                onClick={onAdd}
                disabled={!newCaption.text.trim()}
                className="w-full py-1.5 rounded-lg text-sm font-bold text-[#f2665e] border border-[#f2665e]/30 hover:bg-[#f2665e]/10 transition disabled:opacity-40"
            >
                <FaPlus className="inline text-xs ml-1" />
                הוסף משפט
            </button>
            {captions.length > 0 && (
                <ul className="space-y-2 max-h-40 overflow-y-auto">
                    {captions.map((caption) => (
                        <li
                            key={caption._id}
                            className="flex items-start justify-between gap-2 p-2 rounded-lg bg-white border border-gray-100 text-sm"
                        >
                            <div className="min-w-0 text-right">
                                <span className="text-xs font-bold text-[#f2665e] bg-[#f2665e]/10 px-2 py-0.5 rounded-full">
                                    {caption.category || DEFAULT_CAPTION_CATEGORY}
                                </span>
                                <p className="mt-1 text-gray-800 truncate">&quot;{caption.text}&quot;</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => onRemove(caption._id)}
                                className="shrink-0 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="מחק משפט"
                            >
                                <FaTrash className="text-xs" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
