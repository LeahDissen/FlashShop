import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon, BoldIcon, ItalicIcon, PlusIcon, UnderlineIcon } from '../../icons';
import ToolbarPopover from '../ToolbarPopover';
import NumericStepper from './NumericStepper';
import ToolbarDivider from './ToolbarDivider';
import { usePopoverToggle } from './usePopoverToggle';

/** Text tools: font, size, color, bold / italic / underline and alignment */
export default function TextTools({ element, onChange, fonts, paletteValues, minFontSize, maxFontSize }) {
    const colorPicker = usePopoverToggle();
    const isCaption = element.role === 'caption';

    return (
        <>
            {isCaption && (
                <span className="shrink-0 text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">
                    כתובית
                </span>
            )}

            {/* Font Family */}
            <div className="relative" data-tooltip="גופן" data-tooltip-pos="bottom">
                <select
                    value={element.fontFamily}
                    onChange={(e) => onChange('fontFamily', e.target.value)}
                    className="h-9 pl-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 bg-white text-gray-700 min-w-[140px]"
                >
                    {fonts.map((font) => (
                        <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                            {font.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Font Size - THE STEPPER */}
            <div data-tooltip="גודל גופן" data-tooltip-pos="bottom">
                <NumericStepper
                    value={element.fontSize}
                    onChange={(val) => onChange('fontSize', val)}
                    min={minFontSize}
                    max={maxFontSize}
                />
            </div>

            <ToolbarDivider />

            {/* Text Color Picker */}
            <div className="relative shrink-0" ref={colorPicker.ref}>
                <button
                    type="button"
                    onClick={colorPicker.toggle}
                    className={`relative flex items-center justify-center w-9 h-9 rounded-lg border cursor-pointer shadow-sm transition-colors ${
                        colorPicker.open ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:bg-gray-50'
                    }`}
                    data-tooltip="צבע טקסט"
                    data-tooltip-pos="bottom"
                >
                    <span
                        className="w-6 h-6 rounded-full border border-gray-200 shadow-sm"
                        style={{ backgroundColor: element.color }}
                    />
                </button>

                {colorPicker.open && (
                    <ToolbarPopover anchorRef={colorPicker.ref} width={288} className="p-4">
                        <div className="text-right font-bold text-gray-800 mb-3">צבע הטקסט</div>
                        <div className="flex items-center gap-3 mb-4">
                            <div
                                className="w-12 h-12 rounded-lg shadow-sm border border-gray-200"
                                style={{ backgroundColor: element.color }}
                            />
                            <div className="w-12 h-12 rounded-lg overflow-hidden relative cursor-pointer group border border-gray-200 hover:border-red-400 transition-colors">
                                <div className="w-full h-full bg-gradient-to-br from-red-500 via-yellow-400 to-purple-600 flex items-center justify-center">
                                    <PlusIcon className="w-6 h-6 text-white drop-shadow-md" />
                                </div>
                                <input
                                    type="color"
                                    value={element.color}
                                    onChange={(e) => onChange('color', e.target.value)}
                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                    aria-label="צבע מותאם אישית"
                                />
                            </div>
                        </div>

                        <div className="text-right text-sm font-semibold text-gray-600 mb-2">צבעים</div>
                        <div className="grid grid-cols-6 gap-2">
                            {paletteValues.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => onChange('color', color)}
                                    className={`w-8 h-8 rounded-md border border-gray-200 hover:scale-110 transition-transform ${
                                        element.color === color ? 'ring-2 ring-red-400 ring-offset-2' : ''
                                    }`}
                                    style={{ backgroundColor: color }}
                                    aria-label={`בחר צבע ${color}`}
                                />
                            ))}
                        </div>
                    </ToolbarPopover>
                )}
            </div>

            <ToolbarDivider />

            {/* Text Styling */}
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1 bg-gray-50">
                <button
                    onClick={() => onChange('bold', !element.bold)}
                    className={`w-7 h-7 flex items-center justify-center rounded ${element.bold ? 'bg-white shadow-sm text-black font-bold' : 'text-gray-500 hover:bg-gray-200'}`}
                    data-tooltip="מודגש"
                    data-tooltip-pos="bottom"
                >
                    <BoldIcon className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onChange('italic', !element.italic)}
                    className={`w-7 h-7 flex items-center justify-center rounded ${element.italic ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:bg-gray-200'}`}
                    data-tooltip="נטוי"
                    data-tooltip-pos="bottom"
                >
                    <ItalicIcon className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onChange('underline', !element.underline)}
                    className={`w-7 h-7 flex items-center justify-center rounded ${element.underline ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:bg-gray-200'}`}
                    data-tooltip="קו תחתון"
                    data-tooltip-pos="bottom"
                >
                    <UnderlineIcon className="w-4 h-4" />
                </button>
            </div>

            <ToolbarDivider />

            {/* Alignment */}
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1 bg-gray-50">
                <button
                    onClick={() => onChange('textAlign', 'right')}
                    className={`w-7 h-7 flex items-center justify-center rounded ${element.textAlign === 'right' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:bg-gray-200'}`}
                    data-tooltip="יישור לימין"
                    data-tooltip-pos="bottom"
                >
                    <AlignRightIcon className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onChange('textAlign', 'center')}
                    className={`w-7 h-7 flex items-center justify-center rounded ${element.textAlign === 'center' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:bg-gray-200'}`}
                    data-tooltip="יישור למרכז"
                    data-tooltip-pos="bottom"
                >
                    <AlignCenterIcon className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onChange('textAlign', 'left')}
                    className={`w-7 h-7 flex items-center justify-center rounded ${element.textAlign === 'left' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:bg-gray-200'}`}
                    data-tooltip="יישור לשמאל"
                    data-tooltip-pos="bottom"
                >
                    <AlignLeftIcon className="w-4 h-4" />
                </button>
            </div>
        </>
    );
}
