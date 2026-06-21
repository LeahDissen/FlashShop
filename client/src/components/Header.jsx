import { useEffect } from "react";
import { Link } from "react-router-dom";
import { getPage } from "../api/pages";
import AdminControls from "./AdminControls";
import SmartImageInput from "./SmartImageInput";
import { useAdminControl } from "../hooks/useAdminControl";

export default function Header() {
    const adminControls = useAdminControl({ logo: null }, "header");
    const { draft, updateDraft, editMode } = adminControls;

    useEffect(() => {
        getPage("header").then((data) => {
            adminControls.setPage(data);
            adminControls.setDraft(data);
        });
    }, []);

    const EditContent = (
        <>
            <label className="block mb-2 font-semibold">🔗 Logo URL:</label>
            <SmartImageInput
                value={draft.logo}
                onChange={(url) => updateDraft({ logo: url })}
                className="w-full p-2 border border-gray-300 rounded"
            />
        </>
    );

    const ViewContent = (
        <div className="flex items-center justify-start h-full">
            <Link to="/">
                <img
                    src={draft.logo}
                    alt="Flash Logo"
                    className="h-14 w-auto object-contain transition-all hover:opacity-90"
                />
            </Link>
        </div>
    );

    return (
        <div className="h-full flex items-center relative min-w-[200px]">
            <div className={editMode ? "absolute top-0 right-0 z-50 min-w-[350px]" : "w-full"}>
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