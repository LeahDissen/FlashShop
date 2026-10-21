/**
 * Cleaning what the browser sends for an order before it is stored: customer details, product ids,
 * and each cart line's design or designer request, kept to the fields production needs.
 */
const mongoose = require("mongoose");

const sanitizeText = (value, max = 120) => String(value || "").trim().slice(0, max);

const sanitizeCustomerDetails = (customer = {}) => ({
    name: sanitizeText(customer.name, 120),
    phone: sanitizeText(customer.phone, 40),
    email: sanitizeText(customer.email, 120).toLowerCase(),
});

const sanitizeShippingAddress = (shipping = {}) => ({
    city: sanitizeText(shipping.city, 80),
    street: sanitizeText(shipping.street, 120),
    houseNumber: sanitizeText(shipping.houseNumber, 20),
});

const isValidObjectId = (id) =>
    mongoose.Types.ObjectId.isValid(id) &&
    String(new mongoose.Types.ObjectId(id)) === String(id);

const extractProductIdFromLineId = (lineId) => {
    if (!lineId || typeof lineId !== "string") return null;
    const match = lineId.match(/^([a-f0-9]{24})-/i);
    return match ? match[1] : null;
};

const resolveProductId = (item) => {
    const candidates = [
        item.productId,
        item.product_id,
        item._id,
        extractProductIdFromLineId(item.id),
    ];
    for (const id of candidates) {
        if (isValidObjectId(String(id))) {
            return String(id);
        }
    }
    return null;
};

const MAX_STORED_IMAGE_LENGTH = 500_000;

const maybeStoreImage = (img) => {
    if (typeof img !== "string" || !img) return undefined;
    if (img.startsWith("data:") && img.length > MAX_STORED_IMAGE_LENGTH) return undefined;
    return img;
};

const compactDriveFile = (file) => {
    if (!file || typeof file !== "object" || !file.id) return undefined;
    return {
        id: String(file.id),
        name: file.name ? String(file.name) : undefined,
        url: file.url ? String(file.url) : undefined,
    };
};

/** Saves the customer's editor choices (frame, size, orientation, captions) for production */
const compactFrameSelection = (frameSelection) => {
    if (!frameSelection || typeof frameSelection !== "object") return undefined;
    const compact = {
        frameId: frameSelection.frameId,
        frameTitle: frameSelection.frameTitle,
        frameImageUrl: frameSelection.frameImageUrl,
        printSizeKey: frameSelection.printSizeKey,
        printSizeLabel: frameSelection.printSizeLabel,
        frameOrientation: frameSelection.frameOrientation,
        canvasOrientation: frameSelection.canvasOrientation,
        orientationFlipped: frameSelection.orientationFlipped,
        layoutType: frameSelection.layoutType,
        isFixedOverlay: frameSelection.isFixedOverlay,
        rotationApplied: frameSelection.rotationApplied,
    };
    Object.keys(compact).forEach((key) => {
        if (compact[key] === undefined) delete compact[key];
    });
    return Object.keys(compact).length ? compact : undefined;
};

const compactCaptions = (captions) => {
    if (!Array.isArray(captions) || captions.length === 0) return undefined;
    return captions.slice(0, 20).map((caption) => ({
        content: String(caption?.content ?? "").slice(0, 300),
        fontFamily: caption?.fontFamily,
        fontSize: caption?.fontSize,
        color: caption?.color,
    }));
};

const MAX_DESIGN_COPIES = 200;

const compactCustomDesign = (customDesign) => {
    if (!customDesign || typeof customDesign !== "object") return undefined;
    const compact = {
        projectId: customDesign.projectId,
        projectName: customDesign.projectName,
        canvasSize: customDesign.canvasSize,
        printSizeCm: customDesign.printSizeCm,
        frameSelection: compactFrameSelection(customDesign.frameSelection),
        captions: compactCaptions(customDesign.captions),
        designFile: compactDriveFile(customDesign.designFile),
        driveFile: compactDriveFile(customDesign.driveFile),
        // A separate design per copy: each copy's print file (https, uploaded by the editor)
        copies: Array.isArray(customDesign.copies)
            ? customDesign.copies
                .map((copy) => (typeof copy?.image === "string" && /^https:\/\//.test(copy.image) ? { image: copy.image } : null))
                .filter(Boolean)
                .slice(0, MAX_DESIGN_COPIES)
            : undefined,
    };
    if (compact.copies && !compact.copies.length) delete compact.copies;
    const hasValue = Object.values(compact).some((value) => value != null);
    return hasValue ? compact : undefined;
};

const MAX_DESIGNER_IMAGES = 6;

const compactCustomization = (customization) => {
    if (!customization || typeof customization !== "object") return undefined;
    const compact = {
        type: customization.type,
        name: customization.name,
        email: customization.email,
        phone: customization.phone,
        description: customization.description,
        printSize: customization.printSize,
        width: customization.width,
        height: customization.height,
        originalImage: maybeStoreImage(customization.originalImage),
        referenceImage: maybeStoreImage(customization.referenceImage),
        // "עיצוב מותאם": up to 6 photos for the designer
        referenceImages: Array.isArray(customization.referenceImages)
            ? customization.referenceImages.map(maybeStoreImage).filter((src) => typeof src === "string" && src).slice(0, MAX_DESIGNER_IMAGES)
            : undefined,
    };
    Object.keys(compact).forEach((key) => {
        if (compact[key] === undefined || compact[key] === "" || (Array.isArray(compact[key]) && !compact[key].length)) {
            delete compact[key];
        }
    });
    return Object.keys(compact).length ? compact : undefined;
};

const withItemExtras = (base, item) => {
    const extras = {};
    if (item.itemType) extras.itemType = item.itemType;
    const customDesign = compactCustomDesign(item.customDesign);
    if (customDesign) extras.customDesign = customDesign;
    const customization = compactCustomization(item.customization);
    if (customization) extras.customization = customization;
    return { ...base, ...extras };
};

const sanitizeCartItem = (item) => {
    const sanitized = withItemExtras({
        name: item.name,
        size: item.size,
        quantity: item.quantity,
        price: item.price,
        image: maybeStoreImage(item.image) ?? (typeof item.image === "string" ? item.image : undefined),
        itemType: item.itemType,
    }, item);
    const rawId = resolveProductId(item);
    if (isValidObjectId(rawId)) {
        sanitized.productId = rawId;
    }
    return sanitized;
};

module.exports = {
    sanitizeText,
    sanitizeCustomerDetails,
    sanitizeShippingAddress,
    isValidObjectId,
    resolveProductId,
    maybeStoreImage,
    compactDriveFile,
    compactCustomDesign,
    compactCustomization,
    withItemExtras,
    sanitizeCartItem,
};
