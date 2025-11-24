import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCloudUploadAlt, FaFilePdf, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import axios from 'axios';

export default function UpdateCatalog() {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setMessage({ type: '', text: '' });
        } else {
            setFile(null);
            setMessage({ type: 'error', text: 'נא לבחור קובץ PDF בלבד' });
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('catalog', file);

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // שליחה לשרת - נדרש להוסיף את הנתיב הזה בשרת (הסבר בהמשך)
            await axios.post('http://localhost:5000/admin/upload-catalog', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });

            setMessage({ type: 'success', text: 'הקטלוג עודכן בהצלחה! 🎉' });
            setFile(null);
        } catch (error) {
            console.error("Upload error:", error);
            setMessage({ type: 'error', text: 'שגיאה בהעלאת הקובץ. נסה שוב מאוחר יותר.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 relative" dir="rtl">
            {/* כותרת עליונה */}
            <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">ניהול קטלוג מוצרים</h1>
                    <p className="text-gray-500">כאן ניתן לעדכן את קובץ ה-PDF שהלקוחות מורידים מהאתר</p>
                </div>
                <Link to="/admindashboard" className="text-[#f2665e] hover:underline font-bold flex items-center gap-2">
                    חזרה ללוח בקרה &larr;
                </Link>
            </div>

            <div className="max-w-2xl mx-auto">
                {/* כרטיס קטלוג נוכחי */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-red-100 p-3 rounded-full text-[#f2665e]">
                            <FaFilePdf size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">הקטלוג הנוכחי באתר</h3>
                            <p className="text-sm text-gray-500">זמין להורדה ללקוחות</p>
                        </div>
                    </div>
                    <a
                        href="/My-Product-Catalog.pdf"
                        target="_blank"
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                        צפייה בקובץ
                    </a>
                </div>

                {/* אזור העלאה */}
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 text-center">
                    <div className={`border-2 border-dashed rounded-2xl p-10 transition-all ${file ? 'border-[#f2665e] bg-red-50' : 'border-gray-300 hover:border-[#f2665e] hover:bg-gray-50'}`}>
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileChange}
                            className="hidden"
                            id="catalog-upload"
                        />
                        <label htmlFor="catalog-upload" className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                            {file ? (
                                <>
                                    <FaFilePdf className="text-5xl text-[#f2665e] mb-4" />
                                    <span className="text-lg font-semibold text-gray-800">{file.name}</span>
                                    <span className="text-sm text-gray-500 mt-2">לחצי להחלפה</span>
                                </>
                            ) : (
                                <>
                                    <FaCloudUploadAlt className="text-6xl text-gray-300 mb-4" />
                                    <span className="text-lg font-medium text-gray-600">גררי קובץ לכאן או לחצי לבחירה</span>
                                    <span className="text-sm text-gray-400 mt-2">קובץ PDF בלבד (עד 10MB)</span>
                                </>
                            )}
                        </label>
                    </div>

                    {/* הודעות שגיאה/הצלחה */}
                    {message.text && (
                        <div className={`mt-6 p-3 rounded-lg flex items-center justify-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {message.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
                            {message.text}
                        </div>
                    )}

                    {/* כפתור שמירה */}
                    <button
                        onClick={handleUpload}
                        disabled={!file || loading}
                        className={`mt-8 w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transform transition-all
                            ${!file || loading
                                ? "bg-gray-300 cursor-not-allowed"
                                : "bg-gradient-to-r from-[#f2665e] to-[#d95248] hover:shadow-xl hover:-translate-y-1"
                            }`}
                    >
                        {loading ? 'מעלה קובץ...' : 'עדכן קטלוג באתר'}
                    </button>
                </div>
            </div>
        </div>
    );
}