import { useRef } from 'react';

const SELECTED_RING = 'ring-2 ring-[#f2665e] ring-offset-1';

/** The background color around the photo inside the print frame: the palette, or any color */
export default function BackgroundColorPicker({ colors, value, onChange, disabled }) {
    const colorInputRef = useRef(null);
    // The palette is uppercase; a color saved in lowercase (e.g. #ffffff) is still recognized
    const active = String(value || '').toUpperCase();
    const isCustom = !colors.includes(active);

    return (
        <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">צבע רקע</span>
            <div className="flex flex-wrap items-center gap-2">
                {colors.map((color) => (
                    <button
                        key={color}
                        type="button"
                        onClick={() => onChange(color)}
                        disabled={disabled}
                        className={`w-8 h-8 rounded-md border border-gray-200 transition-all ${
                            active === color ? SELECTED_RING : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                        aria-label={`רקע ${color}`}
                        aria-pressed={active === color}
                    />
                ))}
                <button
                    type="button"
                    onClick={() => colorInputRef.current?.click()}
                    disabled={disabled}
                    className={`w-8 h-8 rounded-md border border-gray-200 flex items-center justify-center ${isCustom ? SELECTED_RING : ''}`}
                    aria-label="בחר צבע מותאם"
                >
                    {isCustom ? (
                        <span className="w-full h-full rounded-md" style={{ backgroundColor: value }} />
                    ) : (
                        <span className="w-full h-full rounded-md bg-gradient-to-br from-red-500 via-yellow-300 to-blue-500" />
                    )}
                </button>
                <input
                    ref={colorInputRef}
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className="sr-only"
                />
            </div>
        </div>
    );
}
