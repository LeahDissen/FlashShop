const mongoose = require("mongoose");
const { OrderModel } = require("../models/ordersModel");
const { CouponModel } = require("../models/couponModel");
const { ClubModel } = require("../models/clubModel");
const { ProductModel } = require("../models/productModel"); // Import the products model for price verification
const { getPhotoUnitPrice, countPrintsBySize, normalizeSize, isPhotoPrintItem } = require("../utils/photoQuantityPricing");
const { loadPhotoPricing } = require("../services/photoPricingService");
const { getUnitPriceForQuantity } = require("../utils/productQuantityPricing");
const {
    isDriveConfigured,
    moveDesignsToOrderFolder,
    ensureOrderFolder,
    downloadImageSource,
    uploadBufferToFolder,
} = require("../services/googleDriveService");
const { loadEditorSettings } = require("./editorSettingsController");
const { validateCheckoutDetails, firstCheckoutValidationMessage } = require("../utils/checkoutValidation");
const { sendOrderStatusEmail, loadOrderEmailTemplates } = require("../services/orderEmailService");
const { isHypConfigured, createPaymentUrl, verifyPaymentRedirect, checkConnection } = require("../services/hypPaymentService");
const { OrderEmailTemplateModel, ORDER_EMAIL_STATUSES, ORDER_EMAIL_PLACEHOLDERS } = require("../models/orderEmailTemplateModel");

const DELIVERY_FEE = 25;
/** Added to the product price when the shop's designer creates the design (matches the client) */
const DESIGNER_SERVICE_FEE = 15;
const MAX_ITEM_QUANTITY = 10_000;

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

// Helper for safely comparing ids (ObjectIds)
const isSameUser = (a, b) => String(a) === String(b);

const MAX_STORED_IMAGE_LENGTH = 500_000;

const maybeStoreImage = (img) => {
    if (typeof img !== "string" || !img) return undefined;
    if (img.startsWith("data:") && img.length > MAX_STORED_IMAGE_LENGTH) return undefined;
    return img;
};

