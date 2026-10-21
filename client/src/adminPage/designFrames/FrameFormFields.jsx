import SmartImageInput from '../../components/SmartImageInput';
import { DROPZONE_PRESETS } from '../../utils/dropzoneUtils';
import DropzonesEditor from './DropzonesEditor';
import { ASPECT_RATIO_PRESETS, MULTI_DROPZONE, ORIENTATION_OPTIONS } from './frameForm';

const inputClass = 'w-full border border-gray-200 rounded-lg p-2.5';

/**
 * The frame's details: name, image (its proportions and orientation are read from it), category,
 * size folder, overlay behavior, order and status, and – for a collage – its photo windows.
 * `zones` holds the window actions: onDetect, onApplyPreset, onAddZone, onUpdateZone, onRemoveZone, detecting.
 */
export default function FrameFormFields({ form, patchForm, onImageUrlChange, categories, printSizes, zones }) {
    const changeLayoutType = (layoutType) => patchForm((prev) => ({
        layoutType,
        dropzones: layoutType === MULTI_DROPZONE
            ? (prev.dropzones?.length ? prev.dropzones : DROPZONE_PRESETS[0].dropzones)
            : [],
    }));

    return (
        <>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם המסגרת</label>
                <input
                    type="text"
                    value={form.title}
                    onChange={(e) => patchForm({ title: e.target.value })}
                    className={inputClass}
                    placeholder="לדוגמה: מסגרת פרח ורודה"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">תמונת מסגרת (PNG/SVG)</label>
                <SmartImageInput value={form.imageUrl} onChange={onImageUrlChange} placeholder="הדביקו URL או העלו תמונה" />
                {form.imageUrl && (
                    <button
                        type="button"
                        onClick={zones.onDetect}
                        disabled={zones.detecting}
                        className="mt-2 w-full py-2 rounded-lg border border-[#f2665e] text-[#f2665e] text-sm font-bold hover:bg-red-50 disabled:opacity-50"
                    >
                        {zones.detecting ? 'מזהה חלונות...' : 'זהה ריבועים ריקים להעלאת תמונות'}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה</label>
                    <select value={form.category} onChange={(e) => patchForm({ category: e.target.value })} className={inputClass}>
                        {categories.map((cat) => (
                            <option key={cat._id} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">יחס גובה-רוחב</label>
                    <input
                        type="text"
                        value={form.aspectRatio}
                        onChange={(e) => patchForm({ aspectRatio: e.target.value })}
                        className={`${inputClass} ltr`}
                        placeholder="4:3"
                        list="aspect-ratio-presets"
                    />
                    <datalist id="aspect-ratio-presets">
                        {ASPECT_RATIO_PRESETS.map((r) => <option key={r} value={r} />)}
                    </datalist>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">תיקיית מידה</label>
                    <select value={form.printSizeKey} onChange={(e) => patchForm({ printSizeKey: e.target.value })} className={inputClass}>
                        <option value="">כל המידות</option>
                        {printSizes.map((size) => (
                            <option key={size.key} value={size.key}>{size.label}</option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">מידות התיקיות נערכות במסך &quot;הגדרות עורך התמונות&quot;.</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">כיוון המסגרת</label>
                    <select value={form.orientation} onChange={(e) => patchForm({ orientation: e.target.value })} className={inputClass}>
                        {ORIENTATION_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">מזוהה אוטומטית מהתמונה, וניתן לשנות ידנית.</p>
                </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer rounded-xl bg-gray-50 border border-gray-100 p-3">
                <input
                    type="checkbox"
                    checked={form.isFixedOverlay}
                    onChange={(e) => patchForm({ isFixedOverlay: e.target.checked })}
                    className="rounded mt-0.5"
                />
                <span className="text-sm text-gray-700">
                    שכבת Overlay קבועה
                    <span className="block text-xs text-gray-500">
                        המסגרת נפרסת על כל משטח העיצוב והלקוח לא יכול להזיז או לשנות את גודלה.
                    </span>
                </span>
            </label>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">סדר תצוגה</label>
                    <input type="number" value={form.sortOrder} onChange={(e) => patchForm({ sortOrder: e.target.value })} className={inputClass} />
                </div>
                <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.isActive} onChange={(e) => patchForm({ isActive: e.target.checked })} className="rounded" />
                        <span className="text-sm text-gray-700">פעילה בעורך</span>
                    </label>
                </div>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">סוג מסגרת</label>
                    <select value={form.layoutType} onChange={(e) => changeLayoutType(e.target.value)} className={inputClass}>
                        <option value="single_overlay">מסגרת רגילה (שכבת עיצוב)</option>
                        <option value="multi_dropzone">קולאז׳ (כמה חלונות לתמונות)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                        בקולאז׳: העלו תמונה עם ריבועים ריקים (לבנים), לחצו על זיהוי אוטומטי, או הגדירו ידנית.
                    </p>
                </div>

                {form.layoutType === MULTI_DROPZONE && (
                    <DropzonesEditor
                        imageUrl={form.imageUrl}
                        zones={form.dropzones || []}
                        detecting={zones.detecting}
                        onDetect={zones.onDetect}
                        onApplyPreset={zones.onApplyPreset}
                        onAddZone={zones.onAddZone}
                        onUpdateZone={zones.onUpdateZone}
                        onRemoveZone={zones.onRemoveZone}
                    />
                )}
            </div>
        </>
    );
}
