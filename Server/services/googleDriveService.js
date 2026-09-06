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
const DRIVE_NOT_CONFIGURED_MSG = "Google Drive אינו מוגדר בשרת. יש להגדיר GOOGLE_DRIVE_CLIENT_EMAIL, GOOGLE_DRIVE_PRIVATE_KEY ו-GOOGLE_DRIVE_ROOT_FOLDER_ID.";

let cachedClient = null;
let loggedAuthOk = false;

/**
 * האינטגרציה עם Drive היא אופציונלית: אם המשתני סביבה לא מוגדרים,
 * המערכת ממשיכה לעבוד רגיל וההזמנה נשמרת בלי תיקיית Drive.
 */
const isDriveConfigured = () => Boolean(
    config.GOOGLE_DRIVE_CLIENT_EMAIL
    && config.GOOGLE_DRIVE_PRIVATE_KEY
    && config.GOOGLE_DRIVE_ROOT_FOLDER_ID,
);

const formatDriveTags = ({ orderId, itemIndex, fileName, fileId } = {}) => [
    orderId && `[order=${orderId}]`,
    itemIndex != null && `[item=${itemIndex}]`,
    fileName && `[file=${fileName}]`,
    fileId && `[fileId=${fileId}]`,
].filter(Boolean).join("");

const logDrive = (extra, stage, detail = "") => {
    console.log(`[Drive]${formatDriveTags(extra)} stage=${stage}${detail ? ` ${detail}` : ""}`);
};

const driveUserError = (message, cause) => {
    const err = new Error(message);
    err.driveUserFacing = true;
    if (cause) err.cause = cause;
    return err;
};

const mapDriveError = (err, stage, extra = {}) => {
    const status = Number(err.response?.status || err.code);
    const code = String(err.code || "");
    const isNetwork = ["ECONNRESET", "ENOTFOUND", "ETIMEDOUT", "ECONNREFUSED", "ECONNABORTED"].includes(code)
        || /timeout/i.test(String(err.message || ""));

    console.error(`[Drive]${formatDriveTags(extra)} stage=${stage} failed:`, err.message);

    if (status === 403 || status === 404) {
        return driveUserError(
            "אין הרשאה לתיקיית Google Drive, או שהתיקייה הראשית לא נמצאה. שתפו את התיקייה עם חשבון השירות.",
            err,
        );
    }
    if (isNetwork) {
        return driveUserError(`שגיאת רשת בהעלאה ל-Google Drive (שלב: ${stage}).`, err);
    }
    return driveUserError(
        `שגיאה ב-Google Drive בשלב ${stage}: ${String(err.message || "שגיאה לא ידועה").slice(0, 200)}`,
        err,
    );
};

const safeUrlHost = (url) => {
    try {
        return new URL(url).host;
    } catch {
        return "invalid-url";
    }
};

const getDriveClient = () => {
    if (!isDriveConfigured()) return null;
    if (cachedClient) return cachedClient;

    const google = loadGoogleApis();
    if (!google) {
        console.error("[Drive] stage=auth failed reason=googleapis_missing");
        return null;
    }

    const auth = new google.auth.JWT({
        email: config.GOOGLE_DRIVE_CLIENT_EMAIL,
        // מפתחות ב-.env נשמרים עם \n מילולי
        key: config.GOOGLE_DRIVE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        scopes: DRIVE_SCOPES,
    });

    cachedClient = google.drive({ version: "v3", auth });
    if (!loggedAuthOk) {
        logDrive({}, "auth", "ok");
        loggedAuthOk = true;
    }
    return cachedClient;
};

const requireDriveClient = () => {
    if (!isDriveConfigured()) {
        throw driveUserError(DRIVE_NOT_CONFIGURED_MSG);
    }
    const drive = getDriveClient();
    if (!drive) {
        throw driveUserError("החבילה googleapis אינה מותקנת בשרת");
    }
    return drive;
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
    if (existing) {
        logDrive({}, "ensureFolder", `name="${name}" parent=${parentId} result=existing id=${existing.id}`);
        return existing;
    }
    const created = await createFolder(drive, name, parentId);
    logDrive({}, "ensureFolder", `name="${name}" parent=${parentId} result=created id=${created.id}`);
    return created;
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

const renderFolderName = (template, { orderId, date }) => (
    String(template || "הזמנה {orderId} - {date}")
        .replace("{orderId}", orderId)
        .replace("{date}", date)
);

const folderWebUrl = (folder) => (
    folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`
);

const ensureOrderFolder = async ({ orderId, orderLabel, folderTemplate }) => {
    const extra = { orderId };
    const drive = requireDriveClient();
    const folderName = renderFolderName(folderTemplate, {
        orderId: orderLabel || orderId,
        date: new Date().toLocaleDateString("he-IL"),
    });

    try {
        const folder = await ensureFolder(drive, folderName, config.GOOGLE_DRIVE_ROOT_FOLDER_ID);
        logDrive(extra, "ensureOrderFolder", `name="${folder.name || folderName}" id=${folder.id}`);
        return {
            folderId: folder.id,
            folderName: folder.name || folderName,
            folderUrl: folderWebUrl(folder),
        };
    } catch (err) {
        if (err.driveUserFacing) throw err;
        throw mapDriveError(err, "ensureFolder", extra);
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
        if (!file?.id) {
            logDrive({ orderId, fileName: file?.name }, "move", "skipped reason=missing_file_id");
            continue;
        }
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
            console.warn(
                `[Drive][order=${orderId}][fileId=${file.id}][file=${file.name || ""}] stage=move failed:`,
                err.message,
            );
        }
    }

    if (movedFiles.length === 0) return null;

    return {
        folderId: folder.id,
        folderName: folder.name || folderName,
        folderUrl: folderWebUrl(folder),
        files: movedFiles,
    };
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
