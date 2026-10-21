import { forwardRef, useRef, useState } from 'react';
import { FileText, Image as ImageIcon, Loader2, Mail, Phone, Trash2, Upload, User } from 'lucide-react';
import { optimizeImageUrl } from '../../utils/imageUrl';
import { uploadImageToCloudinary } from '../../utils/cloudinaryUpload';
import { DESIGNER_SERVICE_FEE, MAX_DESIGNER_IMAGES, validateDesignerContact } from './productCartItem';

const inputClass = 'w-full border border-gray-200 rounded-xl p-3 pl-10 pr-4 focus:ring-2 focus:ring-[#f2665e]/20 focus:border-[#f2665e] outline-none transition-all text-sm';

/** A text field with an icon on its left */
function IconField({ label, icon: Icon, children }) {
    return (
        <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">{label}</label>
            <div className="relative">
                {children}
                <Icon className="absolute left-3 top-3.5 text-gray-400" size={18} />
            </div>
        </div>
    );
}

/**
 * "עיצוב מותאם": the customer's contact details, what to design and up to 6 photos for the shop's
 * designer. The request is kept by the page (`request`, `setRequest`), so closing and reopening the form
 * keeps what was typed. `onSubmit(request)` runs once the phone and email are valid.
 */
const DesignerRequestForm = forwardRef(function DesignerRequestForm({ request, setRequest, onSubmit }, ref) {
    const fileRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const patch = (fields) => setRequest((prev) => ({ ...prev, ...fields }));

    // Several photos at once, up to the limit; a file that fails does not stop the others
    const uploadFiles = async (e) => {
        const room = MAX_DESIGNER_IMAGES - request.referenceImages.length;
        const files = Array.from(e.target.files || []).slice(0, Math.max(0, room));
        e.target.value = '';
        if (!files.length) return;
        setIsUploading(true);
        try {
            const results = await Promise.allSettled(files.map((file) => uploadImageToCloudinary(file)));
            const urls = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
            setRequest((prev) => ({ ...prev, referenceImages: [...prev.referenceImages, ...urls].slice(0, MAX_DESIGNER_IMAGES) }));
            const failed = results.length - urls.length;
            if (failed) alert(`${failed} מהקבצים לא הועלו. אפשר לנסות שוב.`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const error = validateDesignerContact(request);
        if (error) {
            alert(error);
            return;
        }
        onSubmit(request);
    };

    return (
        <div ref={ref} className="animate-fade-in bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6 scroll-mt-24">
            <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">עיצוב מותאם אישית על ידי גרפיקאית</h3>
                <p className="text-sm text-gray-500">הסבירו לנו מה אתם רוצים שיופיע, צרפו קובץ במידת הצורך, ואנו נשלח לכם סקיצה לאישור במייל!</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <IconField label="שם מלא:" icon={User}>
                        <input required type="text" value={request.name} onChange={(e) => patch({ name: e.target.value })} className={inputClass} />
                    </IconField>
                    <IconField label="כתובת מייל:" icon={Mail}>
                        <input required type="email" value={request.email} onChange={(e) => patch({ email: e.target.value })} className={`${inputClass} text-left ltr`} />
                    </IconField>
                    <IconField label="טלפון ליצירת קשר:" icon={Phone}>
                        <input required type="tel" value={request.phone} onChange={(e) => patch({ phone: e.target.value })} className={`${inputClass} text-left ltr`} />
                    </IconField>
                </div>

                <IconField label="תיאור העיצוב המבוקש:" icon={FileText}>
                    <textarea
                        required
                        rows="4"
                        value={request.description}
                        onChange={(e) => patch({ description: e.target.value })}
                        className={`${inputClass} resize-none`}
                        placeholder="לדוגמה: אני רוצה רקע ורוד, בצד אחד להוסיף את התמונה שצירפתי ובצד השני לכתוב באותיות יפות לבנות 'אמא היקרה שלנו'..."
                    />
                </IconField>

                <div className="bg-gray-50 rounded-xl p-4 border border-dashed border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-right">
                        <div className="p-2.5 bg-white rounded-lg border shadow-sm text-gray-500">
                            <ImageIcon size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-800">רוצים לצרף תמונה או לוגו כבסיס?</p>
                            <p className="text-xs text-gray-400">הגרפיקאית תשתמש בקובץ זה כדי לבנות את העיצוב שלכם (עד ~10MB, מומלץ תמונות מהטלפון)</p>
                        </div>
                    </div>
                    <div>
                        <button
                            type="button"
                            onClick={() => fileRef.current.click()}
                            disabled={isUploading || request.referenceImages.length >= MAX_DESIGNER_IMAGES}
                            className="px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                        >
                            {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                            העלאת תמונות (עד {MAX_DESIGNER_IMAGES} קבצים)
                        </button>
                        <input type="file" ref={fileRef} onChange={uploadFiles} className="hidden" accept="image/*" multiple />
                    </div>
                </div>

                {request.referenceImages.length > 0 && (
                    <div className="bg-green-50 text-green-800 p-3 rounded-xl border border-green-100 text-xs max-w-md space-y-2">
                        <p className="font-medium">
                            {request.referenceImages.length} מתוך {MAX_DESIGNER_IMAGES} תמונות מצורפות לבקשה
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {request.referenceImages.map((url, index) => (
                                <div key={url} className="relative">
                                    <img src={optimizeImageUrl(url, { width: 96, height: 96 })} alt={`תמונה ${index + 1}`} className="w-12 h-12 object-cover rounded border bg-white shadow-sm" />
                                    <button
                                        type="button"
                                        onClick={() => patch({ referenceImages: request.referenceImages.filter((src) => src !== url) })}
                                        className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-white shadow text-gray-500 hover:text-red-500 flex items-center justify-center cursor-pointer"
                                        aria-label={`מחיקת תמונה ${index + 1}`}
                                    >
                                        <Trash2 size={11} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="text-left pt-2">
                    <button type="submit" className="bg-[#f2665e] hover:bg-[#d95248] text-white font-bold py-2 px-8 rounded-full shadow-sm transition-all text-sm cursor-pointer">
                        אישור ותוספת לסל (+{DESIGNER_SERVICE_FEE} ₪)
                    </button>
                </div>
            </form>
        </div>
    );
});

export default DesignerRequestForm;
