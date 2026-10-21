import { FaTrash } from 'react-icons/fa';

/** Confirms deleting the selected orders */
export default function DeleteOrdersModal({ count, deleting, onConfirm, onClose }) {
    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => !deleting && onClose()}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-lg font-bold text-gray-800 mb-2">אישור מחיקה</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                    האם אתה בטוח שברצונך למחוק {count} הזמנות שנבחרו? פעולה זו אינה הפיכה
                </p>
                <div className="mt-6 flex gap-3 justify-end">
                    <button
                        type="button"
                        disabled={deleting}
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                        ביטול
                    </button>
                    <button
                        type="button"
                        disabled={deleting}
                        onClick={onConfirm}
                        className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        <FaTrash size={12} />
                        {deleting ? "מוחק..." : "מחק הזמנות"}
                    </button>
                </div>
            </div>
        </div>
    );
}
