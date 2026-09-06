const mongoose = require("mongoose");
const { OrderModel } = require("../models/ordersModel");
const { CouponModel } = require("../models/couponModel");
const { ClubModel } = require("../models/clubModel");
const { ProductModel } = require("../models/productModel"); // יבוא מודל המוצרים לאימות מחירים
const { getUnitPriceByQuantity, isPhotoPrintItem } = require("../utils/photoQuantityPricing");
const { getUnitPriceForQuantity } = require("../utils/productQuantityPricing");
const {
    isDriveConfigured,
    moveDesignsToOrderFolder,
    ensureOrderFolder,
    downloadImageSource,
    uploadBufferToFolder,
} = require("../services/googleDriveService");
const { loadEditorSettings } = require("./editorSettingsController");

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

// פונקציית עזר להשוואת מזהים (ObjectIds) בצורה בטוחה
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

/** שומר את בחירות הלקוח בעורך (מסגרת, מידה, כיוון, כתוביות) לצורך ההפקה */
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

// פונקציית עזר לבדיקת הרשאות (המשתמש עצמו או אדמין)
const ensureSelfOrAdmin = (req, res, userId) => {
    if (!isSameUser(req.tokenData._id, userId) && req.tokenData.role !== "admin") {
        res.status(403).json({ msg: "אין הרשאה לצפות במידע זה" });
        return false;
    }
    return true;
};

// חישוב הנחת קופון (כללי או מועדון)
async function calculateCouponDiscount(couponCode, userId, subtotal) {
    if (!couponCode) {
        return { discount: 0 };
    }

    // 1. בדיקת קופון כללי במערכת
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

    // 2. בדיקת קוד הטבה של חבר מועדון
    const member = await ClubModel.findOne({ giftCode: couponCode });
    if (member) {
        if (member.isUsed) {
            return { error: "הקוד הזה כבר נוצל בעבר" };
        }
        const discount = subtotal * 0.15; // 15% הנחת מועדון קבועה
        return { discount: Math.min(discount, subtotal), couponType: "club" };
    }

    return { error: "קופון לא תקין" };
}

// סימון קופון כמשומש לאחר רכישה מוצלחת
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
 * מעלה תמונות פיתוח ל-Drive לפני סידור תיקיית ההזמנה.
 * מוצרים רגילים נשארים בניהול הזמנות בלבד.
 * @param {{ strict?: boolean }} [options] — strict=true מהכפתור באדמין; אחרת לא מפיל יצירת הזמנה.
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
 * מסדר את קבצי העיצוב של ההזמנה בתיקיית Google Drive ייחודית ושומר את הקישור.
 * כישלון כאן לא מפיל את ההזמנה – היא נשמרת גם בלי Drive.
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
// ראוטים (Route Handlers)
// ============================================================================

// שליפת הזמנה זמנית (עגלת קניות) של משתמש ספציפי
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

// שליפת כל ההזמנות במערכת (לאדמין בלבד - יש לוודא חסימה גם ב-Router עצמו)
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

// שליפת היסטוריית הזמנות (סגורות) של משתמש ספציפי
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

