const toggleClass = (isActive, inactive) => (isActive ? 'bg-[#f2665e] text-white border-[#f2665e]' : inactive);

/** Print size, orientation, the frame and caption buttons, and a warning when the photo will be cropped a lot */
export default function PrintOptionsPanel({
    printSize,
    sizeOptions,
    onPrintSizeChange,
    orientation,
    onOrientationChange,
    showFramePanel,
    onToggleFramePanel,
    onAddCaption,
    addCaptionLabel,
    warning,
    disabled,
}) {
    return (
        <div className="px-5 py-3 space-y-3">
            <label className="block text-sm font-medium text-gray-700">
                גודל הדפסה
                <select
                    value={printSize}
                    onChange={(e) => onPrintSizeChange(e.target.value)}
                    disabled={disabled}
                    className="mt-1 w-full h-10 border border-gray-300 rounded-lg px-3 text-sm bg-white text-gray-800"
                >
                    {sizeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </label>

            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => onOrientationChange('portrait')}
                    disabled={disabled}
                    className={`flex-1 min-w-[7rem] py-2 px-3 rounded-lg text-sm font-bold border transition-colors ${
                        toggleClass(orientation === 'portrait', 'bg-white text-gray-700 border-gray-200 hover:border-gray-300')
                    }`}
                >
                    אורך ↕
                </button>
                <button
                    type="button"
                    onClick={() => onOrientationChange('landscape')}
                    disabled={disabled}
                    className={`flex-1 min-w-[7rem] py-2 px-3 rounded-lg text-sm font-bold border transition-colors ${
                        toggleClass(orientation === 'landscape', 'bg-white text-gray-700 border-gray-200 hover:border-gray-300')
                    }`}
                >
                    רוחב ↔
                </button>
            </div>

            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={onToggleFramePanel}
                    disabled={disabled}
                    className={`flex-1 min-w-[8rem] py-2 px-3 rounded-lg text-sm font-bold border transition-colors ${
                        toggleClass(showFramePanel, 'bg-white text-gray-700 border-gray-200 hover:border-[#f2665e]/40')
                    }`}
                >
                    הוספת מסגרת
                </button>
                <button
                    type="button"
                    onClick={onAddCaption}
                    disabled={disabled}
                    className="flex-1 min-w-[8rem] py-2 px-3 rounded-lg text-sm font-bold border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                >
                    {addCaptionLabel || 'הוסף כתובית לתמונה'}
                </button>
            </div>

            {warning && (
                <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    {warning}
                </div>
            )}
        </div>
    );
}
