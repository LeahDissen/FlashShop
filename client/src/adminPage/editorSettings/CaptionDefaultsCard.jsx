import { Card, Field } from './SettingsCard';
import { inputClass } from './inputClass';

/** How a new caption looks: its button text, placeholder, font, size and color */
export default function CaptionDefaultsCard({ captionDefaults, fonts, onPatch }) {
    return (
                <Card title="ברירות מחדל לכתובית">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="טקסט הכפתור בעורך">
                            <input
                                type="text"
                                value={captionDefaults.buttonLabel}
                                onChange={(e) => onPatch({ buttonLabel: e.target.value })}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="טקסט ברירת מחדל בכתובית">
                            <input
                                type="text"
                                value={captionDefaults.placeholder}
                                onChange={(e) => onPatch({ placeholder: e.target.value })}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="גופן">
                            <select
                                value={captionDefaults.fontFamily}
                                onChange={(e) => onPatch({ fontFamily: e.target.value })}
                                className={inputClass}
                            >
                                {fonts.map((font) => (
                                    <option key={font.value} value={font.value}>{font.label}</option>
                                ))}
                            </select>
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="גודל">
                                <input
                                    type="number"
                                    min="1"
                                    value={captionDefaults.fontSize}
                                    onChange={(e) => onPatch({ fontSize: Number(e.target.value) })}
                                    className={inputClass}
                                />
                            </Field>
                            <Field label="צבע">
                                <input
                                    type="color"
                                    value={captionDefaults.color}
                                    onChange={(e) => onPatch({ color: e.target.value })}
                                    className="w-full h-[42px] rounded-lg border border-gray-200 cursor-pointer"
                                />
                            </Field>
                        </div>
                    </div>
                </Card>
    );
}
