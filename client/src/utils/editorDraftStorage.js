/**
 * The editor's draft in localStorage, kept per product so each product reopens with its own design.
 * Every function here tolerates a full or unavailable storage: the editor keeps working, only unsaved.
 */

const STORAGE_PREFIXES = {
    canvasKey: 'active_editor_canvas_key',
    elements: 'active_editor_elements',
    background: 'active_editor_bg',
    projectName: 'active_editor_name',
    frameSelection: 'active_editor_frame_selection',
};

export const DEFAULT_PROJECT_NAME = 'הפרויקט שלי';

/** A new object each time, so no caller can change the shared default */
export const createDefaultBackground = () => ({ type: 'color', value: '#FFFFFF' });

export const safeJsonParse = (raw, fallback) => {
    if (!raw) return fallback;
    try {
        return JSON.parse(raw);
    } catch (error) {
        console.warn('Invalid JSON in storage:', error);
        return fallback;
    }
};

const isQuotaExceededError = (error) =>
    error?.name === 'QuotaExceededError' || error?.code === 22 || error?.code === 1014;

/** @returns {boolean} false when the storage is full (any other storage error is rethrown) */
export const safeStorageSetItem = (key, value) => {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (error) {
        if (isQuotaExceededError(error)) {
            console.warn(`localStorage quota exceeded for key: ${key}`);
            return false;
        }
        throw error;
    }
};

/** The product a draft belongs to: its id, the id in the URL, or a shared key when there is no product */
export const resolveDraftProductKey = (product, fallbackProductId) =>
    product?._id || product?.id || fallbackProductId || 'no-product';

/** @returns {{ canvasKey: string, elements: string, background: string, projectName: string, frameSelection: string }} */
export const getDraftStorageKeys = (productKey) => Object.fromEntries(
    Object.entries(STORAGE_PREFIXES).map(([field, prefix]) => [field, `${prefix}_${productKey}`]),
);

/** Where a design per copy is kept for a product (separately from its regular draft) */
export const getCopiesStorageKey = (productKey) => `${STORAGE_PREFIXES.elements}_copies_${productKey}`;

/**
 * Writes the given parts of a draft; a part left undefined is not touched.
 * frameSelection: null removes the saved frame choice.
 */
export function writeDraft(keys, { canvasKey, elements, background, projectName, frameSelection } = {}) {
    if (canvasKey !== undefined) safeStorageSetItem(keys.canvasKey, canvasKey);
    if (elements !== undefined) safeStorageSetItem(keys.elements, JSON.stringify(elements));
    if (background !== undefined) safeStorageSetItem(keys.background, JSON.stringify(background));
    if (projectName !== undefined) safeStorageSetItem(keys.projectName, projectName);
    if (frameSelection === null) localStorage.removeItem(keys.frameSelection);
    else if (frameSelection !== undefined) safeStorageSetItem(keys.frameSelection, JSON.stringify(frameSelection));
}

export function clearDraft(keys) {
    Object.values(keys).forEach((key) => localStorage.removeItem(key));
}
