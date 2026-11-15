import { areaLabel } from '../../utils/designAreas';

/**
 * The product's design areas above the canvas: the main design and each extra area (e.g. the back).
 * An area she designed is marked ✓ and printed with the order; "הסרה" leaves it out.
 */
export default function DesignAreasStrip({ areas, activeArea, areaFiles, onSelect, onRemove, disabled }) {
    const chip = (isActive) => `whitespace-nowrap text-xs font-bold px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50 ${
        isActive ? 'bg-[#f2665e] text-white border-[#f2665e]' : 'bg-white text-[#f2665e] border-[#f2665e]/40 hover:bg-[#ffeae8]'
    }`;
    return (
        <div className="shrink-0 bg-[#fff5f4] border-b border-[#f2665e]/20 px-3 py-2 flex items-center gap-2 overflow-x-auto" dir="rtl">
            <span className="text-xs font-bold text-[#a83232] whitespace-nowrap">שטחי עיצוב:</span>
            <button type="button" disabled={disabled} onClick={() => onSelect(null)} aria-pressed={!activeArea} className={chip(!activeArea)}>
                עיצוב ראשי
            </button>
            {areas.map((area) => {
                const isActive = activeArea === area.name;
                const designed = Boolean(areaFiles[area.name]);
                return (
                    <span key={area.name} className="inline-flex items-center gap-1">
                        <button type="button" disabled={disabled} onClick={() => onSelect(area.name)} aria-pressed={isActive} className={chip(isActive)}>
                            {areaLabel(area)}{designed && !isActive ? ' ✓' : ''}
                        </button>
                        {designed && !isActive && (
                            <button
                                type="button"
                                disabled={disabled}
                                onClick={() => onRemove(area.name)}
                                className="text-[11px] text-gray-500 hover:text-red-500 underline whitespace-nowrap"
                            >
                                הסרה
                            </button>
                        )}
                    </span>
                );
            })}
            <span className="text-[11px] text-gray-500 whitespace-nowrap mr-auto">
                {activeArea ? 'השטח נשמר כשעוברים לשטח אחר או לוחצים "המשך"' : 'אפשר להוסיף עיצוב גם לשטחים נוספים (לא חובה)'}
            </span>
        </div>
    );
}
