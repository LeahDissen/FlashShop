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
        <div className="preview-content">
            <img
                src={draft.logo}
                alt="Flash Logo"
                style={{ maxWidth: "100%", marginBottom: "10px" }}
            />
        </div>
    );

    return (
        <div style={{ padding: "20px", maxWidth: 800, margin: "auto" }}>
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