const sanitizeDriveFileName = (value, fallback) => {
    const cleaned = String(value || "")
        .replace(/[\\/:*?"<>|]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    return cleaned.slice(0, 120) || fallback;
};

const extensionFromImageUrl = (url) => {
    const match = String(url || "").toLowerCase().match(/\.(jpe?g|png|webp|gif)(?:\?|$)/);
    if (!match) return "jpg";
    return match[1] === "jpeg" ? "jpg" : match[1];
};

const extensionFromMime = (mime) => {
    const type = String(mime || "").toLowerCase();
    if (type.includes("png")) return "png";
    if (type.includes("webp")) return "webp";
    if (type.includes("gif")) return "gif";
    return "jpg";
};

const resolvePhotoPrintSource = (item) => {
    const candidates = [
        item?.image,
        item?.customization?.originalImage,
        item?.customization?.referenceImage,
    ];
    for (const src of candidates) {
        if (typeof src === "string" && src.trim()) return src.trim();
    }
    return "";
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
    };
    const hasValue = Object.values(compact).some((value) => value != null);
    return hasValue ? compact : undefined;
};

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
    };
    Object.keys(compact).forEach((key) => {
        if (compact[key] === undefined || compact[key] === "") {
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

// Helper for checking permissions (the user themselves or an admin)
const ensureSelfOrAdmin = (req, res, userId) => {
    if (!isSameUser(req.tokenData._id, userId) && req.tokenData.role !== "admin") {
        res.status(403).json({ msg: "אין הרשאה לצפות במידע זה" });
        return false;
    }
    return true;
};

// Calculate the coupon discount (general or club)
async function calculateCouponDiscount(couponCode, userId, subtotal) {
    if (!couponCode) {
        return { discount: 0 };
    }

    // 1. Check for a general coupon in the system
    const generalCoupon = await CouponModel.findOne({ code: couponCode });

    if (generalCoupon) {
        if (!generalCoupon.isActive) {
            return { error: "הקופון אינו פעיל" };
        }
        if (generalCoupon.expirationDate && new Date() > new Date(generalCoupon.expirationDate)) {
            return { error: "תוקף הקופון פג" };
        }
        if (userId && generalCoupon.usedBy.some((id) => isSameUser(id, userId))) {
            return { error: "כבר השתמשת בקופון זה בעבר" };
        }

        let discount = 0;
        if (generalCoupon.type === "percent") {
            discount = subtotal * (generalCoupon.value / 100);
        } else if (generalCoupon.type === "fixed") {
            discount = generalCoupon.value;
        }

        return { discount: Math.min(discount, subtotal), couponType: "general" };
    }

    // 2. Check a club member's benefit code
    const member = await ClubModel.findOne({ giftCode: couponCode });
    if (member) {
        if (member.isUsed) {
            return { error: "הקוד הזה כבר נוצל בעבר" };
        }
        const discount = subtotal * 0.15; // Fixed 15% club discount
        return { discount: Math.min(discount, subtotal), couponType: "club" };
    }

    return { error: "קופון לא תקין" };
}

// Mark the coupon as used after a successful purchase
async function markCouponAsUsed(couponCode, userId) {
    if (!couponCode || !userId) return;

    const generalCoupon = await CouponModel.findOne({ code: couponCode });
    if (generalCoupon) {
        if (!generalCoupon.usedBy.some((id) => isSameUser(id, userId))) {
            generalCoupon.usedBy.push(userId);
            await generalCoupon.save();
        }
        return;
    }

    await ClubModel.findOneAndUpdate({ giftCode: couponCode }, { isUsed: true });
}

const shortOrderLabel = (id) => String(id).slice(-8).toUpperCase();

/**
 * Uploads photo development images to Drive before organizing the order folder.
 * Regular products stay in order management only.
 * @param {{ strict?: boolean }} [options] — strict=true from the admin button; otherwise it never fails order creation.
 */
async function uploadPhotoPrintsToDrive(order, { strict = false } = {}) {
    if (!isDriveConfigured()) return;

    const orderId = String(order._id);
    const photoIndexes = [];
    for (let itemIndex = 0; itemIndex < order.items.length; itemIndex += 1) {
        if (isPhotoPrintItem(order.items[itemIndex])) photoIndexes.push(itemIndex);
    }

    if (photoIndexes.length === 0) {
        if (strict) {
            const err = new Error("אין בהזמנה פריטי פיתוח תמונות להעלאה.");
            err.driveUserFacing = true;
            throw err;
        }
        return;
    }

    console.log(`[Drive][order=${orderId}] stage=uploadPhotoPrints start items=${photoIndexes.length}`);

    let folder;
    try {
        const settings = await loadEditorSettings();
        folder = await ensureOrderFolder({
            orderId,
            orderLabel: shortOrderLabel(order._id),
            folderTemplate: settings?.drive?.orderFolderTemplate,
        });
    } catch (err) {
        if (strict) throw err;
        console.warn(`[Drive][order=${orderId}] stage=ensureOrderFolder failed:`, err.message);
        return;
    }

    let uploaded = 0;
    let skipped = 0;
    let changed = false;

    for (const itemIndex of photoIndexes) {
        const item = order.items[itemIndex];
        if (item.customDesign?.designFile?.id) {
            console.log(`[Drive][order=${orderId}][item=${itemIndex}] stage=skip already_uploaded`);
            skipped += 1;
            continue;
        }

        const imageUrl = resolvePhotoPrintSource(item);
        const originalName = String(item.name || "")
            .replace(/^פיתוח תמונה\s*/i, "")
            .replace(/[()]/g, "")
            .trim();
        const sizePart = item.size ? `${item.size} ` : "";
        const fallbackExt = imageUrl.startsWith("data:") ? "jpg" : extensionFromImageUrl(imageUrl);
        const fileNameHint = sanitizeDriveFileName(
            `פיתוח ${sizePart}${originalName || itemIndex + 1}.${fallbackExt}`,
            `photo-print-${itemIndex + 1}.${fallbackExt}`,
        );

        if (!imageUrl || (!imageUrl.startsWith("http") && !imageUrl.startsWith("data:"))) {
            console.error(
                `[Drive][order=${orderId}][item=${itemIndex}] stage=resolveSource failed reason=missing_file`,
            );
            const message = `קובץ התמונה חסר בפריט ${itemIndex + 1} (${item.name || "ללא שם"}).`;
            if (strict) {
                const err = new Error(message);
                err.driveUserFacing = true;
                throw err;
            }
            console.warn(`[Drive][order=${orderId}][item=${itemIndex}] ${message}`);
            continue;
        }

        try {
            const downloaded = await downloadImageSource(imageUrl, {
                orderId,
                fileName: fileNameHint,
                itemIndex,
            });
            const ext = imageUrl.startsWith("data:")
                ? extensionFromMime(downloaded.mimeType)
                : extensionFromImageUrl(imageUrl);
            const fileName = sanitizeDriveFileName(
                `פיתוח ${sizePart}${originalName || itemIndex + 1}.${ext}`,
                `photo-print-${itemIndex + 1}.${ext}`,
            );
            const file = await uploadBufferToFolder({
                buffer: downloaded.buffer,
                mimeType: downloaded.mimeType,
                fileName,
                parentId: folder.folderId,
                orderId,
                itemIndex,
            });
            const compact = compactDriveFile(file);
            item.customDesign = {
                ...(item.customDesign || {}),
                designFile: compact,
                driveFile: compact,
            };
            uploaded += 1;
            changed = true;
        } catch (err) {
            if (strict) throw err;
            console.warn(
                `[Drive][order=${orderId}][item=${itemIndex}][file=${fileNameHint}] stage=uploadPhotoPrints failed:`,
                err.message,
            );
        }
    }

    if (changed || (uploaded + skipped) > 0) {
        const fileCount = order.items.filter(
            (line) => isPhotoPrintItem(line) && line.customDesign?.designFile?.id,
        ).length;
        if (fileCount > 0) {
            order.drive = {
                folderId: folder.folderId,
                folderName: folder.folderName,
                folderUrl: folder.folderUrl,
                fileCount,
                uploadedAt: new Date(),
            };
            changed = true;
        }
    }

    if (changed) {
        order.markModified("items");
        await order.save();
    }

    console.log(
        `[Drive][order=${orderId}] stage=uploadPhotoPrints done uploaded=${uploaded} skipped=${skipped}`,
    );
}

/**
 * Organizes the order's design files in a unique Google Drive folder and saves the link.
 * A failure here does not fail the order – it is saved without Drive too.
 */
async function attachDriveFolderToOrder(order) {
    if (!isDriveConfigured()) return;

    const files = order.items
        .map((item, itemIndex) => {
            const file = item.customDesign?.designFile;
            if (!file?.id) return null;
            return { itemIndex, id: file.id, name: file.name };
        })
        .filter(Boolean);

    if (files.length === 0) return;

    try {
        const settings = await loadEditorSettings();
        const result = await moveDesignsToOrderFolder({
            orderId: String(order._id),
            orderLabel: shortOrderLabel(order._id),
            files,
            folderTemplate: settings?.drive?.orderFolderTemplate,
        });
        if (!result) return;

        result.files.forEach(({ itemIndex, id, name, url }) => {
            const item = order.items[itemIndex];
            if (!item?.customDesign) return;
            item.customDesign = { ...item.customDesign, driveFile: { id, name, url } };
        });

        order.drive = {
            folderId: result.folderId,
            folderName: result.folderName,
            folderUrl: result.folderUrl,
            fileCount: result.files.length,
            uploadedAt: new Date(),
        };
        order.markModified("items");
        await order.save();
    } catch (err) {
        console.error("Drive: failed to organize order designs", err.message);
    }
}

// ============================================================================
// Route handlers
// ============================================================================

// Fetch a specific user's temporary order (shopping cart)
exports.getPendingOrderForUser = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!ensureSelfOrAdmin(req, res, userId)) return;

        const orders = await OrderModel.find({ user_id: userId, status: "pending" });
        res.json(orders);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "There was an error, try again later" });
    }
};

