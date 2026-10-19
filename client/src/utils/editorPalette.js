const normalizeHex = (value) => String(value || '').trim().toUpperCase();

/**
 * The color palette the customer sees in the editor – for text, element color and canvas background.
 * Merges the "preset colors" from the editor settings with the color items in the editor library,
 * so every color the admin defined in either place appears in all the pickers.
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
