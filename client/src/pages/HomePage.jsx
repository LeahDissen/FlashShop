import AdminControls from '../components/AdminControls.jsx';
import { useAdminControl } from '../hooks/useAdminControl.jsx';
import { useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/appStore';
import { getPage } from '../api/pages';

export default function HomePage() {
    const adminControls = useAdminControl({
        title: "",
        mainImg: "",
        products: [],
        goToAll: "",
        goToAbout: "",
        textAbout: "",
        goToTips: ""
    }, "home");
    const { draft, updateDraft, editMode } = adminControls;
    const setClubOpen = useAppStore(state => state.setClubOpen);
    const Navigate = useNavigate();

    useEffect(() => {
        setClubOpen(true);
        getPage("home").then((data) => {
            if (typeof data.products === "string") {
                try {
                    const fixedJson = data.products.trim();
                    const jsonToParse = fixedJson.startsWith("[") ? fixedJson : `[${fixedJson}]`;
                    data.products = JSON.parse(jsonToParse);
                } catch (err) {
                    console.error("Failed to parse products JSON:", err);
                    data.products = [];
                }
            }
            adminControls.setPage(data);
            adminControls.setDraft(data);
        });
    }, []);

    const EditContent = (
        <>
            <input
                type="text"
                value={draft.title}
                style={{ width: "100%", height: "250px" }}
                onChange={(e) => updateDraft({ title: e.target.value })}
            />
            <label>🔗 Main Image URL:</label>
            <input
                type="text"
                value={draft.mainImg}
                onChange={(e) => updateDraft({ mainImg: e.target.value })}
                style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
            />
            <div className='container'>
                {Array.isArray(draft.products) && draft.products.map((prod, index) => (
                    <div key={index} className='product-card'>
                        <input
                            type="text"
                            placeholder="שם המוצר"
                            value={prod.name || ''}
                            onChange={(e) => {
                                const updatedProducts = [...draft.products];
                                updatedProducts[index] = {
                                    ...updatedProducts[index],
                                    name: e.target.value
                                };
                                updateDraft({ products: updatedProducts });
                            }}
                            style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
                        />
                        <input
                            type="text"
                            placeholder="URL התמונה"
                            value={prod.image || ''}
                            onChange={(e) => {
                                const updatedProducts = [...draft.products];
                                updatedProducts[index] = {
                                    ...updatedProducts[index],
                                    image: e.target.value
                                };
                                updateDraft({ products: updatedProducts });
                            }}
                            style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
                        />
                        {prod.image && (
                            <img
                                src={prod.image}
                                alt={`Preview ${prod.name || index + 1}`}
                                style={{ width: "100px", height: "100px", objectFit: "cover" }}
                            />
                        )}
                    </div>
                ))}
            </div>
            <input
                type="text"
                value={draft.goToAll}
                style={{ width: "100%", height: "50px", marginTop: "10px" }}
                onChange={(e) => updateDraft({ goToAll: e.target.value })}
            />
            <input
                type="text"
                value={draft.goToAbout}
                style={{ width: "100%", height: "50px", marginTop: "10px" }}
                onChange={(e) => updateDraft({ goToAbout: e.target.value })}
            />
            <textarea
                style={{ width: "100%", height: "150px", marginTop: "10px" }}
                value={draft.textAbout}
                onChange={(e) => updateDraft({ textAbout: e.target.value })}
            />
            <input
                type="text"
                value={draft.goToTips}
                style={{ width: "100%", height: "50px", marginTop: "10px" }}
                onChange={(e) => updateDraft({ goToTips: e.target.value })}
            />
        </>
    );

    const ViewContent = (
        <div className="home-content text-center max-w-6xl mx-auto px-4">
            {draft.mainImg && (
                <div className="hero-section relative">
                    <img
                        src={draft.mainImg}
                        alt="main home image"
                        className="w-full h-auto"
                    />
                    <div className="hero-overlay absolute inset-0 flex items-center justify-center text-white text-3xl font-bold bg-black/30">
                        {draft.title}
                    </div>
                </div>
            )}
            <div className="about-section bg-white py-10 px-6 rounded-2xl shadow-md relative z-10">
                <p className="text-right text-gray-700 leading-relaxed mb-6">{draft.textAbout}</p>
                {Array.isArray(draft.products) && draft.products.length > 0 && (
                    <div className="flex justify-center gap-4 mt-8 flex-wrap">
                        {draft.products.map((prod, index) => (
                            <div key={index} className='product-card'>
                                <img
                                    src={prod.image}
                                    alt={prod.name || `Product ${index + 1}`}
                                    className="w-40 h-40 object-cover rounded-xl shadow"
                                />
                            </div>
                        ))}
                    </div>
                )}
                <div className="mt-10 flex flex-col items-center gap-4">
                    <button className="bg-[#f2665e] text-white px-8 py-3 rounded-full hover:bg-[#e1574f] transition-colors">
                        {draft.goToAll}
                    </button>
                    <button onClick={(e) => Navigate('/about')} className="bg-[#f2665e] text-white px-8 py-3 rounded-full hover:bg-[#e1574f] transition-colors">
                        {draft.goToAbout}
                    </button>
                    <p>כאן הלקוחות המרוצים שלנו יספרו לכם על החוייה אצלנו כמה כיף לקנות כאן ואיזה שירות פצצה יש לנו לקוח מרוצה . עד הגג . . .</p>
                    <button onClick={(e) => Navigate('/tips')} className="bg-[#f2665e] text-white px-8 py-3 rounded-full hover:bg-[#e1574f] transition-colors">
                        {draft.goToTips}
                    </button>
                </div>
            </div>
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