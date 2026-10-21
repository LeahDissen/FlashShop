import { useRef, useState } from 'react';
import { Palette, Trash2 } from 'lucide-react';
import { uploadImageToCloudinary } from '../../utils/cloudinaryUpload';
import { checkPrintFit, loadImageSize } from './printFit';

const formatCm = (value) => (Number.isInteger(value) ? value : Number(value).toFixed(1));

/**
 * A magnet: design it in the editor, or upload a photo and add it to the cart. A photo in other
 * proportions than the magnet (either orientation) cannot go to the cart as is: it can be adjusted
 * in the editor (`onDesign(image)`), or replaced. `printProduct` carries the magnet's print size.
 */
export default function MagnetOptions({ selfDesignLabel, uploadLabel, printProduct, onDesign, onAddToCart }) {
    const fileRef = useRef(null);
    const [image, setImage] = useState(null);
    const [fit, setFit] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const mismatch = Boolean(image && fit && !fit.fits);

    const uploadFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';
        setIsUploading(true);
        try {
            const imageUrl = await uploadImageToCloudinary(file);
            const size = await loadImageSize(imageUrl);
            setFit(checkPrintFit(size?.width, size?.height, { ...printProduct, allowOrientationToggle: true }));
            setImage(imageUrl);
        } catch (error) {
            alert(error?.message || 'הייתה שגיאה בהעלאת התמונה.');
        } finally {
            setIsUploading(false);
        }
    };

    const removeImage = () => {
        setImage(null);
        setFit(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    return (
        <div className="space-y-4 w-full">
            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    onClick={() => onDesign()}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-[#f2665e] border border-[#f2665e]/30 bg-[#fff5f4] rounded-xl hover:bg-[#f2665e]/10 transition-colors cursor-pointer"
                >
                    <Palette size={16} />
                    {selfDesignLabel}
                </button>
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={isUploading}
                    className="px-4 py-2 text-xs font-medium text-[#f2665e] border border-[#f2665e]/30 bg-[#fff5f4] rounded-xl hover:bg-[#f2665e]/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                    {isUploading ? 'מעלה...' : image ? 'החלפת תמונה' : uploadLabel}
                </button>
                <input type="file" ref={fileRef} onChange={uploadFile} className="hidden" accept="image/*" />
                {!mismatch && (
                    <button
                        onClick={() => onAddToCart(image)}
                        className="px-5 py-2 bg-[#f2665e] hover:bg-[#d95248] text-white rounded-xl text-sm font-semibold border-2 border-[#f2665e] transition-colors cursor-pointer"
                    >
                        הוסף לסל
                    </button>
                )}
            </div>
            {mismatch && (
                <div className="max-w-sm bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3 text-right" role="alert">
                    <p className="font-bold text-amber-900">התמונה אינה מתאימה לגודל ההדפסה</p>
                    <button
                        type="button"
                        onClick={() => onDesign(image)}
                        className="w-full bg-[#f2665e] hover:bg-[#d95248] text-white font-bold py-2 px-4 rounded-full text-sm cursor-pointer"
                    >
                        באפשרותכם לעצב בעיצוב העצמי ולכוונן את התמונה
                    </button>
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="w-full bg-white border border-[#f2665e]/40 text-[#f2665e] font-bold py-2 px-4 rounded-full text-sm hover:bg-[#fff5f4] cursor-pointer"
                    >
                        או העלו תמונה בגודל {formatCm(fit.widthCm)} על {formatCm(fit.heightCm)} ס&quot;מ
                    </button>
                </div>
            )}
            {image && (
                <div className="relative inline-block">
                    <img src={image} alt="תצוגת מגנט" className="max-w-[160px] rounded-lg border-2 border-[#f2665e]/20" />
                    <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-1.5 -left-1.5 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-colors cursor-pointer"
                        title="מחק תמונה"
                        aria-label="מחק תמונה"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )}
        </div>
    );
}
