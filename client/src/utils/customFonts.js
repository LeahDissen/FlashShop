const STYLE_ELEMENT_ID = 'flashshop-custom-fonts';
const FORMAT_BY_EXTENSION = { otf: 'opentype', ttf: 'truetype', woff: 'woff', woff2: 'woff2' };

const fontFormat = (url) => {
    const extension = String(url).split('?')[0].split('.').pop().toLowerCase();
    return FORMAT_BY_EXTENSION[extension] || 'opentype';
};

const escapeCss = (text) => String(text).replace(/["\\\n]/g, '');

/**
 * רושם בדף את הגופנים שהמנהלת העלתה (fonts עם url) כ-@font-face.
 * נעשה בתגית style (ולא FontFace API) כדי שגם צילום העיצוב לתמונה (html-to-image) יכלול אותם.
 * @param {{ value: string, url?: string }[]} fonts
 */
export function registerCustomFonts(fonts = []) {
    if (typeof document === 'undefined') return;
    const rules = fonts
        .filter((font) => font?.url && font?.value)
        .map((font) => `@font-face { font-family: "${escapeCss(font.value)}"; src: url("${escapeCss(font.url)}") format("${fontFormat(font.url)}"); font-display: swap; }`)
        .join('\n');

    let style = document.getElementById(STYLE_ELEMENT_ID);
    if (!style) {
        style = document.createElement('style');
        style.id = STYLE_ELEMENT_ID;
        document.head.appendChild(style);
    }
    if (style.textContent !== rules) style.textContent = rules;
}

/** שם משפחת הגופן מתוך שם הקובץ: "FbAbrakadabra-Regular.otf" -> "FbAbrakadabra" */
export function fontFamilyFromFileName(fileName) {
    return String(fileName || '')
        .replace(/\.[^.]+$/, '')
        .replace(/[-_ ](regular|normal|book)$/i, '')
        .replace(/[^\p{L}\p{N} _-]/gu, '')
        .trim();
}
