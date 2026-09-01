import { useEffect, useMemo, useState } from "react";
import {
    FaBoxOpen,
    FaCheckCircle,
    FaClipboardList,
    FaClock,
    FaCopy,
    FaDownload,
    FaEdit,
    FaEnvelope,
    FaExternalLinkAlt,
    FaFont,
    FaGoogleDrive,
    FaImages,
    FaPhone,
    FaShippingFast,
    FaTimes,
    FaTimesCircle,
    FaUser,
} from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";
import { Link, useParams } from "react-router-dom";
import { getOrderById, syncOrderDrive, updateOrderStatus } from "../api/orders";
import { useEditorSettings } from "../hooks/useEditorSettings";
import {
    STATUS_ACTIVE,
    STATUS_OPTIONS,
    STATUS_STYLES,
    formatOrderDate,
    getCustomerName,
    shortOrderId,
} from "./orderStatus";

const CUSTOMIZATION_LABELS = {
    "upload-only": "העלאת עיצוב מוכן",
    magnet: "מגנט מותאם",
    "designer-service": "שירות עיצוב גרפי",
};

const getStatusBadge = (status) => {
    switch (status) {
        case "processing":
            return <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 flex items-center gap-1 w-fit"><FaClock /> בטיפול</span>;
        case "pending":
            return <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 flex items-center gap-1 w-fit"><FaClock /> ממתין לטיפול</span>;
        case "shipped":
            return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 flex items-center gap-1 w-fit"><FaShippingFast /> נשלח</span>;
            case "delivered":
            return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 flex items-center gap-1 w-fit"><FaCheckCircle /> ההזמנה מוכנה</span>;
        case "cancelled":
            return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 flex items-center gap-1 w-fit"><FaTimesCircle /> בוטל</span>;
        default:
            return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">לא ידוע</span>;
    }
};

const extensionFromSrc = (src) => {
    if (!src || typeof src !== "string") return "jpg";
    if (src.startsWith("data:image/png")) return "png";
    if (src.startsWith("data:image/webp")) return "webp";
    if (src.startsWith("data:image/gif")) return "gif";
    const fromUrl = src.split("?")[0].match(/\.(png|jpe?g|webp|gif|svg)$/i);
    return fromUrl ? fromUrl[1].toLowerCase().replace("jpeg", "jpg") : "jpg";
};

const downloadAsset = async (src, filename) => {
    try {
        if (src.startsWith("data:")) {
            const link = document.createElement("a");
            link.href = src;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            return;
        }

        const response = await fetch(src, { mode: "cors" });
        if (!response.ok) throw new Error("download failed");
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    } catch {
        window.open(src, "_blank", "noopener,noreferrer");
    }
};

const collectItemDownloads = (item, orderId, index) => {
    const prefix = `order-${shortOrderId(orderId)}-item-${index + 1}`;
    const files = [];
    const seen = new Set();

    const add = (src, label, namePart) => {
        if (!src || typeof src !== "string" || seen.has(src)) return;
        seen.add(src);
        files.push({
            src,
            label,
            filename: `${prefix}-${namePart}.${extensionFromSrc(src)}`,
        });
    };

    if (item.customization?.type === "designer-service") {
        add(item.customization.referenceImage, "הורדת התמונה המצורפת", "reference");
        return files;
    }

    if (item.customization?.type === "designer-service") {
        add(item.customization.referenceImage, "הורדת התמונה המצורפת", "reference");
        return files;
    }

    add(item.image, "הורדת עיצוב / תמונה", "design");
    add(item.customization?.referenceImage, "הורדת קובץ מצורף", "reference");
    return files;
};

const itemKindLabel = (item) => {
    if (item.itemType === "photo-print") return "פיתוח תמונות";
    if (item.customDesign) return "עיצוב מהעורך";
    if (item.customization?.type && CUSTOMIZATION_LABELS[item.customization.type]) {
        return CUSTOMIZATION_LABELS[item.customization.type];
    }
    if (item.customization) return "מוצר מותאם";
    return "מוצר מהקטלוג";
};

