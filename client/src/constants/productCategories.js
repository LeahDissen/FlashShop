/** קטגוריות מוצרים — לפי הוראות הבוס */

export const DISPLAY_TYPES = {
    DESIGN: 'design',
    SIMPLE: 'simple',
    MAGNET: 'magnet',
};

export const PRODUCT_CATEGORIES = [
    {
        value: 'ביגוד וטקסטיל',
        label: 'ביגוד וטקסטיל',
        displayType: DISPLAY_TYPES.DESIGN,
        hint: 'מוצר עם עיצוב — עורך, גרפיקאית או העלאת תמונה',
    },
    {
        value: 'כוסות וספלים',
        label: 'כוסות וספלים',
        displayType: DISPLAY_TYPES.DESIGN,
        hint: 'מוצר עם עיצוב — עורך, גרפיקאית או העלאת תמונה',
    },
    {
        value: 'אקססוריז',
        label: 'אקססוריז',
        displayType: DISPLAY_TYPES.DESIGN,
        hint: 'מוצר עם עיצוב — עורך, גרפיקאית או העלאת תמונה',
    },
    {
        value: 'מתנות ומשחקים',
        label: 'מתנות ומשחקים',
        displayType: DISPLAY_TYPES.DESIGN,
        hint: 'מוצר עם עיצוב — עורך, גרפיקאית או העלאת תמונה',
    },
    {
        value: 'תמונות וקירות',
        label: 'תמונות וקירות',
        displayType: DISPLAY_TYPES.DESIGN,
        hint: 'מוצר עם עיצוב — עורך, גרפיקאית או העלאת תמונה',
    },
    {
        value: 'אלבום',
        label: 'אלבומים',
        displayType: DISPLAY_TYPES.SIMPLE,
        hint: 'תמונה + מחיר בלבד — ללא עיצוב',
    },
    {
        value: 'ציוד נלווה',
        label: 'ציוד נלווה',
        displayType: DISPLAY_TYPES.SIMPLE,
        hint: 'תמונה + מחיר בלבד (USB, כרטיסי זיכרון, מטענים וכו\')',
    },
    {
        value: 'מגנטים',
        label: 'מגנטים',
        displayType: DISPLAY_TYPES.MAGNET,
        hint: 'העלאת תמונה + בחירת גודל — המחיר מתעדכן לפי הגודל',
    },
];

export const MAGNET_CATEGORY = 'מגנטים';

export const MAGNET_SIZES = [
    { label: '10×15', width: 10, height: 15, price: 8 },
    { label: '13×18', width: 13, height: 18, price: 12 },
    { label: '15×20', width: 15, height: 20, price: 15 },
    { label: '20×30', width: 20, height: 30, price: 30 },
];

export const DISPLAY_TYPE_HINTS = {
    [DISPLAY_TYPES.DESIGN]: 'מוצר עם עיצוב — עורך, גרפיקאית או העלאת תמונה',
    [DISPLAY_TYPES.SIMPLE]: 'תמונה + מחיר בלבד — ללא עיצוב',
    [DISPLAY_TYPES.MAGNET]: 'העלאת תמונה + בחירת גודל — המחיר מתעדכן לפי הגודל',
};

export const DISPLAY_TYPE_LABELS = {
    [DISPLAY_TYPES.DESIGN]: 'עיצוב (עורך / גרפיקאית)',
    [DISPLAY_TYPES.SIMPLE]: 'תמונה + מחיר',
    [DISPLAY_TYPES.MAGNET]: 'מגנטים (תמונה + גודל)',
};

let customCategoriesCache = [];
let hiddenCategoriesCache = [];

export function setCustomCategories(categories) {
    customCategoriesCache = Array.isArray(categories) ? categories : [];
}

export function setHiddenCategories(categories) {
    hiddenCategoriesCache = Array.isArray(categories) ? categories : [];
}

export function getCustomCategories() {
    return customCategoriesCache;
}

export function getHiddenCategories() {
    return hiddenCategoriesCache;
}

function parseJsonArray(raw) {
    try {
        if (!raw) return [];
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function parseCustomCategoriesFromPage(pageData) {
    return parseJsonArray(pageData?.customCategories);
}

export function parseHiddenCategoriesFromPage(pageData) {
    return parseJsonArray(pageData?.hiddenCategories);
}

export function normalizeCategoryName(name) {
    return String(name ?? '').trim().replace(/\s+/g, ' ');
}

export function categoryNamesMatch(a, b) {
    return normalizeCategoryName(a) === normalizeCategoryName(b);
}

export function isDuplicateOfBuiltinCategory(cat) {
    return PRODUCT_CATEGORIES.some(
        (builtin) =>
            categoryNamesMatch(builtin.value, cat.value) ||
            categoryNamesMatch(builtin.label, cat.value) ||
            categoryNamesMatch(builtin.label, cat.label) ||
            categoryNamesMatch(builtin.value, cat.label),
    );
}

export function findCategoryByName(name) {
    const normalized = normalizeCategoryName(name);
    const all = [...PRODUCT_CATEGORIES, ...customCategoriesCache];
    return (
        all.find(
            (cat) =>
                categoryNamesMatch(cat.value, normalized) ||
                categoryNamesMatch(cat.label, normalized),
        ) ?? null
    );
}

export function sanitizeCustomCategories(list) {
    const seen = new Set();
    return (Array.isArray(list) ? list : []).filter((cat) => {
        if (isDuplicateOfBuiltinCategory(cat)) return false;
        const key = normalizeCategoryName(cat.value);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

export function applyCategoryPageData(pageData) {
    const sanitized = sanitizeCustomCategories(parseCustomCategoriesFromPage(pageData));
    setCustomCategories(sanitized);
    setHiddenCategories(parseHiddenCategoriesFromPage(pageData));
    return sanitized;
}

export function getAllCategories() {
    const visibleBuiltin = PRODUCT_CATEGORIES.filter((c) => !hiddenCategoriesCache.includes(c.value));
    const customOnly = customCategoriesCache.filter((c) => !isDuplicateOfBuiltinCategory(c));
    return [...visibleBuiltin, ...customOnly];
}

export function getCategoryMeta(category) {
    const fromBuiltin = PRODUCT_CATEGORIES.find((c) => c.value === category);
    if (fromBuiltin) return fromBuiltin;
    return customCategoriesCache.find((c) => c.value === category) ?? null;
}

export function isCustomCategory(categoryValue) {
    return customCategoriesCache.some((c) => c.value === categoryValue);
}

export function getDisplayTypeForCategory(category) {
    return getCategoryMeta(category)?.displayType ?? DISPLAY_TYPES.DESIGN;
}

export function buildCustomCategory(name, displayType) {
    const value = name.trim();
    return {
        value,
        label: value,
        displayType,
        hint: DISPLAY_TYPE_HINTS[displayType] ?? DISPLAY_TYPE_HINTS[DISPLAY_TYPES.DESIGN],
        isCustom: true,
    };
}
