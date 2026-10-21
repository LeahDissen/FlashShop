import { DEFAULT_EDITOR_SETTINGS } from '../../constants/editorSettingsDefaults';
import { detectTextDirection } from '../../utils/cropImage';

/** The selected caption's text, font, size and color */
const PhotoCaptionToolbar = ({
    caption,
    textOptions = DEFAULT_EDITOR_SETTINGS.textToolbar,
    onChange,
    onRemove,
    disabled,
}) => {
    if (!caption) return null;

    const fonts = textOptions?.fonts?.length
        ? textOptions.fonts
        : DEFAULT_EDITOR_SETTINGS.textToolbar.fonts;
    const colorPresets = textOptions?.colorPresets?.length
        ? textOptions.colorPresets
        : DEFAULT_EDITOR_SETTINGS.textToolbar.colorPresets;
    const minFontSize = Number(textOptions?.minFontSize) || 8;
    const maxFontSize = Number(textOptions?.maxFontSize) || 200;
    const dir = detectTextDirection(caption.content);

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">
                    כתובית
                </span>
                <button
                    type="button"
                    onClick={onRemove}
                    disabled={disabled}
                    className="text-xs font-bold text-gray-500 hover:text-red-600 disabled:opacity-50"
                >
                    מחק כתובית
                </button>
            </div>
            <textarea
                value={caption.content}
                onChange={(e) => onChange({ content: e.target.value })}
                disabled={disabled}
                dir={dir}
                rows={2}
                placeholder="כתובית לתמונה"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
                style={{
                    fontFamily: caption.fontFamily,
                    color: caption.color,
                    backgroundColor: '#111827',
                }}
            />
            <div className="flex flex-wrap items-center gap-2">
                <select
                    value={caption.fontFamily}
                    onChange={(e) => onChange({ fontFamily: e.target.value })}
                    disabled={disabled}
                    className="h-9 pl-2 pr-8 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 min-w-[8rem]"
                >
                    {fonts.map((font) => (
                        <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                            {font.label}
                        </option>
                    ))}
                </select>
                <input
                    type="number"
                    min={minFontSize}
                    max={maxFontSize}
                    value={caption.fontSize}
                    onChange={(e) => onChange({
                        fontSize: Math.max(minFontSize, Math.min(maxFontSize, Number(e.target.value) || minFontSize)),
                    })}
                    disabled={disabled}
                    className="w-16 h-9 border border-gray-300 rounded-lg text-sm text-center"
                    aria-label="גודל גופן"
                />
                <div className="flex flex-wrap items-center gap-1.5">
                    {colorPresets.slice(0, 12).map((color) => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => onChange({ color })}
                            disabled={disabled}
                            className={`w-6 h-6 rounded-full border border-gray-200 ${
                                caption.color === color ? 'ring-2 ring-[#f2665e] ring-offset-1' : ''
                            }`}
                            style={{ backgroundColor: color }}
                            aria-label={`צבע ${color}`}
                        />
                    ))}
                    <input
                        type="color"
                        value={caption.color || '#FFFFFF'}
                        onChange={(e) => onChange({ color: e.target.value })}
                        disabled={disabled}
                        className="w-8 h-8 rounded cursor-pointer border border-gray-200 p-0"
                        aria-label="צבע מותאם"
                    />
                </div>
            </div>
        </div>
    );
};

export default PhotoCaptionToolbar;
