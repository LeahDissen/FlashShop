/**
 * The strip of copies above the canvas in "a separate design for each copy" mode.
 * A copy that was already opened is marked ✓.
 */
export default function CopiesStrip({ copyCount, activeCopy, copyDesigns, onSelectCopy }) {
    return (
        <div className="shrink-0 bg-[#fff5f4] border-b border-[#f2665e]/20 px-3 py-2 flex items-center gap-2 overflow-x-auto" dir="rtl">
            <span className="text-xs font-bold text-[#a83232] whitespace-nowrap">עיצוב לכל עותק:</span>
            {Array.from({ length: copyCount }, (_, i) => {
                const isActive = i === activeCopy;
                const designed = isActive || Boolean(copyDesigns[i]);
                return (
                    <button
                        key={i}
                        type="button"
                        onClick={() => onSelectCopy(i)}
                        aria-pressed={isActive}
                        className={`whitespace-nowrap text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
                            isActive
                                ? 'bg-[#f2665e] text-white border-[#f2665e]'
                                : 'bg-white text-[#f2665e] border-[#f2665e]/40 hover:bg-[#ffeae8]'
                        }`}
                    >
                        עותק {i + 1}{designed && !isActive ? ' ✓' : ''}
                    </button>
                );
            })}
            <span className="text-[11px] text-gray-500 whitespace-nowrap mr-auto">בסיום לוחצים &quot;המשך&quot; לצפייה בכל העיצובים</span>
        </div>
    );
}