// Fetch all the orders in the system (admin only - make sure the router blocks it too)
exports.getOrders = async (req, res) => {
    try {
        if (req.tokenData.role !== "admin") {
            return res.status(403).json({ msg: "גישה מורשית למנהלים בלבד" });
        }
        const orders = await OrderModel.find({ status: { $ne: "pending" } })
            .populate("user_id", "name email createdAt")
            .sort({ date_created: -1 });
        res.json(orders);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "There was an error, try again later" });
    }
};

// Fetch a specific user's order history (closed)
exports.getOrdersByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!ensureSelfOrAdmin(req, res, userId)) return;

        const orders = await OrderModel.find({
            user_id: userId,
            status: { $ne: "pending" },
        }).sort({ date_created: -1 });

        res.json(orders);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "There was an error, try again later" });
    }
};

// Update/sync the user's temporary shopping cart from the frontend
exports.updateOrder = async (req, res) => {
    try {
        // Prefer the id from the secure token to prevent URL manipulation
        const userId = req.tokenData._id; 

        const newItems = (req.body.items || []).map(sanitizeCartItem);
        const newTotalPrice = req.body.total_price ?? 0;

        const order = await OrderModel.findOneAndUpdate(
            { user_id: userId, status: "pending" },
            {
                $set: {
                    items: newItems,
                    total_price: newTotalPrice,
                    subtotal: newTotalPrice,
                    discount: 0,
                    coupon_code: null,
                    date_created: Date.now(),
                },
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.json(order);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "Error updating cart" });
    }
};

