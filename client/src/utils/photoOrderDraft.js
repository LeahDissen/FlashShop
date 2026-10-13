/**
 * שמירת בחירת התמונות בפיתוח תמונות לאורך הביקור (sessionStorage),
 * כדי שלקוחה שיוצאת לבחור אלבום תחזור ותמצא את התמונות שבחרה.
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
        // אחסון מלא או חסום – הבחירה פשוט לא תישמר, ההזמנה עצמה ממשיכה לעבוד
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
        // אין מה לנקות
    }
}

/** מסמן שהלקוחה יצאה מפיתוח התמונות לבחירת אלבום */
export function startAlbumDetour() {
    write(ALBUM_DETOUR_KEY, '1');
}

/** הלקוחה חזרה לפיתוח התמונות בעצמה – אין צורך להחזיר אותה לשם אחר כך */
export function endAlbumDetour() {
    try {
        sessionStorage.removeItem(ALBUM_DETOUR_KEY);
    } catch {
        // אין סימון
    }
}

/**
 * לאן לחזור אחרי הוספה לסל: לפיתוח התמונות אם הגיעו משם לבחירת אלבום והמוצר שנוסף הוא אלבום,
 * אחרת לברירת המחדל. החזרה קורית פעם אחת בלבד.
 */
export function getReturnPathAfterAdd(product, defaultPath) {
    const isAlbumDetour = readJson(ALBUM_DETOUR_KEY) === 1 && product?.category === ALBUM_CATEGORY;
    if (!isAlbumDetour) return defaultPath;
    endAlbumDetour();
    return PHOTO_DEVELOPMENT_PATH;
}
