import { useEffect } from "react";
import useAppStore from "../store/appStore";
import { NAV_ITEMS } from "../constants/navItems";
import { Link } from "react-router-dom";
import { getPage } from "../api/pages";
import AdminControls from "./AdminControls";
import SmartImageInput from "./SmartImageInput";
import { optimizeImageUrl } from "../utils/imageUrl";
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

    // The menu follows the draft, so renaming shows in the menu while editing
    const setNavLabels = useAppStore((state) => state.setNavLabels);
    useEffect(() => {
        setNavLabels(draft.navLabels);
    }, [draft.navLabels, setNavLabels]);

    const updateNavLabel = (key, value) => updateDraft({ navLabels: { ...(draft.navLabels || {}), [key]: value } });

    const EditContent = (
        <>
            <label className="block mb-2 font-semibold">🔗 Logo URL:</label>
            <SmartImageInput
                value={draft.logo}
                onChange={(url) => updateDraft({ logo: url })}
                className="w-full p-2 border border-gray-300 rounded"
            />
            <label className="block mt-4 mb-2 font-semibold">שמות בתפריט העליון</label>
            <div className="space-y-2">
                {NAV_ITEMS.map((item) => (
                    <input
                        key={item.key}
                        id={`nav-label-${item.key}`}
                        type="text"
                        value={draft.navLabels?.[item.key] ?? ""}
                        onChange={(e) => updateNavLabel(item.key, e.target.value)}
                        placeholder={item.label}
                        aria-label={`שם בתפריט במקום "${item.label}"`}
                        className="w-full p-2 border border-gray-300 rounded"
                    />
                ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">שדה ריק משאיר את השם הרגיל.</p>
        </>
    );

    const ViewContent = (
        <div className="flex items-center justify-start h-full">
            <Link to="/">
                <img
                    src={optimizeImageUrl(draft.logo, { height: 112 })}
                    height="56"
                    alt="Flash Logo"
                    className="h-14 w-auto object-contain transition-all hover:opacity-90"
                />
            </Link>
        </div>
    );

    return (
        <div className="h-full flex items-center relative sm:min-w-[200px]">
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