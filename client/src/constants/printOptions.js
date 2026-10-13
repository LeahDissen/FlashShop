/**
 * כפתורי האפשרויות בעמוד המוצר. הטקסט וההסבר ניתנים לעריכה בעמוד "המוצרים" באדמין
 * ונשמרים בדף ה-CMS "products" בשדות `${key}Label` / `${key}Hint`.
 */
export const PRINT_OPTIONS = [
    { key: "optionSelfDesign", defaultLabel: "עיצוב עצמי", adminLabel: "עיצוב עצמי" },
    { key: "optionDesigner", defaultLabel: "עיצוב מותאם", adminLabel: "עיצוב על ידי גרפיקאית" },
    { key: "optionUpload", defaultLabel: "העלאת תמונה", adminLabel: "העלאת תמונה מוכנה" },
    { key: "optionCaptions", defaultLabel: "רעיונות לכיתוב", adminLabel: "רעיונות לכיתוב" },
];

/** הטקסט וההסבר של אפשרות, לפי תוכן ה-CMS עם ברירת מחדל */
export function getPrintOption(content, key) {
    const option = PRINT_OPTIONS.find((o) => o.key === key);
    const label = String(content?.[`${key}Label`] ?? "").trim();
    const hint = String(content?.[`${key}Hint`] ?? "").trim();
    return { label: label || option?.defaultLabel || "", hint };
}
