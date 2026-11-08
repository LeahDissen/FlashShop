import { FaPlus, FaTrash } from 'react-icons/fa';
import SmartImageInput from '../../components/SmartImageInput';

const MAX_GALLERY_IMAGES = 12;

/** More photos of the product, shown on the product page next to the main image */
export default function GalleryField({ value = [], onChange }) {
    const update = (index, url) => onChange(value.map((item, i) => (i === index ? url : item)));
    const remove = (index) => onChange(value.filter((_, i) => i !== index));

    return (
        <div>
            <p className="block text-sm font-medium text-gray-700">תמונות נוספות למוצר (לא חובה)</p>
            <p className="text-xs text-gray-500 mb-1.5">מופיעות בעמוד המוצר, לצד התמונה הראשית.</p>
            <div className="space-y-2">
                {value.map((url, index) => (
                    <div key={index} className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                            <SmartImageInput
                                value={url}
                                onChange={(next) => update(index, next)}
                                placeholder="https://..."
                                className="w-full p-2 border rounded-lg"
                                previewClassName="h-20 w-20 rounded-lg border border-gray-200 object-contain bg-gray-50 shrink-0"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => remove(index)}
                            className="shrink-0 p-2.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
                            aria-label="מחיקת תמונה"
                        >
                            <FaTrash />
                        </button>
                    </div>
                ))}
            </div>
            {value.length < MAX_GALLERY_IMAGES && (
                <button
                    type="button"
                    onClick={() => onChange([...value, ''])}
                    className="mt-2 text-sm font-bold text-[#f2665e] hover:text-[#d95248] flex items-center gap-1.5"
                >
                    <FaPlus className="text-xs" /> הוספת תמונה
                </button>
            )}
        </div>
    );
}
