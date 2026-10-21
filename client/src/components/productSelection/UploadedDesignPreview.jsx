import { Trash2 } from 'lucide-react';

const formatCm = (value) => (Number.isInteger(value) ? value : Number(value).toFixed(1));

/**
 * A ready design the customer uploaded for printing as is: remove it, or add it to the cart.
 * When its proportions do not match the print area (`fit.fits` false), it cannot go to the cart as is:
 * the customer can adjust it in the editor, or upload an image in the print size.
 */
export default function UploadedDesignPreview({ imageUrl, fit, onRemove, onAddToCart, onDesign, onReplace }) {
    const mismatch = fit && !fit.fits;
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
                {mismatch ? (
                    <div className="w-full max-w-sm bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3" role="alert">
                        <p className="font-bold text-amber-900">התמונה אינה מתאימה לגודל ההדפסה</p>
                        <button
                            type="button"
                            onClick={onDesign}
                            className="w-full bg-[#f2665e] hover:bg-[#d95248] text-white font-bold py-2 px-4 rounded-full text-sm cursor-pointer"
                        >
                            באפשרותכם לעצב בעיצוב העצמי ולכוונן את התמונה
                        </button>
                        <button
                            type="button"
                            onClick={onReplace}
                            className="w-full bg-white border border-[#f2665e]/40 text-[#f2665e] font-bold py-2 px-4 rounded-full text-sm hover:bg-[#fff5f4] cursor-pointer"
                        >
                            או העלו תמונה בגודל {formatCm(fit.widthCm)} על {formatCm(fit.heightCm)} ס&quot;מ
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={onAddToCart}
                        className="w-full max-w-xs bg-[#f2665e] hover:bg-[#d95248] text-white font-bold py-2 px-6 rounded-full shadow-sm transition-all text-sm cursor-pointer"
                    >
                        הוסף לסל
                    </button>
                )}
            </div>
        </div>
    );
}
