import { Card, Field } from './SettingsCard';
import { inputClass } from './inputClass';

/**
 * A card of plain text settings. Each field is `{ section, key, label, hint?, wide? }`: it edits
 * `form[section][key]`, and a wide field takes the whole row.
 */
export default function TextFieldsCard({ title, description, fields, form, patchSection }) {
    return (
        <Card title={title} description={description}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fields.map(({ section, key, label, hint, wide }) => {
                    const field = (
                        <Field label={label} hint={hint}>
                            <input
                                type="text"
                                value={form[section][key]}
                                onChange={(e) => patchSection(section, { [key]: e.target.value })}
                                className={inputClass}
                            />
                        </Field>
                    );
                    return wide
                        ? <div key={`${section}.${key}`} className="sm:col-span-2">{field}</div>
                        : <div key={`${section}.${key}`}>{field}</div>;
                })}
            </div>
        </Card>
    );
}
