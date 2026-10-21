import { useState } from "react";
import { uploadDocumentToCloudinary } from "../../utils/cloudinaryUpload";

/** Admin: the club popup's texts and the automatic welcome email (subject, body, PDF gift) */
export default function ClubEditPanel({ draft, updateDraft }) {
    const [attachmentUploading, setAttachmentUploading] = useState(false);
    const [attachmentError, setAttachmentError] = useState("");
    const handleAttachmentFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setAttachmentUploading(true);
        setAttachmentError("");
        try {
            const url = await uploadDocumentToCloudinary(file);
            updateDraft({ welcomeAttachmentUrl: url });
        } catch (error) {
            setAttachmentError(error.message || "העלאת הקובץ נכשלה");
        } finally {
            setAttachmentUploading(false);
        }
    };

    return (
    <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full mx-auto text-right max-h-[80vh] overflow-y-auto">
        <h3 className="font-bold text-lg border-b pb-2 mb-4 text-gray-800">עריכת פופ-אפ מועדון</h3>
        <div className="flex flex-col gap-4">
            <div>
                <label className="block text-sm font-bold text-gray-700">כותרת ראשית:</label>
                <textarea className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={draft.title} onChange={(e) => updateDraft({ title: e.target.value })} />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700">כותרת משנית:</label>
                <textarea className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={draft.subtitle} onChange={(e) => updateDraft({ subtitle: e.target.value })} />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700">תיאור:</label>
                <textarea className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={draft.description} onChange={(e) => updateDraft({ description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <input type="text" className="border p-2 rounded" value={draft.inputNamePlaceholder} onChange={(e) => updateDraft({ inputNamePlaceholder: e.target.value })} placeholder="שם" />
                <input type="text" className="border p-2 rounded" value={draft.inputEmailPlaceholder} onChange={(e) => updateDraft({ inputEmailPlaceholder: e.target.value })} placeholder="מייל" />
                <input type="text" className="border p-2 rounded" value={draft.inputDatePlaceholder} onChange={(e) => updateDraft({ inputDatePlaceholder: e.target.value })} placeholder="תאריך" />
                <input type="text" className="border p-2 rounded" value={draft.btnText} onChange={(e) => updateDraft({ btnText: e.target.value })} placeholder="כפתור" />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700">הודעה אחרי הרשמה מוצלחת:</label>
                <textarea className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={draft.successText} onChange={(e) => updateDraft({ successText: e.target.value })} />
            </div>
            <div className="border-t pt-4 mt-2">
                <h4 className="font-bold text-gray-800 mb-1">מייל ההצטרפות האוטומטי</h4>
                <p className="text-xs text-gray-500 mb-3">
                    נשלח לכל מי שנרשם/ת. אפשר להשתמש ב-<code dir="ltr">{"{{name}}"}</code> (שם) ו-<code dir="ltr">{"{{code}}"}</code> (קוד ההטבה). ריק = הנוסח הקבוע של האתר.
                </p>
                <label className="block text-sm font-bold text-gray-700">נושא המייל:</label>
                <input type="text" className="w-full border border-gray-300 p-2 rounded mb-3" value={draft.welcomeSubject || ""} onChange={(e) => updateDraft({ welcomeSubject: e.target.value })} placeholder="ברוכים הבאים למועדון! 🎁" />
                <label className="block text-sm font-bold text-gray-700">תוכן המייל:</label>
                <textarea className="w-full border border-gray-300 p-2 rounded min-h-[120px] mb-3" value={draft.welcomeBody || ""} onChange={(e) => updateDraft({ welcomeBody: e.target.value })} placeholder={"היי {{name}}, איזה כיף שהצטרפת!\nקוד ההטבה שלך: {{code}}"} />
                <label className="block text-sm font-bold text-gray-700">מדריך PDF במתנה (מצורף למייל):</label>
                <div className="flex items-center gap-2 flex-wrap">
                    <label className="cursor-pointer text-sm px-3 py-1.5 rounded border border-gray-300 bg-gray-50 hover:bg-gray-100">
                        {attachmentUploading ? "מעלה..." : "העלאת PDF"}
                        <input type="file" accept="application/pdf" className="hidden" onChange={handleAttachmentFile} disabled={attachmentUploading} />
                    </label>
                    {draft.welcomeAttachmentUrl ? (
                        <>
                            <a href={draft.welcomeAttachmentUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline truncate max-w-[220px]" dir="ltr">{draft.welcomeAttachmentUrl}</a>
                            <button type="button" onClick={() => updateDraft({ welcomeAttachmentUrl: "" })} className="text-xs text-red-600 hover:underline">הסרה</button>
                        </>
                    ) : (
                        <span className="text-xs text-gray-500">אין קובץ מצורף</span>
                    )}
                </div>
                {attachmentError && <p className="text-xs text-red-600 mt-1">{attachmentError}</p>}
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700">טקסט צ'קבוקס:</label>
                <textarea className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={draft.checkboxText} onChange={(e) => updateDraft({ checkboxText: e.target.value })} />
            </div>
        </div>
    </div>
    );
}