// Update an order status (secured - admin only!)
exports.updateOrderStatus = async (req, res) => {
    try {
        if (req.tokenData.role !== "admin") {
            return res.status(403).json({ msg: "אין הרשאה לעדכן סטטוס הזמנה זו" });
        }

        const { id } = req.params;
        const { status } = req.body;
        if (!ORDER_EMAIL_STATUSES.includes(status)) {
            return res.status(400).json({ msg: "סטטוס לא תקין" });
        }

        const previous = await OrderModel.findById(id).select("status").lean();
        if (!previous) {
            return res.status(404).json({ msg: "הזמנה לא נמצאה" });
        }

        const order = await OrderModel.findOneAndUpdate(
            { _id: id },
            previous.status !== status ? { status, statusChangedAt: new Date() } : { status },
            { new: true }
        );

        // The customer gets an email on every status change (per the text the admin defined).
        // Sent in the background: the admin does not wait for the mail server, and a failure is only logged.
        if (previous.status !== status) {
            sendOrderStatusEmail(order, status);
        }

        res.json(order);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה בעדכון סטטוס ההזמנה" });
    }
};

// Delete the selected orders (admin only — only the ids that were sent, no bulk delete)
exports.deleteOrders = async (req, res) => {
    try {
        if (req.tokenData.role !== "admin") {
            return res.status(403).json({ msg: "אין הרשאה למחוק הזמנות" });
        }

        const ids = req.body?.ids;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ msg: "יש לבחור לפחות הזמנה אחת למחיקה" });
        }
        if (ids.length > 50) {
            return res.status(400).json({ msg: "לא ניתן למחוק יותר מ-50 הזמנות בפעם אחת" });
        }

        const validIds = [...new Set(ids.map(String))].filter(isValidObjectId);
        if (validIds.length === 0) {
            return res.status(400).json({ msg: "מזהה הזמנה אינו תקין" });
        }

        const result = await OrderModel.deleteMany({
            _id: { $in: validIds },
            status: { $ne: "pending" },
        });

        res.json({ deletedCount: result.deletedCount });
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה במחיקת ההזמנות" });
    }
};

