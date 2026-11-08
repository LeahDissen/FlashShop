/**
 * Texts shown at checkout, saved in the "checkout" CMS page and edited by the admin under
 * "מועדון והנחות". These defaults are what Michal asked for and are used until she saves her own.
 */
export const DEFAULT_CHECKOUT_TEXTS = {
    pickupNotice:
        'ההזמנה תהיה מוכנה עד 2 ימי עסקים, תישלח אליך הודעה כשההזמנה מוכנה. כשההזמנה מוכנה ניתן לאסוף בכל עת מהתיבה שלנו ליד דלת החנות. כתובת: דרך מרן 15, נוף כנרת, טבריה עילית (כניסה מהחצר).',
    deliveryNotice: 'זמן הכנת המוצר: עד 2 ימי עסקים. זמן משלוח: עד 7 ימי עסקים נוספים.',
    termsCheckboxText: 'קראתי את תקנון האתר ואני מסכים/ה',
    termsTitle: 'תקנון האתר',
    termsContent: '',
};

/** Saved texts over the defaults; an empty saved field falls back to the default */
export const mergeCheckoutTexts = (saved = {}) =>
    Object.fromEntries(
        Object.entries(DEFAULT_CHECKOUT_TEXTS).map(([key, value]) => [key, String(saved[key] ?? '').trim() || value]),
    );
