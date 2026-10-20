import { useState } from "react";
import { FaDownload, FaFolderOpen } from "react-icons/fa";
import { downloadOrderZip } from "../utils/orderDownloads";
import { optimizeImageUrl } from "../utils/imageUrl";

const THUMB_PIXELS = 240;

/** "פיתוח תמונה 10x15 (IMG_0009.JPG)" -> "IMG_0009.JPG" */
const photoFileName = (name) => String(name || "").match(/\(([^)]+)\)\s*$/)?.[1] || "";

/**
 * All photo prints of an order as one folder: counts per size, one ZIP of just the photos,
 * and the thumbnails on demand (a 100-photo order would otherwise be 100 product cards).
 */
export default function OrderPhotoFolder({ order, photos, purged }) {
    const [open, setOpen] = useState(false);
    const [progress, setProgress] = useState(null);
    const [message, setMessage] = useState("");

    const prints = photos.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const bySize = photos.reduce((acc, item) => {
        const size = item.size || "ללא גודל";
        acc[size] = (acc[size] || 0) + (Number(item.quantity) || 0);
        return acc;
    }, {});

    const handleDownload = async () => {
        setMessage("");
        setProgress({ done: 0, total: photos.length });
        try {
            const { total, failed } = await downloadOrderZip(order, (done, all) => setProgress({ done, total: all }), {
                items: photos,
                nameSuffix: "-תמונות",
            });
            if (failed) setMessage(`${failed} מתוך ${total} תמונות לא ירדו. הן רשומות בקובץ "פרטי-ההזמנה" שבתוך ה-ZIP.`);
        } catch {
            setMessage("לא הצלחנו להכין את הקובץ. נסו שוב.");
        } finally {
            setProgress(null);
        }
    };

    return (
        <div className="border border-gray-100 rounded-2xl p-4 bg-[#fffaf9]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                    <FaFolderOpen className="text-[#f2665e] text-2xl shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-gray-800">תמונות להדפסה</p>
                        <p className="text-sm text-gray-500">
                            {photos.length} תמונות · {prints} הדפסות
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {Object.entries(bySize).map(([size, count]) => `${size}: ${count}`).join(" · ")}
                        </p>
                    </div>
                </div>
                {!purged && (
                    <div className="flex gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => setOpen((value) => !value)}
                            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-white"
                            aria-expanded={open}
                        >
                            {open ? "הסתרת התמונות" : "הצגת התמונות"}
                        </button>
                        <button
                            type="button"
                            onClick={handleDownload}
                            disabled={progress !== null}
                            className="px-4 py-2 rounded-xl bg-[#f2665e] text-white text-sm font-bold hover:bg-[#d95248] disabled:opacity-60 flex items-center gap-2"
                        >
                            <FaDownload size={12} />
                            {progress === null
                                ? "הורדת התמונות"
                                : progress.done < progress.total
                                    ? `${progress.done}/${progress.total}`
                                    : "מכין..."}
                        </button>
                    </div>
                )}
            </div>
            {message && <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">{message}</p>}

            {open && !purged && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-4">
                    {photos.map((item, index) => (
                        <a
                            key={item._id || index}
                            href={item.image}
                            target="_blank"
                            rel="noreferrer"
                            className="block group"
                            title={photoFileName(item.name)}
                        >
                            <span className="block aspect-square overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                                <img
                                    src={optimizeImageUrl(item.image, { width: THUMB_PIXELS, height: THUMB_PIXELS })}
                                    alt={photoFileName(item.name)}
                                    loading="lazy"
                                    className="w-full h-full object-cover group-hover:opacity-90"
                                />
                            </span>
                            <span className="block text-[11px] text-gray-600 mt-1 truncate">
                                {item.size} · ×{item.quantity}
                            </span>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}
