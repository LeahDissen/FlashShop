/** A designed product's print size (the editor's canvas proportions) and whether customers may turn it */
export default function PrintAreaFields({ printWidth, printHeight, allowOrientationToggle, onFieldChange, onToggleOrientation }) {
    return (
        <div className="rounded-lg border border-dashed border-[#f2665e]/40 bg-[#fff5f4] p-3 space-y-2">
            <p className="text-sm font-bold text-gray-800">גודל משטח ההדפסה (ס&quot;מ)</p>
            <p className="text-xs text-gray-500">הלקוח יראה בעורך משטח עבודה בפרופורציה הזו</p>
            <div className="flex gap-4">
                <div className="w-1/2">
                    <label className="block text-xs font-medium text-gray-600">רוחב</label>
                    <input
                        type="number"
                        name="printWidth"
                        min="1"
                        max="100"
                        step="0.5"
                        value={printWidth}
                        onChange={onFieldChange}
                        className="w-full p-2 border rounded-lg"
                        required
                    />
                </div>
                <div className="w-1/2">
                    <label className="block text-xs font-medium text-gray-600">גובה</label>
                    <input
                        type="number"
                        name="printHeight"
                        min="1"
                        max="100"
                        step="0.5"
                        value={printHeight}
                        onChange={onFieldChange}
                        className="w-full p-2 border rounded-lg"
                        required
                    />
                </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                    type="checkbox"
                    name="allowOrientationToggle"
                    checked={Boolean(allowOrientationToggle)}
                    onChange={(e) => onToggleOrientation(e.target.checked)}
                    className="rounded border-gray-300 text-[#f2665e] focus:ring-[#f2665e]"
                />
                <span className="text-xs text-gray-700">
                    לאפשר ללקוח להפוך את כיוון המשטח (אורך/רוחב)
                </span>
            </label>
        </div>
    );
}
