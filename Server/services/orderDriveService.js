/** Saving an order's files to Google Drive (optional: without Drive settings nothing happens) */
const { loadEditorSettings } = require("../controllers/editorSettingsController");
const {
    isDriveConfigured,
    moveDesignsToOrderFolder,
    ensureOrderFolder,
    downloadImageSource,
    uploadBufferToFolder,
} = require("./googleDriveService");
const { isPhotoPrintItem } = require("../utils/photoQuantityPricing");
const { compactDriveFile } = require("../utils/orderItems");

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

module.exports = { uploadPhotoPrintsToDrive, attachDriveFolderToOrder };
