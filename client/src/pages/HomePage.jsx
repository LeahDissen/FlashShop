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
            {/* ================= HERO & PRODUCTS SECTION ================= */}
            <section className="relative w-full overflow-hidden bg-white pb-10">
                <div className="relative z-10 w-full">

                    {/* MAIN FLEX CONTAINER */}
                    <div className="flex items-start justify-between">

                        {/* 1. COLUMN RIGHT: Image & Red Wave */}
                        {draft.mainImg && (
                            <div className="relative" style={{ width: '32%', flexShrink: 0, minHeight: '500px' }}>

                                {/* SVG CLIP PATH */}
                                <svg width="0" height="0" style={{ position: 'absolute' }}>
                                    <defs>
                                        <clipPath id="cornerWaveClip" clipPathUnits="objectBoundingBox">
                                            <path d="M 1,0 L 1,0.9 Q 0.55,1.05 0.15,0.85 Q 0,0.425 0.15,0 L 1,0 Z" />
                                        </clipPath>
                                    </defs>
                                </svg>

                                {/* IMAGE ITSELF */}
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
                                        background: 'linear-gradient(180deg, #ff5555 0%, #ff9aaa 100%)', // התחלה באדום האתר
                                        clipPath: 'url(#cornerWaveClip)',
                                        zIndex: '10',
                                    }}
                                ></div>
                            </div>
                        )}

                        {/* 2. COLUMN LEFT: Text + Products Grid */}
                        <div className="flex-1 flex flex-col pr-20 pt-10 pl-10 relative z-30">

                            {/* A. TEXT CONTENT */}
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
                                    onClick={() => Navigate('/about')}
                                    className="px-8 py-2 rounded-full text-white font-medium shadow-lg hover:shadow-xl transition-all"
                                    style={{ backgroundColor: '#ff5555' }}
                                >
                                    {draft.goToAbout}
                                </button>
                            </div>

                            {/* B. PRODUCTS GRID */}
                            <div className="w-full max-w-3xl mr-auto mt-5  text-right">
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

                    {/* Button Centered */}
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

            {/* ================= STORY SECTION ================= */}
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

            {/* ================= REVIEWS WAVE HEADER ================= */}
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

                {/* TEXT CONTENT ON WAVE */}
                <div className="absolute inset-0 flex flex-col justify-start items-center pt-32 px-4 text-center">
                    <h3 className="text-xl font-bold mb-4 text-white drop-shadow-md">
                        תראו מה מספרים עלינו
                    </h3>

                    <div
                        className="rounded-2xl p-4 w-full max-w-sm bg-white shadow-lg flex flex-col items-center"
                    >
                        <p className="text-xs text-gray-700 leading-relaxed text-center font-medium mb-2">
                            "המלצה חמה מלקוח מרוצה על השירות המעולה, המוצרים האיכותיים והחוויה הנפלאה. הכל היה מושלם מההתחלה ועד הסוף."
                        </p>
                        <div className="text-xs font-bold text-[#ff5555]">
                            שם לקוח
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= TIPS SECTION ================= */}
            <section className="w-full py-12 px-6" style={{ background: '#fda49e' }}>
                {/* שיניתי כאן ל-max-w-3xl כדי להצר את הרוחב הכולל, מה שמקטין את הקלפים */}
                <div className="max-w-3xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-6 mb-8">

                        {/* TIP 1 */}
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            {/* שיניתי ל-h-32 (במקום h-40) כדי להקטין את גובה התמונה */}
                            <div className="h-32 bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-400">תמונה של טיפ 1</span>
                            </div>
                            {/* שיניתי ל-p-4 (במקום p-5) כדי להקטין את המרווח הפנימי */}
                            <div className="p-4">
                                <h4 className="text-base font-bold mb-2" style={{ color: '#ff5555' }}>
                                    טיפ חשוב 1
                                </h4>
                                <p className="text-xs text-gray-700 leading-relaxed">
                                    כאן יבוא טיפ שימושי שיעזור ללקוחות להפיק את המקסימום מהמוצרים שלכם. מידע חשוב שכדאי לדעת.
                                </p>
                            </div>
                        </div>

                        {/* TIP 2 */}
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            <div className="h-32 bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-400">תמונה של טיפ 2</span>
                            </div>
                            <div className="p-4">
                                <h4 className="text-base font-bold mb-2" style={{ color: '#ff5555' }}>
                                    טיפ חשוב 2
                                </h4>
                                <p className="text-xs text-gray-700 leading-relaxed">
                                    עוד טיפ מועיל שיכול לעזור ללקוחות להבין טוב יותר איך להשתמש במוצרים בצורה הטובה ביותר.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="text-center">
                        <button
                            onClick={() => Navigate('/tips')}
                            style={{ backgroundColor: '#ff5555' }}
                            className="px-12 py-3 rounded-full text-white font-bold shadow-lg hover:shadow-xl transition-all text-lg"
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