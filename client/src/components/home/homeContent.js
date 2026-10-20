/** The home page's content: defaults, the cached copy from the last visit and the product tiles */
import { DEFAULT_TESTIMONIALS } from '../../constants/testimonials';

/** Parse a Redis field that may arrive as JSON string or already-parsed value */
export const parseJsonField = (value, fallback) => {
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
export const HERO_HEIGHTS = {
    small: { label: "נמוכה", px: 240 },
    medium: { label: "בינונית", px: 360 },
    large: { label: "גבוהה", px: 480 },
};
export const DEFAULT_HERO_HEIGHT = "medium";
export const DEFAULT_HERO_FOCUS = 50; // Vertical percent: 0 = top of the image, 100 = bottom
/** How many product tiles can be set on the home page (4 per row on desktop, 2 on mobile) */
export const HOME_TILE_COUNT = 8;
export const PHOTO_DEVELOPMENT_PATH = '/photo-development';
export const DEFAULT_UPLOAD_BADGE_TEXT = 'להעלאת תמונות להדפסה';

const HOME_CACHE_KEY = 'flashshop_home_page';

/** Home page content from the previous visit – shown immediately, and updated when the fresh version arrives from the server */
export const readHomeCache = () => {
    try {
        const cached = JSON.parse(localStorage.getItem(HOME_CACHE_KEY) || 'null');
        return cached && typeof cached === 'object' ? cached : null;
    } catch {
        return null;
    }
};

export const writeHomeCache = (data) => {
    try {
        localStorage.setItem(HOME_CACHE_KEY, JSON.stringify(data));
    } catch {
        // Storage full or blocked – just no cache
    }
};

/** Stable initial data — defined outside component to prevent recreation on every render */
export const INITIAL_DATA = {
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

/** Cuts text to maxLength characters, with "..." when it was longer */
export const truncateText = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

/** A tile without an explicit link leads to the products page filtered by its category name */
export const tileLink = (prod) => {
    const link = (prod?.link || '').trim();
    if (link) return link;
    const name = (prod?.name || '').trim();
    return name ? `/products?category=${encodeURIComponent(name)}` : '/products';
};

/** The admin's edit slots: always HOME_TILE_COUNT, including empty ones (null) */
export const homeEditTiles = (products) => {
    const list = Array.isArray(products) ? products : [];
    return [
        ...list.slice(0, HOME_TILE_COUNT),
        ...Array(Math.max(0, HOME_TILE_COUNT - list.length)).fill(null),
    ];
};

/** The testimonials to edit: the saved list, or the defaults until the admin changed them */
export const testimonialsOf = (draft) => (Array.isArray(draft.testimonials) ? draft.testimonials : DEFAULT_TESTIMONIALS);
