import SmartImageInput from '../SmartImageInput';
import { DEFAULT_UPLOAD_BADGE_TEXT, HERO_HEIGHTS, HOME_TILE_COUNT, testimonialsOf } from './homeContent';

/** Admin: the home page's texts, hero image, product tiles and testimonials */
export default function HomeEditPanel({ draft, updateDraft, heroHeightKey, heroFocus, editTiles }) {
    const updateProduct = (index, field, value) => {
        const updated = [...(draft.products || [])];
        // Ensure slot exists
        while (updated.length <= index) updated.push({});
        updated[index] = { ...updated[index], [field]: value };
        updateDraft({ products: updated });
    };

    const updateTestimonial = (index, field, value) => {
        const updated = [...testimonialsOf(draft)];
        updated[index] = { ...updated[index], id: updated[index]?.id ?? index + 1, [field]: value };
        updateDraft({ testimonials: updated });
    };

    const addTestimonial = () => {
        const list = testimonialsOf(draft);
        updateDraft({
            testimonials: [...list, { id: Date.now(), text: "", name: "" }]
        });
    };

    const removeTestimonial = (index) => {
        const list = testimonialsOf(draft);
        updateDraft({ testimonials: list.filter((_, i) => i !== index) });
    };

    return (
        <div dir="rtl" className="space-y-5 text-right text-sm text-gray-700 p-3">
            <div>
                <label className="font-bold block mb-1">כותרת ראשית:</label>
                <input
                    type="text"
                    value={draft.title || ''}
                    className="w-full border rounded p-2"
                    onChange={(e) => updateDraft({ title: e.target.value })}
                />
            </div>
            <div>
                <label className="font-bold block mb-1">🖼 תמונת Hero:</label>
                <SmartImageInput
                    value={draft.mainImg || ''}
                    onChange={(url) => updateDraft({ mainImg: url })}
                    className="w-full border p-2 rounded ltr"
                    previewClassName="h-[80px] w-[80px] rounded object-cover border border-gray-200"
                />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <label className="block">
                    <span className="font-bold block mb-1">גובה התמונה:</span>
                    <select
                        value={heroHeightKey}
                        onChange={(e) => updateDraft({ heroHeight: e.target.value })}
                        className="w-full border rounded p-2"
                    >
                        {Object.entries(HERO_HEIGHTS).map(([key, { label }]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </label>
                <label className="block">
                    <span className="font-bold block mb-1">איזה חלק מהתמונה יוצג: {heroFocus <= 20 ? "למעלה" : heroFocus >= 80 ? "למטה" : "אמצע"}</span>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={heroFocus}
                        onChange={(e) => updateDraft({ heroFocus: Number(e.target.value) })}
                        className="w-full accent-[#f2665e]"
                    />
                </label>
            </div>
            <div>
                <label className="font-bold block mb-2">{HOME_TILE_COUNT} מוצרים — תמונה + שם + קישור (4 בשורה):</label>
                <div className="grid grid-cols-2 gap-3">
                    {editTiles.map((prod, index) => (
                        <div key={index} className="border rounded-xl p-3 bg-gray-50 space-y-2">
                            <p className="font-bold text-xs" style={{ color: '#ff5a5a' }}>מוצר {index + 1}</p>
                            <input
                                type="text"
                                placeholder="שם הקטגוריה"
                                value={prod?.name || ''}
                                className="w-full border rounded p-1.5 text-xs"
                                onChange={(e) => updateProduct(index, 'name', e.target.value)}
                            />
                            <SmartImageInput
                                placeholder="URL תמונה"
                                value={prod?.image || ''}
                                onChange={(url) => updateProduct(index, 'image', url)}
                                className="w-full border p-1.5 rounded ltr text-xs"
                                previewClassName="h-[48px] w-[48px] rounded object-cover border border-gray-200"
                            />
                            <input
                                type="text"
                                placeholder="קישור (ריק = מוצרים לפי שם הקטגוריה)"
                                value={prod?.link || ''}
                                className="w-full border rounded p-1.5 text-xs ltr"
                                dir="ltr"
                                onChange={(e) => updateProduct(index, 'link', e.target.value)}
                            />
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <label className="font-bold block mb-1">טקסט העיגול שמוביל להעלאת תמונות:</label>
                <input
                    type="text"
                    value={draft.uploadBadgeText || ''}
                    placeholder={DEFAULT_UPLOAD_BADGE_TEXT}
                    className="w-full border rounded p-2"
                    onChange={(e) => updateDraft({ uploadBadgeText: e.target.value })}
                />
            </div>
            <div>
                <label className="font-bold block mb-1">כפתור "לכל המוצרים":</label>
                <input
                    type="text"
                    value={draft.goToAll || ''}
                    className="w-full border rounded p-2"
                    onChange={(e) => updateDraft({ goToAll: e.target.value })}
                />
            </div>
            <div>
                <label className="font-bold block mb-1">כותרת "הסיפור שלנו":</label>
                <input
                    type="text"
                    value={draft.titleAbout || ''}
                    placeholder="זה הסיפור שלנו <"
                    className="w-full border rounded p-2"
                    onChange={(e) => updateDraft({ titleAbout: e.target.value })}
                />
            </div>
            <div>
                <label className="font-bold block mb-1">טקסט "הסיפור שלנו" (3–4 שורות על החנות):</label>
                <textarea
                    placeholder="כמה שורות על החנות: מי אנחנו, מה אנחנו עושות ולמה"
                    className="w-full border rounded p-2 h-28"
                    value={draft.textAbout || ''}
                    onChange={(e) => updateDraft({ textAbout: e.target.value })}
                />
            </div>
            <div>
                <label className="font-bold block mb-1">כותרת המלצות לקוחות:</label>
                <input
                    type="text"
                    value={draft.titleTestimonials || ''}
                    placeholder="תראו מה מספרים עלינו <"
                    className="w-full border rounded p-2"
                    onChange={(e) => updateDraft({ titleTestimonials: e.target.value })}
                />
            </div>
            <div>
                <label className="font-bold block mb-2">המלצות לקוחות:</label>
                <div className="space-y-3">
                    {testimonialsOf(draft).map((item, index) => (
                        <div key={item.id ?? index} className="border rounded-xl p-3 bg-gray-50 space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="font-bold text-xs" style={{ color: '#ff5a5a' }}>המלצה {index + 1}</p>
                                <button
                                    type="button"
                                    onClick={() => removeTestimonial(index)}
                                    className="text-xs text-red-500 hover:underline"
                                >
                                    מחק
                                </button>
                            </div>
                            <input
                                type="text"
                                placeholder="שם הלקוח/ה"
                                value={item?.name || ''}
                                className="w-full border rounded p-1.5 text-xs"
                                onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
                            />
                            <textarea
                                placeholder="טקסט ההמלצה"
                                value={item?.text || ''}
                                className="w-full border rounded p-1.5 text-xs h-20"
                                onChange={(e) => updateTestimonial(index, 'text', e.target.value)}
                            />
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addTestimonial}
                        className="w-full border border-dashed border-[#f2665e] text-[#f2665e] rounded-xl py-2 text-xs font-bold hover:bg-red-50 transition"
                    >
                        + הוסף המלצה
                    </button>
                </div>
            </div>
            <div>
                <label className="font-bold block mb-1">כפתור "לכל הטיפים":</label>
                <input
                    type="text"
                    value={draft.goToTips || ''}
                    className="w-full border rounded p-2"
                    onChange={(e) => updateDraft({ goToTips: e.target.value })}
                />
            </div>
        </div>
    );
}
