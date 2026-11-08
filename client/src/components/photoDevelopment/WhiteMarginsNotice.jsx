import { useEffect } from 'react';

export const WHITE_MARGINS_MESSAGE = 'שימו לב שהתמונה לא מתאימה בדיוק לגודל המוזמן, לכן נשארו שוליים לבנים מסביב. באפשרותכם לערוך את התמונה ולהתאימה לגודל המודפס. בברירת המחדל התמונה תודפס כמו שהיא וישארו שוליים לבנים כמו שאתם רואים כאן.';

/** Shown right after an upload when some of the photos don't fit the print size and will print with white margins */
export default function WhiteMarginsNotice({ count, onClose }) {
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="white-margins-title"
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-right space-y-4"
                onClick={(e) => e.stopPropagation()}
                dir="rtl"
            >
                <h2 id="white-margins-title" className="text-lg font-bold text-[#f2665e]">
                    {count > 1 ? `${count} תמונות לא מתאימות בדיוק לגודל ההדפסה` : 'התמונה לא מתאימה בדיוק לגודל ההדפסה'}
                </h2>
                <p className="text-sm text-gray-700 leading-relaxed">{WHITE_MARGINS_MESSAGE}</p>
                <p className="text-xs text-gray-500">התמונות האלה מסומנות בגלריה. לעריכה לוחצים על התגית שעל התמונה.</p>
                <button type="button" onClick={onClose} className="w-full bg-[#f2665e] text-white font-bold py-2.5 rounded-full hover:bg-[#d95248]">
                    הבנתי
                </button>
            </div>
        </div>
    );
}
