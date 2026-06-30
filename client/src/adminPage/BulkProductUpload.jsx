import { useRef, useState } from 'react';
import { FaCloudUploadAlt, FaDownload, FaFileExcel, FaFolderOpen, FaPlay } from 'react-icons/fa';
import {
    downloadBulkProductTemplate,
    parseSpreadsheetFile,
    runBulkProductUpload,
} from '../utils/bulkProductUpload';

export default function BulkProductUpload({ onComplete }) {
    const spreadsheetRef = useRef(null);
    const imagesRef = useRef(null);
    const folderRef = useRef(null);

    const [spreadsheetFile, setSpreadsheetFile] = useState(null);
    const [imageFiles, setImageFiles] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0, label: '' });
    const [report, setReport] = useState(null);
    const [error, setError] = useState('');

    const handleSpreadsheetChange = (e) => {
        const file = e.target.files?.[0] ?? null;
        setSpreadsheetFile(file);
        setReport(null);
        setError('');
    };

    const handleImagesChange = (e) => {
        const files = Array.from(e.target.files ?? []).filter((f) => f.type?.startsWith('image/'));
        setImageFiles(files);
        setReport(null);
        setError('');
        if (folderRef.current) folderRef.current.value = '';
    };

    const handleFolderChange = (e) => {
        const files = Array.from(e.target.files ?? []).filter((f) => f.type?.startsWith('image/'));
        setImageFiles(files);
        setReport(null);
        setError('');
        if (imagesRef.current) imagesRef.current.value = '';
    };

    const resetInputs = () => {
        if (spreadsheetRef.current) spreadsheetRef.current.value = '';
        if (imagesRef.current) imagesRef.current.value = '';
        if (folderRef.current) folderRef.current.value = '';
        setSpreadsheetFile(null);
        setImageFiles([]);
    };

    const handleBulkUpload = async () => {
        if (!spreadsheetFile) {
            setError('יש לבחור קובץ אקסל או CSV');
            return;
        }
        if (imageFiles.length === 0) {
            setError('יש לבחור תמונות או תיקייה');
            return;
        }

        setProcessing(true);
        setError('');
        setReport(null);
        setProgress({ current: 0, total: 0, label: '' });

        try {
            const rows = await parseSpreadsheetFile(spreadsheetFile);
            if (!rows.length) {
                setError('הקובץ לא מכיל שורות מוצרים');
                return;
            }

            const result = await runBulkProductUpload({
                rows,
                imageFiles,
                onProgress: ({ current, total, label }) => {
                    setProgress({ current, total, label });
                },
            });

            setReport(result);
            if (result.successCount > 0) {
                onComplete?.();
            }
        } catch (err) {
            setError(err?.message || 'שגיאה בעיבוד ההעלאה המרוכזת');
        } finally {
            setProcessing(false);
        }
    };

    const progressPercent = progress.total
        ? Math.round((progress.current / progress.total) * 100)
        : 0;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FaCloudUploadAlt className="text-[#f2665e]" />
                        העלאת מוצרים מרוכזת
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        העלו קובץ אקסל/CSV ותיקיית תמונות — המערכת תיצור מוצרים אוטומטית
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        עמודת משפטים (captions): הפרידו בין משפטים ב-; ובין טקסט לקטגוריה ב-|
                    </p>
                </div>
                <button
                    type="button"
                    onClick={downloadBulkProductTemplate}
                    disabled={processing}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[#f2665e]/30 text-[#f2665e] font-bold text-sm hover:bg-[#fff5f4] transition disabled:opacity-50"
                >
                    <FaDownload />
                    הורדת קובץ אקסל לדוגמה
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        קובץ אקסל / CSV
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#f2665e]/50 hover:bg-gray-50 transition">
                        <FaFileExcel className="text-2xl text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 text-center px-3">
                            {spreadsheetFile ? spreadsheetFile.name : 'בחרו קובץ .xlsx, .xls או .csv'}
                        </span>
                        <input
                            ref={spreadsheetRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            className="hidden"
                            disabled={processing}
                            onChange={handleSpreadsheetChange}
                        />
                    </label>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        תמונות (קבצים מרובים או תיקייה)
                    </label>
                    <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 px-4">
                        <FaFolderOpen className="text-2xl text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 text-center mb-3">
                            {imageFiles.length > 0
                                ? `${imageFiles.length} קבצי תמונה נבחרו`
                                : 'בחרו תמונות בודדות או תיקייה שלמה'}
                        </span>
                        <div className="flex flex-wrap gap-2 justify-center">
                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-gray-200 hover:border-[#f2665e]/40 cursor-pointer transition">
                                בחירת תמונות
                                <input
                                    ref={imagesRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    disabled={processing}
                                    onChange={handleImagesChange}
                                />
                            </label>
                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-gray-200 hover:border-[#f2665e]/40 cursor-pointer transition">
                                בחירת תיקייה
                                <input
                                    ref={folderRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    webkitdirectory=""
                                    directory=""
                                    className="hidden"
                                    disabled={processing}
                                    onChange={handleFolderChange}
                                />
                            </label>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">
                        שמות הקבצים חייבים להתאים בדיוק לעמודת imageFile באקסל
                    </p>
                </div>
            </div>

            {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm text-right">
                    {error}
                </div>
            )}

            {processing && (
                <div className="mt-5 p-4 rounded-xl bg-[#fff9f8] border border-[#f2665e]/20">
                    <p className="text-sm font-bold text-gray-800 mb-2 text-right">
                        מעלה מוצר {progress.current} מתוך {progress.total || '...'}
                        {progress.label ? ` — ${progress.label}` : ''}
                        ... אנא אל תסגור את העמוד
                    </p>
                    <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#f2665e] transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5 text-left ltr">{progressPercent}%</p>
                </div>
            )}

            {report && (
                <div className="mt-5 p-4 rounded-xl border border-gray-200 bg-gray-50 text-right">
                    <p className="font-bold text-gray-800 mb-2">דוח סיכום</p>
                    <p className="text-sm text-green-700">
                        {report.successCount} מוצרים הועלו בהצלחה.
                    </p>
                    {report.failureCount > 0 && (
                        <>
                            <p className="text-sm text-red-600 mt-1">
                                {report.failureCount} מוצרים נכשלו:
                            </p>
                            <ul className="mt-2 text-xs text-red-700 space-y-1 max-h-40 overflow-y-auto">
                                {report.failures.map((msg, i) => (
                                    <li key={i}>• {msg}</li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={handleBulkUpload}
                    disabled={processing || !spreadsheetFile || imageFiles.length === 0}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-white bg-[#f2665e] hover:bg-[#d95248] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FaPlay className="text-sm" />
                    החל העלאה מרוכזת
                </button>
                {!processing && (spreadsheetFile || imageFiles.length > 0) && (
                    <button
                        type="button"
                        onClick={resetInputs}
                        className="px-4 py-2.5 rounded-lg font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
                    >
                        נקה בחירה
                    </button>
                )}
            </div>
        </div>
    );
}
