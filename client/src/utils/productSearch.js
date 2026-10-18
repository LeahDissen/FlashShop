/** Niqqud, quote marks and punctuation do not affect matching; final letters count as regular ones */
const FINAL_LETTERS = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };

export const normalizeSearchText = (text) => String(text || '')
    .toLowerCase()
    .replace(/[֑-ׇ]/g, '')
    .replace(/[ךםןףץ]/g, (letter) => FINAL_LETTERS[letter])
    .replace(/["'״׳`.,!?()\-–_/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const FIELD_WEIGHTS = [
    ['name', 3],
    ['category', 2],
    ['description', 1],
];

/** Simple Hebrew stemming: "photo" and "photos" find each other (strips a common singular/plural suffix) */
const toStem = (word) => {
    const stem = word.replace(/(ות|ימ|ה|ת)$/, ''); // After normalization the final mem becomes a regular mem
    return stem.length >= 3 ? stem : word;
};

/**
 * Searches products by name, category and description. A product matches if at least one search word appears in it
 * (also as part of a word and regardless of singular/plural, e.g. "magnet" finds "magnets"); products with more name matches come first.
 */
export function searchProducts(products, query, limit = 8) {
    const words = normalizeSearchText(query).split(' ').filter((word) => word.length >= 2).map(toStem);
    if (words.length === 0) return [];

    return (products || [])
        .map((product) => {
            const fields = FIELD_WEIGHTS.map(([key, weight]) => [normalizeSearchText(product[key]), weight]);
            const score = words.reduce((total, word) => total + fields.reduce(
                (sum, [text, weight]) => sum + (text.includes(word) ? weight : 0),
                0,
            ), 0);
            return { product, score };
        })
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ product }) => product);
}
