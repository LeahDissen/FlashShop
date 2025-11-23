import { useEffect, useState } from "react";
import { getPage } from "../api/pages";
import AdminControls from "./AdminControls";
import { useAdminControl } from "../hooks/useAdminControl";


import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaClock } from "react-icons/fa";

export default function Footer() {
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

    const handleContactFormChange = (field, value) => {
        setContactForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Contact form submitted:", contactForm);
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
        getPage("terms").then((data) => {
            adminControls.setPage(data);
            adminControls.setDraft(data);
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
        <footer className="w-full bg-[#f2665e] py-14 px-8 text-white" dir="rtl" style={{ fontFamily: "'Noto Sans Hebrew', sans-serif" }}>
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
                {/* טופס יצירת קשר */}
                <div className="sendANote">
                    <h2 className="text-2xl font-semibold mb-4">{draft.noteTitle}</h2>
                    <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
                        <input
                            type="text"
                            placeholder={draft.notePlaceholderName}
                            className="w-full h-10 rounded px-4 text-[#f2665e] placeholder:text-[#f2665e] bg-white/80"
                            onChange={(e) => handleContactFormChange("name", e.target.value)}
                        />
                        <input
                            type="email"
                            placeholder={draft.notePlaceholderEmail}
                            className="w-full h-10 rounded px-4 text-[#f2665e] placeholder:text-[#f2665e] bg-white/80"
                            onChange={(e) => handleContactFormChange("email", e.target.value)}
                            aria-label="אימייל"
                        />
                        <textarea
                            placeholder={draft.notePlaceholderMessage}
                            className="w-full h-24 rounded px-4 py-2 resize-none text-[#f2665e] placeholder:text-[#f2665e] bg-white/80"
                            onChange={(e) => handleContactFormChange("message", e.target.value)}
                            aria-label="ההודעה שלי"
                        />
                        <button className="bg-white text-[#f2665e] px-6 py-2 rounded hover:bg-gray-100 font-semibold transition-colors">
                            {draft.noteButtonText}
                        </button>
                    </form>
                </div>
                {/* מידע ליצירת קשר + מפה */}
                <div className="text-right">
                    <iframe
                        title="map"
                        src={`https://www.google.com/maps?q=${encodeURIComponent(draft.contactAddress)}&output=embed`}
                        height="250"
                        allowFullScreen=""
                        loading="lazy"
                        className="w-full rounded-md mb-4 border-0"
                    ></iframe>
                    <p className="mb-2">{draft.contactAddress}</p>
                    <p className="mb-2">
                        {draft.contactInfo}
                        <a href="tel:0548486485" className="underline hover:text-gray-200">{draft.contactPhone}</a>
                    </p>
                    <p className="mb-2">
                        <a href="mailto:f486485@gmail.com" className="underline hover:text-gray-200">{draft.contactEmail}</a>
                    </p>
                    <p className="text-sm mt-6 text-center opacity-90">{draft.creditNote}</p>
                </div>

            </div>
        </footer>
    );


    return (
        <>
            <AdminControls
                editMode={editMode}
                previewContent={EditContent}
                adminControls={adminControls}
            >
                {ViewContent}
            </AdminControls>
        </>
    );
}
