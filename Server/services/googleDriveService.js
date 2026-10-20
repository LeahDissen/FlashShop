/** Uploading files to Google Drive: designs and photos to the pending folder, and print files to an order's folder */
const { Readable } = require("stream");
const { config } = require("../config/secret");
const {
    STAGING_FOLDER_NAME,
    isDriveConfigured,
    getDriveClient,
    requireDriveClient,
    driveUserError,
    mapDriveError,
    formatDriveTags,
    logDrive,
    safeUrlHost,
} = require("./drive/driveClient");
const { ensureFolder, ensureOrderFolder, moveDesignsToOrderFolder } = require("./drive/driveFolders");

const parseDataUrl = (dataUrl) => {
    const match = /^data:([^;,]+);base64,(.+)$/s.exec(String(dataUrl || ""));
    if (!match) return null;
    return { mimeType: match[1], buffer: Buffer.from(match[2], "base64") };
};

const maybeShareFile = async (drive, fileId) => {
    if (String(config.GOOGLE_DRIVE_PUBLIC_LINKS).toLowerCase() !== "true") return;
    try {
        await drive.permissions.create({
            fileId,
            requestBody: { role: "reader", type: "anyone" },
            supportsAllDrives: true,
        });
    } catch (err) {
        console.warn("Drive: failed to share file publicly", err.message);
    }
};

const guessImageMime = (url, contentType) => {
    const header = String(contentType || "").split(";")[0].trim().toLowerCase();
    if (header.startsWith("image/")) return header;
    const lower = String(url || "").toLowerCase();
    if (lower.includes(".png")) return "image/png";
    if (lower.includes(".webp")) return "image/webp";
    if (lower.includes(".gif")) return "image/gif";
    return "image/jpeg";
};

const uploadBufferToStaging = async ({ buffer, mimeType, fileName }) => {
    const drive = getDriveClient();
    if (!drive || !buffer?.length) return null;

    const staging = await ensureFolder(drive, STAGING_FOLDER_NAME, config.GOOGLE_DRIVE_ROOT_FOLDER_ID);
    const { data } = await drive.files.create({
        requestBody: { name: fileName, parents: [staging.id] },
        media: { mimeType: mimeType || "image/jpeg", body: Readable.from(buffer) },
        fields: "id, name, webViewLink, size",
        supportsAllDrives: true,
    });

    await maybeShareFile(drive, data.id);

    return {
        id: data.id,
        name: data.name,
        url: data.webViewLink,
        size: Number(data.size) || buffer.length,
    };
};

/** Uploads a data-URL image to the pending folder, before the order is created */
const uploadDesignToStaging = async ({ dataUrl, fileName }) => {
    const parsed = parseDataUrl(dataUrl);
    if (!parsed) throw new Error("קובץ העיצוב אינו בפורמט data-URL תקין");
    return uploadBufferToStaging({
        buffer: parsed.buffer,
        mimeType: parsed.mimeType,
        fileName,
    });
};

/** Uploads an image from a URL (e.g. Cloudinary) to the pending folder in Drive */
const uploadRemoteImageToStaging = async ({ imageUrl, fileName }) => {
    const drive = getDriveClient();
    if (!drive || !imageUrl) return null;

    const axios = require("axios");
    const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        timeout: 60000,
        maxContentLength: 30 * 1024 * 1024,
        validateStatus: (status) => status >= 200 && status < 300,
    });

    const buffer = Buffer.from(response.data);
    if (!buffer.length) throw new Error("התמונה שהתקבלה ריקה");

    return uploadBufferToStaging({
        buffer,
        mimeType: guessImageMime(imageUrl, response.headers["content-type"]),
        fileName,
    });
};

const downloadImageSource = async (imageUrl, { orderId, fileName, itemIndex } = {}) => {
    const extra = { orderId, fileName, itemIndex };
    const source = String(imageUrl || "");

    if (source.startsWith("data:")) {
        const parsed = parseDataUrl(source);
        if (!parsed?.buffer?.length) {
            console.error(`[Drive]${formatDriveTags(extra)} stage=parseDataUrl failed`);
            throw driveUserError(
                `קובץ הפיתוח אינו בפורמט תקין (פריט ${(itemIndex ?? 0) + 1}${fileName ? `, ${fileName}` : ""}).`,
            );
        }
        logDrive(extra, "parseDataUrl", `ok bytes=${parsed.buffer.length}`);
        return parsed;
    }

    if (!/^https?:\/\//i.test(source)) {
        throw driveUserError(
            `לא ניתן להוריד את קובץ הפיתוח (פריט ${(itemIndex ?? 0) + 1}${fileName ? `, ${fileName}` : ""}). הקובץ חסר או לא נגיש.`,
        );
    }

    try {
        const axios = require("axios");
        const response = await axios.get(source, {
            responseType: "arraybuffer",
            timeout: 60000,
            maxContentLength: 30 * 1024 * 1024,
            validateStatus: (status) => status >= 200 && status < 300,
        });
        const buffer = Buffer.from(response.data);
        if (!buffer.length) {
            throw driveUserError(
                `לא ניתן להוריד את קובץ הפיתוח (פריט ${(itemIndex ?? 0) + 1}${fileName ? `, ${fileName}` : ""}). הקובץ חסר או לא נגיש.`,
            );
        }
        logDrive(extra, "download", `ok bytes=${buffer.length} host=${safeUrlHost(source)}`);
        return {
            mimeType: guessImageMime(source, response.headers["content-type"]),
            buffer,
        };
    } catch (err) {
        if (err.driveUserFacing) throw err;
        console.error(`[Drive]${formatDriveTags(extra)} stage=download failed urlHost=${safeUrlHost(source)}`);
        throw mapDriveError(err, "download", extra);
    }
};

const uploadBufferToFolder = async ({
    buffer,
    mimeType,
    fileName,
    parentId,
    orderId,
    itemIndex,
}) => {
    const extra = { orderId, fileName, itemIndex };
    if (!buffer?.length) {
        throw driveUserError(
            `קובץ הפיתוח ריק (פריט ${(itemIndex ?? 0) + 1}${fileName ? `, ${fileName}` : ""}).`,
        );
    }

    const drive = requireDriveClient();
    logDrive(extra, "upload", "start");
    try {
        const { data } = await drive.files.create({
            requestBody: { name: fileName, parents: [parentId] },
            media: { mimeType: mimeType || "image/jpeg", body: Readable.from(buffer) },
            fields: "id, name, webViewLink, size",
            supportsAllDrives: true,
        });
        await maybeShareFile(drive, data.id);
        logDrive({ ...extra, fileId: data.id }, "upload", "ok");
        return {
            id: data.id,
            name: data.name,
            url: data.webViewLink,
            size: Number(data.size) || buffer.length,
        };
    } catch (err) {
        if (err.driveUserFacing) throw err;
        throw mapDriveError(err, "upload", extra);
    }
};

module.exports = {
    isDriveConfigured,
    uploadDesignToStaging,
    uploadRemoteImageToStaging,
    moveDesignsToOrderFolder,
    ensureOrderFolder,
    downloadImageSource,
    uploadBufferToFolder,
};
