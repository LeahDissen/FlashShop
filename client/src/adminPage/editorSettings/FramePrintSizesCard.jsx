import { FaPlus, FaTrash } from 'react-icons/fa';
import { Card, Field } from './SettingsCard';
import { inputClass } from './inputClass';

/** The print sizes: each one is a folder of frames (landscape and portrait) in the editor */
export default function FramePrintSizesCard({ sizes, onUpdate, onAdd, onRemove }) {
    return (
                <Card
                    title="תיקיות מידות מסגרות"
                    description="כל מידה מוצגת ללקוח כתיקייה בעורך, ובתוכה מסגרות לרוחב ולאורך."
                >
                    <div className="space-y-3">
                        {sizes.map((size, index) => (
                            <div
                                key={`${size.key}-${index}`}
                                className="grid grid-cols-12 gap-3 items-end rounded-xl border border-gray-100 bg-gray-50 p-3"
                            >
                                <div className="col-span-12 sm:col-span-5">
                                    <Field label="תווית לתצוגה">
                                        <input
                                            type="text"
                                            value={size.label}
                                            onChange={(e) => onUpdate(index, 'label', e.target.value)}
                                            className={inputClass}
                                        />
                                    </Field>
                                </div>
                                <div className="col-span-4 sm:col-span-2">
                                    <Field label="רוחב (ס״מ)">
                                        <input
                                            type="number"
                                            min="1"
                                            step="0.5"
                                            value={size.widthCm}
                                            onChange={(e) => onUpdate(index, 'widthCm', e.target.value)}
                                            className={inputClass}
                                        />
                                    </Field>
                                </div>
                                <div className="col-span-4 sm:col-span-2">
                                    <Field label="גובה (ס״מ)">
                                        <input
                                            type="number"
                                            min="1"
                                            step="0.5"
                                            value={size.heightCm}
                                            onChange={(e) => onUpdate(index, 'heightCm', e.target.value)}
                                            className={inputClass}
                                        />
                                    </Field>
                                </div>
                                <div className="col-span-3 sm:col-span-2 flex items-center gap-2 pb-2.5">
                                    <input
                                        type="checkbox"
                                        checked={size.isActive !== false}
                                        onChange={(e) => onUpdate(index, 'isActive', e.target.checked)}
                                        className="rounded"
                                    />
                                    <span className="text-sm text-gray-700">פעילה</span>
                                </div>
                                <div className="col-span-1 flex justify-end pb-2.5">
                                    <button
                                        type="button"
                                        onClick={() => onRemove(index)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                        aria-label="מחק מידה"
                                    >
                                        <FaTrash size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={onAdd}
                        className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#f2665e] hover:underline"
                    >
                        <FaPlus size={11} />
                        הוסף מידה
                    </button>
                </Card>
    );
}
