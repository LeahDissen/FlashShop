/** The trusted price of an order: never the browser's prices */
const { ProductModel } = require("../models/productModel");
const { ClubModel } = require("../models/clubModel");
const { UserModel } = require("../models/userModel");
const { loadShopSettings } = require("../controllers/shopSettingsController");
const { computeClubDiscounts, albumPercentFor } = require("./clubDiscountService");
const { loadPhotoPricing } = require("./photoPricingService");
const { calculateCouponDiscount } = require("./couponService");
const { getPhotoUnitPrice, countPrintsBySize, normalizeSize, isPhotoPrintItem } = require("../utils/photoQuantityPricing");
const { getUnitPriceForQuantity } = require("../utils/productQuantityPricing");
const { resolveProductId, withItemExtras } = require("../utils/orderItems");

const DELIVERY_FEE = 25;
/** Added to the product price when the shop's designer creates the design (matches the client) */
const DESIGNER_SERVICE_FEE = 15;
const MAX_ITEM_QUANTITY = 10_000;

/**
 * Trusted pricing of a cart, used both to create the order and to preview it at checkout:
 * prices come from the products and the photo price list, then club discounts (member price,
 * album discount, join gift) for a customer whose account email is a club member, then a coupon.
 * @returns {Promise<{ error: string } | { verifiedItems, subtotal, discount, discounts, clubGiftMemberId, isMember, potentialMemberSavings }>}
 */
async function priceOrder({ items, couponCode, userId }) {
    let subtotal = 0;
    const verifiedItems = [];
    const discountEntries = [];

    const photoItems = items.filter(isPhotoPrintItem);
    // Each size's price tier is set by the number of prints of that size in the order
    const photoPrintsBySize = countPrintsBySize(photoItems, (item) => item.size, (item) => item.quantity);
    const photoPricing = photoItems.length > 0 ? await loadPhotoPricing() : null;

    for (const item of items) {
        const qty = Number(item.quantity ?? 1);
        if (!Number.isInteger(qty) || qty < 1 || qty > MAX_ITEM_QUANTITY) {
            return { error: `כמות לא תקינה בעגלה: ${item.name || "ללא שם"}` };
        }

        if (isPhotoPrintItem(item)) {
            // The price per photo is set here from the saved price list, by size and the number of prints of that size in the whole order.
            // The cart price is not used: if the customer added photos in several rounds, the tier is calculated on all of them together.
            const photoUnitPrice = getPhotoUnitPrice(photoPricing, item.size, photoPrintsBySize[normalizeSize(item.size)]);

            subtotal += photoUnitPrice * qty;
            verifiedItems.push(withItemExtras({
                name: item.name,
                size: item.size,
                price: photoUnitPrice,
                quantity: qty,
                image: typeof item.image === "string" && item.image.length > 500_000
                    ? null
                    : item.image,
            }, item));
            continue;
        }

        // Every other item must be a catalog product: the price always comes from the product, never from the cart
        const productId = resolveProductId(item);
        const product = productId ? await ProductModel.findById(productId) : null;
        if (!product) {
            return {
                error: `המוצר "${item.name || "ללא שם"}" כבר לא קיים באתר. יש להסיר אותו מהעגלה ולהוסיף מחדש.`,
            };
        }

        const copies = item.customDesign?.copies;
        if (Array.isArray(copies) && copies.length && copies.length !== qty) {
            return { error: `מספר העיצובים לא תואם לכמות: ${item.name || product.name}. יש לעצב שוב את העותקים.` };
        }

        const isCustom = Boolean(item.customDesign || item.customization);
        const serviceFee = item.customization?.type === "designer-service" ? DESIGNER_SERVICE_FEE : 0;
        const basePrice = getUnitPriceForQuantity(product, qty);
        const unitPrice = basePrice + serviceFee;
        // Club discounts apply to the product price, not to the designer fee
        discountEntries.push({ productId: String(product._id), unitPrice: basePrice, quantity: qty, product });

        subtotal += unitPrice * qty;
        verifiedItems.push(withItemExtras({
            productId: product._id,
            name: isCustom && item.name ? item.name : product.name,
            size: item.size,
            price: unitPrice,
            quantity: qty,
            image: isCustom && item.image ? item.image : product.image,
        }, item));
    }

    const user = userId ? await UserModel.findById(userId).select("email").lean() : null;
    const member = user?.email
        ? await ClubModel.findOne({ email: String(user.email).trim().toLowerCase() }).collation({ locale: "en", strength: 2 })
        : null;
    const settings = await loadShopSettings();
    const giftSettings = settings.clubGift?.enabled && settings.clubGift.productId ? settings.clubGift : null;
    const totalPrints = photoItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const albumTiers = photoPricing?.albumDiscountTiers || (totalPrints ? (await loadPhotoPricing()).albumDiscountTiers : []);
    const albumPercent = albumPercentFor(albumTiers, totalPrints);

    const couponResult = await calculateCouponDiscount(couponCode, userId, subtotal);
    if (couponResult.error) {
        return { error: couponResult.error };
    }
    // The join gift: the logged-in member's own unused gift, or a gift code typed at checkout
    const giftMember = [member, couponResult.giftMember]
        .find((m) => m && m.giftType === "join-gift" && !m.isUsed) || null;
    const gift = giftSettings && giftMember ? giftSettings : null;

    const club = member || couponResult.giftMember
        ? computeClubDiscounts({ entries: discountEntries, albumPercent: member ? albumPercent : 0, gift })
        : { member: 0, album: 0, gift: 0, giftApplied: false };
    // Member price and album discount need a member; the gift code alone gives only the gift
    if (!member) { club.member = 0; club.album = 0; }

    const discounts = [
        club.member > 0 && { kind: "member", label: "הנחת חברות מועדון", amount: club.member },
        club.album > 0 && { kind: "album", label: `הנחת אלבום לחברות מועדון (${albumPercent}%)`, amount: club.album },
        club.gift > 0 && { kind: "gift", label: "מתנת הצטרפות למועדון", amount: club.gift },
    ].filter(Boolean);
    const clubTotal = discounts.reduce((sum, d) => sum + d.amount, 0);
    // A coupon applies to what is left after the club discounts
    const couponDiscount = couponResult.applyTo ? couponResult.applyTo(Math.max(0, subtotal - clubTotal)) : 0;
    if (couponDiscount > 0) discounts.push({ kind: "coupon", label: `קופון ${couponCode}`, amount: Math.round(couponDiscount * 100) / 100 });
    const discount = Math.min(subtotal, discounts.reduce((sum, d) => sum + d.amount, 0));

    // What a non-member would save by joining (shown at checkout with a join button)
    let potentialMemberSavings = 0;
    if (!member) {
        const would = computeClubDiscounts({
            entries: discountEntries,
            albumPercent,
            gift: giftSettings,
        });
        potentialMemberSavings = Math.round((would.member + would.album + would.gift) * 100) / 100;
    }

    return {
        verifiedItems,
        subtotal,
        discount,
        discounts,
        clubGiftMemberId: club.giftApplied ? giftMember._id : undefined,
        isMember: Boolean(member),
        potentialMemberSavings,
    };
}

module.exports = { priceOrder, DELIVERY_FEE };
