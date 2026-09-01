const { Readable } = require("stream");
const { config } = require("../config/secret");

const loadGoogleApis = () => {
    try {
        return require("googleapis").google;
    } catch (err) {
        if (err.code === "MODULE_NOT_FOUND") {
            console.warn("googleapis is not installed; Drive uploads are disabled");
            return null;
        }
        throw err;
    }
};

const DRIVE_SCOPES = ["https://www.googleapis.com/auth/drive"];
const FOLDER_MIME = "application/vnd.google-apps.folder";
const STAGING_FOLDER_NAME = "_staging";

let cachedClient = null;

/**
 * האינטגרציה עם Drive היא אופציונלית: אם המשתני סביבה לא מוגדרים,
 * המערכת ממשיכה לעבוד רגיל וההזמנה נשמרת בלי תיקיית Drive.
 */
const isDriveConfigured = () => Boolean(
    config.GOOGLE_DRIVE_CLIENT_EMAIL
    && config.GOOGLE_DRIVE_PRIVATE_KEY
    && config.GOOGLE_DRIVE_ROOT_FOLDER_ID,
);

const getDriveClient = () => {
    if (!isDriveConfigured()) return null;
    if (cachedClient) return cachedClient;

    const google = loadGoogleApis();
    if (!google) return null;

    const auth = new google.auth.JWT({
        email: config.GOOGLE_DRIVE_CLIENT_EMAIL,
        // מפתחות ב-.env נשמרים עם \n מילולי
        key: config.GOOGLE_DRIVE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        scopes: DRIVE_SCOPES,
    });

    cachedClient = google.drive({ version: "v3", auth });
    return cachedClient;
};

const sharedDriveParams = () => (
    config.GOOGLE_DRIVE_SHARED_DRIVE_ID
        ? { supportsAllDrives: true, driveId: config.GOOGLE_DRIVE_SHARED_DRIVE_ID, corpora: "drive" }
        : { supportsAllDrives: true }
);

const escapeQueryValue = (value) => String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");

const findFolder = async (drive, name, parentId) => {
    const query = [
        `mimeType = '${FOLDER_MIME}'`,
        `name = '${escapeQueryValue(name)}'`,
        `'${parentId}' in parents`,
        "trashed = false",
    ].join(" and ");

    const { data } = await drive.files.list({
        q: query,
        fields: "files(id, name, webViewLink)",
        pageSize: 1,
        includeItemsFromAllDrives: true,
        ...sharedDriveParams(),
    });

    return data.files?.[0] || null;
};

const createFolder = async (drive, name, parentId) => {
    const { data } = await drive.files.create({
        requestBody: { name, mimeType: FOLDER_MIME, parents: [parentId] },
        fields: "id, name, webViewLink",
        supportsAllDrives: true,
    });
    return data;
};

const ensureFolder = async (drive, name, parentId) => {
    const existing = await findFolder(drive, name, parentId);
    if (existing) return existing;
    return createFolder(drive, name, parentId);
};

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

/** מעלה תמונת data-URL לתיקיית ההמתנה, לפני שההזמנה נוצרה */
const uploadDesignToStaging = async ({ dataUrl, fileName }) => {
    const parsed = parseDataUrl(dataUrl);
    if (!parsed) throw new Error("קובץ העיצוב אינו בפורמט data-URL תקין");
    return uploadBufferToStaging({
        buffer: parsed.buffer,
        mimeType: parsed.mimeType,
        fileName,
    });
};

/** מעלה תמונה מכתובת (למשל Cloudinary) לתיקיית ההמתנה ב-Drive */
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

const renderFolderName = (template, { orderId, date }) => (
    String(template || "הזמנה {orderId} - {date}")
        .replace("{orderId}", orderId)
        .replace("{date}", date)
);

/**
 * יוצר תיקייה להזמנה ומעביר אליה את קבצי העיצוב שהועלו בזמן העיצוב.
 * @returns {Promise<{folderId: string, folderName: string, folderUrl: string, files: Array}|null>}
 */
const moveDesignsToOrderFolder = async ({ orderId, orderLabel, files, folderTemplate }) => {
    const drive = getDriveClient();
    if (!drive || !Array.isArray(files) || files.length === 0) return null;

    const folderName = renderFolderName(folderTemplate, {
        orderId: orderLabel || orderId,
        date: new Date().toLocaleDateString("he-IL"),
    });

    const folder = await ensureFolder(drive, folderName, config.GOOGLE_DRIVE_ROOT_FOLDER_ID);
    const movedFiles = [];

    for (const file of files) {
        if (!file?.id) continue;
        try {
            const current = await drive.files.get({
                fileId: file.id,
                fields: "parents",
                supportsAllDrives: true,
            });

            const { data } = await drive.files.update({
                fileId: file.id,
                addParents: folder.id,
                removeParents: (current.data.parents || []).join(","),
                requestBody: file.name ? { name: file.name } : undefined,
                fields: "id, name, webViewLink",
                supportsAllDrives: true,
            });

            movedFiles.push({
                itemIndex: file.itemIndex,
                id: data.id,
                name: data.name,
                url: data.webViewLink,
            });
        } catch (err) {
            console.warn(`Drive: failed to move file ${file.id} for order ${orderId}`, err.message);
        }
    }

    if (movedFiles.length === 0) return null;

    return {
        folderId: folder.id,
        folderName: folder.name || folderName,
        folderUrl: folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`,
        files: movedFiles,
    };
};

module.exports = {
    isDriveConfigured,
    uploadDesignToStaging,
    uploadRemoteImageToStaging,
    moveDesignsToOrderFolder,
};
