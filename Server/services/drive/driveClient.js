/** The Google Drive connection (optional: without its settings, orders are saved without a Drive folder), its errors and logs */
const { config } = require("../../config/secret");

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
 * The Drive integration is optional: if the environment variables are not set,
 * the system keeps working as usual and the order is saved without a Drive folder.
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
        // Keys in .env are saved with a literal \n
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

module.exports = {
    FOLDER_MIME,
    STAGING_FOLDER_NAME,
    isDriveConfigured,
    getDriveClient,
    requireDriveClient,
    driveUserError,
    mapDriveError,
    formatDriveTags,
    logDrive,
    safeUrlHost,
    sharedDriveParams,
};
