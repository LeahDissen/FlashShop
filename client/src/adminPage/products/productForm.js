/**
 * The product form in products management: its empty state, a product loaded into it for editing,
 * and the form turned into what is sent to the server.
 */
import { DISPLAY_TYPES, getDisplayTypeForCategory } from '../../constants/productCategories';
import { parseMagnetSize } from '../../utils/magnetSize';
import { serializePriceTiers, validatePriceTiers } from '../../utils/productQuantityPricing';
import { getSaleInfo, regularUnitPrice } from '../../utils/salePrice';

export const DEFAULT_CAPTION_CATEGORY = 'כללי';
const DEFAULT_PRINT_WIDTH_CM = 12;
const DEFAULT_PRINT_HEIGHT_CM = 18;

export const INITIAL_FORM_DATA = {
    name: '',
    description: '',
    price: '',
    category: '',
    displayType: '',
    stock: 100,
    image: '',
    printWidth: DEFAULT_PRINT_WIDTH_CM,
    printHeight: DEFAULT_PRINT_HEIGHT_CM,
    allowOrientationToggle: false,
    size: '',
    memberDiscountType: '',
    memberDiscountValue: '',
    shapeType: '',
    shapeMaskUrl: '',
};

export const createEmptyTier = () => ({
    id: `tier-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    minQuantity: '',
    maxQuantity: '',
    unitPrice: '',
});

export const createEmptyCaption = () => ({ text: '', category: DEFAULT_CAPTION_CATEGORY });

/** The category's kind (design / magnet / simple...), from the form or from the category itself */
export const displayTypeOf = (formData) => formData.displayType
    || (formData.category ? getDisplayTypeForCategory(formData.category) : '');

/** A product loaded into the form for editing: the form fields, its caption ideas and its price tiers */
export function productToForm(product) {
    const displayType = product.displayType || getDisplayTypeForCategory(product.category);
    const tiers = displayType === DISPLAY_TYPES.MAGNET ? [] : (product.priceTiers ?? []);
    return {
        formData: {
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category || '',
            displayType,
            stock: product.stock,
            image: product.image,
            printWidth: product.printWidth ?? DEFAULT_PRINT_WIDTH_CM,
            printHeight: product.printHeight ?? DEFAULT_PRINT_HEIGHT_CM,
            allowOrientationToggle: Boolean(product.allowOrientationToggle),
            size: product.size ?? '',
            shapeType: product.shape?.type ?? '',
            shapeMaskUrl: product.shape?.maskUrl ?? '',
            memberDiscountType: product.memberDiscount?.type ?? '',
            memberDiscountValue: product.memberDiscount?.value ?? '',
        },
        captions: displayType === DISPLAY_TYPES.DESIGN ? (product.captionIdeas ?? []) : [],
        priceTiers: tiers.map((t, i) => ({
            id: `tier-${i}-${t.minQuantity}`,
            minQuantity: t.minQuantity ?? '',
            maxQuantity: t.maxQuantity == null ? '' : t.maxQuantity,
            unitPrice: t.unitPrice ?? '',
        })),
    };
}

/**
 * What is sent to the server for the form, or { error } with the message for the admin.
 * @param {{ formData: object, priceTiers: object[], tieredPricingEnabled: boolean, captions: object[],
 *           isDesignCategory: boolean, isMagnetCategory: boolean }} form
 */
export function buildProductPayload({ formData, priceTiers, tieredPricingEnabled, captions, isDesignCategory, isMagnetCategory }) {
    if (!formData.category) return { error: 'יש לבחור קטגוריה' };

    let serializedTiers = [];
    if (tieredPricingEnabled && !isMagnetCategory) {
        const validation = validatePriceTiers(priceTiers);
        if (!validation.valid) return { error: validation.message };
        serializedTiers = serializePriceTiers(priceTiers);
    }

    const magnetSize = isMagnetCategory ? formData.size.trim() : '';
    if (isMagnetCategory && !magnetSize) return { error: 'יש להזין גודל למגנט' };

    const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        category: formData.category,
        displayType: getDisplayTypeForCategory(formData.category),
        stock: Number(formData.stock),
        image: formData.image.trim(),
        shape: formData.shapeType
            ? { type: formData.shapeType, maskUrl: formData.shapeType === 'custom' ? formData.shapeMaskUrl : undefined }
            : null,
        // Members-only sale: percent off or a final price (the server derives "on sale" from it)
        memberDiscount: formData.memberDiscountType && formData.memberDiscountValue !== ''
            ? { type: formData.memberDiscountType, value: Number(formData.memberDiscountValue) }
            : null,
        priceTiers: isMagnetCategory ? [] : serializedTiers,
        size: magnetSize,
        captionIdeas: isDesignCategory
            ? captions
                .map(({ text, category }) => ({ text: text.trim(), category: category || DEFAULT_CAPTION_CATEGORY }))
                .filter((caption) => caption.text.length > 0)
            : [],
    };

    if (isDesignCategory) {
        payload.printWidth = Number(formData.printWidth) || DEFAULT_PRINT_WIDTH_CM;
        payload.printHeight = Number(formData.printHeight) || DEFAULT_PRINT_HEIGHT_CM;
        payload.allowOrientationToggle = Boolean(formData.allowOrientationToggle);
    }
    if (isMagnetCategory) {
        const parsedSize = parseMagnetSize(magnetSize);
        if (parsedSize) {
            payload.printWidth = parsedSize.width;
            payload.printHeight = parsedSize.height;
        }
    }
    return { payload };
}

/**
 * Warnings when the product's prices contradict each other: a first quantity tier that differs from the
 * price (everyone pays the tier, so the price is never charged), or a members' sale that the tier
 * already gives to everyone. Michal's puzzle: price 34.99, tier 1-30 at 25, members' price 25.
 * @returns {string[]}
 */
export function pricingWarnings({ formData, priceTiers, tieredPricingEnabled }) {
    const price = Number(formData.price);
    if (!tieredPricingEnabled || !(price > 0)) return [];
    const product = {
        price,
        priceTiers: priceTiers.map(({ minQuantity, maxQuantity, unitPrice }) => ({ minQuantity, maxQuantity, unitPrice })),
        memberDiscount: formData.memberDiscountType
            ? { type: formData.memberDiscountType, value: Number(formData.memberDiscountValue) }
            : null,
    };
    const oneUnit = Number(regularUnitPrice(product));
    if (!(oneUnit > 0) || oneUnit === price) return [];
    const warnings = [`במדרגת הכמות של יחידה אחת המחיר הוא ${oneUnit} ₪, ולכן כל הלקוחות משלמים ${oneUnit} ₪ ולא ${price} ₪. אם ${price} ₪ הוא המחיר הרגיל, כדאי לשנות את המדרגה הראשונה ל-${price} ₪.`];
    if (product.memberDiscount && !getSaleInfo(product)) {
        warnings.push(`מבצע חברות המועדון לא מוריד את המחיר מתחת ל-${oneUnit} ₪, ולכן חברות המועדון לא יקבלו הנחה על המוצר הזה.`);
    }
    return warnings;
}
