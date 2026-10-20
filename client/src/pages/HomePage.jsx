import { useRef, useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from 'react-router-dom';
import { getPage } from '../api/pages';
import { getAllTips } from '../api/tips';
import AdminControls from '../components/AdminControls.jsx';
import SmartImageInput from '../components/SmartImageInput';
import Testimonials from '../components/Testimonials';
import { DEFAULT_TESTIMONIALS } from '../constants/testimonials';
import WaveDivider from '../components/WaveDivider';
import ProductSearch from '../components/ProductSearch';
import { useAdminControl } from '../hooks/useAdminControl.jsx';
import useAppStore from '../store/appStore';
import { useTipsStore } from '../store/tipsStore';
import { optimizeImageUrl, screenWidthImageSize } from '../utils/imageUrl';

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

/** Hero image height by the admin's choice (on desktop; smaller on mobile by the same ratio) */
const HERO_HEIGHTS = {
    small: { label: "נמוכה", px: 240 },
    medium: { label: "בינונית", px: 360 },
    large: { label: "גבוהה", px: 480 },
};
const DEFAULT_HERO_HEIGHT = "medium";
const DEFAULT_HERO_FOCUS = 50; // Vertical percent: 0 = top of the image, 100 = bottom
/** How many product tiles can be set on the home page (4 per row on desktop, 2 on mobile) */
const HOME_TILE_COUNT = 8;
const PHOTO_DEVELOPMENT_PATH = '/photo-development';
const DEFAULT_UPLOAD_BADGE_TEXT = 'להעלאת תמונות להדפסה';

const HOME_CACHE_KEY = 'flashshop_home_page';

/** Home page content from the previous visit – shown immediately, and updated when the fresh version arrives from the server */
const readHomeCache = () => {
    try {
        const cached = JSON.parse(localStorage.getItem(HOME_CACHE_KEY) || 'null');
        return cached && typeof cached === 'object' ? cached : null;
    } catch {
        return null;
    }
};

const writeHomeCache = (data) => {
    try {
        localStorage.setItem(HOME_CACHE_KEY, JSON.stringify(data));
    } catch {
        // Storage full or blocked – just no cache
    }
};

/** Stable initial data — defined outside component to prevent recreation on every render */
const INITIAL_DATA = {
    title: "",
    mainImg: "",
    heroHeight: DEFAULT_HERO_HEIGHT,
    heroFocus: DEFAULT_HERO_FOCUS,
    products: [],
    goToAll: "",
    uploadBadgeText: "",
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
    const [cachedHome] = useState(readHomeCache);
    // Don't draw the page until the content arrives, so it does not "jump" when the image and tiles load
    const [isLoaded, setIsLoaded] = useState(Boolean(cachedHome));
    const adminControls = useAdminControl(cachedHome ? { ...INITIAL_DATA, ...cachedHome } : INITIAL_DATA, "home");
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
            setIsLoaded(true);
            writeHomeCache(data);
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

    /** A tile without an explicit link leads to the products page filtered by its category name */
    const tileLink = (prod) => {
        const link = (prod?.link || '').trim();
        if (link) return link;
        const name = (prod?.name || '').trim();
        return name ? `/products?category=${encodeURIComponent(name)}` : '/products';
    };

    const heroHeightKey = HERO_HEIGHTS[draft.heroHeight] ? draft.heroHeight : DEFAULT_HERO_HEIGHT;
    const heroFocus = Number.isFinite(Number(draft.heroFocus)) ? Number(draft.heroFocus) : DEFAULT_HERO_FOCUS;

    const uploadBadgeText = (draft.uploadBadgeText || '').trim() || DEFAULT_UPLOAD_BADGE_TEXT;

    /** The admin's edit slots: always HOME_TILE_COUNT, including empty ones */
    const editTiles = useMemo(() => {
        const list = Array.isArray(draft.products) ? draft.products : [];
        return [
            ...list.slice(0, HOME_TILE_COUNT),
            ...Array(Math.max(0, HOME_TILE_COUNT - list.length)).fill(null),
        ];
    }, [draft.products]);

    /** The shop shows only tiles that have an image – no empty slots */
    const visibleTiles = useMemo(() => editTiles.filter((prod) => prod?.image), [editTiles]);

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
            <div className="grid grid-cols-2 gap-3">
                <label className="block">
                    <span className="font-bold block mb-1">גובה התמונה:</span>
                    <select
                        value={heroHeightKey}
                        onChange={(e) => updateDraft({ heroHeight: e.target.value })}
                        className="w-full border rounded p-2"
                    >
                        {Object.entries(HERO_HEIGHTS).map(([key, { label }]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </label>
                <label className="block">
                    <span className="font-bold block mb-1">איזה חלק מהתמונה יוצג: {heroFocus <= 20 ? "למעלה" : heroFocus >= 80 ? "למטה" : "אמצע"}</span>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={heroFocus}
                        onChange={(e) => updateDraft({ heroFocus: Number(e.target.value) })}
                        className="w-full accent-[#f2665e]"
                    />
                </label>
            </div>
            <div>
                <label className="font-bold block mb-2">{HOME_TILE_COUNT} מוצרים — תמונה + שם + קישור (4 בשורה):</label>
                <div className="grid grid-cols-2 gap-3">
                    {editTiles.map((prod, index) => (
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
                                placeholder="קישור (ריק = מוצרים לפי שם הקטגוריה)"
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
                <label className="font-bold block mb-1">טקסט העיגול שמוביל להעלאת תמונות:</label>
                <input
                    type="text"
                    value={draft.uploadBadgeText || ''}
                    placeholder={DEFAULT_UPLOAD_BADGE_TEXT}
                    className="w-full border rounded p-2"
                    onChange={(e) => updateDraft({ uploadBadgeText: e.target.value })}
                />
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
                <label className="font-bold block mb-1">טקסט "הסיפור שלנו" (3–4 שורות על החנות):</label>
                <textarea
                    placeholder="כמה שורות על החנות: מי אנחנו, מה אנחנו עושות ולמה"
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
    const ViewContent = !isLoaded ? (
        <div className="w-full min-h-screen bg-white" aria-busy="true" />
    ) : (
        <div className="w-full bg-white overflow-x-hidden">

            {/* ══ HERO WAVE + PRODUCTS ══════════════════════════════════════ */}
            <section className="home-hero">
                <div className="home-hero__banner">
                    <div
                        className="home-hero__banner-bg"
                        style={{
                            backgroundColor: '#f8dcdb',
                            backgroundImage: draft.mainImg ? `url(${optimizeImageUrl(draft.mainImg, { width: screenWidthImageSize() })})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: `center ${heroFocus}%`,
                            '--hero-height': `${HERO_HEIGHTS[heroHeightKey].px}px`,
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

                    <ProductSearch className="mb-6" />

                    <div className="home-products">
                        <Link
                            to={PHOTO_DEVELOPMENT_PATH}
                            className="home-products__badge"
                            aria-label={uploadBadgeText}
                        >
                            <svg className="home-products__badge-ring" viewBox="0 0 100 100" aria-hidden="true">
                                <defs>
                                    <path id="uploadRing" d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" />
                                </defs>
                                <text fill="#F2665E" fontSize="9" fontWeight="700">
                                    <textPath href="#uploadRing" startOffset="0%" textLength="232" lengthAdjust="spacing">
                                        {`${uploadBadgeText} · `}
                                    </textPath>
                                </text>
                            </svg>
                            <span className="home-products__badge-inner" aria-hidden="true">
                                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26"
                                    viewBox="0 0 24 24" fill="none" stroke="#fff"
                                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 19V5" />
                                    <path d="M5 12l7-7 7 7" />
                                </svg>
                            </span>
                        </Link>

                        <div className="home-products__grid">
                            {visibleTiles.map((prod, index) => (
                                <Link
                                    key={index}
                                    to={tileLink(prod)}
                                    aria-label={prod.name || `קטגוריה ${index + 1}`}
                                    className="home-products__tile"
                                >
                                    <img
                                        src={optimizeImageUrl(prod.image, { width: 600 })}
                                        alt={prod.name || `מוצר ${index + 1}`}
                                        width="600"
                                        height="600"
                                        loading="lazy"
                                    />
                                    {prod.name ? (
                                        <span className="home-products__tile-label">{prod.name}</span>
                                    ) : null}
                                </Link>
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
                                        <img src={optimizeImageUrl(tip.img, { width: 600 })} alt={tip.title} loading="lazy" decoding="async" />
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
