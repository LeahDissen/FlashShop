import { useEffect, useMemo, useState } from 'react';
import { FaCheckCircle, FaImage, FaPaperPlane, FaTrash, FaUserPlus, FaUsers } from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";
import { Link } from "react-router-dom";
import { addClubMember, deleteClubMember, getClubMembers, sendBroadcastEmail } from "../api/club";

const RECIPIENT_LABELS = {
    all: "לכל חברי המועדון",
    new_members: "למצטרפים החודש",
    birthday: "לחוגגי יום הולדת החודש",
    selected: "לחברים שנבחרו",
};

const EMPTY_MEMBER = { name: "", email: "", birthDate: "" };

export default function SendMailToClub() {
    const [formData, setFormData] = useState({
        subject: "",
        recipientType: "all",
        message: "",
        image: null
    });
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(false);
    /** תוצאת השליחה האחרונה: כמה נשלחו, למי נכשל, אילו כתובות דולגו */
    const [sendResult, setSendResult] = useState(null);
    const [members, setMembers] = useState([]);
    const [membersLoading, setMembersLoading] = useState(true);
    const [newMember, setNewMember] = useState(EMPTY_MEMBER);
    const [addingMember, setAddingMember] = useState(false);
    const [memberMessage, setMemberMessage] = useState({ type: "", text: "" });

    const loadMembers = async () => {
        try {
            const data = await getClubMembers();
            setMembers(data);
        } catch (error) {
            console.error("Failed to load club members:", error);
        } finally {
            setMembersLoading(false);
        }
    };

    useEffect(() => {
        loadMembers();
    }, []);

    const activeMembers = useMemo(() => members.filter((m) => !m.unsubscribed), [members]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({ ...prev, image: e.target.files[0] }));
    };

    const toggleSelected = (id) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const toggleSelectAll = () => {
        setSelectedIds((prev) => (prev.length === activeMembers.length ? [] : activeMembers.map((m) => m._id)));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.subject || !formData.message) {
            alert("נא למלא כותרת ותוכן הודעה");
            return;
        }
        if (formData.recipientType === "selected" && selectedIds.length === 0) {
            alert("יש לסמן לפחות חבר/ה אחד/ת ברשימה");
            return;
        }

        setLoading(true);
        const data = new FormData();
        data.append("subject", formData.subject);
        data.append("recipientType", formData.recipientType);
        data.append("message", formData.message);
        if (formData.recipientType === "selected") {
            data.append("memberIds", JSON.stringify(selectedIds));
        }
        if (formData.image) {
            data.append("image", formData.image);
        }

        try {
            const result = await sendBroadcastEmail(data);
            setSendResult(result);
            setFormData({ subject: "", recipientType: "all", message: "", image: null });
            setSelectedIds([]);
        } catch (error) {
            console.error(error);
            const serverMsg = error.response?.data?.msg;
            alert(serverMsg || "אירעה שגיאה בשליחת המייל.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        setAddingMember(true);
        setMemberMessage({ type: "", text: "" });
        try {
            await addClubMember(newMember);
            setNewMember(EMPTY_MEMBER);
            setMemberMessage({ type: "success", text: "נוסף/ה למועדון" });
            await loadMembers();
        } catch (error) {
            setMemberMessage({ type: "error", text: error.response?.data?.msg || "שגיאה בהוספה" });
        } finally {
            setAddingMember(false);
        }
    };

    const handleDeleteMember = async (member) => {
        if (!confirm(`להסיר את ${member.name} (${member.email}) מהמועדון?`)) return;
        try {
            await deleteClubMember(member._id);
            setMembers((prev) => prev.filter((m) => m._id !== member._id));
            setSelectedIds((prev) => prev.filter((id) => id !== member._id));
        } catch (error) {
            alert(error.response?.data?.msg || "שגיאה בהסרה");
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
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8 border border-gray-100 mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-[#f2665e]/10 rounded-xl">
                        <FaUsers className="text-2xl text-[#f2665e]" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">חברי המועדון ({members.length})</h2>
                        <p className="text-gray-500 text-sm">
                            סימון חברים ברשימה מאפשר לשלוח מייל רק אליהם. מי שהסיר/ה את עצמו/ה מהתפוצה מסומן/ת ולא מקבל/ת דיוור.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleAddMember} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end mb-6 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <label className="block">
                        <span className="block text-xs font-bold text-gray-600 mb-1">שם</span>
                        <input type="text" value={newMember.name} onChange={(e) => setNewMember((p) => ({ ...p, name: e.target.value }))} required className="w-full p-2.5 border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-[#f2665e]" />
                    </label>
                    <label className="block">
                        <span className="block text-xs font-bold text-gray-600 mb-1">מייל</span>
                        <input type="email" dir="ltr" value={newMember.email} onChange={(e) => setNewMember((p) => ({ ...p, email: e.target.value }))} required className="w-full p-2.5 border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-[#f2665e]" />
                    </label>
                    <label className="block">
                        <span className="block text-xs font-bold text-gray-600 mb-1">תאריך לידה (אופציונלי)</span>
                        <input type="date" value={newMember.birthDate} onChange={(e) => setNewMember((p) => ({ ...p, birthDate: e.target.value }))} className="w-full p-2.5 border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-[#f2665e]" />
                    </label>
                    <button type="submit" disabled={addingMember} className="py-2.5 px-4 rounded-xl bg-[#f2665e] text-white font-bold hover:bg-[#d95248] disabled:opacity-50 flex items-center justify-center gap-2">
                        <FaUserPlus /> {addingMember ? "מוסיף..." : "הוספה ידנית"}
                    </button>
                    {memberMessage.text && (
                        <p className={`md:col-span-4 text-sm font-medium ${memberMessage.type === "success" ? "text-green-700" : "text-red-600"}`}>
                            {memberMessage.text}
                        </p>
                    )}
                </form>

                {membersLoading ? (
                    <p className="text-gray-500 text-center py-6">טוען רשימת חברים...</p>
                ) : members.length === 0 ? (
                    <p className="text-gray-500 text-center py-6">אין עדיין חברי מועדון רשומים</p>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-100 max-h-[420px] overflow-y-auto">
                        <table className="w-full text-right">
                            <thead className="bg-gray-50 text-gray-600 text-sm sticky top-0">
                                <tr>
                                    <th className="p-3 w-10">
                                        <input
                                            type="checkbox"
                                            aria-label="בחירת כל החברים הפעילים"
                                            checked={activeMembers.length > 0 && selectedIds.length === activeMembers.length}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="p-3 font-bold">שם</th>
                                    <th className="p-3 font-bold">מייל</th>
                                    <th className="p-3 font-bold">תאריך הצטרפות</th>
                                    <th className="p-3 font-bold">קוד מתנה</th>
                                    <th className="p-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.map((member) => (
                                    <tr key={member._id} className={`border-t border-gray-100 hover:bg-gray-50 ${member.unsubscribed ? "opacity-60" : ""}`}>
                                        <td className="p-3">
                                            <input
                                                type="checkbox"
                                                aria-label={`בחירת ${member.name}`}
                                                disabled={member.unsubscribed}
                                                checked={selectedIds.includes(member._id)}
                                                onChange={() => toggleSelected(member._id)}
                                            />
                                        </td>
                                        <td className="p-3">
                                            {member.name}
                                            {member.unsubscribed && (
                                                <span className="mr-2 text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-500">הוסר/ה מהתפוצה</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-[#f2665e]" dir="ltr">{member.email}</td>
                                        <td className="p-3 text-gray-500 text-sm">
                                            {new Date(member.createdAt).toLocaleDateString("he-IL")}
                                        </td>
                                        <td className="p-3 font-mono text-sm">{member.giftCode}</td>
                                        <td className="p-3">
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteMember(member)}
                                                className="text-gray-400 hover:text-red-600"
                                                aria-label={`הסרת ${member.name} מהמועדון`}
                                            >
                                                <FaTrash size={13} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
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
                                <option value="selected">רק חברים שסימנתי ברשימה ({selectedIds.length}) ✅</option>
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
                        <p className="text-xs text-gray-500 mt-1">לכל מייל מצורף אוטומטית קישור "להסרה מרשימת התפוצה", כנדרש בחוק.</p>
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
                                <span>שלח הודעה {RECIPIENT_LABELS[formData.recipientType] || ""}</span>
                                <FaPaperPlane />
                            </>
                        )}
                    </button>
                </form>
            </div>
            {sendResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSendResult(null)}></div>

                    <div className="relative bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl text-center" dir="rtl">
                        <button
                            onClick={() => setSendResult(null)}
                            className="absolute top-4 left-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                            aria-label="סגירה"
                        >
                            ✕
                        </button>
                        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${sendResult.sent > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                            <FaCheckCircle className="text-3xl" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-gray-800">{sendResult.msg}</h2>
                        {sendResult.failed?.length > 0 && (
                            <div className="text-right mt-4 bg-red-50 border border-red-100 rounded-xl p-3 text-sm">
                                <p className="font-bold text-red-700 mb-1">נכשלה השליחה ל-{sendResult.failed.length}:</p>
                                <ul className="text-red-600 space-y-0.5" dir="ltr">
                                    {sendResult.failed.map((email) => <li key={email}>{email}</li>)}
                                </ul>
                            </div>
                        )}
                        {sendResult.skipped?.length > 0 && (
                            <div className="text-right mt-3 bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm">
                                <p className="font-bold text-amber-700 mb-1">כתובות לא חוקיות שדולגו ({sendResult.skipped.length}):</p>
                                <ul className="text-amber-700 space-y-0.5" dir="ltr">
                                    {sendResult.skipped.map((email) => <li key={email}>{email}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
