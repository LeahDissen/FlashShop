/** Covers the editor while a preview is being made or the order is being prepared */
export default function EditorBusyOverlay({ isSaving }) {
    return (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
            <svg className="animate-spin h-16 w-16 text-red-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{isSaving ? 'מעבד הזמנה...' : 'יוצר תצוגה מקדימה...'}</h2>
            <p className="text-gray-600">{isSaving ? 'נא להמתין בזמן שהמוצר מתווסף לעגלה שלך...' : 'מכין את העיצוב שלך להדפסה'}</p>
        </div>
    );
}
