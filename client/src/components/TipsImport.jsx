import { useRef, useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { importTips } from '../api/tips';
import { uploadImageToCloudinary } from '../utils/cloudinaryUpload';
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

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (!/\.docx$/i.test(file.name)) {
            setMessage({ ok: false, text: 'יש לבחור קובץ Word בפורמט ‎.docx' });
            return;
        }
        setBusy('קורא את המסמך...');
        setMessage(null);
        try {
            const found = await readTipsFromDocx(file);
            setTips(found.map((tip) => ({ ...tip, selected: true })));
            if (!found.length) {
                setMessage({ ok: false, text: 'לא נמצאו טיפים. כל טיפ צריך להתחיל בשורה עם מספר, למשל "1. כותרת" או "טיפ מס\' 1".' });
            }
        } catch {
            setMessage({ ok: false, text: 'לא הצלחנו לקרוא את הקובץ. ודאי שזה מסמך Word תקין.' });
        } finally {
            setBusy('');
        }
    };

    const patchTip = (index, fields) => setTips((prev) => prev.map((tip, i) => (i === index ? { ...tip, ...fields } : tip)));
    const chosen = tips.filter((tip) => tip.selected);
    const missing = chosen.filter((tip) => !tip.title.trim() || !tip.content.trim() || !tip.images.length);

    const publish = async () => {
        setMessage(null);
        try {
            const prepared = [];
            for (let i = 0; i < chosen.length; i += 1) {
                const tip = chosen[i];
                setBusy(`מעלה תמונות (טיפ ${i + 1} מתוך ${chosen.length})...`);
                const images = [];
                for (let j = 0; j < tip.images.length; j += 1) {
                    const file = await dataUrlToFile(tip.images[j], `tip-${tip.number}-${j + 1}`);
                    images.push(await uploadImageToCloudinary(file));
                }
                prepared.push({ title: tip.title.trim(), content: tip.content.trim(), images });
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
                    <p className="text-xs text-gray-500">כל טיפ מתחיל בשורה עם מספר. הטקסט והתמונות שאחריה שייכים לו עד המספר הבא.</p>
                </div>
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={Boolean(busy)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-bold text-gray-700 hover:border-gray-300 disabled:opacity-50"
                >
                    <FileText size={16} />
                    בחירת קובץ Word
                </button>
                <input ref={fileRef} type="file" accept=".docx" className="hidden" onChange={handleFile} />
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
                            <div key={`${tip.number}-${index}`} className={`rounded-lg border p-3 bg-white ${tip.selected ? 'border-gray-200' : 'border-gray-100 opacity-50'}`}>
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
                                        <p className="text-xs text-gray-600 whitespace-pre-line line-clamp-3">{tip.content || 'אין טקסט'}</p>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {tip.images.map((src, i) => (
                                                <img key={i} src={src} alt="" className="w-12 h-12 object-cover rounded border" />
                                            ))}
                                            {!tip.images.length && <span className="text-xs text-amber-700">אין תמונה בטיפ הזה</span>}
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
