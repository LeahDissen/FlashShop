import { useState } from 'react';
import { Info } from 'lucide-react';
import { PhotoPricingTableContent } from './PhotoPricingTable';

/**
 * כפתור קטן + חלון קופץ עם מדרגות המחיר (פחות דרמטי מטבלה מלאה בעמוד)
 */
const PhotoPricingInfo = ({ totalPrints = 0, className = '' }) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={`inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#f2665e] transition-colors underline-offset-2 hover:underline ${className}`}
            >
                <Info className="w-3.5 h-3.5 shrink-0" aria-hidden />
                <span>מדרגות מחיר לפי כמות</span>
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]"
                    onClick={() => setOpen(false)}
                    role="presentation"
                >
                    <div
                        className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 text-right"
                        dir="rtl"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="pricing-modal-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <h3
                                id="pricing-modal-title"
                                className="text-base font-bold text-gray-800"
                            >
                                איך התמחור עובד?
                            </h3>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="text-gray-400 hover:text-gray-600 text-xl leading-none p-1"
                                aria-label="סגור"
                            >
                                ×
                            </button>
                        </div>

                        <PhotoPricingTableContent totalPrints={totalPrints} />

                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="mt-4 w-full py-2 text-sm font-bold text-white bg-[#f2665e] hover:bg-[#d95248] rounded-lg transition-colors"
                        >
                            הבנתי, תודה
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default PhotoPricingInfo;
