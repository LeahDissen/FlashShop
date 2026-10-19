/**
 * Keeps the photo selection in photo development for the whole visit (sessionStorage),
 * so a customer who leaves to pick an album comes back and finds the photos she chose.
 */
import { ALBUM_CATEGORY } from './photoQuantityPricing';

const PHOTO_DRAFT_KEY = 'flashshop_photo_order_draft';
const ALBUM_DETOUR_KEY = 'flashshop_album_detour';
export const PHOTO_DEVELOPMENT_PATH = '/photo-development';

const readJson = (key) => {
    try {
        const raw = sessionStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const write = (key, value) => {
    try {
        sessionStorage.setItem(key, value);
    } catch (err) {
        // Storage full or blocked – the selection just won't be saved, the order itself keeps working
        console.warn('Could not save photo order draft:', err.message);
    }
};

export function loadPhotoDraft() {
    const images = readJson(PHOTO_DRAFT_KEY);
    return Array.isArray(images) ? images : [];
}

export function savePhotoDraft(images) {
    if (images.length === 0) {
        clearPhotoDraft();
        return;
    }
    write(PHOTO_DRAFT_KEY, JSON.stringify(images));
}

export function clearPhotoDraft() {
    try {
        sessionStorage.removeItem(PHOTO_DRAFT_KEY);
    } catch {
        // Nothing to clear
    }
}

/** Marks that the customer left photo development to pick an album */
export function startAlbumDetour() {
    write(ALBUM_DETOUR_KEY, '1');
}

/** The customer returned to photo development on her own – no need to send her back there later */
export function endAlbumDetour() {
    try {
        sessionStorage.removeItem(ALBUM_DETOUR_KEY);
    } catch {
        // No marker
    }
}

/**
 * Where to return after adding to the cart: to photo development if the customer came from there to pick an album and the added product is an album,
 * otherwise to the default. The return happens only once.
 */
export function getReturnPathAfterAdd(product, defaultPath) {
    const isAlbumDetour = readJson(ALBUM_DETOUR_KEY) === 1 && product?.category === ALBUM_CATEGORY;
    if (!isAlbumDetour) return defaultPath;
    endAlbumDetour();
    return PHOTO_DEVELOPMENT_PATH;
}
