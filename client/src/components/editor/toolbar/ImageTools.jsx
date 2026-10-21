import { CropIcon, SunIcon } from '../../icons';
import ToolbarPopover from '../ToolbarPopover';
import FlipButtons from './FlipButtons';
import ToolbarDivider from './ToolbarDivider';
import { usePopoverToggle } from './usePopoverToggle';

/** The image adjustments: each one's range, neutral value and how its value is shown */
const IMAGE_FILTERS = [
    { key: 'brightness', label: 'בהירות', min: 0, max: 200, neutral: 100, display: (v) => `${Math.round(v - 100)}%` },
    { key: 'contrast', label: 'ניגודיות', min: 0, max: 200, neutral: 100, display: (v) => `${Math.round(v - 100)}%` },
    { key: 'grayscale', label: 'גווני אפור', min: 0, max: 100, neutral: 0, display: (v) => `${v}%` },
    { key: 'sepia', label: 'ספיה', min: 0, max: 100, neutral: 0, display: (v) => `${v}%` },
    { key: 'blur', label: 'טשטוש', min: 0, max: 20, step: 0.5, neutral: 0, display: (v) => `${v}px` },
];

const NEUTRAL_FILTERS = Object.fromEntries(IMAGE_FILTERS.map(({ key, neutral }) => [key, neutral]));

/** Image tools: crop, flip, and the adjustments panel */
export default function ImageTools({ element, onChange, onCrop, onUpdateElement }) {
    const filters = usePopoverToggle();

    return (
        <>
            <button
                onClick={onCrop}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors hover:shadow-sm"
                data-tooltip="חיתוך תמונה"
                data-tooltip-pos="bottom"
            >
                <CropIcon className="w-4 h-4" />
                חתוך
            </button>

            <ToolbarDivider />

            <FlipButtons element={element} onChange={onChange} />

            <ToolbarDivider />

            <div className="relative" ref={filters.ref}>
                <button
                    onClick={filters.toggle}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${filters.open ? 'bg-red-50 border-red-300 text-red-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    data-tooltip="התאמות תמונה"
                    data-tooltip-pos="bottom"
                >
                    <SunIcon className="w-4 h-4" />
                    <span>התאמות</span>
                </button>

                {filters.open && (
                    <ToolbarPopover anchorRef={filters.ref} width={256} align="center" className="p-5">
                        <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">התאמת תמונה</h3>

                        <div className="space-y-4">
                            {IMAGE_FILTERS.map(({ key, label, min, max, step, neutral, display }) => {
                                const value = element[key] || neutral;
                                return (
                                    <div key={key} className="flex flex-col gap-1">
                                        <div className="flex justify-between text-xs text-gray-500 font-medium">
                                            <span>{label}</span>
                                            <span>{display(value)}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={min}
                                            max={max}
                                            step={step}
                                            value={value}
                                            onChange={(e) => onChange(key, step ? parseFloat(e.target.value) : parseInt(e.target.value))}
                                            className="w-full accent-red-400 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                );
                            })}

                            <button
                                onClick={() => onUpdateElement(NEUTRAL_FILTERS)}
                                className="w-full text-xs text-red-500 hover:bg-red-50 py-1 rounded transition-colors mt-2"
                            >
                                איפוס הגדרות
                            </button>
                        </div>
                    </ToolbarPopover>
                )}
            </div>
        </>
    );
}
