import { useEffect, useState } from "react";
import { joinClubRequest } from "../api/club";
import { getPage } from "../api/pages";
import AdminControls from "./AdminControls.jsx";
import ClubEditPanel from "./club/ClubEditPanel";
import ClubJoinForm from "./club/ClubJoinForm";
import ClubJoinSuccess from "./club/ClubJoinSuccess";
import { useAdminControl } from "../hooks/useAdminControl.jsx";
import useAppStore from '../store/appStore';
import useAuthStore from '../store/authStore.js';

const EMPTY_JOIN_FORM = { name: "", email: "", birthdate: "", agreed: false };

const DEFAULT_CLUB_PAGE = {
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
};

/** The club signup popup (opened from the menu, checkout, a gift product or after a while on the home page) */
export default function Club() {
    const { isClubOpen, setClubOpen, setTermsOpen, termsAgreed, clubPrefillEmail, markClubJoined } = useAppStore();
    const userId = useAuthStore(state => state.userId);
    const adminControls = useAdminControl(DEFAULT_CLUB_PAGE, "club");
    const { draft, updateDraft, editMode } = adminControls;
    const [formData, setFormData] = useState(EMPTY_JOIN_FORM);
    /** The signup result is shown inside the popup: success (with the benefit code) or error */
    const [joinResult, setJoinResult] = useState(null);
    const [isJoining, setIsJoining] = useState(false);

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
            setJoinResult({ type: "success", code: data.code, pendingGift: Boolean(data.pendingGift) });
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

    const viewContent = (
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
                    <ClubJoinSuccess successText={draft.successText} result={joinResult} onClose={closeClub} />
                ) : (
                    <ClubJoinForm
                        texts={draft}
                        formData={formData}
                        onChange={handleInputChange}
                        onSubmit={handleSubmit}
                        onOpenTerms={openTerms}
                        error={joinResult?.type === "error" ? joinResult.message : ""}
                        isJoining={isJoining}
                    />
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
                    previewContent={<ClubEditPanel draft={draft} updateDraft={updateDraft} />}
                    adminControls={adminControls}
                >
                    {viewContent}
                </AdminControls>
            </div>
        </div>
    );
}
