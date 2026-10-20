/**
 * Option buttons on the product page. The label and hint are editable on the admin "products" page
 * and right under the buttons on any product page (admins only),
 * and saved in the "products" CMS page under the `${key}Label` / `${key}Hint` fields.
 */
export const PRINT_OPTIONS = [
    { key: "optionSelfDesign", defaultLabel: "עיצוב עצמי", adminLabel: "עיצוב עצמי", defaultHint: "מעצבים בעצמכם בעורך: תמונות, טקסט, מסגרות ורקע." },
    { key: "optionDesigner", defaultLabel: "עיצוב מותאם", adminLabel: "עיצוב על ידי גרפיקאית", defaultHint: "שולחים לנו תמונות והוראות, והגרפיקאית שלנו מעצבת בשבילכם (בתוספת תשלום)." },
    { key: "optionUpload", defaultLabel: "העלאת תמונה", adminLabel: "העלאת תמונה מוכנה", defaultHint: "יש לכם עיצוב מוכן? מעלים אותו, ואנחנו מדפיסים אותו כמו שהוא." },
    { key: "optionCaptions", defaultLabel: "רעיונות לכיתוב", adminLabel: "רעיונות לכיתוב", defaultHint: "רעיונות לטקסטים ולהקדשות לעיצוב שלכם." },
    { key: "optionPerCopy", defaultLabel: "עיצוב בנפרד עבור כל עותק מוצר", adminLabel: "עיצוב נפרד לכל עותק (כשהכמות יותר מ-1)", defaultHint: "עיצוב אחר לכל אחד מהעותקים שהזמנתם: כל עותק מודפס עם העיצוב שלו." },
];

/** An option's label and hint, from the CMS content with a default */
export function getPrintOption(content, key) {
    const option = PRINT_OPTIONS.find((o) => o.key === key);
    const label = String(content?.[`${key}Label`] ?? "").trim();
    const hint = String(content?.[`${key}Hint`] ?? "").trim();
    return { label: label || option?.defaultLabel || "", hint: hint || option?.defaultHint || "" };
}
