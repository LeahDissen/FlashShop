/** The photos that failed to upload, with a retry button */
export default function FailedUploadsNotice({ failedUploads, onClose, onRetry }) {
    return (
        <div
            className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 z-[150] max-w-md bg-white border border-red-200 rounded-2xl shadow-xl p-4 text-right"
            dir="rtl"
            role="alert"
        >
            <p className="font-bold text-red-700 mb-1">{failedUploads.length} תמונות לא הועלו</p>
            <ul className="text-xs text-gray-600 max-h-24 overflow-y-auto mb-3 space-y-0.5">
                {failedUploads.map(({ file, error }) => (
                    <li key={`${file.name}-${file.size}`}>{file.name} — {error?.message || 'שגיאה'}</li>
                ))}
            </ul>
            <div className="flex gap-2 justify-end">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                    סגירה
                </button>
                <button
                    type="button"
                    onClick={onRetry}
                    className="px-3 py-1.5 text-sm rounded-lg bg-[#f2665e] text-white font-bold hover:bg-[#d95248]"
                >
                    לנסות שוב
                </button>
            </div>
        </div>
    );
}
