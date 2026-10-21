/** Drive folders: find or create by name, and the order's folder (with the design files moved into it) */
const { config } = require("../../config/secret");
const {
    FOLDER_MIME,
    getDriveClient,
    requireDriveClient,
    logDrive,
    mapDriveError,
    sharedDriveParams,
} = require("./driveClient");

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


/**
 * Creates a folder for the order and moves into it the design files uploaded while designing.
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
    ensureFolder,
    ensureOrderFolder,
    moveDesignsToOrderFolder,
};
