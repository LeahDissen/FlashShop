import { useRef, useState } from 'react';
import { Palette, Trash2 } from 'lucide-react';
import { uploadImageToCloudinary } from '../../utils/cloudinaryUpload';

/** A magnet: design it in the editor, or upload a photo and add it to the cart */
export default function MagnetOptions({ selfDesignLabel, uploadLabel, onDesign, onAddToCart }) {
    const fileRef = useRef(null);
    const [image, setImage] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const uploadFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';
        setIsUploading(true);
        try {
            setImage(await uploadImageToCloudinary(file));
        } catch (error) {
            alert(error?.message || 'הייתה שגיאה בהעלאת התמונה.');
        } finally {
            setIsUploading(false);
        }
    };

    const removeImage = () => {
        setImage(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    return (
        <div className="space-y-4 w-full">
            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    onClick={onDesign}
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
                <button
                    onClick={() => onAddToCart(image)}
                    className="px-5 py-2 bg-[#f2665e] hover:bg-[#d95248] text-white rounded-xl text-sm font-semibold border-2 border-[#f2665e] transition-colors cursor-pointer"
                >
                    הוסף לסל
                </button>
            </div>
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
