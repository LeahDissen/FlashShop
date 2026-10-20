const axios = require("axios");
const { config } = require("../config/secret");
const { OrderModel } = require("../models/ordersModel");

/** Printed (or cancelled) orders keep their uploaded photos this long, for complaints and reprints */
const PRINTED_RETENTION_DAYS = 30;
/** A payment page that was opened and never paid */
const UNPAID_RETENTION_DAYS = 7;
const DONE_STATUSES = ["shipped", "delivered", "cancelled"];
const UNPAID_STATUS = "awaiting_payment";
const RUN_EVERY_MS = 24 * 60 * 60 * 1000;
const FIRST_RUN_DELAY_MS = 5 * 60 * 1000;
/** Cloudinary's Admin API deletes at most 100 public ids per call */
const DELETE_BATCH = 100;
const DAY_MS = 24 * 60 * 60 * 1000;

/** CLOUDINARY_URL = cloudinary://<api key>:<api secret>@<cloud name>, as shown in the Cloudinary console */
const cloudinaryAdmin = () => {
    const match = String(config.CLOUDINARY_URL || "").match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
    return match ? { apiKey: match[1], apiSecret: match[2], cloudName: match[3].trim() } : null;
};

exports.isPhotoRetentionConfigured = () => Boolean(cloudinaryAdmin());

const isPhotoPrint = (item) =>
    item?.itemType === "photo-print" || String(item?.name || "").startsWith("פיתוח תמונה");

/**
 * "https://res.cloudinary.com/<cloud>/image/upload/v1792062691/folder/IMG_0009_ubzypp.jpg" -> "folder/IMG_0009_ubzypp".
 * Only images of our own cloud; anything else (data: URLs, other hosts) is never touched.
 */
const publicIdFromUrl = (url, cloudName) => {
    const match = String(url || "").match(/^https:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\/(.+)$/);
    if (!match || match[1] !== cloudName) return null;
    const path = match[2].split("?")[0].split("/");
    const versionAt = path.findIndex((part) => /^v\d+$/.test(part));
    const idParts = versionAt >= 0 ? path.slice(versionAt + 1) : path;
    const id = idParts.join("/").replace(/\.[^./]+$/, "");
    return id || null;
};

const photoUrlsOf = (order) => order.items.filter(isPhotoPrint).map((item) => item.image).filter(Boolean);

/** Orders whose photos are due for deletion: printed/cancelled 30+ days ago, or unpaid for 7+ days */
const findDueOrders = (now) => {
    const printedBefore = new Date(now.getTime() - PRINTED_RETENTION_DAYS * DAY_MS);
    const unpaidBefore = new Date(now.getTime() - UNPAID_RETENTION_DAYS * DAY_MS);
    return OrderModel.find({
        photosPurgedAt: { $exists: false },
        $or: [
            { status: { $in: DONE_STATUSES }, statusChangedAt: { $lte: printedBefore } },
            // Orders finished before the status date was recorded
            { status: { $in: DONE_STATUSES }, statusChangedAt: { $exists: false }, date_created: { $lte: printedBefore } },
            // A charge under review is kept until the admin resolves it
            { status: UNPAID_STATUS, "payment.status": { $ne: "review" }, date_created: { $lte: unpaidBefore } },
        ],
    }).select("items status");
};

const deleteFromCloudinary = async (publicIds, admin) => {
    for (let i = 0; i < publicIds.length; i += DELETE_BATCH) {
        const batch = publicIds.slice(i, i + DELETE_BATCH);
        const query = batch.map((id) => `public_ids[]=${encodeURIComponent(id)}`).join("&");
        await axios.delete(
            `https://api.cloudinary.com/v1_1/${admin.cloudName}/resources/image/upload?${query}`,
            { auth: { username: admin.apiKey, password: admin.apiSecret }, timeout: 30_000 },
        );
    }
};

/**
 * Deletes the uploaded photos of every order that is due, and marks those orders.
 * A photo that another (not yet due) order or an open cart still uses is kept.
 * @returns {Promise<{ orders: number, deleted: number, kept: number }>}
 */
exports.purgeDuePhotos = async (now = new Date()) => {
    const admin = cloudinaryAdmin();
    if (!admin) return { orders: 0, deleted: 0, kept: 0, skipped: "not-configured" };

    const due = await findDueOrders(now);
    if (!due.length) return { orders: 0, deleted: 0, kept: 0 };

    const dueIds = due.map((order) => order._id);
    const dueUrls = [...new Set(due.flatMap(photoUrlsOf))];
    const stillUsed = new Set(
        (await OrderModel.find({ _id: { $nin: dueIds }, "items.image": { $in: dueUrls } }).select("items.image").lean())
            .flatMap((order) => order.items.map((item) => item.image)),
    );

    const toDelete = dueUrls.filter((url) => !stillUsed.has(url));
    const publicIds = [...new Set(toDelete.map((url) => publicIdFromUrl(url, admin.cloudName)).filter(Boolean))];
    if (publicIds.length) await deleteFromCloudinary(publicIds, admin);

    await OrderModel.updateMany({ _id: { $in: dueIds } }, { $set: { photosPurgedAt: now } });
    return { orders: due.length, deleted: publicIds.length, kept: dueUrls.length - toDelete.length };
};

/** Runs once a few minutes after start and then daily. Failures are logged and retried on the next run. */
exports.startPhotoRetentionSchedule = () => {
    if (!exports.isPhotoRetentionConfigured()) {
        console.warn("Photo retention: CLOUDINARY_URL is not set, uploaded photos are not deleted automatically");
        return;
    }
    const run = async () => {
        try {
            const result = await exports.purgeDuePhotos();
            if (result.orders) console.log(`Photo retention: ${result.orders} orders, ${result.deleted} photos deleted, ${result.kept} kept (still in use)`);
        } catch (err) {
            console.error("Photo retention failed:", err.response?.data?.error?.message || err.message);
        }
    };
    setTimeout(run, FIRST_RUN_DELAY_MS).unref();
    setInterval(run, RUN_EVERY_MS).unref();
};

exports.PRINTED_RETENTION_DAYS = PRINTED_RETENTION_DAYS;
exports.publicIdFromUrl = publicIdFromUrl;
