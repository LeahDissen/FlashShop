/** Covers the page while photos upload: progress of a multi-upload, or a status message */
export default function UploadProgressOverlay({ progress, status }) {
    return (
        <div
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            dir="rtl"
            role="alertdialog"
            aria-live="polite"
            aria-busy="true"
            aria-label="מעלה תמונות"
        >
            <div className="bg-white rounded-2xl shadow-2xl px-8 py-10 max-w-sm w-full text-center">
                <svg
                    className="animate-spin h-14 w-14 text-[#f2665e] mb-5 mx-auto"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
                <h2 className="text-xl font-bold text-gray-800 mb-2">מעלה תמונות</h2>
                {progress ? (
                    <>
                        <div
                            className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2"
                            role="progressbar"
                            aria-valuemin={0}
                            aria-valuemax={progress.total}
                            aria-valuenow={progress.done}
                        >
                            <div
                                className="h-full bg-[#f2665e] transition-all duration-300"
                                style={{ width: `${Math.round((progress.done / Math.max(1, progress.total)) * 100)}%` }}
                            />
                        </div>
                        <p className="text-gray-600 text-sm">
                            {progress.done} מתוך {progress.total} תמונות
                            {progress.failed > 0 && (
                                <span className="text-red-600"> · {progress.failed} נכשלו</span>
                            )}
                        </p>
                    </>
                ) : (
                    <p className="text-gray-600 text-sm">{status}</p>
                )}
                <p className="text-gray-400 text-xs mt-3">
                    התמונות מועלות — אל תסגרו את הדף
                </p>
            </div>
        </div>
    );
}
