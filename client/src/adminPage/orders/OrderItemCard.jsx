import { FaBoxOpen, FaDownload, FaGoogleDrive } from 'react-icons/fa';
import { optimizeImageUrl } from '../../utils/imageUrl';
import { CaptionsSummary, DesignerRequestBox, FrameSelectionSummary } from './ItemDesignSummaries';
import { collectItemDownloads, downloadAsset, itemKindLabel, splitItemDisplayName } from './orderItemFiles';

function ItemThumbnail({ item }) {
    if (!item.image) {
        return (
            <div className="w-full sm:w-36 shrink-0">
                <div className="aspect-square w-full rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300">
                    <FaBoxOpen size={28} />
                </div>
            </div>
        );
    }
    return (
        <a href={item.image} target="_blank" rel="noreferrer" className="block w-full sm:w-36 shrink-0">
            <span className="block aspect-square w-full overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                <img
                    src={optimizeImageUrl(item.image, { width: 288, height: 288 })}
                    alt={item.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                />
            </span>
        </a>
    );
}

/** The designs of a per-copy order line, one per copy */
function CopiesFolder({ copies }) {
    return (
        <div className="mt-3">
            <p className="text-xs font-semibold text-gray-600 mb-1">תיקיית העותקים: {copies.length} עיצובים, אחד לכל עותק</p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                {copies.map((copy, copyIndex) => (
                    <a key={copy.image} href={copy.image} target="_blank" rel="noreferrer" title={`עותק ${copyIndex + 1}`}>
                        <img src={optimizeImageUrl(copy.image, { width: 160 })} alt={`עותק ${copyIndex + 1}`} loading="lazy" className="w-full aspect-square object-contain rounded border bg-gray-50" />
                    </a>
                ))}
            </div>
        </div>
    );
}

/** One order line for production: what it is, its price, its files to download and the customer's choices */
export default function OrderItemCard({ item, index, orderId, orientationLabels }) {
    const downloads = collectItemDownloads(item, orderId, index);
    const printSize = item.customDesign?.printSizeCm;
    const driveFile = item.customDesign?.driveFile || item.customDesign?.designFile;
    const { title, fileName } = splitItemDisplayName(item.name);

    return (
        <div className="border border-gray-100 rounded-2xl p-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <ItemThumbnail item={item} />
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start gap-2 mb-1">
                        <h3 className="font-bold text-gray-800">{title}</h3>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full shrink-0">
                            {itemKindLabel(item)}
                        </span>
                    </div>
                    {fileName && (
                        <p className="text-sm text-gray-500 mb-1 break-all" dir="ltr">{fileName}</p>
                    )}
                    <p className="text-sm text-gray-500">
                        כמות: {item.quantity}
                        {item.size ? ` · גודל: ${item.size}` : ''}
                        {printSize?.width && printSize?.height ? ` · הדפסה: ${printSize.width}×${printSize.height} ס״מ` : ''}
                    </p>
                    {item.customDesign?.projectName && (
                        <p className="text-sm text-gray-500 mt-1">פרויקט: {item.customDesign.projectName}</p>
                    )}
                    <p className="font-bold text-[#f2665e] mt-2">
                        ₪{(Number(item.price) * Number(item.quantity)).toFixed(2)}
                        <span className="text-xs text-gray-400 font-medium mr-2">
                            (₪{Number(item.price).toFixed(2)} ליחידה)
                        </span>
                    </p>
                    {item.customDesign?.copies?.length > 0 && <CopiesFolder copies={item.customDesign.copies} />}
                    <div className="flex flex-wrap gap-2 mt-3">
                        {downloads.map((file) => (
                            <button
                                key={file.filename}
                                type="button"
                                onClick={() => downloadAsset(file.src, file.filename)}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#f2665e] text-white text-sm font-medium whitespace-nowrap hover:bg-[#d95248]"
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
                    <FrameSelectionSummary selection={item.customDesign?.frameSelection} orientationLabels={orientationLabels} />
                    <CaptionsSummary captions={item.customDesign?.captions} />
                    <DesignerRequestBox contact={item.customization} />
                </div>
            </div>
        </div>
    );
}
