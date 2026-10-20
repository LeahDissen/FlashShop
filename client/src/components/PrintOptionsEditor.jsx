import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { updatePage } from '../api/pages';
import { PRINT_OPTIONS, getPrintOption } from '../constants/printOptions';

/**
 * Admin only, under the option buttons on the product page: the name and the explanation of each button,
 * saved to the "products" CMS page (the same fields the products page editor uses).
 */
export default function PrintOptionsEditor({ content, onSaved }) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    const start = () => {
        setForm(Object.fromEntries(PRINT_OPTIONS.flatMap((option) => [
            [`${option.key}Label`, String(content?.[`${option.key}Label`] ?? '')],
            [`${option.key}Hint`, String(content?.[`${option.key}Hint`] ?? '')],
        ])));
        setMessage(null);
        setOpen(true);
    };

    const save = async () => {
        setSaving(true);
        setMessage(null);
        try {
            await updatePage('products', form);
            onSaved({ ...content, ...form });
            setMessage({ ok: true, text: 'נשמר. הכפתורים מתעדכנים בכל עמודי המוצרים.' });
        } catch {
            setMessage({ ok: false, text: 'השמירה נכשלה. נסו שוב.' });
        } finally {
            setSaving(false);
        }
    };

    if (!open) {
        return (
            <button
                type="button"
                onClick={start}
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#f2665e]"
            >
                <Pencil size={12} />
                עריכת שמות הכפתורים וההסברים (מנהלת)
            </button>
        );
    }

    return (
        <div className="mt-3 w-full max-w-lg rounded-xl border border-dashed border-[#f2665e]/40 bg-[#fffaf9] p-4 text-right space-y-3" dir="rtl">
            <p className="text-sm font-bold text-gray-800">שמות הכפתורים וההסברים</p>
            <p className="text-xs text-gray-500">ההסבר מופיע במעבר עכבר על הכפתור, ובטלפון בלחיצה על סימן ה-i. שדה ריק משאיר את ברירת המחדל.</p>
            {PRINT_OPTIONS.map((option) => {
                const defaults = getPrintOption({}, option.key);
                return (
                    <div key={option.key} className="space-y-1.5">
                        <label htmlFor={`${option.key}-label`} className="block text-xs font-semibold text-gray-700">{option.adminLabel}</label>
                        <input
                            id={`${option.key}-label`}
                            type="text"
                            value={form[`${option.key}Label`]}
                            onChange={(e) => setForm((prev) => ({ ...prev, [`${option.key}Label`]: e.target.value }))}
                            placeholder={defaults.label}
                            className="w-full p-2 text-sm border border-gray-200 rounded-lg"
                        />
                        <textarea
                            id={`${option.key}-hint`}
                            rows={2}
                            value={form[`${option.key}Hint`]}
                            onChange={(e) => setForm((prev) => ({ ...prev, [`${option.key}Hint`]: e.target.value }))}
                            placeholder={defaults.hint}
                            aria-label={`הסבר לכפתור ${option.adminLabel}`}
                            className="w-full p-2 text-sm border border-gray-200 rounded-lg"
                        />
                    </div>
                );
            })}
            {message && <p className={`text-xs ${message.ok ? 'text-green-700' : 'text-red-600'}`}>{message.text}</p>}
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-[#f2665e] text-white text-sm font-bold hover:bg-[#d95248] disabled:opacity-60"
                >
                    {saving ? 'שומר...' : 'שמירה'}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
                    סגירה
                </button>
            </div>
        </div>
    );
}
