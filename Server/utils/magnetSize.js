/** גדלי מגנט שהיו קשיחים בממשק — משמשים לפירוק מוצר ישן למוצרים נפרדים */
const MAGNET_CATEGORY = "מגנטים";

const DEFAULT_MAGNET_SIZES = [
    { label: "10×15", width: 10, height: 15, price: 8 },
    { label: "13×18", width: 13, height: 18, price: 12 },
    { label: "15×20", width: 15, height: 20, price: 15 },
    { label: "20×30", width: 20, height: 30, price: 30 },
];

function parseMagnetSize(raw) {
    if (raw == null) return null;
    const text = String(raw).trim();
    if (!text) return null;
    const match = text.match(/(\d+(?:\.\d+)?)\s*[x×*]\s*(\d+(?:\.\d+)?)/i);
    if (!match) return null;
    const width = Number(match[1]);
    const height = Number(match[2]);
    if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
    return {
        width,
        height,
        label: `${width}×${height}`,
    };
}

function sizesMatch(a, b) {
    const parsedA = typeof a === "object" && a ? a : parseMagnetSize(a);
    const parsedB = typeof b === "object" && b ? b : parseMagnetSize(b);
    if (!parsedA || !parsedB) return false;
    return (
        (parsedA.width === parsedB.width && parsedA.height === parsedB.height) ||
        (parsedA.width === parsedB.height && parsedA.height === parsedB.width)
    );
}

function stripSizeFromName(name) {
    const stripped = String(name ?? "")
        .replace(/\s*[-–—]?\s*\d+(?:\.\d+)?\s*[x×*]\s*\d+(?:\.\d+)?\s*(?:ס"?מ)?/gi, "")
        .replace(/\s{2,}/g, " ")
        .trim();
    return stripped || String(name ?? "").trim();
}

function isMagnetProductDoc(product) {
    return product?.displayType === "magnet" || product?.category === MAGNET_CATEGORY;
}

function formatMagnetProductName(baseName, sizeLabel) {
    const base = stripSizeFromName(baseName) || "מגנט";
    return `${base} ${sizeLabel}`.trim();
}

module.exports = {
    MAGNET_CATEGORY,
    DEFAULT_MAGNET_SIZES,
    parseMagnetSize,
    sizesMatch,
    stripSizeFromName,
    isMagnetProductDoc,
    formatMagnetProductName,
};
