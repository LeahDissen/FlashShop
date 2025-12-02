import { useEffect } from "react";
import { getPage } from "../api/pages";
import AdminControls from "./AdminControls";
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
            <input
                type="text"
                value={draft.logo}
                onChange={(e) => updateDraft({ logo: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
            />
        </>
    );

    const ViewContent = (
        <div className="flex items-center justify-start h-full">
            <img
                src={draft.logo}
                alt="Flash Logo"
                className="h-14 w-auto object-contain transition-all hover:opacity-90"
            />
        </div>
    );

    return (
        <div className="h-full flex items-center">
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