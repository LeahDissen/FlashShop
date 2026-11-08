import { useEffect } from 'react';

/** The site terms, opened from the checkbox at checkout. Closes on Escape or a click outside. */
export default function SiteTermsModal({ title, content, onClose }) {
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="site-terms-title"
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
                dir="rtl"
            >
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <h2 id="site-terms-title" className="text-xl font-bold text-gray-800">{title}</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none" aria-label="סגירה">×</button>
                </div>
                <div className="overflow-y-auto px-6 py-4 text-sm text-gray-700 leading-relaxed whitespace-pre-line text-right">
                    {content || 'התקנון יעודכן בקרוב.'}
                </div>
                <div className="border-t border-gray-100 px-6 py-4">
                    <button type="button" onClick={onClose} className="w-full bg-[#f2665e] text-white font-bold py-2.5 rounded-lg hover:bg-[#d95248]">
                        סגירה
                    </button>
                </div>
            </div>
        </div>
    );
}
