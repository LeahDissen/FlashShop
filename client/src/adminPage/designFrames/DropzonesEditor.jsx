import { FaTrash } from 'react-icons/fa';
import { DROPZONE_PRESETS } from '../../utils/dropzoneUtils';

const ZONE_POSITION_FIELDS = ['x', 'y', 'width', 'height'];

/** The photo windows of a collage frame over the frame image, in percent */
function ZonesPreview({ imageUrl, zones }) {
    return (
        <div className="relative w-full aspect-[3/4] max-h-64 bg-gray-200 rounded-lg overflow-hidden border border-gray-200">
            <img src={imageUrl} alt="תצוגת חלונות" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
            {zones.map((zone) => (
                <div
                    key={zone.id}
                    className="absolute border-2 border-[#f2665e] bg-[#f2665e]/20 text-[10px] font-bold text-[#f2665e] flex items-center justify-center"
                    style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.width}%`, height: `${zone.height}%` }}
                >
                    {zone.label || zone.id}
                </div>
            ))}
        </div>
    );
}

/**
 * A collage frame's photo windows: detected from the empty squares in the image, a ready layout,
 * or set by hand (name, position and size in percent).
 */
export default function DropzonesEditor({ imageUrl, zones, detecting, onDetect, onApplyPreset, onAddZone, onUpdateZone, onRemoveZone }) {
    return (
        <div className="space-y-3 rounded-xl bg-gray-50 border border-gray-100 p-3">
            <button
                type="button"
                onClick={onDetect}
                disabled={!imageUrl || detecting}
                className="w-full py-2.5 rounded-xl bg-[#f2665e] text-white text-sm font-bold hover:bg-[#d95248] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {detecting ? 'מזהה חלונות...' : 'זהה ריבועים ריקים מהתמונה'}
            </button>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">פריסה מוכנה</label>
                <div className="flex flex-wrap gap-2">
                    {DROPZONE_PRESETS.map((preset) => (
                        <button
                            key={preset.id}
                            type="button"
                            onClick={() => onApplyPreset(preset.id)}
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-[#f2665e] hover:text-[#f2665e]"
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-800">חלונות תמונה ({zones.length})</h4>
                <button type="button" onClick={onAddZone} className="text-xs font-bold text-[#f2665e] hover:underline">
                    + הוסף חלון
                </button>
            </div>

            {zones.map((zone, index) => (
                <div key={zone.id || index} className="bg-white rounded-lg border border-gray-200 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <input
                            type="text"
                            value={zone.label || ''}
                            onChange={(e) => onUpdateZone(index, 'label', e.target.value)}
                            className="flex-1 border border-gray-200 rounded-md px-2 py-1 text-sm"
                            placeholder="שם חלון"
                        />
                        <button
                            type="button"
                            onClick={() => onRemoveZone(index)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                            aria-label="מחק חלון"
                        >
                            <FaTrash size={12} />
                        </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                        {ZONE_POSITION_FIELDS.map((field) => (
                            <label key={field} className="block">
                                <span className="text-gray-500 uppercase">{field} %</span>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="any"
                                    value={zone[field]}
                                    onChange={(e) => onUpdateZone(index, field, e.target.value)}
                                    className="w-full border border-gray-200 rounded-md px-1.5 py-1 mt-0.5"
                                />
                            </label>
                        ))}
                    </div>
                </div>
            ))}

            {imageUrl && zones.length > 0 && <ZonesPreview imageUrl={imageUrl} zones={zones} />}
        </div>
    );
}