const copyText = async (value) => {
    try {
        await navigator.clipboard.writeText(value);
    } catch {
        alert("לא ניתן להעתיק אוטומטית");
    }
};

/** בחירת המסגרת שהלקוח עשה בעורך – מידה, כיוון והאם התמונה סובבה */
const FrameSelectionSummary = ({ selection, orientationLabels }) => {
    if (!selection) return null;

    const orientationText = (value) => orientationLabels?.[value] || value || "—";
    const badges = [
        selection.printSizeLabel || selection.printSizeKey,
        selection.frameOrientation && `מסגרת ${orientationText(selection.frameOrientation)}`,
        selection.rotationApplied && "התמונה סובבה ב-90°",
        selection.isFixedOverlay && "שכבת Overlay קבועה",
    ].filter(Boolean);

    return (
        <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
            <div className="flex items-center gap-2 mb-2">
                <FaImages className="text-[#f2665e]" size={13} />
                <span className="text-sm font-semibold text-gray-700">
                    מסגרת: {selection.frameTitle || "ללא שם"}
                </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {badges.map((badge) => (
                    <span key={badge} className="text-[11px] bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                        {badge}
                    </span>
                ))}
            </div>
        </div>
    );
};

/** הכתוביות שהלקוח הוסיף, עם הגופן, הגודל והצבע שנבחרו */
const CaptionsSummary = ({ captions }) => {
    if (!Array.isArray(captions) || captions.length === 0) return null;

    return (
        <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
            <div className="flex items-center gap-2 mb-2">
                <FaFont className="text-[#f2665e]" size={12} />
                <span className="text-sm font-semibold text-gray-700">כתוביות ({captions.length})</span>
            </div>
            <ul className="space-y-2">
                {captions.map((caption, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                        <span
                            className="mt-1 w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0"
                            style={{ backgroundColor: caption.color || "#FFFFFF" }}
                            title={caption.color}
                        />
                        <div className="min-w-0">
                            <p className="text-gray-800 break-words">{caption.content || "—"}</p>
                            <p className="text-xs text-gray-500">
                                {[caption.fontFamily, caption.fontSize && `${caption.fontSize}px`, caption.color]
                                    .filter(Boolean)
                                    .join(" · ")}
                            </p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const Chip = ({ children }) => (
    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{children}</span>
);

/** בחירות הלקוח בעורך: מסגרת, מידה, כיוון וכתוביות – כפי שנשמרו עם ההזמנה */
const DesignSelectionDetails = ({ customDesign, orientationLabels }) => {
    const frame = customDesign?.frameSelection;
    const captions = customDesign?.captions;
    const driveFile = customDesign?.driveFile || customDesign?.designFile;

    if (!frame && !captions?.length && !driveFile) return null;

    const orientationText = (value) => orientationLabels?.[value] || value;

    return (
        <div className="mt-4 pt-4 border-t border-dashed border-gray-100 space-y-3">
            {frame && (
                <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-2">
                        <FaImages className="text-[#f2665e]" size={12} />
                        מסגרת שנבחרה
                    </h4>
                    <div className="flex items-center gap-3">
                        {frame.frameImageUrl && (
                            <a href={frame.frameImageUrl} target="_blank" rel="noreferrer" className="shrink-0">
                                <img
                                    src={frame.frameImageUrl}
                                    alt={frame.frameTitle || "מסגרת"}
                                    className="w-14 h-14 object-contain rounded-lg border border-gray-100 bg-gray-50"
                                />
                            </a>
                        )}
                        <div className="min-w-0 flex flex-wrap items-center gap-1.5">
                            {frame.frameTitle && (
                                <span className="text-sm font-medium text-gray-700">{frame.frameTitle}</span>
                            )}
                            {frame.printSizeLabel && <Chip>{frame.printSizeLabel}</Chip>}
                            {frame.frameOrientation && <Chip>{orientationText(frame.frameOrientation)}</Chip>}
                            {frame.rotationApplied && <Chip>התמונה סובבה ב-90°</Chip>}
                            {frame.isFixedOverlay && <Chip>שכבת Overlay קבועה</Chip>}
                        </div>
                    </div>
                </div>
            )}

            {captions?.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-2">
                        <FaFont className="text-[#f2665e]" size={12} />
                        כתוביות על התמונה
                    </h4>
                    <ul className="space-y-1.5">
                        {captions.map((caption, index) => (
                            <li
                                key={index}
                                className="flex flex-wrap items-center gap-2 text-sm bg-gray-50 border border-gray-100 rounded-lg px-3 py-2"
                            >
                                <span
                                    className="font-medium text-gray-800"
                                    style={{ fontFamily: caption.fontFamily }}
                                >
                                    {caption.content || "(ריק)"}
                                </span>
                                {caption.fontFamily && <Chip>{caption.fontFamily}</Chip>}
                                {caption.fontSize && <Chip>{caption.fontSize}px</Chip>}
                                {caption.color && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <span
                                            className="w-4 h-4 rounded border border-gray-200"
                                            style={{ backgroundColor: caption.color }}
                                        />
                                        <span className="text-xs text-gray-500" dir="ltr">{caption.color}</span>
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {driveFile?.url && (
                <a
                    href={driveFile.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:border-[#f2665e] hover:text-[#f2665e] transition-colors no-underline"
                >
                    <FaGoogleDrive size={13} />
                    {driveFile.name || "קובץ ההדפסה ב-Drive"}
                    <FaExternalLinkAlt size={10} className="opacity-60" />
                </a>
            )}
        </div>
    );
};

export default function OrderDetailPage() {
    const { orderId } = useParams();
    const { settings } = useEditorSettings();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showStatusEdit, setShowStatusEdit] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [syncingDrive, setSyncingDrive] = useState(false);
    const [driveError, setDriveError] = useState("");

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError("");
            try {
                const data = await getOrderById(orderId);
                setOrder(data);
            } catch (err) {
                console.error("Failed to load order:", err);
                setError(err.response?.data?.msg || "לא ניתן לטעון את ההזמנה");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [orderId]);

    const customer = order?.user_id && typeof order.user_id === "object" ? order.user_id : null;
    const designerContacts = useMemo(() => {
        if (!order?.items) return [];
        return order.items
            .map((item) => item.customization)
            .filter((c) => c?.type === "designer-service");
    }, [order]);

    const handleStatusChange = async (newStatus) => {
        if (!order) return;
        setUpdatingStatus(true);
        try {
            const updated = await updateOrderStatus(order._id, { status: newStatus });
            setOrder((prev) => ({ ...prev, status: updated.status }));
            setShowStatusEdit(false);
        } catch (err) {
            console.error("Failed to update order status:", err);
            alert("שגיאה בעדכון סטטוס ההזמנה");
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleSyncDrive = async () => {
        if (!order) return;
        setSyncingDrive(true);
        setDriveError("");
        try {
            const updated = await syncOrderDrive(order._id);
            setOrder(updated);
        } catch (err) {
            setDriveError(err.response?.data?.msg || "שגיאה בשליחה ל-Google Drive");
        } finally {
            setSyncingDrive(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-gray-50 p-10 text-center text-gray-500">טוען פרטי הזמנה...</div>;
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 font-sans" dir="rtl">
                <div className="max-w-xl mx-auto bg-white rounded-2xl border border-gray-100 p-8 text-center">
                    <h1 className="text-xl font-bold text-gray-800 mb-2">הזמנה לא נמצאה</h1>
                    <p className="text-gray-500 mb-6">{error || "אין הרשאה או שההזמנה אינה קיימת."}</p>
                    <Link to="/ordersmanagement" className="text-[#f2665e] font-bold hover:underline">
                        חזרה לניהול הזמנות
                    </Link>
                </div>
            </div>
        );
    }

    const hasPhotoPrints = order.items.some(
        (item) => item.itemType === "photo-print" || String(item.name || "").startsWith("פיתוח תמונה"),
    );
    const showDriveCard = hasPhotoPrints || Boolean(order.drive?.folderUrl);

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans" dir="rtl">
            <div className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <FaClipboardList className="text-[#f2665e]" />
                        הזמנה #{shortOrderId(order._id)}
                    </h1>
                    <p className="text-gray-500 mt-1">{formatOrderDate(order.date_created)}</p>
                </div>
                <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                    <Link
                        to="/ordersmanagement"
                        className="text-[#f2665e] transition-all font-bold p-2 gap-2 rounded-lg hover:bg-[#f2665e]/10 flex items-center no-underline"
                    >
                        <span>חזרה להזמנות</span>
                        <FiArrowLeft className="text-xl" />
                    </Link>
                </div>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FaUser className="text-[#f2665e]" />
                            פרטי לקוח
                        </h2>
                        <div className="grid sm:grid-cols-2 gap-4 text-sm">
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <p className="text-gray-500 mb-1">שם</p>
                                <p className="font-bold text-gray-800">{getCustomerName(order)}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <p className="text-gray-500 mb-1">אימייל</p>
                                {customer?.email ? (
                                    <div className="flex items-center gap-2">
                                        <a href={`mailto:${customer.email}`} className="font-medium text-[#f2665e] break-all">
                                            {customer.email}
                                        </a>
                                        <button type="button" onClick={() => copyText(customer.email)} className="text-gray-400 hover:text-gray-700" title="העתק">
                                            <FaCopy size={12} />
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-gray-400">לא זמין</p>
                                )}
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <p className="text-gray-500 mb-1">מזהה לקוח</p>
                                <p className="font-mono text-xs text-gray-700 break-all">{customer?._id || order.user_id || "—"}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <p className="text-gray-500 mb-1">תאריך הצטרפות</p>
                                <p className="text-gray-800">{formatOrderDate(customer?.createdAt)}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 sm:col-span-2">
                                <p className="text-gray-500 mb-1">כתובת למשלוח / טלפון בחשבון</p>
                                <p className="text-gray-600">
                                    לא נאספים כרגע בקופה. אם יש פרטי התקשרות בבקשת עיצוב, הם יופיעו למטה.
                                </p>
                            </div>
                        </div>

                        {designerContacts.length > 0 && (
                            <div className="mt-4 space-y-3">
                                <h3 className="text-sm font-semibold text-gray-500">פרטי קשר מבקשת עיצוב</h3>
                                {designerContacts.map((contact, i) => (
                                    <div key={i} className="rounded-xl border border-[#f2665e]/20 bg-[#fff5f4] p-4 text-sm flex gap-4 items-start">
                                        {contact.referenceImage && (
                                            <a href={contact.referenceImage} target="_blank" rel="noreferrer" className="shrink-0">
                                                <img
                                                    src={contact.referenceImage}
                                                    alt="תמונה מצורפת"
                                                    className="w-24 h-24 object-cover rounded-lg border border-[#f2665e]/20 bg-white"
                                                />
                                            </a>
                                        )}
                                        <div className="min-w-0 flex-1 space-y-1">
                                            {contact.name && <p className="font-bold text-gray-800">{contact.name}</p>}
                                            {contact.phone && (
                                                <p className="flex items-center gap-2 text-gray-700">
                                                    <FaPhone className="text-[#f2665e]" size={12} />
                                                    <a href={`tel:${contact.phone}`} className="hover:underline" dir="ltr">{contact.phone}</a>
                                                </p>
                                            )}
                                            {contact.email && (
                                                <p className="flex items-center gap-2 text-gray-700">
                                                    <FaEnvelope className="text-[#f2665e]" size={12} />
                                                    <a href={`mailto:${contact.email}`} className="hover:underline">{contact.email}</a>
                                                </p>
                                            )}
                                            {contact.description && (
                                                <p className="text-gray-600 mt-2 whitespace-pre-wrap">{contact.description}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {showDriveCard && (
                        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                                <FaGoogleDrive className="text-[#f2665e]" />
                                Google Drive
                            </h2>
                            {order.drive?.folderUrl ? (
                                <>
                                    <p className="text-sm text-gray-500 mb-4">
                                        {order.drive.folderName || "תיקיית ההזמנה"}
                                        {order.drive.fileCount ? ` · ${order.drive.fileCount} קבצים` : ""}
                                    </p>
                                    <a
                                        href={order.drive.folderUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-full py-3 rounded-xl bg-[#f2665e] text-white text-sm font-bold hover:bg-[#d95248] flex items-center justify-center gap-2 no-underline"
                                    >
                                        <FaExternalLinkAlt size={12} />
                                        פתיחת התיקייה ב-Google Drive
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => copyText(order.drive.folderUrl)}
                                        className="mt-2 w-full py-2 text-xs text-gray-500 hover:text-gray-700 flex items-center justify-center gap-2"
                                    >
                                        <FaCopy size={11} />
                                        העתקת הקישור
                                    </button>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-gray-500 mb-4">
                                        תמונות הפיתוח עדיין לא הועלו ל-Drive. לחצו כדי לשלוח אותן עכשיו.
                                    </p>
                                    {driveError && (
                                        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
                                            {driveError}
                                        </p>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleSyncDrive}
                                        disabled={syncingDrive}
                                        className="w-full py-3 rounded-xl bg-[#f2665e] text-white text-sm font-bold hover:bg-[#d95248] disabled:opacity-50"
                                    >
                                        {syncingDrive ? "שולח ל-Drive..." : "שליחה ל-Google Drive"}
                                    </button>
                                </>
                            )}
                        </section>
                    )}

                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FaBoxOpen className="text-[#f2665e]" />
                            פריטים להפקה
                        </h2>
                        <div className="space-y-4">
                            {order.items.map((item, i) => {
                                const downloads = collectItemDownloads(item, order._id, i);
                                const printSize = item.customDesign?.printSizeCm;
                                const driveFile = item.customDesign?.driveFile || item.customDesign?.designFile;
                                return (
                                    <div key={i} className="border border-gray-100 rounded-2xl p-4">
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            {item.image ? (
                                                <a href={item.image} target="_blank" rel="noreferrer" className="shrink-0">
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="w-full sm:w-36 h-36 object-cover rounded-xl border border-gray-100 bg-gray-50"
                                                    />
                                                </a>
                                            ) : (
                                                <div className="w-full sm:w-36 h-36 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300">
                                                    <FaBoxOpen size={28} />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <h3 className="font-bold text-gray-800">{item.name}</h3>
                                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                                        {itemKindLabel(item)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    כמות: {item.quantity}
                                                    {item.size ? ` · גודל: ${item.size}` : ""}
                                                    {printSize?.width && printSize?.height
                                                        ? ` · הדפסה: ${printSize.width}×${printSize.height} ס״מ`
                                                        : ""}
                                                </p>
                                                {item.customDesign?.projectName && (
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        פרויקט: {item.customDesign.projectName}
                                                    </p>
                                                )}
                                                <p className="font-bold text-[#f2665e] mt-2">
                                                    ₪{(Number(item.price) * Number(item.quantity)).toFixed(2)}
                                                    <span className="text-xs text-gray-400 font-medium mr-2">
                                                        (₪{Number(item.price).toFixed(2)} ליחידה)
                                                    </span>
                                                </p>
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {downloads.map((file) => (
                                                        <button
                                                            key={file.filename}
                                                            type="button"
                                                            onClick={() => downloadAsset(file.src, file.filename)}
                                                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#f2665e] text-white text-sm font-medium hover:bg-[#d95248]"
                                                        >
                                                            <FaDownload size={12} />
                                                            {file.label}
                                                        </button>
                                                    ))}
                                                    {driveFile?.url && (
                                                        <a
                                                            href={driveFile.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:border-[#f2665e] hover:text-[#f2665e] no-underline"
                                                        >
                                                            <FaGoogleDrive size={12} />
                                                            קובץ ההדפסה ב-Drive
                                                        </a>
                                                    )}
                                                    {!downloads.length && !driveFile?.url && (
                                                        <p className="text-xs text-gray-400">אין קובץ עיצוב להורדה בפריט זה</p>
                                                    )}
                                                </div>
                                                <FrameSelectionSummary
                                                    selection={item.customDesign?.frameSelection}
                                                    orientationLabels={settings.orientationLabels}
                                                />
                                                <CaptionsSummary captions={item.customDesign?.captions} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>

                <div className="space-y-6">
                    {order.drive?.folderUrl && (
                        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                                <FaGoogleDrive className="text-[#f2665e]" />
                                תיקיית העיצובים
                            </h2>
                            <p className="text-sm text-gray-500 mb-4">
                                {order.drive.folderName || "תיקייה בהזמנה זו"}
                                {order.drive.fileCount ? ` · ${order.drive.fileCount} קבצים` : ""}
                            </p>
                            <a
                                href={order.drive.folderUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-3 rounded-xl bg-[#f2665e] text-white text-sm font-bold hover:bg-[#d95248] flex items-center justify-center gap-2 no-underline"
                            >
                                <FaExternalLinkAlt size={12} />
                                פתיחת התיקייה ב-Google Drive
                            </a>
                            <button
                                type="button"
                                onClick={() => copyText(order.drive.folderUrl)}
                                className="mt-2 w-full py-2 text-xs text-gray-500 hover:text-gray-700 flex items-center justify-center gap-2"
                            >
                                <FaCopy size={11} />
                                העתקת הקישור
                            </button>
                        </section>
                    )}

                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">סיכום תשלום</h2>
                        <div className="space-y-2 text-sm">
                            {Number(order.subtotal) > 0 && (
                                <div className="flex justify-between text-gray-500">
                                    <span>סכום ביניים</span>
                                    <span>₪{Number(order.subtotal).toFixed(2)}</span>
                                </div>
                            )}
                            {Number(order.discount) > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>הנחה{order.coupon_code ? ` (${order.coupon_code})` : ""}</span>
                                    <span>-₪{Number(order.discount).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                                <span className="font-semibold text-gray-700">סה״כ לתשלום</span>
                                <span className="text-2xl font-bold text-[#f2665e]">₪{Number(order.total_price).toFixed(2)}</span>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-2">פרטי הזמנה</h2>
                        <dl className="text-sm space-y-2">
                            <div className="flex justify-between gap-3">
                                <dt className="text-gray-500">מספר מלא</dt>
                                <dd className="font-mono text-xs text-gray-700 break-all text-left">{order._id}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500">תאריך</dt>
                                <dd>{formatOrderDate(order.date_created)}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500">פריטים</dt>
                                <dd>{order.items.length}</dd>
                            </div>
                        </dl>
                        <button
                            type="button"
                            onClick={() => setShowStatusEdit(true)}
                            className="mt-5 w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-600 text-sm font-medium hover:border-[#f2665e] hover:text-[#f2665e] transition-colors flex items-center justify-center gap-2"
                        >
                            <FaEdit size={13} />
                            עדכון סטטוס הזמנה
                        </button>
                    </section>
                </div>
            </div>

            {showStatusEdit && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={() => !updatingStatus && setShowStatusEdit(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">עדכון סטטוס</h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    הזמנה #{shortOrderId(order._id)} · {getCustomerName(order)}
                                </p>
                            </div>
                            <button
                                type="button"
                                disabled={updatingStatus}
                                onClick={() => setShowStatusEdit(false)}
                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-50"
                            >
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-3">
                            {STATUS_OPTIONS.map(({ value, label, icon: Icon }) => (
                                <button
                                    key={value}
                                    type="button"
                                    disabled={updatingStatus || order.status === value}
                                    onClick={() => handleStatusChange(value)}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium
                                        ${order.status === value
                                            ? `${STATUS_ACTIVE[value]} cursor-default`
                                            : `${STATUS_STYLES[value]} cursor-pointer`
                                        } disabled:opacity-60`}
                                >
                                    <Icon size={20} />
                                    {label}
                                    {order.status === value && (
                                        <span className="text-xs opacity-70">(נוכחי)</span>
                                    )}
                                </button>
                            ))}
                        </div>
                        {updatingStatus && (
                            <p className="text-center text-sm text-gray-400 pb-4">מעדכן...</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
