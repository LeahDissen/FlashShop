import { useRef, useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { importTips } from '../api/tips';
import { uploadImageToCloudinary } from '../utils/cloudinaryUpload';
import { stripImageMarkers } from '../utils/tipBody';
import { dataUrlToFile, readTipsFromDocx } from '../utils/tipsDocx';

/**
 * Admin, on the tips page: upload a Word document of numbered tips, check the tips found
 * (uncheck, fix titles), then publish – images go to Cloudinary and each tip becomes a tip on the site.
 */
export default function TipsImport({ onImported }) {
    const fileRef = useRef(null);
    const [tips, setTips] = useState([]);
    const [busy, setBusy] = useState('');
    const [message, setMessage] = useState(null);

    // One or more Word files at once: a file of numbered tips gives several, a file without numbers one tip
    const handleFiles = async (e) => {
        const files = Array.from(e.target.files || []);
        e.target.value = '';
        if (!files.length) return;
        const notWord = files.filter((file) => !/\.docx$/i.test(file.name));
        const docs = files.filter((file) => /\.docx$/i.test(file.name));
        setBusy('קורא את המסמכים...');
        setMessage(null);
        const found = [];
        const failed = notWord.map((file) => file.name);
        for (const file of docs) {
            try {
                found.push(...(await readTipsFromDocx(file)).map((tip) => ({ ...tip, selected: true, file: file.name })));
            } catch {
                failed.push(file.name);
            }
        }
        // Files chosen now are added to the tips already found, so documents can be added one by one too
        setTips((prev) => [...prev, ...found]);
        if (failed.length) {
            setMessage({ ok: false, text: `לא הצלחנו לקרוא: ${failed.join(', ')}. יש לבחור מסמכי Word בפורמט ‎.docx.` });
        } else if (!found.length) {
            setMessage({ ok: false, text: 'לא נמצאו טיפים בקבצים שנבחרו.' });
        }
        setBusy('');
    };

    const patchTip = (index, fields) => setTips((prev) => prev.map((tip, i) => (i === index ? { ...tip, ...fields } : tip)));
    const chosen = tips.filter((tip) => tip.selected);
    const missing = chosen.filter((tip) => !tip.title.trim() || !tip.content.trim() || !tip.mainImage);

    const publish = async () => {
        setMessage(null);
        try {
            const prepared = [];
            for (let i = 0; i < chosen.length; i += 1) {
                const tip = chosen[i];
                setBusy(`מעלה תמונות (טיפ ${i + 1} מתוך ${chosen.length})...`);
                // The main image and the body images, in the order of their "[[תמונה N]]" lines
                const uploaded = new Map();
                const upload = async (dataUrl, name) => {
                    if (!uploaded.has(dataUrl)) uploaded.set(dataUrl, await uploadImageToCloudinary(await dataUrlToFile(dataUrl, name)));
                    return uploaded.get(dataUrl);
                };
                const img = await upload(tip.mainImage, `tip-${tip.number}-main`);
                const images = [];
                for (let j = 0; j < tip.images.length; j += 1) {
                    images.push(await upload(tip.images[j], `tip-${tip.number}-${j + 1}`));
                }
                prepared.push({ title: tip.title.trim(), content: tip.content.trim(), img, images });
            }
            setBusy('שומר את הטיפים...');
            const { count, tips: saved } = await importTips(prepared);
            setTips([]);
            setMessage({ ok: true, text: `${count} טיפים פורסמו באתר.` });
            onImported?.(saved);
        } catch (err) {
            setMessage({ ok: false, text: err.response?.data?.msg || err.message || 'הפרסום נכשל. נסי שוב.' });
        } finally {
            setBusy('');
        }
    };

    return (
        <div className="rounded-xl border border-dashed border-[#f2665e]/40 bg-[#fffaf9] p-4 text-right space-y-3" dir="rtl">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <p className="font-bold text-gray-800">ייבוא טיפים ממסמך Word</p>
                    <p className="text-xs text-gray-500">אפשר לבחור כמה קבצים יחד. בקובץ עם כמה טיפים, כל טיפ מתחיל בשורה עם מספר. קובץ בלי מספרים הוא טיפ אחד. התמונה הראשונה היא התמונה הראשית, והשאר יופיעו בתוך הטיפ במקום שלהן.</p>
                </div>
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={Boolean(busy)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-bold text-gray-700 hover:border-gray-300 disabled:opacity-50"
                >
                    <FileText size={16} />
                    בחירת קובצי Word
                </button>
                <input ref={fileRef} type="file" accept=".docx" multiple className="hidden" onChange={handleFiles} />
            </div>

            {busy && (
                <p className="text-sm text-gray-600 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> {busy}</p>
            )}
            {message && <p className={`text-sm ${message.ok ? 'text-green-700' : 'text-red-600'}`}>{message.text}</p>}

            {tips.length > 0 && (
                <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-700">נמצאו {tips.length} טיפים. אפשר לתקן כותרות ולהוריד סימון מטיפים שלא צריך:</p>
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                        {tips.map((tip, index) => (
                            <div key={`${tip.file}-${tip.number}-${index}`} className={`rounded-lg border p-3 bg-white ${tip.selected ? 'border-gray-200' : 'border-gray-100 opacity-50'}`}>
                                <div className="flex items-start gap-2">
                                    <input
                                        type="checkbox"
                                        checked={tip.selected}
                                        onChange={(e) => patchTip(index, { selected: e.target.checked })}
                                        aria-label={`לפרסם את טיפ ${tip.number}`}
                                        className="mt-2"
                                    />
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <input
                                            type="text"
                                            value={tip.title}
                                            onChange={(e) => patchTip(index, { title: e.target.value })}
                                            aria-label={`כותרת טיפ ${tip.number}`}
                                            className="w-full p-1.5 border border-gray-200 rounded text-sm font-bold"
                                        />
                                        <p className="text-xs text-gray-600 whitespace-pre-line line-clamp-3">{stripImageMarkers(tip.content) || 'אין טקסט'}</p>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {[tip.mainImage, ...tip.images].filter((src, i, all) => src && all.indexOf(src) === i).map((src, i) => (
                                                <img key={i} src={src} alt="" className="w-12 h-12 object-cover rounded border" />
                                            ))}
                                            {!tip.mainImage && <span className="text-xs text-amber-700">אין תמונה בטיפ הזה</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {missing.length > 0 && (
                        <p className="text-xs text-amber-700">לכל טיפ צריך כותרת, טקסט ולפחות תמונה אחת. יש להשלים או להוריד סימון מ-{missing.length} טיפים.</p>
                    )}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={publish}
                            disabled={Boolean(busy) || !chosen.length || missing.length > 0}
                            className="px-5 py-2 rounded-lg bg-[#f2665e] text-white text-sm font-bold hover:bg-[#d95248] disabled:opacity-50"
                        >
                            פרסום {chosen.length} טיפים
                        </button>
                        <button type="button" onClick={() => setTips([])} disabled={Boolean(busy)} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
                            ביטול
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
