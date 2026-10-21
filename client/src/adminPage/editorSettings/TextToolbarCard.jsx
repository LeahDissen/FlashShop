import { useState } from 'react';
import { FaTrash } from 'react-icons/fa';
import { Card, Field } from './SettingsCard';
import { inputClass } from './inputClass';

/**
 * The text toolbar: fonts (by name, or an uploaded font file), ready colors and the font size range.
 * `onPatch` updates the textToolbar section; `onFontFile` uploads and saves a font file.
 */
export default function TextToolbarCard({ textToolbar, onPatch, onFontFile, fontUploading, fontError, fontNotice }) {
    const [newColor, setNewColor] = useState('#f2665e');
    const [newFont, setNewFont] = useState('');

    const addFont = () => {
        const value = newFont.trim();
        if (!value) return;
        if (textToolbar.fonts.some((font) => font.value === value)) {
            setNewFont('');
            return;
        }
        onPatch({
            fonts: [...textToolbar.fonts, { label: value, value }],
        });
        setNewFont('');
    };

    const removeFont = (value) => onPatch({
        fonts: textToolbar.fonts.filter((font) => font.value !== value),
    });

    const addColor = () => {
        const color = newColor.toUpperCase();
        if (textToolbar.colorPresets.includes(color)) return;
        onPatch({
            colorPresets: [...textToolbar.colorPresets, color],
        });
    };

    const removeColor = (color) => onPatch({
        colorPresets: textToolbar.colorPresets.filter((c) => c !== color),
    });

    return (
                <Card
                    title="סרגל הטקסט והכתוביות"
                    description="הגופנים, הצבעים וטווח הגדלים שהלקוח יכול לבחור לטקסט ולכתוביות."
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <span className="block text-sm font-medium text-gray-700 mb-2">גופנים</span>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {textToolbar.fonts.map((font) => (
                                    <span
                                        key={font.value}
                                        className="inline-flex items-center gap-2 text-sm bg-gray-100 text-gray-700 rounded-lg px-2.5 py-1.5"
                                        style={{ fontFamily: font.value }}
                                    >
                                        {font.label}
                                        {font.url && <span className="text-[10px] text-gray-500 bg-white rounded px-1" style={{ fontFamily: 'inherit' }}>קובץ</span>}
                                        <button
                                            type="button"
                                            onClick={() => removeFont(font.value)}
                                            className="text-red-500 hover:text-red-700"
                                            aria-label={`הסר את ${font.label}`}
                                        >
                                            <FaTrash size={10} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newFont}
                                    onChange={(e) => setNewFont(e.target.value)}
                                    placeholder="שם גופן, לדוגמה Heebo"
                                    className={inputClass}
                                />
                                <button
                                    type="button"
                                    onClick={addFont}
                                    className="px-4 py-2 bg-gray-800 text-white text-sm font-bold rounded-lg hover:bg-gray-700 whitespace-nowrap"
                                >
                                    הוסף
                                </button>
                            </div>
                            <div className="mt-3 flex items-center gap-3 flex-wrap">
                                <label className={`cursor-pointer px-4 py-2 text-sm font-bold rounded-lg border border-gray-300 bg-white hover:bg-gray-50 ${fontUploading ? 'opacity-60 pointer-events-none' : ''}`}>
                                    {fontUploading ? 'מעלה גופן...' : 'העלאת קובץ גופן (OTF / TTF / WOFF)'}
                                    <input
                                        type="file"
                                        accept=".otf,.ttf,.woff,.woff2,font/otf,font/ttf,font/woff,font/woff2"
                                        className="hidden"
                                        onChange={onFontFile}
                                        disabled={fontUploading}
                                    />
                                </label>
                                <span className="text-xs text-gray-500">הגופן זמין אחרי השמירה גם בעורך המוצרים וגם בעורך התמונות.</span>
                            </div>
                            {fontError && <p className="text-xs text-red-600 mt-1">{fontError}</p>}
                            {fontNotice && <p className="text-xs text-green-700 mt-1">{fontNotice}</p>}
                        </div>

                        <div>
                            <span className="block text-sm font-medium text-gray-700 mb-2">צבעים מוכנים</span>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {textToolbar.colorPresets.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => removeColor(color)}
                                        className="w-8 h-8 rounded-md border border-gray-200 hover:ring-2 hover:ring-red-300 transition-all"
                                        style={{ backgroundColor: color }}
                                        title={`הסר ${color}`}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={newColor}
                                    onChange={(e) => setNewColor(e.target.value)}
                                    className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer"
                                />
                                <button
                                    type="button"
                                    onClick={addColor}
                                    className="px-4 py-2 bg-gray-800 text-white text-sm font-bold rounded-lg hover:bg-gray-700"
                                >
                                    הוסף צבע
                                </button>
                                <span className="text-xs text-gray-500">לחיצה על צבע קיים מסירה אותו</span>
                            </div>
                        </div>

                        <Field label="גודל גופן מינימלי">
                            <input
                                type="number"
                                min="1"
                                value={textToolbar.minFontSize}
                                onChange={(e) => onPatch({ minFontSize: Number(e.target.value) })}
                                className={inputClass}
                            />
                        </Field>
                        <Field label="גודל גופן מקסימלי">
                            <input
                                type="number"
                                min="2"
                                value={textToolbar.maxFontSize}
                                onChange={(e) => onPatch({ maxFontSize: Number(e.target.value) })}
                                className={inputClass}
                            />
                        </Field>
                    </div>
                </Card>
    );
}
