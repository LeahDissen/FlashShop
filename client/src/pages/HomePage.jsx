import { useRef, useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from 'react-router-dom';
import { getPage } from '../api/pages';
import { getAllTips } from '../api/tips';
import AdminControls from '../components/AdminControls.jsx';
import SmartImageInput from '../components/SmartImageInput';
import Testimonials, { DEFAULT_TESTIMONIALS } from '../components/Testimonials';
import WaveDivider from '../components/WaveDivider';
import { useAdminControl } from '../hooks/useAdminControl.jsx';
import useAppStore from '../store/appStore';
import { useTipsStore } from '../store/tipsStore';

/** Parse a Redis field that may arrive as JSON string or already-parsed value */
const parseJsonField = (value, fallback) => {
    if (Array.isArray(value)) return value;
    if (typeof value !== "string" || !value.trim()) return fallback;
    try {
        const raw = value.trim();
        const parsed = JSON.parse(raw.startsWith("[") || raw.startsWith("{") ? raw : `[${raw}]`);
        return Array.isArray(parsed) ? parsed : fallback;
    } catch (err) {
        console.error("Failed to parse JSON field:", err);
        return fallback;
    }
};

/** Stable initial data — defined outside component to prevent recreation on every render */
const INITIAL_DATA = {
    title: "",
    mainImg: "",
    products: [],
    goToAll: "",
    goToAbout: "",
    titleAbout: "",
    textAbout: "",
    titleTestimonials: "",
    testimonials: DEFAULT_TESTIMONIALS,
    goToTips: ""
};

/**
 * HomePage — Figma-inspired layout with wave hero.
 *
 * Layout:
 *  - Full-width hero image with the same wave divider as the products page
 *  - Title + 6 product tiles below the wave
 *  - Story, Testimonials, Tips
 */
export default function HomePage() {
    const adminControls = useAdminControl(INITIAL_DATA, "home");
    const { draft, updateDraft, editMode } = adminControls;

    const setClubOpen = useAppStore(state => state.setClubOpen);
    const navigate = useNavigate();
    const [recentTips, setRecentTips] = useState([]);
    const setCurrentTip = useTipsStore(state => state.setCurrentTip);

    // Track if we already loaded data — prevent double-fetch
    const loadedRef = useRef(false);

    /** Show club popup after 8s if not dismissed this session */
    useEffect(() => {
        const dismissed = sessionStorage.getItem("club-popup-dismissed");
        if (dismissed) return;
        const timer = setTimeout(() => {
            if (!sessionStorage.getItem("club-popup-dismissed")) setClubOpen(true);
        }, 8000);
        return () => clearTimeout(timer);
    }, [setClubOpen]);

    /** Fetch CMS data and tips exactly once on mount */
    useEffect(() => {
        if (loadedRef.current) return;
        loadedRef.current = true;

        getPage("home").then((data) => {
            data.products = parseJsonField(data.products, []);
            data.testimonials = parseJsonField(data.testimonials, DEFAULT_TESTIMONIALS);
            adminControls.setPage(data);
            adminControls.setDraft(data);
        });

        getAllTips(1, 2)
            .then((data) => { if (data?.tips) setRecentTips(data.tips); })
            .catch((err) => console.error("Failed to fetch tips:", err));
    }); // intentionally no dependency array — the ref guard prevents double-execution

    /**
     * Truncates text to maxLength characters.
     * @param {string} text
     * @param {number} maxLength
     * @returns {string}
     */
    const truncateText = (text, maxLength) => {
        if (!text) return "";
        return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
    };

    /**
     * Updates a specific field of one product in the draft array.
     * @param {number} index
     * @param {string} field
     * @param {string} value
     */
    const updateProduct = (index, field, value) => {
        const updated = [...(draft.products || [])];
        // Ensure slot exists
        while (updated.length <= index) updated.push({});
        updated[index] = { ...updated[index], [field]: value };
        updateDraft({ products: updated });
    };

    const updateTestimonial = (index, field, value) => {
        const updated = [...(Array.isArray(draft.testimonials) ? draft.testimonials : DEFAULT_TESTIMONIALS)];
        updated[index] = { ...updated[index], id: updated[index]?.id ?? index + 1, [field]: value };
        updateDraft({ testimonials: updated });
    };

    const addTestimonial = () => {
        const list = Array.isArray(draft.testimonials) ? draft.testimonials : [...DEFAULT_TESTIMONIALS];
        updateDraft({
            testimonials: [...list, { id: Date.now(), text: "", name: "" }]
        });
    };

    const removeTestimonial = (index) => {
        const list = Array.isArray(draft.testimonials) ? draft.testimonials : [...DEFAULT_TESTIMONIALS];
        updateDraft({ testimonials: list.filter((_, i) => i !== index) });
    };

    /** Always 6 grid slots — real products or empty placeholders */
    const gridItems = useMemo(() => {
        const list = Array.isArray(draft.products) ? draft.products : [];
        return [
            ...list.slice(0, 6),
            ...Array(Math.max(0, 6 - list.length)).fill(null)
        ];
    }, [draft.products]);

    // ─── Admin Edit Panel ─────────────────────────────────────────────────────
    const EditContent = (
        <div dir="rtl" className="space-y-5 text-right text-sm text-gray-700 p-3">
            <div>
                <label className="font-bold block mb-1">כותרת ראשית:</label>
                <input
                    type="text"
                    value={draft.title || ''}
                    className="w-full border rounded p-2"
                    onChange={(e) => updateDraft({ title: e.target.value })}
                />
            </div>
            <div>
                <label className="font-bold block mb-1">🖼 תמונת Hero:</label>
                <SmartImageInput
                    value={draft.mainImg || ''}
                    onChange={(url) => updateDraft({ mainImg: url })}
                    className="w-full border p-2 rounded ltr"
                    previewClassName="h-[80px] w-[80px] rounded object-cover border border-gray-200"
                />
            </div>
            <div>
                <label className="font-bold block mb-2">6 מוצרים — תמונה + שם + קישור:</label>
                <div className="grid grid-cols-2 gap-3">
                    {gridItems.map((prod, index) => (
                        <div key={index} className="border rounded-xl p-3 bg-gray-50 space-y-2">
                            <p className="font-bold text-xs" style={{ color: '#ff5a5a' }}>מוצר {index + 1}</p>
                            <input
                                type="text"
                                placeholder="שם הקטגוריה"
                                value={prod?.name || ''}
                                className="w-full border rounded p-1.5 text-xs"
                                onChange={(e) => updateProduct(index, 'name', e.target.value)}
                            />
                            <SmartImageInput
                                placeholder="URL תמונה"
                                value={prod?.image || ''}
                                onChange={(url) => updateProduct(index, 'image', url)}
                                className="w-full border p-1.5 rounded ltr text-xs"
                                previewClassName="h-[48px] w-[48px] rounded object-cover border border-gray-200"
                            />
                            <input
                                type="text"
                                placeholder="קישור (e.g. /products)"
                                value={prod?.link || ''}
                                className="w-full border rounded p-1.5 text-xs ltr"
                                dir="ltr"
                                onChange={(e) => updateProduct(index, 'link', e.target.value)}
                            />
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <label className="font-bold block mb-1">כפתור "לכל המוצרים":</label>
                <input
                    type="text"
                    value={draft.goToAll || ''}
                    className="w-full border rounded p-2"
                    onChange={(e) => updateDraft({ goToAll: e.target.value })}
                />
            </div>
            <div>
                <label className="font-bold block mb-1">כותרת "הסיפור שלנו":</label>
                <input
                    type="text"
                    value={draft.titleAbout || ''}
                    placeholder="זה הסיפור שלנו <"
                    className="w-full border rounded p-2"
                    onChange={(e) => updateDraft({ titleAbout: e.target.value })}
                />
            </div>
            <div>
                <label className="font-bold block mb-1">טקסט "הסיפור שלנו":</label>
                <textarea
                    className="w-full border rounded p-2 h-28"
                    value={draft.textAbout || ''}
                    onChange={(e) => updateDraft({ textAbout: e.target.value })}
                />
            </div>
            <div>
                <label className="font-bold block mb-1">כותרת המלצות לקוחות:</label>
                <input
                    type="text"
                    value={draft.titleTestimonials || ''}
                    placeholder="תראו מה מספרים עלינו <"
                    className="w-full border rounded p-2"
                    onChange={(e) => updateDraft({ titleTestimonials: e.target.value })}
                />
            </div>
            <div>
                <label className="font-bold block mb-2">המלצות לקוחות:</label>
                <div className="space-y-3">
                    {(Array.isArray(draft.testimonials) ? draft.testimonials : DEFAULT_TESTIMONIALS).map((item, index) => (
                        <div key={item.id ?? index} className="border rounded-xl p-3 bg-gray-50 space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="font-bold text-xs" style={{ color: '#ff5a5a' }}>המלצה {index + 1}</p>
                                <button
                                    type="button"
                                    onClick={() => removeTestimonial(index)}
                                    className="text-xs text-red-500 hover:underline"
                                >
                                    מחק
                                </button>
                            </div>
                            <input
                                type="text"
                                placeholder="שם הלקוח/ה"
                                value={item?.name || ''}
                                className="w-full border rounded p-1.5 text-xs"
                                onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
                            />
                            <textarea
                                placeholder="טקסט ההמלצה"
                                value={item?.text || ''}
                                className="w-full border rounded p-1.5 text-xs h-20"
                                onChange={(e) => updateTestimonial(index, 'text', e.target.value)}
                            />
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addTestimonial}
                        className="w-full border border-dashed border-[#f2665e] text-[#f2665e] rounded-xl py-2 text-xs font-bold hover:bg-red-50 transition"
                    >
                        + הוסף המלצה
                    </button>
                </div>
            </div>
            <div>
                <label className="font-bold block mb-1">כפתור "לכל הטיפים":</label>
                <input
                    type="text"
                    value={draft.goToTips || ''}
                    className="w-full border rounded p-2"
                    onChange={(e) => updateDraft({ goToTips: e.target.value })}
                />
            </div>
        </div>
    );

    // ─── View Content ─────────────────────────────────────────────────────────
    const ViewContent = (
        <div className="w-full bg-white overflow-x-hidden">

            {/* ══ HERO WAVE + PRODUCTS ══════════════════════════════════════ */}
            <section className="home-hero">
                <div className="home-hero__banner">
                    <div
                        className="home-hero__banner-bg"
                        style={{
                            backgroundColor: '#f8dcdb',
                            backgroundImage: draft.mainImg ? `url(${draft.mainImg})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        {draft.mainImg ? <div className="home-hero__banner-overlay" /> : null}
                        <WaveDivider fill="#ffffff" className="home-hero__wave" />
                    </div>
                </div>

                <div className="home-hero__inner">
                    <h1 className="home-hero__title">
                        {draft.title || (<>מה הסיפור<br />שלכם?</>)}
                    </h1>

                    <div className="home-products">
                        <div className="home-products__badge" aria-label="משלוחים לכל הארץ">
                            <svg className="home-products__badge-ring" viewBox="0 0 100 100" aria-hidden="true">
                                <defs>
                                    <path id="shipRing" d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" />
                                </defs>
                                <text fill="#F2665E" fontSize="9.5" fontWeight="700" letterSpacing="1.2">
                                    <textPath xlinkHref="#shipRing" href="#shipRing" startOffset="0%">
                                        משלוחים לכל הארץ · משלוחים לכל הארץ ·
                                    </textPath>
                                </text>
                            </svg>
                            <div className="home-products__badge-inner">
                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"
                                    viewBox="0 0 24 24" fill="none" stroke="#F2665E"
                                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                    aria-hidden="true">
                                    <rect x="1" y="3" width="15" height="13" rx="1" />
                                    <path d="M16 8h4l3 5v3h-7V8z" />
                                    <circle cx="5.5" cy="18.5" r="2.5" />
                                    <circle cx="18.5" cy="18.5" r="2.5" />
                                </svg>
                            </div>
                        </div>

                        <div className="home-products__grid">
                            {gridItems.map((prod, index) => (
                                prod?.image ? (
                                    <Link
                                        key={index}
                                        to={prod.link || '/products'}
                                        aria-label={prod.name || `קטגוריה ${index + 1}`}
                                        className="home-products__tile"
                                    >
                                        <img src={prod.image} alt={prod.name || `מוצר ${index + 1}`} />
                                        {prod.name ? (
                                            <span className="home-products__tile-label">{prod.name}</span>
                                        ) : null}
                                    </Link>
                                ) : (
                                    <div key={index} className="home-products__empty">
                                        {prod?.name || `מוצר ${index + 1}`}
                                    </div>
                                )
                            ))}
                        </div>
                    </div>

                    <div className="home-products__all">
                        <button
                            type="button"
                            onClick={() => navigate('/products')}
                            className="home-products__all-btn"
                        >
                            {draft.goToAll || "לכל המוצרים"}
                        </button>
                    </div>
                </div>
            </section>

            {/* ══ STORY ═════════════════════════════════════════════════════ */}
            <section className="home-story">
                <div className="home-story__inner">
                    <h2 className="home-story__title">
                        {draft.titleAbout || "זה הסיפור שלנו <"}
                    </h2>
                    <p className="home-story__text">{draft.textAbout}</p>
                </div>
            </section>

            {/* ══ TESTIMONIALS + TIPS ═══════════════════════════════════════ */}
            <div className="home-social">
                <svg
                    viewBox="0 0 1440 90"
                    style={{ display: 'block', width: '100%', height: 72, marginBottom: -2 }}
                    preserveAspectRatio="none"
                    aria-hidden="true"
                >
                    <path
                        fill="#fda49e"
                        d="M0,50 C180,90 360,10 540,45 C720,80 900,15 1080,50 C1260,85 1380,30 1440,45 L1440,90 L0,90 Z"
                    />
                </svg>

                <div className="home-social__band">
                    <h3 className="home-social__title">
                        {draft.titleTestimonials || "תראו מה מספרים עלינו <"}
                    </h3>
                    <Testimonials items={draft.testimonials} />

                    <div className="home-tips">
                        {recentTips.length > 0 ? (
                            recentTips.map((tip) => (
                                <Link
                                    to="/tips/tip_page"
                                    key={tip._id}
                                    onClick={() => setCurrentTip(tip)}
                                    className="home-tips__card"
                                >
                                    <div className="home-tips__img">
                                        <img src={tip.img} alt={tip.title} />
                                    </div>
                                    <div className="home-tips__body">
                                        <h4 className="line-clamp-1">
                                            {tip.title ? tip.title.split(":")[0].trim() : ""}
                                        </h4>
                                        <p className="line-clamp-3">
                                            {truncateText(tip.summary || tip.content, 90)}
                                        </p>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <p className="text-center text-white/80 text-sm" style={{ gridColumn: '1 / -1' }}>
                                טוען טיפים...
                            </p>
                        )}
                    </div>

                    <div className="home-tips__cta">
                        <button
                            type="button"
                            onClick={() => navigate('/tips')}
                            className="home-tips__cta-btn"
                        >
                            {draft.goToTips || "לכל הטיפים"}
                        </button>
                    </div>
                </div>
            </div>
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