exports.syncOrderDrive = async (req, res) => {
    try {
        if (req.tokenData.role !== "admin") {
            return res.status(403).json({ msg: "גישה מורשית למנהלים בלבד" });
        }
        if (!isDriveConfigured()) {
            return res.status(503).json({
                msg: "שמירה אוטומטית לתיקייה עוד לא הוגדרה. בינתיים אפשר להוריד כל תמונה בכפתור \"הורדת תמונה\".",
                code: "DRIVE_NOT_CONFIGURED",
            });
        }

        const order = await OrderModel.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ msg: "ההזמנה לא נמצאה" });
        }

        await uploadPhotoPrintsToDrive(order, { strict: true });
        await attachDriveFolderToOrder(order);

        const fresh = await OrderModel.findById(order._id).populate("user_id", "name email createdAt");
        if (!fresh?.drive?.folderUrl) {
            return res.status(500).json({
                msg: "ההעלאה ל-Drive לא הושלמה: לא נוצרה תיקייה להזמנה. בדקו הרשאות לתיקייה הראשית ושהקבצים זמינים.",
            });
        }
        res.json(fresh);
    } catch (err) {
        console.error(`[Drive][order=${req.params.id}] stage=sync failed:`, err.message);
        res.status(500).json({
            msg: err.driveUserFacing
                ? err.message
                : "שגיאה בשליחה ל-Google Drive.",
        });
    }
};

// Create a new order and close the shopping cart (fully protected against price tampering)
const AWAITING_PAYMENT = "awaiting_payment";

/** What happens when an order moves to processing: redeem the coupon, clear the cart and send the customer a confirmation email */
async function completeOrder(order, userId) {
    if (order.coupon_code) {
        await markCouponAsUsed(order.coupon_code, userId);
    }
    await OrderModel.findOneAndUpdate(
        { user_id: userId, status: "pending" },
        { $set: { items: [], total_price: 0, subtotal: 0, discount: 0, coupon_code: null } },
    );
    sendOrderStatusEmail(order, "processing"); // In the background, does not delay the response
}

