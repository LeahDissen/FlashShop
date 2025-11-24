import { useEffect, useState } from "react";
import axios from "axios";
import AdminControls from "./AdminControls";
import { useAdminControl } from "../hooks/useAdminControl";


import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaClock } from "react-icons/fa";

export default function Footer() {
    const isAdmin = localStorage.getItem("admin");
    const adminControls = useAdminControl(
        {
            noteTitle: "",
            notePlaceholderName: "",
            notePlaceholderEmail: "",
            notePlaceholderMessage: "",
            noteButtonText: "",
            creditNote: "",
            contactAddress: "",
            contactPhone: "",
            contactEmail: "",
            contactInfo: "",
        },
        "footer"
    );
    const { draft, updateDraft, editMode } = adminControls;
    const [contactForm, setContactForm] = useState({
        name: "",
        email: "",
        message: "",
    });
    const [sending, setSending] = useState(false);
    const [statusMsg, setStatusMsg] = useState(null);
    const handleContactFormChange = (field, value) => {
        setContactForm((prev) => ({ ...prev, [field]: value }));
    };

    // inside Footer.jsx component (replace the current handleSubmit)


    const handleSubmit = async (e) => {
        e.preventDefault();

        // basic validation
        if (!contactForm.name?.trim() || !contactForm.email?.trim() || !contactForm.message?.trim()) {
            setStatusMsg({ type: 'error', text: 'מלא/י שם, אימייל והודעה.' });
            return;
        }
        // basic email regex
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRe.test(contactForm.email)) {
            setStatusMsg({ type: 'error', text: 'כתובת אימייל לא תקינה.' });
            return;
        }

        try {
            setSending(true);
            setStatusMsg(null);

            // בצע POST לשרת - החלף את הכתובת בהתאם לאן תרצי לשלוח
            // אפשר לבחור: http://localhost:5000/contact או http://localhost:4000/api/contact
            const res = await axios.post('http://localhost:5000/contact', contactForm, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.status === 200 || res.status === 201) {
                setStatusMsg({ type: 'success', text: 'ההודעה נשלחה בהצלחה. תודה!' });
                setContactForm({ name: '', email: '', message: '' }); // נקה טופס
            } else {
                setStatusMsg({ type: 'error', text: 'אירעה שגיאה בשליחת ההודעה. נסה/י שנית.' });
            }
        } catch (err) {
            console.error('contact send error', err);
            setStatusMsg({ type: 'error', text: 'שגיאה ברשת או בשרת. נא לנסות שוב מאוחר יותר.' });
        } finally {
            setSending(false);
        }
    };

    // helper to format phone for tel: link (remove spaces and non-digit except leading +)
    const formatPhoneForLink = (phone) => {
        if (!phone) return "";
        // keep plus and digits only
        return phone.replace(/[^+\d]/g, "");
    };

    const formatEmailForLink = (email) => {
        if (!email) return "";
        return encodeURIComponent(email);
    };

    useEffect(() => {
        axios.get("http://localhost:4000/api/page/footer").then((res) => {
            adminControls.setPage(res.data);
            adminControls.setDraft(res.data);
        });
    }, []);

    const EditContent = (

        <>
            <div className="sendANote">
                <input
                    type="text"
                    value={draft.noteTitle}
                    onChange={(e) => updateDraft({ noteTitle: e.target.value })}
                    placeholder="Note Title"
                    style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
                />
                <input
                    type="text"
                    value={draft.notePlaceholderName}
                    onChange={(e) => updateDraft({ notePlaceholderName: e.target.value })}
                    placeholder="Name Placeholder"
                    style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
                />
                <input
                    type="text"
                    value={draft.notePlaceholderEmail}
                    onChange={(e) => updateDraft({ notePlaceholderEmail: e.target.value })}
                    placeholder="Email Placeholder"
                    style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
                />
                <input
                    type="text"
                    value={draft.notePlaceholderMessage}
                    onChange={(e) => updateDraft({ notePlaceholderMessage: e.target.value })}
                    placeholder="Message Placeholder"
                    style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
                />
            </div>
            <div className="contactInfo" style={{ marginTop: "30px" }}>
                <input
                    type="text"
                    value={draft.contactAddress}
                    onChange={(e) => updateDraft({ contactAddress: e.target.value })}
                    placeholder="Contact Address"
                    style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
                />
                <input
                    type="text"
                    value={draft.contactInfo}
                    onChange={(e) => updateDraft({ contactInfo: e.target.value })}
                    placeholder="Contact Information"
                    style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
                />
                <input
                    type="text"
                    value={draft.contactPhone}
                    onChange={(e) => updateDraft({ contactPhone: e.target.value })}
                    placeholder={draft.contactPhone}
                    style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
                />
                <input
                    type="email"
                    value={draft.contactEmail}
                    onChange={(e) => updateDraft({ contactEmail: e.target.value })}
                    placeholder={draft.contactEmail}
                    style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
                />
                <input
                    type="text"
                    value={draft.creditNote}
                    onChange={(e) => updateDraft({ creditNote: e.target.value })}
                    placeholder="Credit Note"
                    style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
                />
            </div>
        </>
    );

    const ViewContent = (
        <footer className="w-full bg-[#f2665e] py-12 px-4 sm:px-8 text-white">

            <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 px-4 lg:px-8 items-start" dir="rtl">

                <div className="sendANote pr-0 md:pr-8">
                    <h2 dir="rtl" className="text-xl font-semibold mb-4 text-right" style={{ fontFamily: 'Noto Sans Hebrew, sans-serif' }}>
                        {draft.noteTitle}
                    </h2>

                    <form
                        className="flex flex-col gap-3"
                        onSubmit={handleSubmit}
                    >
                        <div className="relative">
                            <input
                                type="text"
                                placeholder={draft.notePlaceholderName}
                                value={contactForm.name} // <-- ADD THIS
                                className="w-full h-8 bg-white/70 px-3 rounded text-[#f2665e] placeholder:text-[#f2665e]/70 text-right text-sm"
                                style={{ fontFamily: 'Noto Sans Hebrew, sans-serif' }}
                                onChange={(e) => handleContactFormChange("name", e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <input
                                type="email"
                                placeholder={draft.notePlaceholderEmail}
                                value={contactForm.email} // <-- ADD THIS
                                className="w-full h-8 bg-white/70 px-3 rounded text-[#f2665e] placeholder:text-[#f2665e]/70 text-right text-sm"
                                style={{ fontFamily: 'Noto Sans Hebrew, sans-serif' }}
                                onChange={(e) => handleContactFormChange("email", e.target.value)}
                                aria-label="אימייל"
                            />
                        </div>
                        <div className="relative">
                            <textarea
                                placeholder={draft.notePlaceholderMessage}
                                value={contactForm.message} // <-- ADD THIS
                                className="w-full h-24 bg-white/70 px-3 py-2 rounded resize-none text-[#f2665e] placeholder:text-[#f2665e]/70 text-right text-sm"
                                style={{ fontFamily: 'Noto Sans Hebrew, sans-serif' }}
                                onChange={(e) => handleContactFormChange("message", e.target.value)}
                                aria-label="ההודעה שלי"
                            />
                        </div>
                        {statusMsg && (
                            <div className={`mt-3 ${statusMsg.type === 'error' ? 'text-red-200' : 'text-green-200'}`}>
                                {statusMsg.text}
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={sending}
className="bg-white text-[#f2665e] px-6 py-2 rounded hover:bg-gray-100 font-semibold transition-colors"                            style={{ fontFamily: 'Noto Sans Hebrew, sans-serif' }}>
                            {sending ? 'שולח...' : 'שלח'}
                        </button>
                    </form>
                </div>

                {/* --- עמודה 2: פרטי יצירת קשר (צד שמאלי) --- */}
                <div className="contactInfo flex flex-col items-center md:items-start">
                    <iframe
                        title="map"
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(draft.contactAddress)}&output=embed&t=m`}
                        height="140"
                        style={{ border: 0 }}
                        allowFullScreen=""
                        loading="lazy"
                        className="w-full max-w-[260px] mx-auto md:mx-0 mb-4 rounded shadow-md"
                    ></iframe>
                    {/* כתובת: הקטנתי גופן, תיקנתי יישור והפכתי סדר אייקון */}
                    <address className="font-normal text-sm [font-family:'Noto_Sans_Hebrew',Helvetica] tracking-[0] leading-[normal] [direction:rtl] not-italic mb-4 flex items-center justify-start">
                        {/* תיקון יישור: justify-start (במקום end) עובד נכון ב-RTL
                          תיקון סדר: האייקון עכשיו *לפני* הטקסט ב-JSX
                          תיקון גודל: w-4 h-4 (במקום w-5 h-5) ו-ml-2 (במקום mr-2)
                        */}
                        <FaMapMarkerAlt className="inline-block w-4 h-4 ml-2" />
                        {draft.contactAddress}
                    </address>



                    {/* הקטנתי גופן (text-sm) והוספתי text-right */}
                    <p className="[font-family:'Noto_Sans_Hebrew',Helvetica] font-normal text-sm tracking-[0] leading-[normal] [direction:rtl] mb-4 text-right">
                        <span className="flex items-center justify-start mb-1">
                            <FaClock className="inline-block w-4 h-4 ml-2" />
                            <span>{draft.contactInfo}</span>
                        </span>
                        <br />

                        <a href={`tel:${formatPhoneForLink(draft.contactPhone)}`} className="hover:underline flex items-center justify-start" style={{ color: '#ffffff' }}>
                            <FaPhoneAlt className="inline-block w-4 h-4 ml-2" />
                            {draft.contactPhone}
                        </a>
                        <br />

                        <a href={`mailto:${formatEmailForLink(draft.contactEmail)}`} className="hover:underline flex items-center justify-start" style={{ color: '#ffffff' }}>
                            <FaEnvelope className="inline-block w-4 h-4 ml-2" />
                            {draft.contactEmail}
                        </a>
                    </p>

                    {/* הקטנתי גופן (text-sm) */}
                    <p className="font-normal text-sm text-center [font-family:'Noto_Sans_Hebrew',Helvetica] tracking-[0] leading-[normal] [direction:rtl] mt-auto pt-4">
                        {draft.creditNote}
                    </p>
                </div>

            </div>
        </footer>
    );


    return (
        <>
            {isAdmin ? (
                <AdminControls
                    isAdmin={isAdmin}
                    editMode={editMode}
                    previewContent={EditContent}
                    adminControls={adminControls}
                >
                    {ViewContent}
                </AdminControls>
            ) : (
                ViewContent
            )}
        </>
    );
}