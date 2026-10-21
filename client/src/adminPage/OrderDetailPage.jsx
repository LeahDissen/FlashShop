import { useEffect, useState } from 'react';
import { FaBoxOpen, FaClipboardList, FaShippingFast } from 'react-icons/fa';
import { FiArrowLeft } from 'react-icons/fi';
import { Link, useParams } from 'react-router-dom';
import { getOrderById, updateOrderStatus } from '../api/orders';
import { useEditorSettings } from '../hooks/useEditorSettings';
import { buildOrderFileList, downloadOrderZip } from '../utils/orderDownloads';
import OrderPhotoFolder from './OrderPhotoFolder';
import { formatOrderDate, isDeliveryOrder, shortOrderId } from './orderStatus';
import CustomerDetailsSection from './orders/CustomerDetailsSection';
import OrderItemCard from './orders/OrderItemCard';
import { DriveFolderSection, OrderInfoSection, PaymentSummarySection, PrintFilesSection } from './orders/OrderSideSections';
import OrderStatusBadge from './orders/OrderStatusBadge';
import StatusPickerModal from './orders/StatusPickerModal';
import { isPhotoPrintItem } from './orders/orderItemFiles';

const ITEMS_PAGE_SIZE = 10;

/** One order for production: the customer, the files, each line, payment, and the status update */
export default function OrderDetailPage() {
    const { orderId } = useParams();
    const { settings } = useEditorSettings();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showStatusEdit, setShowStatusEdit] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [zipProgress, setZipProgress] = useState(null);
    const [zipMessage, setZipMessage] = useState(null);
    const [visibleCount, setVisibleCount] = useState(ITEMS_PAGE_SIZE);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError('');
            setVisibleCount(ITEMS_PAGE_SIZE);
            try {
                setOrder(await getOrderById(orderId));
            } catch (err) {
                console.error('Failed to load order:', err);
                setError(err.response?.data?.msg || 'לא ניתן לטעון את ההזמנה');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [orderId]);

    const handleStatusChange = async (newStatus) => {
        if (!order) return;
        setUpdatingStatus(true);
        try {
            const updated = await updateOrderStatus(order._id, { status: newStatus });
            setOrder((prev) => ({ ...prev, status: updated.status }));
            setShowStatusEdit(false);
        } catch (err) {
            console.error('Failed to update order status:', err);
            alert('שגיאה בעדכון סטטוס ההזמנה');
        } finally {
            setUpdatingStatus(false);
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
                    <p className="text-gray-500 mb-6">{error || 'אין הרשאה או שההזמנה אינה קיימת.'}</p>
                    <Link to="/ordersmanagement" className="text-[#f2665e] font-bold hover:underline">
                        חזרה לניהול הזמנות
                    </Link>
                </div>
            </div>
        );
    }

    // Photo prints are shown as one folder; every other item keeps its own card (and its line number)
    const photoItems = order.items.filter(isPhotoPrintItem);
    const otherItems = order.items.map((item, index) => ({ item, index })).filter(({ item }) => !isPhotoPrintItem(item));
    // After the photos were purged, the ZIP still offers the rest of the order's files (designs etc.)
    const zipItems = order.photosPurgedAt ? order.items.filter((item) => !isPhotoPrintItem(item)) : order.items;
    const orderFileCount = buildOrderFileList({ ...order, items: zipItems }).length;

    const handleDownloadAll = async () => {
        setZipMessage(null);
        setZipProgress({ done: 0, total: orderFileCount });
        try {
            const { total, failed } = await downloadOrderZip(order, (done, all) => setZipProgress({ done, total: all }), { items: zipItems });
            if (failed) {
                setZipMessage({ tone: 'warn', text: `${failed} מתוך ${total} קבצים לא ירדו. הם רשומים בקובץ "פרטי-ההזמנה" שבתוך ה-ZIP, ואפשר להוריד אותם אחד-אחד למטה.` });
            }
        } catch {
            setZipMessage({ tone: 'error', text: 'לא הצלחנו להכין את הקובץ. נסו שוב, או הורידו את התמונות אחת-אחת למטה.' });
        } finally {
            setZipProgress(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans" dir="rtl">
            <div className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <FaClipboardList className="text-[#f2665e]" />
                        הזמנה #{shortOrderId(order._id)}
                    </h1>
                    <p className="text-gray-500 mt-1">{formatOrderDate(order.date_created)}</p>
                    <div className="mt-3">
                        {isDeliveryOrder(order) ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 inline-flex items-center gap-1">
                                <FaShippingFast /> הזמנה למשלוח
                            </span>
                        ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                איסוף עצמי
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <OrderStatusBadge status={order.status} />
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
                    <CustomerDetailsSection order={order} />

                    {order.photosPurgedAt && (
                        <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
                            תמונות הפיתוח של ההזמנה נמחקו אוטומטית ב-{formatOrderDate(order.photosPurgedAt)}, 30 יום אחרי ההדפסה. פרטי ההזמנה נשמרים.
                        </p>
                    )}

                    {orderFileCount > 0 && (
                        <PrintFilesSection
                            fileCount={orderFileCount}
                            progress={zipProgress}
                            message={zipMessage}
                            onDownload={handleDownloadAll}
                        />
                    )}

                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FaBoxOpen className="text-[#f2665e]" />
                            פריטים להפקה
                        </h2>
                        <div className="space-y-4">
                            {photoItems.length > 0 && (
                                <OrderPhotoFolder order={order} photos={photoItems} purged={Boolean(order.photosPurgedAt)} />
                            )}
                            {otherItems.slice(0, visibleCount).map(({ item, index }) => (
                                <OrderItemCard
                                    key={index}
                                    item={item}
                                    index={index}
                                    orderId={order._id}
                                    orientationLabels={settings.orientationLabels}
                                />
                            ))}
                        </div>
                        {visibleCount < otherItems.length && (
                            <button
                                type="button"
                                onClick={() => setVisibleCount((count) => count + ITEMS_PAGE_SIZE)}
                                className="mt-4 w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-600 text-sm font-medium hover:border-[#f2665e] hover:text-[#f2665e] transition-colors"
                            >
                                טען עוד ({otherItems.length - visibleCount} נוספים)
                            </button>
                        )}
                    </section>
                </div>

                <div className="space-y-6">
                    {order.drive?.folderUrl && <DriveFolderSection drive={order.drive} />}
                    <PaymentSummarySection order={order} />
                    <OrderInfoSection order={order} onEditStatus={() => setShowStatusEdit(true)} />
                </div>
            </div>

            {showStatusEdit && (
                <StatusPickerModal
                    order={order}
                    updating={updatingStatus}
                    onPick={handleStatusChange}
                    onClose={() => setShowStatusEdit(false)}
                />
            )}
        </div>
    );
}
