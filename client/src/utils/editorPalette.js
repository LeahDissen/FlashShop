const normalizeHex = (value) => String(value || '').trim().toUpperCase();

/**
 * פלטת הצבעים שהלקוח רואה בעורך – לטקסט, לצבע אלמנט ולרקע הקנבס.
 * מאחדת את "צבעים מוכנים" מהגדרות העורך עם פריטי הצבע בספריית העורך,
 * כך שכל צבע שהמנהלת הגדירה באחד המקומות מופיע בכל הבוררים.
 */
export const buildEditorPalette = (presetValues = [], assetColors = []) => {
    const seen = new Set();
    const palette = [];

    const push = (value, cssClass = '') => {
        const hex = normalizeHex(value);
        if (!hex || seen.has(hex)) return;
        seen.add(hex);
        palette.push({ value: hex, class: cssClass });
    };

    presetValues.forEach((value) => push(value));
    assetColors.forEach((color) => push(color?.value, color?.class));

    return palette;
};
