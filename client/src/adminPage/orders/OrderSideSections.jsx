import { FaCopy, FaDownload, FaEdit, FaExternalLinkAlt, FaGoogleDrive } from 'react-icons/fa';
import { formatOrderDate } from '../orderStatus';
import { copyText } from './orderItemFiles';

/** All the order's files in one ZIP, with progress and a note about files that could not be fetched */
export function PrintFilesSection({ fileCount, progress, message, onDownload }) {
    return (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                <FaDownload className="text-[#f2665e]" />
                קבצים להדפסה
            </h2>
            <p className="text-sm text-gray-500 mb-4">
                {fileCount} קבצים, בקובץ ZIP אחד. בשם כל קובץ מופיעים מספר השורה, הגודל ומספר העותקים.
            </p>
            {message && (
                <p className={`text-sm rounded-lg px-3 py-2 mb-3 border ${message.tone === 'error' ? 'text-red-600 bg-red-50 border-red-100' : 'text-amber-800 bg-amber-50 border-amber-200'}`}>
                    {message.text}
                </p>
            )}
            <button
                type="button"
                onClick={onDownload}
                disabled={progress !== null}
                className="w-full py-3 rounded-xl bg-[#f2665e] text-white text-sm font-bold hover:bg-[#d95248] disabled:opacity-60 flex items-center justify-center gap-2"
            >
                <FaDownload size={12} />
                {progress === null
                    ? 'הורדת כל התמונות'
                    : progress.done < progress.total
                        ? `מוריד ${progress.done} מתוך ${progress.total}...`
                        : 'מכין את הקובץ...'}
            </button>
        </section>
    );
}

/** The order's Google Drive folder, when it was saved there */
export function DriveFolderSection({ drive }) {
    return (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                <FaGoogleDrive className="text-[#f2665e]" />
                תיקיית העיצובים
            </h2>
            <p className="text-sm text-gray-500 mb-4">
                {drive.folderName || 'תיקייה בהזמנה זו'}
                {drive.fileCount ? ` · ${drive.fileCount} קבצים` : ''}
            </p>
            <a
                href={drive.folderUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-xl bg-[#f2665e] text-white text-sm font-bold hover:bg-[#d95248] flex items-center justify-center gap-2 no-underline"
            >
                <FaExternalLinkAlt size={12} />
                פתיחת התיקייה ב-Google Drive
            </a>
            <button
                type="button"
                onClick={() => copyText(drive.folderUrl)}
                className="mt-2 w-full py-2 text-xs text-gray-500 hover:text-gray-700 flex items-center justify-center gap-2"
            >
                <FaCopy size={11} />
                העתקת הקישור
            </button>
        </section>
    );
}

const Row = ({ label, value, className = 'flex justify-between text-gray-500' }) => (
    <div className={className}>
        <span>{label}</span>
        <span>{value}</span>
    </div>
);

/** Subtotal, each discount, shipping, total, and the card payment's state */
export function PaymentSummarySection({ order }) {
    const discounts = Array.isArray(order.discounts) ? order.discounts : [];
    return (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">סיכום תשלום</h2>
            <div className="space-y-2 text-sm">
                {Number(order.subtotal) > 0 && <Row label="סכום ביניים" value={`₪${Number(order.subtotal).toFixed(2)}`} />}
                {discounts.length > 0
                    ? discounts.map((line) => (
                        <Row key={line.kind} label={line.label} value={`-₪${Number(line.amount).toFixed(2)}`} className="flex justify-between text-green-700" />
                    ))
                    : Number(order.discount) > 0 && (
                        <Row
                            label={`הנחה${order.coupon_code ? ` (${order.coupon_code})` : ''}`}
                            value={`-₪${Number(order.discount).toFixed(2)}`}
                            className="flex justify-between text-green-600"
                        />
                    )}
                {Number(order.shipping_fee) > 0 && (
                    <Row label="משלוח" value={`₪${Number(order.shipping_fee).toFixed(2)}`} className="flex justify-between text-gray-700" />
                )}
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <span className="font-semibold text-gray-700">סה״כ לתשלום</span>
                    <span className="text-2xl font-bold text-[#f2665e]">₪{Number(order.total_price).toFixed(2)}</span>
                </div>
                {order.payment?.status === 'paid' && (
                    <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                        שולם באשראי (Hyp) · מספר עסקה {order.payment.transactionId}
                        {order.payment.approvalCode && ` · אישור ${order.payment.approvalCode}`}
                    </p>
                )}
                {order.payment?.status === 'review' && (
                    <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        Hyp אישרו חיוב (מספר עסקה {order.payment.transactionId}
                        {order.payment.approvalCode && `, אישור ${order.payment.approvalCode}`}), אבל האימות האוטומטי נכשל.
                        יש לבדוק את העסקה בפורטל של Hyp, ואם היא תקינה לעדכן את ההזמנה ל&quot;בטיפול&quot;.
                    </p>
                )}
            </div>
        </section>
    );
}

/** The order's id, date, number of lines, and the button that opens the status update */
export function OrderInfoSection({ order, onEditStatus }) {
    return (
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
                onClick={onEditStatus}
                className="mt-5 w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-600 text-sm font-medium hover:border-[#f2665e] hover:text-[#f2665e] transition-colors flex items-center justify-center gap-2"
            >
                <FaEdit size={13} />
                עדכון סטטוס הזמנה
            </button>
        </section>
    );
}
