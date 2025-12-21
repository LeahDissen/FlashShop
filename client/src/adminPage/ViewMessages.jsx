import { useEffect, useState } from "react";
import { FaClock, FaEnvelope, FaReply, FaTrash, FaUser } from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";
import { Link } from "react-router-dom";

export default function ViewMessages() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            const data = await getAllMessages();
            setMessages(data);
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("האם למחוק את ההודעה הזו?")) {
            try {
                await deleteMessageRequest(id);
                setMessages(messages.filter(msg => msg._id !== id));
            } catch (error) {
                alert("שגיאה במחיקת ההודעה");
            }
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('he-IL', options);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 border-r-4 border-[#f2665e] pr-4">
                        הודעות מהאתר
                        <span className="text-sm font-normal text-gray-500 block mt-1">
                            סה"כ {messages.length} הודעות
                        </span>
                    </h1>
                    <Link
                        to="/admindashboard"
                        className="text-[#f2665e] transition-all font-bold p-2 gap-2 rounded-lg hover:bg-[#f2665e]/10 hover:-translate-y-1 flex items-center no-underline"
                    >
                        <span>חזרה ללוח הבקרה</span>
                        <FiArrowLeft className="text-xl" />
                    </Link>
                </div>
                {loading ? (
                    <div className="text-center py-20 text-gray-500 text-xl">טוען הודעות...</div>
                ) : messages.length === 0 ? (
                    <div className="bg-white rounded-xl shadow p-10 text-center">
                        <FaEnvelope className="mx-auto text-6xl text-gray-200 mb-4" />
                        <p className="text-xl text-gray-500">אין הודעות חדשות כרגע.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {messages.map((msg) => (
                            <div key={msg._id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-col border border-gray-100">
                                <div className="bg-[#f2665e]/10 p-4 border-b border-[#f2665e]/20 flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                            <FaUser className="text-[#f2665e]" size={14} />
                                            {msg.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                            <FaClock size={12} />
                                            {formatDate(msg.createdAt)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(msg._id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                        title="מחק הודעה"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                                <div className="p-5 flex-grow">
                                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {msg.message}
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 border-t flex justify-between items-center">
                                    <a
                                        href={`mailto:${msg.email}`}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-2"
                                    >
                                        <FaReply />
                                        השב למייל: {msg.email}
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}