exports.createOrder = async (req, res) => {
    try {
        const userId = req.tokenData._id;
        const { items, couponCode, fulfillmentMethod, customer, shippingAddress } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ msg: "העגלה ריקה" });
        }

        const method = fulfillmentMethod === "delivery" ? "delivery" : "pickup";
        const customerDetails = sanitizeCustomerDetails(customer);
        const shippingDetails = method === "delivery" ? sanitizeShippingAddress(shippingAddress) : {};
        const checkoutErrors = validateCheckoutDetails({
            fulfillmentMethod: method,
            customer: customerDetails,
            shipping: shippingDetails,
        });
        const checkoutErrorMessage = firstCheckoutValidationMessage(checkoutErrors);
        if (checkoutErrorMessage) {
            return res.status(400).json({ msg: checkoutErrorMessage });
        }

        // --- Security: trusted price calculation by item type ---
        let subtotal = 0;
        const verifiedItems = [];

        const photoItems = items.filter(isPhotoPrintItem);
        // Each size's price tier is set by the number of prints of that size in the order
        const photoPrintsBySize = countPrintsBySize(photoItems, (item) => item.size, (item) => item.quantity);
        const photoPricing = photoItems.length > 0 ? await loadPhotoPricing() : null;

        for (const item of items) {
            const qty = Number(item.quantity ?? 1);
            if (!Number.isInteger(qty) || qty < 1 || qty > MAX_ITEM_QUANTITY) {
                return res.status(400).json({ msg: `כמות לא תקינה בעגלה: ${item.name || "ללא שם"}` });
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
                return res.status(400).json({
                    msg: `המוצר "${item.name || "ללא שם"}" כבר לא קיים באתר. יש להסיר אותו מהעגלה ולהוסיף מחדש.`,
                });
            }

            const isCustom = Boolean(item.customDesign || item.customization);
            const serviceFee = item.customization?.type === "designer-service" ? DESIGNER_SERVICE_FEE : 0;
            const unitPrice = getUnitPriceForQuantity(product, qty) + serviceFee;

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
        // ----------------==================================----------------

        // Calculate the discount from the verified subtotal
        const couponResult = await calculateCouponDiscount(couponCode, userId, subtotal);
        if (couponResult.error) {
            return res.status(400).json({ msg: couponResult.error });
        }

        const discount = couponResult.discount || 0;
        const shipping_fee = method === "delivery" ? DELIVERY_FEE : 0;
        const total_price = Math.max(0, subtotal - discount + shipping_fee);

        // Create the new order with the processing status
        const newOrder = new OrderModel({
            user_id: userId,
            items: verifiedItems,
            subtotal,
            discount,
            coupon_code: couponCode || undefined,
            shipping_fee,
            fulfillment_method: method,
            customer: customerDetails,
            shipping_address: method === "delivery" ? shippingDetails : undefined,
            total_price,
            // When payment is connected, the order moves to processing only after the payment is verified
            ...(isHypConfigured()
                ? { status: AWAITING_PAYMENT, payment: { provider: "hyp", status: "pending" } }
                : { status: "processing" }),
        });

        const saved = await newOrder.save();

        await uploadPhotoPrintsToDrive(saved);
        // Organize the design files in a Drive folder per order (does not block on failure)
        await attachDriveFolderToOrder(saved);

        if (saved.items.some(isPhotoPrintItem) && !isDriveConfigured()) {
            console.warn("Drive: photo prints were not uploaded because Google Drive is not configured");
        }

        if (saved.status === AWAITING_PAYMENT) {
            // The coupon, email and cart are handled only after payment (confirmPayment)
            try {
                const paymentUrl = await createPaymentUrl(saved);
                return res.status(201).json({ ...saved.toObject(), paymentUrl });
            } catch (paymentErr) {
                console.error(`[Payment][order=${saved._id}] could not create payment page:`, paymentErr.message);
                return res.status(502).json({ msg: "לא הצלחנו לפתוח את דף התשלום. נסי שוב בעוד רגע." });
            }
        }

        await completeOrder(saved, userId);
        res.status(201).json(saved);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה ביצירת ההזמנה" });
    }
};

// Fetch a specific order's details by its id
exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await OrderModel.findById(id).populate("user_id", "name email createdAt");

        if (!order) {
            return res.status(404).json({ msg: "הזמנה לא נמצאה" });
        }

        // Check that only the order owner or an admin can view it
        if (
            !isSameUser(req.tokenData._id, order.user_id?._id ?? order.user_id) &&
            req.tokenData.role !== "admin"
        ) {
            return res.status(403).json({ msg: "אין הרשאה לצפות בהזמנה זו" });
        }

        if (req.tokenData.role === "admin") {
            // Lets the admin page hide the Drive button instead of offering an action that cannot work yet
            return res.json({ ...order.toObject(), driveConfigured: isDriveConfigured() });
        }
        res.json(order);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה בטעינת ההזמנה" });
    }
};
// --- Automatic email texts (admin) ---
exports.getOrderEmailTemplates = async (req, res) => {
    try {
        const templates = await loadOrderEmailTemplates();
        res.json({ templates, placeholders: ORDER_EMAIL_PLACEHOLDERS });
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה בטעינת נוסחי המיילים" });
    }
};

exports.updateOrderEmailTemplate = async (req, res) => {
    try {
        const { status } = req.params;
        if (!ORDER_EMAIL_STATUSES.includes(status)) {
            return res.status(404).json({ msg: "סטטוס לא קיים" });
        }

        const subject = sanitizeText(req.body?.subject, 200);
        const body = String(req.body?.body || "").trim().slice(0, 5000);
        const enabled = req.body?.enabled !== false;
        if (!subject || !body) {
            return res.status(400).json({ msg: "יש למלא נושא וגוף למייל" });
        }

        const template = await OrderEmailTemplateModel.findOneAndUpdate(
            { status },
            { $set: { subject, body, enabled } },
            { new: true, upsert: true, setDefaultsOnInsert: true },
        );
        res.json(template);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה בשמירת נוסח המייל" });
    }
};

