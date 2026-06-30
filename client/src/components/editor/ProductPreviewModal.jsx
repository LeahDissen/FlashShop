import { SparklesIcon, XIcon } from '../icons';

/**
 * RTL flat print preview modal – shows the captured canvas design as-is.
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {string|null} props.previewImage - Canvas capture data URL
 * @param {string|null} props.productNameHe - Hebrew product name for title
 * @param {string|null} [props.printSizeLabel]
 * @param {boolean} props.isSaving
 * @param {() => void} props.onConfirm
 */
export default function ProductPreviewModal({
    isOpen,
    onClose,
    previewImage,
    productNameHe,
    printSizeLabel,
    isSaving,
    onConfirm,
}) {
    if (!isOpen) return null;

    const titleName = productNameHe || 'העיצוב שלך';

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={`תצוגה מקדימה: ${titleName}`}
        >
            <div
                className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
                dir="rtl"
            >
                {isSaving && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
                        <svg
                            className="animate-spin h-12 w-12 text-red-500 mb-3"
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
                        <p className="text-lg font-bold text-gray-800">מעבד הזמנה...</p>
                        <p className="text-sm text-gray-500 mt-1">נא להמתין</p>
                    </div>
                )}

                <header className="shrink-0 p-3 border-b flex justify-between items-center bg-gray-50 gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2 min-w-0">
                        <SparklesIcon className="w-5 h-5 text-red-400 shrink-0" />
                        <span className="truncate">תצוגה מקדימה: {titleName}</span>
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors shrink-0 disabled:opacity-40 disabled:pointer-events-none"
                        aria-label="סגור"
                    >
                        <XIcon className="w-5 h-5 text-gray-500" />
                    </button>
                </header>

                <div className="flex-1 min-h-0 p-4 overflow-auto bg-gray-100 flex flex-col items-center justify-center gap-3">
                    <p className="text-sm text-gray-600 text-center">
                        כך ייראה הקובץ להדפסה
                        {printSizeLabel && (
                            <span className="text-[#f2665e] font-semibold"> · {printSizeLabel}</span>
                        )}
                    </p>
                    {previewImage ? (
                        <div className="bg-white rounded-lg border border-gray-200 shadow-md p-3 max-w-full">
                            <img
                                src={previewImage}
                                alt="תצוגת העיצוב להדפסה"
                                className="max-w-full max-h-[55vh] w-auto h-auto object-contain block mx-auto"
                            />
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-8">
                            <p>טוען תצוגה מקדימה...</p>
                        </div>
                    )}
                </div>

                <footer className="shrink-0 p-3 border-t bg-white flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        חזור לעריכה
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isSaving || !previewImage}
                        className="px-6 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 font-bold shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 min-w-[9.5rem] justify-center"
                    >
                        {isSaving ? (
                            <>
                                <svg
                                    className="animate-spin h-5 w-5"
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
                                מעבד...
                            </>
                        ) : (
                            'אישור והזמנה'
                        )}
                    </button>
                </footer>
            </div>
        </div>
    );
}
