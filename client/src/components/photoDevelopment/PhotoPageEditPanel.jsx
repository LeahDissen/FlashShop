import SmartImageInput from '../SmartImageInput';

/** Admin: the photo development page's background image, titles and button text */
export default function PhotoPageEditPanel({ draft, updateDraft }) {
    return (
    <div className="bg-white p-6 rounded-lg space-y-4 text-right" dir="rtl">
        <h3 className="font-bold text-lg border-b pb-2">עריכת עמוד פיתוח תמונות</h3>

        <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">תמונת רקע עליונה (URL):</label>
            <SmartImageInput
                value={draft.img}
                onChange={(url) => updateDraft({ img: url })}
                className="w-full border p-2 rounded ltr"
            />
        </div>

        <div>
            <label className="block text-sm font-bold text-gray-700">כותרת ראשית:</label>
            <input
                type="text"
                value={draft.title}
                onChange={(e) => updateDraft({ title: e.target.value })}
                className="w-full border p-2 rounded"
            />
        </div>

        <div>
            <label className="block text-sm font-bold text-gray-700">כותרת משנית:</label>
            <textarea
                value={draft.subtitle}
                onChange={(e) => updateDraft({ subtitle: e.target.value })}
                className="w-full border p-2 rounded h-20"
            />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-bold text-gray-700">טקסט כפתור ראשי:</label>
                <input
                    type="text"
                    value={draft.btnText}
                    onChange={(e) => updateDraft({ btnText: e.target.value })}
                    className="w-full border p-2 rounded"
                />
            </div>
        </div>
    </div>
    );
}
