import { useEffect, useState } from "react";
import { useNavigate, Link } from 'react-router-dom';
import { getPage } from '../api/pages';
import { getAllTips } from '../api/tips';
import AdminControls from '../components/AdminControls.jsx';
import Testimonials from '../components/Testimonials';
import { useAdminControl } from '../hooks/useAdminControl.jsx';
import useAppStore from '../store/appStore';
import { useTipsStore } from '../store/tipsStore';

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
    const [recentTips, setRecentTips] = useState([]);
    const setCurrentTip = useTipsStore(state => state.setCurrentTip);

    useEffect(() => {
        const dismissed = sessionStorage.getItem("club-popup-dismissed");
        if (dismissed) return;

        const timer = setTimeout(() => {
            if (!sessionStorage.getItem("club-popup-dismissed")) {
                setClubOpen(true);
            }
        }, 8000);

        return () => clearTimeout(timer);
    }, [setClubOpen]);

    useEffect(() => {
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
        getAllTips(1, 2).then((data) => {
            if (data && data.tips) {
                setRecentTips(data.tips);
            }
        }).catch(err => console.error("Failed to fetch tips:", err));

    }, []);

    const truncateText = (text, maxLength) => {
        if (!text) return "";
        return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
    };

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
                            value={prod.image}
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
        <div className="w-full bg-white">
            {/* HERO & PRODUCTS SECTION */}
            <section className="relative w-full overflow-hidden bg-white pb-10">
                <div className="relative z-10 w-full">
                    <div className="flex items-start justify-between">
                        {/* RIGHT: Image & Red Wave */}
                        {draft.mainImg && (
                            <div className="relative" style={{ width: '32%', flexShrink: 0, minHeight: '500px' }}>
                                <svg width="0" height="0" style={{ position: 'absolute' }}>
                                    <defs>
                                        <clipPath id="cornerWaveClip" clipPathUnits="objectBoundingBox">
                                            <path d="M 1,0 L 1,0.9 Q 0.55,1.05 0.15,0.85 Q 0,0.425 0.15,0 L 1,0 Z" />
                                        </clipPath>
                                    </defs>
                                </svg>
                                <div
                                    style={{
                                        width: '100%',
                                        height: '500px',
                                        clipPath: 'url(#cornerWaveClip)',
                                        position: 'relative',
                                        zIndex: '20'
                                    }}
                                >
                                    <img
                                        src={draft.mainImg}
                                        alt="main"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '-50px',
                                        right: '0',
                                        width: '120%',
                                        height: '650px',
                                        background: 'linear-gradient(180deg, #ff5555 0%, #ff9aaa 100%)',
                                        clipPath: 'url(#cornerWaveClip)',
                                        zIndex: '10',
                                    }}
                                ></div>
                            </div>
                        )}

                        {/*  LEFT: Text + Products Grid */}
                        <div className="flex-1 flex flex-col pr-20 pt-10 pl-10 relative z-30">
                            <div className="text-right mb-8">
                                <h1
                                    className="text-5xl font-bold mb-4"
                                    style={{
                                        color: '#ff5555',
                                        lineHeight: '1.2'
                                    }}
                                >
                                    {draft.title}
                                </h1>
                                <button
                                    onClick={() => setClubOpen(true)}
                                    className="px-8 py-2 rounded-full text-white font-medium shadow-lg hover:shadow-xl transition-all"
                                    style={{ backgroundColor: '#ff5555' }}
                                >
                                    {draft.goToAbout}
                                </button>
                            </div>

                            <div className="w-full max-w-3xl mr-auto mt-5 text-right">
                                <div className="grid grid-cols-3 gap-4">
                                    {Array.isArray(draft.products) &&
                                        draft.products.slice(0, 6).map((prod, index) => (
                                            <div
                                                key={index}
                                                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer overflow-hidden aspect-square"
                                            >
                                                <img
                                                    src={prod.image}
                                                    alt={prod.name || `product-${index}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mt-12 mb-8 w-full">
                        <button
                            onClick={() => Navigate('/products')}
                            className="px-12 py-3 rounded-full text-white font-bold shadow-lg hover:shadow-xl transition-all text-lg"
                            style={{ backgroundColor: '#ff5555' }}
                        >
                            {draft.goToAll}
                        </button>
                    </div>

                </div>
            </section>

            {/* STORY SECTION */}
            <section className="w-full pt-4 pb-10 px-6 bg-white relative z-10">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-2xl font-bold mb-2 text-[#ff5555]">
                        זה הסיפור שלנו
                    </h2>
                    <p className="text-gray-700 text-sm leading-relaxed mb-0">
                        {draft.textAbout}
                    </p>
                </div>
            </section>

            {/* REVIEWS WAVE HEADER */}
            <div className="relative -mt-24 z-0">
                <svg
                    viewBox="0 0 1440 320"
                    className="w-full block h-auto"
                    preserveAspectRatio="none"
                >
                    <path
                        fill="#fda49e"
                        d="M0,96L48,106.7C96,117,192,139,288,144C384,149,480,139,576,128C672,117,768,107,864,112C960,117,1056,139,1152,138.7C1248,139,1344,117,1392,106.7L1440,96L1440,320L0,320Z"
                    ></path>
                </svg>

                <div className="absolute inset-0 flex flex-col justify-start items-center pt-32 px-4 text-center">
                    <h3 className="text-xl font-bold mb-4 text-white drop-shadow-md">
                        תראו מה מספרים עלינו
                    </h3>

                    <Testimonials />
                </div>
            </div>

            {/* TIPS SECTION */}
            <section className="w-full py-12 px-6" style={{ backgroundColor: '#fda49e' }}>
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                        {recentTips.length > 0 ? (
                            recentTips.map((tip) => (
                                <Link
                                    style={{ backgroundColor: '#fff0f0' }}
                                    to={`/tips/tip_page`}
                                    key={tip._id}
                                    onClick={() => setCurrentTip(tip)}
                                    className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all overflow-hidden flex h-48 sm:h-40 cursor-pointer"
                                >
                                    <div className="w-1/3 h-full relative shrink-0">
                                         <img
                                            src={tip.img}
                                            alt={tip.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="w-2/3 p-5 text-right flex flex-col justify-center">
                                        <h4 
                                            className="text-lg font-bold mb-2 line-clamp-1" 
                                            style={{ color: '#ff5555' }}
                                        >
                                            {tip.title ? tip.title.split(":")[0].trim() : ""}
                                        </h4>
                                        <p className="text-black text-sm leading-relaxed line-clamp-3 md:line-clamp-4">
                                            {truncateText(tip.summary || tip.content, 90)}
                                        </p>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="col-span-2 text-center text-gray-400 font-medium">
                                טוען טיפים...
                            </div>
                        )}
                    </div>

                    <div className="text-center">
                        <button
                            onClick={() => Navigate('/tips')}
                            className="px-12 py-3 rounded-full text-white font-bold shadow-lg hover:shadow-xl transition-all text-lg hover:bg-opacity-90"
                            style={{ backgroundColor: '#ff5555' }}
                        >
                            {draft.goToTips}
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );

    return (
        <div className="w-full">
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