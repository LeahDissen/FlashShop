import { useState } from 'react';
import { FaCheckCircle, FaImage, FaPaperPlane } from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";
import { Link } from "react-router-dom";

export default function SendMailToClub() {
    const [formData, setFormData] = useState({
        subject: "",
        recipientType: "all",
        message: "",
        image: null
    });
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({ ...prev, image: e.target.files[0] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.subject || !formData.message) {
            alert("נא למלא כותרת ותוכן הודעה");
            return;
        }

        setLoading(true);
        const data = new FormData();
        data.append("subject", formData.subject);
        data.append("recipientType", formData.recipientType);
        data.append("message", formData.message);
        if (formData.image) {
            data.append("image", formData.image);
        }

        try {
            await sendBroadcastEmail(data);
            setShowSuccess(true);
            setFormData({ subject: "", recipientType: "all", message: "", image: null });
        } catch (error) {
            console.error(error);
            alert("אירעה שגיאה בשליחת המייל.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 relative">
            <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">שליחת מייל לחברי מועדון</h1>
                    <p className="text-gray-500">שמירה על קשר עם הלקוחות שלך מעולם לא הייתה קלה יותר</p>
                </div>
                <Link
                    to="/admindashboard"
                    className="text-[#f2665e] transition-all font-bold p-2 gap-2 rounded-lg hover:bg-[#f2665e]/10 hover:-translate-y-1 flex items-center no-underline"
                >
                    <span>חזרה ללוח הבקרה</span>
                    <FiArrowLeft className="text-xl" />
                </Link>
            </div>
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-700 font-bold mb-2">נושא המייל</label>
                            <input
                                type="text"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                placeholder="למשל: מבצע חם לסופ״ש! 🎁"
                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#f2665e] focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-bold mb-2">למי לשלוח?</label>
                            <select
                                name="recipientType"
                                value={formData.recipientType}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#f2665e] outline-none bg-white">
                                <option value="all">כל חברי המועדון 👥</option>
                                <option value="new_members">מצטרפים חדשים (החודש) ✨</option>
                                <option value="birthday">חוגגי יום הולדת החודש 🎂</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-700 font-bold mb-2">תוכן ההודעה</label>
                        <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            rows="8"
                            placeholder="כתבי כאן את תוכן המייל..."
                            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#f2665e] focus:border-transparent outline-none transition-all resize-none"
                        ></textarea>
                    </div>
                    <div>
                        <label className="block text-gray-700 font-bold mb-2">צרף תמונה (אופציונלי)</label>
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-all group">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <FaImage className="text-3xl text-gray-400 group-hover:text-[#f2665e] mb-2 transition-colors" />
                                <p className="text-sm text-gray-500">
                                    {formData.image ? formData.image.name : "לחצי להעלאת תמונה"}
                                </p>
                            </div>
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        </label>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transform transition-all flex items-center justify-center gap-3
                            ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-[#f2665e] to-[#d95248] hover:shadow-xl hover:-translate-y-1"}`}
                    >
                        {loading ? "שולח..." : (
                            <>
                                <span>שלח הודעה לכולם</span>
                                <FaPaperPlane />
                            </>
                        )}
                    </button>
                </form>
            </div>
            {showSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSuccess(false)}></div>

                    <div className="relative bg-[#f0645a] rounded-full w-[300px] h-[300px] md:w-[400px] md:h-[400px] flex flex-col items-center justify-center text-center p-8 shadow-2xl text-white animate-bounce-in">
                        <button
                            onClick={() => setShowSuccess(false)}
                            className="absolute top-8 right-8 text-red-800/70 hover:text-red-900 transition-colors text-3xl font-bold bg-white/20 rounded-full p-1 w-10 h-10 flex items-center justify-center"
                        >
                            ✕
                        </button>
                        <div className="bg-white/20 p-4 rounded-full mb-4">
                            <FaCheckCircle className="text-5xl text-white" />
                        </div>
                        <h2 className="text-3xl font-bold mb-2">המייל נשלח בהצלחה!</h2>
                        <p className="text-lg opacity-90">ההודעה בדרך ללקוחות שלך.</p>
                        <div className="absolute top-10 left-10 w-16 h-16 bg-white/10 rounded-full pointer-events-none"></div>
                        <div className="absolute bottom-10 right-10 w-10 h-10 bg-white/10 rounded-full pointer-events-none"></div>
                    </div>
                </div>
            )}
        </div>
    );
}