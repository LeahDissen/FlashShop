/**
 * Option buttons on the product page. The label and hint are editable on the admin "products" page
 * and saved in the "products" CMS page under the `${key}Label` / `${key}Hint` fields.
 */
export const PRINT_OPTIONS = [
    { key: "optionSelfDesign", defaultLabel: "עיצוב עצמי", adminLabel: "עיצוב עצמי" },
    { key: "optionDesigner", defaultLabel: "עיצוב מותאם", adminLabel: "עיצוב על ידי גרפיקאית" },
    { key: "optionUpload", defaultLabel: "העלאת תמונה", adminLabel: "העלאת תמונה מוכנה" },
    { key: "optionCaptions", defaultLabel: "רעיונות לכיתוב", adminLabel: "רעיונות לכיתוב" },
];

/** An option's label and hint, from the CMS content with a default */
export function getPrintOption(content, key) {
    const option = PRINT_OPTIONS.find((o) => o.key === key);
    const label = String(content?.[`${key}Label`] ?? "").trim();
    const hint = String(content?.[`${key}Hint`] ?? "").trim();
    return { label: label || option?.defaultLabel || "", hint };
}
