/** ניקוד, גרשיים וסימני פיסוק לא משנים התאמה; אותיות סופיות נחשבות כמו רגילות */
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

/** שורש פשוט לעברית: "תמונה" ו"תמונות" מוצאים זה את זה (מוריד סיומת יחיד/רבים נפוצה) */
const toStem = (word) => {
    const stem = word.replace(/(ות|ים|ה|ת)$/, '');
    return stem.length >= 3 ? stem : word;
};

/**
 * מחפש מוצרים לפי שם, קטגוריה ותיאור. מוצר מתאים אם לפחות מילה אחת מהחיפוש מופיעה בו
 * (גם כחלק ממילה ובלי תלות ביחיד/רבים, למשל "מגנט" מוצא "מגנטים"); מוצרים עם יותר התאמות בשם מופיעים ראשונים.
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
