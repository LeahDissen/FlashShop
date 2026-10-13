import useToastStore from '../store/toastStore';

/** מציג את ההודעה החולפת הנוכחית. מורכב פעם אחת ב-Layout. */
export default function ToastHost() {
    const toast = useToastStore((state) => state.toast);
    const hideToast = useToastStore((state) => state.hideToast);

    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed bottom-6 inset-x-0 z-[1000] flex justify-center px-4 pointer-events-none"
        >
            {toast && (
                <button
                    key={toast.id}
                    type="button"
                    onClick={hideToast}
                    dir="rtl"
                    className="pointer-events-auto flex items-center gap-2 rounded-full bg-gray-900/90 text-white px-5 py-3 shadow-lg text-sm font-bold"
                >
                    <span aria-hidden="true" className="text-green-400 text-base">✓</span>
                    {toast.message}
                </button>
            )}
        </div>
    );
}
