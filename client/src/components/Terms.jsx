import { useEffect } from "react";
import { getPage } from "../api/pages";
import AdminControls from "./AdminControls.jsx";
import { useAdminControl } from "../hooks/useAdminControl.jsx";
import useAuthStore from '../store/authStore';
import useAppStore from '../store/appStore';

export default function Terms() {
    const isAdmin = useAuthStore(state => state.isAdmin());
    const { isTermsOpen, setTermsOpen, setClubOpen, setTermsAgreed } = useAppStore();
    const adminControls = useAdminControl({
        title: "",
        content: "",
        btnText: ""
    }, "terms");
    const { draft, updateDraft, editMode } = adminControls;

    useEffect(() => {
        getPage("terms").then((data) => {
            adminControls.setPage(data);
            adminControls.setDraft(data);
        });
    }, []);

    const handleAgree = () => {
        setTermsAgreed(true);
        setTermsOpen(false);
        setClubOpen(true);
    };

    const handleClose = () => {
        setTermsOpen(false);
        setClubOpen(true);
    };

    const EditContent = (
        <>
            <input type="text" value={draft.title} onChange={(e) => updateDraft({ title: e.target.value })} style={{ width: "100%", marginBottom: "10px", padding: "8px" }} placeholder="כותרת" />
            <textarea value={draft.content} onChange={(e) => updateDraft({ content: e.target.value })} style={{ width: "100%", height: "250px", marginBottom: "10px", padding: "8px" }} placeholder="תוכן התקנון" />
            <input type="text" value={draft.btnText} onChange={(e) => updateDraft({ btnText: e.target.value })} style={{ width: "100%", marginBottom: "10px", padding: "8px" }} placeholder="טקסט כפתור" />
        </>
    );

    const ViewContent = (
        <div className="bg-white rounded-xl shadow-2xl p-8 relative flex flex-col items-center text-center max-w-sm w-full mx-auto border border-gray-100" dir="rtl">

            <button
                onClick={handleClose}
                className="absolute top-3 right-3 text-gray-400 hover:text-[#f0645a] text-xl font-bold p-2 transition-colors"
            >
                ✕
            </button>

            <h2 className="text-2xl font-bold mb-4 text-[#f0645a] whitespace-pre-line leading-snug">
                {draft.title}
            </h2>

            <div className="text-gray-600 mb-8 leading-relaxed max-h-[60vh] overflow-y-auto text-right text-sm px-2 scrollbar-thin scrollbar-thumb-gray-200">
                <p className="whitespace-pre-line">{draft.content}</p>
            </div>

            <button
                onClick={handleAgree}
                className="bg-[#f0645a] text-white px-12 py-2.5 rounded-full hover:bg-[#d95248] font-bold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-lg"
            >
                {draft.btnText}
            </button>
        </div>
    );

    if (!isTermsOpen && !editMode) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[60] p-4 animate-fade-in">
            <AdminControls
                editMode={editMode}
                previewContent={EditContent}
                adminControls={adminControls}
            >
                {ViewContent}
            </AdminControls>
        </div>
    );
}