// --- Payment (Hyp Pay) ---

/** Parameters the server adds itself to the verification request – they must not come from the browser */
const RESERVED_PAYMENT_PARAMS = new Set(["action", "what", "key", "passp", "masof"]);

/**
 * The customer came back from the payment page to the success page. Verify with Hyp that the return is genuine and that the amount and order match,
 * then the order moves to processing. Safe to call again (page refresh) – a paid order is never processed twice.
 */
exports.confirmPayment = async (req, res) => {
    try {
        const order = await OrderModel.findById(req.params.id);
        if (!order) return res.status(404).json({ msg: "הזמנה לא נמצאה" });
        if (!ensureSelfOrAdmin(req, res, order.user_id)) return;
        if (order.payment?.status === "paid") return res.json(order);

        const query = String(req.body?.query || "").replace(/^\?/, "");
        const params = new URLSearchParams(query);
        const keys = [...params.keys()];
        // A duplicate parameter or terminal details inside the return = an attempt to make Hyp verify different values than the ones checked here
        const tampered = new Set(keys).size !== keys.length
            || keys.some((key) => RESERVED_PAYMENT_PARAMS.has(key.toLowerCase()));
        if (tampered) {
            console.warn(`[Payment][order=${order._id}] rejected redirect with duplicate or reserved params`);
            return res.status(400).json({ msg: "התשלום לא הושלם" });
        }
        const amountMatches = Math.abs(Number(params.get("Amount")) - Number(order.total_price)) <= 0.01;
        if (params.get("Order") !== String(order._id) || params.get("CCode") !== "0" || !amountMatches) {
            return res.status(400).json({ msg: "התשלום לא הושלם" });
        }
        if (!(await verifyPaymentRedirect(query))) {
            console.warn(`[Payment][order=${order._id}] Hyp verification failed`);
            return res.status(400).json({ msg: "לא הצלחנו לאמת את התשלום. אם חויבת – צרי איתנו קשר." });
        }

        // Atomic update: only one request moves the order to "paid"
        const paid = await OrderModel.findOneAndUpdate(
            { _id: order._id, "payment.status": { $ne: "paid" } },
            {
                $set: {
                    status: "processing",
                    "payment.status": "paid",
                    "payment.transactionId": params.get("Id"),
                    "payment.approvalCode": params.get("ACode"),
                    "payment.paidAt": new Date(),
                },
            },
            { new: true },
        );
        if (!paid) return res.json(await OrderModel.findById(order._id));

        await completeOrder(paid, paid.user_id);
        res.json(paid);
    } catch (err) {
        console.error(`[Payment][order=${req.params.id}] confirm error:`, err.message);
        res.status(500).json({ msg: "שגיאה באימות התשלום" });
    }
};

/** Admin check: are the Hyp credentials in Railway correct (without charging) */
exports.checkPaymentConnection = async (req, res) => {
    if (!isHypConfigured()) {
        return res.json({ configured: false, ok: false, msg: "חסרים HYP_MASOF / HYP_KEY / HYP_PASSP" });
    }
    try {
        const { ok, code, reason } = await checkConnection();
        const msg = ok ? "החיבור ל-Hyp תקין"
            : reason === "page" ? "דף התשלום של Hyp דוחה את החתימה – כנראה HYP_KEY שגוי או חלקי"
            : `Hyp דחו את הבקשה (קוד ${code})`;
        res.json({ configured: true, ok, code, msg });
    } catch (err) {
        res.status(502).json({ configured: true, ok: false, msg: `אין תשובה מ-Hyp: ${err.message}` });
    }
};

