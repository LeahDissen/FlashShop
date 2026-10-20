import { useEffect, useState } from "react";

import { joinClubRequest } from "../api/club";
import { uploadDocumentToCloudinary } from "../utils/cloudinaryUpload";

import { getPage } from "../api/pages";

import AdminControls from "./AdminControls.jsx";

import { useAdminControl } from "../hooks/useAdminControl.jsx";

import useAppStore from '../store/appStore';

import useAuthStore from '../store/authStore.js';



const EMPTY_JOIN_FORM = { name: "", email: "", birthdate: "", agreed: false };

export default function Club() {

    const { isClubOpen, setClubOpen, setTermsOpen, termsAgreed, clubPrefillEmail, markClubJoined } = useAppStore();

    const userId = useAuthStore(state => state.userId);

    const adminControls = useAdminControl(

        {

            title: "",

            subtitle: "",

            description: "",

            inputNamePlaceholder: "",

            inputEmailPlaceholder: "",

            inputDatePlaceholder: "",


            checkboxText: "",
            btnText: "",
            successText: "הצטרפת בהצלחה למועדון!",
            welcomeSubject: "",
            welcomeBody: "",
            welcomeAttachmentUrl: ""
        }, "club");



    const { draft, updateDraft, editMode } = adminControls;

    const [formData, setFormData] = useState(EMPTY_JOIN_FORM);
    /** The signup result is shown inside the popup: success (with the benefit code) or error */
    const [joinResult, setJoinResult] = useState(null);
    const [isJoining, setIsJoining] = useState(false);




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

    const closeClub = () => {
        setClubOpen(false);
        // The next opening starts with a clean form (e.g. a family member signing up from the same browser)
        if (joinResult?.type === "success") {
            setFormData(EMPTY_JOIN_FORM);
        }
        setJoinResult(null);
        sessionStorage.setItem("club-popup-dismissed", "1");
    };



    // Opened from checkout or a gift product: the customer's email is already known
    useEffect(() => {
        if (isClubOpen && clubPrefillEmail) {
            setFormData((prev) => (prev.email ? prev : { ...prev, email: clubPrefillEmail }));
        }
    }, [isClubOpen, clubPrefillEmail]);

    useEffect(() => {

        if (termsAgreed) {

            setFormData(prev => ({ ...prev, agreed: true }));

        }

    }, [termsAgreed]);



    useEffect(() => {

        getPage("club").then((data) => {

            if (data) {

                adminControls.setPage(data);

                adminControls.setDraft(data);

            }

        });

    }, []);



    const handleInputChange = (e) => {

        const { name, value, type, checked } = e.target;

        setFormData(prev => ({

            ...prev,

            [name]: type === 'checkbox' ? checked : value

        }));

    };



    const handleSubmit = async (e) => {

        e.preventDefault();

        if (!formData.agreed) {

            alert("יש לאשר את התקנון");

            return;

        }

        setIsJoining(true);
        setJoinResult(null);
        try {
            const payload = {
                user_id: userId || null,
                email: formData.email,
                name: formData.name,
                birthDate: formData.birthdate
            };
            const data = await joinClubRequest(payload);
            setJoinResult({ type: "success", code: data.code });
            markClubJoined();
        } catch (error) {
            console.error("Club join error:", error);
            setJoinResult({
                type: "error",
                message: error.response?.data?.msg || "אירעה שגיאה בהצטרפות למועדון",
            });
        } finally {
            setIsJoining(false);
        }

    };



    const openTerms = (e) => {

        e.preventDefault();

        setClubOpen(false);

        setTermsOpen(true);

    };



    if (!isClubOpen && !editMode) return null;



    const EditContent = (

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



    const ViewContent = (

        <div className="relative w-[500px] h-[500px] max-w-[calc(100vw-2rem)] max-h-[calc(100vw-2rem)] flex items-center justify-center animate-fade-in-up">

            <button

                onClick={closeClub}

                className="absolute top-4 right-4 z-50 hover:text-black text-[#f0645a] font-bold text-xl"

                aria-label="סגור"

            >

                ×

            </button>



            <div className="bg-[#f0645a] rounded-full w-full h-full flex flex-col items-center justify-center text-center p-10 shadow-2xl text-white relative z-10">

                <h2 className="text-3xl font-bold mb-2 leading-tight whitespace-pre-line drop-shadow-md">{draft.title}</h2>

                <h3 className="text-lg font-medium mb-4 opacity-90 whitespace-pre-line">{draft.subtitle}</h3>


                <p className="text-sm mb-6 px-4 font-light whitespace-pre-line">{draft.description}</p>
                {joinResult?.type === "success" ? (
                    <div className="w-full max-w-xs flex flex-col items-center gap-3 z-20" role="status">
                        <p className="text-xl font-bold whitespace-pre-line drop-shadow-md">
                            {draft.successText || "הצטרפת בהצלחה למועדון!"}
                        </p>
                        {joinResult.code && (
                            <p className="text-sm font-light">
                                קוד ההטבה שלך: <span className="font-mono font-bold tracking-wider" dir="ltr">{joinResult.code}</span>
                            </p>
                        )}
                        <button
                            type="button"
                            onClick={closeClub}
                            className="bg-white text-[#f0645a] font-bold py-2 px-6 rounded-full mt-2 hover:bg-gray-100 transition-colors shadow-lg"
                        >
                            סגירה
                        </button>
                    </div>
                ) : (
                <form onSubmit={handleSubmit} className="w-full max-w-xs flex flex-col gap-3 z-20">

                    <input type="text" name="name" placeholder={draft.inputNamePlaceholder} value={formData.name} onChange={handleInputChange} required className="w-full px-4 py-2 rounded-md text-gray-700 bg-white/90 text-right" />

                    <input type="email" name="email" placeholder={draft.inputEmailPlaceholder} value={formData.email} onChange={handleInputChange} required className="w-full px-4 py-2 rounded-md text-gray-700 bg-white/90 text-right" />

                    <input type="text" onFocus={(e) => e.target.type = 'date'} onBlur={(e) => e.target.type = 'text'} name="birthdate" placeholder={draft.inputDatePlaceholder} value={formData.birthdate} onChange={handleInputChange} required className="w-full px-4 py-2 rounded-md text-gray-700 bg-white/90 text-right" />



                    <div className="flex items-start gap-2 mt-2 justify-end w-full px-2">

                        <label className="text-[11px] leading-tight text-right cursor-pointer select-none" htmlFor="club-terms">

                            {draft.checkboxText}{" "}

                            <span onClick={openTerms} className="underline font-bold text-white hover:text-gray-200 cursor-pointer">

                                (לקריאת התקנון)

                            </span>

                        </label>

                        <input type="checkbox" id="club-terms" name="agreed" checked={formData.agreed} onChange={handleInputChange} className="mt-0.5 w-4 h-4 accent-white cursor-pointer shrink-0" />

                    </div>




                    {joinResult?.type === "error" && (
                        <p className="text-sm font-bold bg-white/90 text-[#a93636] rounded-md px-3 py-2" role="alert">
                            {joinResult.message}
                        </p>
                    )}
                    <button type="submit" disabled={isJoining} className="bg-white text-[#f0645a] font-bold py-2 px-6 rounded-full mt-4 mx-auto hover:bg-gray-100 transition-colors shadow-lg disabled:opacity-60">
                        {isJoining ? "רגע..." : draft.btnText}
                    </button>
                </form>
                )}



                <div className="absolute top-1/4 -left-8 w-24 h-24 bg-pink-200 rounded-full -z-10 opacity-90"></div>

                <div className="absolute top-1/3 -right-2 w-6 h-6 bg-[#a93636] rounded-full z-20"></div>

                <div className="absolute bottom-12 right-12 w-5 h-5 bg-white rounded-full z-20"></div>

                <div className="absolute top-1/2 -left-12 w-6 h-6 bg-[#f0645a] rounded-full z-0"></div>

            </div>

        </div>

    );



    return (

        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">

            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeClub} />

            <div className="relative z-50">

                <AdminControls

                    editMode={editMode}

                    previewContent={EditContent}

                    adminControls={adminControls}

                >

                    {ViewContent}

                </AdminControls>

            </div>

        </div>

    );

}

