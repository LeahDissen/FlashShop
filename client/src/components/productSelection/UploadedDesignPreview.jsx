import { Trash2 } from 'lucide-react';

/** A ready design the customer uploaded for printing as is: remove it, or add it to the cart */
export default function UploadedDesignPreview({ imageUrl, onRemove, onAddToCart }) {
    return (
        <div className="animate-fade-in bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-4">הקובץ שהעלית להדפסה ישירה:</h3>
            <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                    <img src={imageUrl} alt="Uploaded preview" className="max-w-xs w-full h-48 object-contain rounded-lg bg-gray-50 border p-2" />
                    <button
                        type="button"
                        onClick={onRemove}
                        className="absolute -top-2 -left-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-md transition-all cursor-pointer"
                        title="מחק תמונה והתחרט"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
                <button
                    type="button"
                    onClick={onAddToCart}
                    className="w-full max-w-xs bg-[#f2665e] hover:bg-[#d95248] text-white font-bold py-2 px-6 rounded-full shadow-sm transition-all text-sm cursor-pointer"
                >
                    הוסף לסל
                </button>
            </div>
        </div>
    );
}
