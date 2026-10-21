/**
 * All the copies' designs side by side before ordering. Clicking a copy goes back to edit it.
 */
export default function CopiesReviewModal({ previews, isSaving, onClose, onEditCopy, onConfirm }) {
    return (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4" dir="rtl" role="dialog" aria-modal="true" aria-label="כל העיצובים">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="px-5 py-4 border-b flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-800">כל העיצובים ({previews.length} עותקים)</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl" aria-label="סגירה">×</button>
                </div>
                <div className="p-5 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {previews.map((src, i) => (
                        <button key={i} type="button" onClick={() => onEditCopy(i)} className="text-right group">
                            <img src={src} alt={`עותק ${i + 1}`} className="w-full rounded-lg border bg-gray-50 group-hover:ring-2 ring-[#f2665e]" />
                            <span className="block text-xs text-gray-600 mt-1">עותק {i + 1} · לחיצה לעריכה</span>
                        </button>
                    ))}
                </div>
                <div className="px-5 py-4 border-t flex gap-3 justify-end">
                    <button type="button" onClick={onClose} className="px-5 py-2 rounded-full text-sm text-gray-700 hover:bg-gray-100">חזרה לעריכה</button>
                    <button type="button" onClick={onConfirm} disabled={isSaving} className="px-6 py-2 rounded-full bg-[#f2665e] text-white font-bold text-sm hover:bg-[#d95248] disabled:opacity-60">
                        {isSaving ? 'מכין את העיצובים...' : `אישור והוספת ${previews.length} עותקים לסל`}
                    </button>
                </div>
            </div>
        </div>
    );
}