// עדכון/סנכרון עגלת הקניות הזמנית של המשתמש מה-Frontend
exports.updateOrder = async (req, res) => {
    try {
        // עדיף להשתמש ב-ID מהטוקן המאובטח למניעת מניפולציות URL
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

// עדכון סטטוס הזמנה (מאובטח - אדמין בלבד!)
exports.updateOrderStatus = async (req, res) => {
    try {
        if (req.tokenData.role !== "admin") {
            return res.status(403).json({ msg: "אין הרשאה לעדכן סטטוס הזמנה זו" });
        }

        const { id } = req.params;
        const { status } = req.body;

        const order = await OrderModel.findOneAndUpdate(
            { _id: id },
            { status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ msg: "הזמנה לא נמצאה" });
        }

        res.json(order);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה בעדכון סטטוס ההזמנה" });
    }
};

// מחיקת הזמנות שנבחרו (אדמין בלבד — רק מזהים שנשלחו, לא מחיקה גורפת)
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
                msg: "Google Drive אינו מוגדר בשרת. יש להגדיר GOOGLE_DRIVE_CLIENT_EMAIL, GOOGLE_DRIVE_PRIVATE_KEY ו-GOOGLE_DRIVE_ROOT_FOLDER_ID.",
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

// יצירת הזמנה חדשה וסגירת עגלת הקניות (מאובטח לחלוטין מפני זיוף מחירים)
exports.createOrder = async (req, res) => {
    try {
        const userId = req.tokenData._id;
        const { items, couponCode } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ msg: "העגלה ריקה" });
        }

        // --- אבטחה: חישוב מחיר אמין לפי סוג הפריט ---
        let subtotal = 0;
        const verifiedItems = [];

        const photoItems = items.filter(isPhotoPrintItem);
        const totalPhotoPrints = photoItems.reduce(
            (sum, item) => sum + (Number(item.quantity) || 1),
            0,
        );
        const photoUnitPrice = getUnitPriceByQuantity(totalPhotoPrints);

        for (const item of items) {
            const qty = Number(item.quantity) || 1;
            const productId = resolveProductId(item);

            if (productId) {
                const product = await ProductModel.findById(productId);
                if (!product) {
                    const cartPrice = Number(item.price);
                    if (cartPrice > 0 && item.name) {
                        subtotal += cartPrice * qty;
                        verifiedItems.push(withItemExtras({
                            name: item.name,
                            size: item.size,
                            price: cartPrice,
                            quantity: qty,
                            image: item.image,
                        }, item));
                        continue;
                    }
                    return res.status(404).json({ msg: "המוצר המבוקש לא נמצא במערכת" });
                }

                let unitPrice = getUnitPriceForQuantity(product, qty);
                let name = product.name;
                let image = product.image;

                if (item.customDesign || item.customization) {
                    const cartPrice = Number(item.price);
                    if (cartPrice > 0) unitPrice = cartPrice;
                    if (item.name) name = item.name;
                    if (item.image) image = item.image;
                }

                subtotal += unitPrice * qty;
                verifiedItems.push(withItemExtras({
                    productId: product._id,
                    name,
                    size: item.size,
                    price: unitPrice,
                    quantity: qty,
                    image,
                }, item));
                continue;
            }

            if (isPhotoPrintItem(item)) {
                const cartPrice = Number(item.price);
                if (!cartPrice || Math.abs(cartPrice - photoUnitPrice) > 0.01) {
                    return res.status(400).json({ msg: "מחיר הדפסת תמונה אינו תקין" });
                }

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

            if (item.customDesign) {
                const unitPrice = Number(item.price);
                if (!unitPrice || unitPrice <= 0) {
                    return res.status(400).json({ msg: "מחיר פריט עיצוב אישי אינו תקין" });
                }

                subtotal += unitPrice * qty;
                verifiedItems.push(withItemExtras({
                    name: item.name || "מוצר בעיצוב אישי",
                    size: item.size,
                    price: unitPrice,
                    quantity: qty,
                    image: item.image,
                }, item));
                continue;
            }

            if (item.customization && Number(item.price) > 0 && item.name) {
                const unitPrice = Number(item.price);
                subtotal += unitPrice * qty;
                verifiedItems.push(withItemExtras({
                    name: item.name,
                    size: item.size,
                    price: unitPrice,
                    quantity: qty,
                    image: item.image,
                }, item));
                continue;
            }

            if (item.name && Number(item.price) > 0) {
                const unitPrice = Number(item.price);
                subtotal += unitPrice * qty;
                verifiedItems.push(withItemExtras({
                    name: item.name,
                    size: item.size,
                    price: unitPrice,
                    quantity: qty,
                    image: item.image,
                }, item));
                continue;
            }

            return res.status(400).json({
                msg: `פריט לא תקין בעגלה: ${item.name || "ללא שם"}`,
            });
        }
        // ----------------==================================----------------

        // חישוב הנחה על בסיס ה-subtotal המאומת
        const couponResult = await calculateCouponDiscount(couponCode, userId, subtotal);
        if (couponResult.error) {
            return res.status(400).json({ msg: couponResult.error });
        }

        const discount = couponResult.discount || 0;
        const total_price = Math.max(0, subtotal - discount);

        // יצירת ההזמנה החדשה בסטטוס processing
        const newOrder = new OrderModel({
            user_id: userId,
            items: verifiedItems,
            subtotal,
            discount,
            coupon_code: couponCode || undefined,
            total_price,
            status: "processing",
        });

        const saved = await newOrder.save();

        await uploadPhotoPrintsToDrive(saved);
        // ארגון קבצי העיצוב בתיקיית Drive לפי הזמנה (לא חוסם במקרה של כשל)
        await attachDriveFolderToOrder(saved);

        if (saved.items.some(isPhotoPrintItem) && !isDriveConfigured()) {
            console.warn("Drive: photo prints were not uploaded because Google Drive is not configured");
        }

        // מימוש הקופון במידה וקיים
        if (couponCode) {
            await markCouponAsUsed(couponCode, userId);
        }

        // איפוס וניקוי עגלת הקניות הזמנית (pending) של המשתמש
        await OrderModel.findOneAndUpdate(
            { user_id: userId, status: "pending" },
            {
                $set: {
                    items: [],
                    total_price: 0,
                    subtotal: 0,
                    discount: 0,
                    coupon_code: null,
                },
            }
        );

        res.status(201).json(saved);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה ביצירת ההזמנה" });
    }
};

// שליפת מידע על הזמנה ספציפית לפי ה-ID שלה
exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await OrderModel.findById(id).populate("user_id", "name email createdAt");

        if (!order) {
            return res.status(404).json({ msg: "הזמנה לא נמצאה" });
        }

        // בדיקה שרק בעל ההזמנה או אדמין יכולים לצפות בה
        if (
            !isSameUser(req.tokenData._id, order.user_id?._id ?? order.user_id) &&
            req.tokenData.role !== "admin"
        ) {
            return res.status(403).json({ msg: "אין הרשאה לצפות בהזמנה זו" });
        }

        res.json(order);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה בטעינת ההזמנה" });
    }
};