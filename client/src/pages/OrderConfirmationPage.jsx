import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { getOrderById } from '../api/orders';
import {
    ESTIMATED_HANDLING_TEXT,
    formatOrderDate,
    loadLastOrder,
} from '../utils/orderConfirmation';

const STATUS_LABELS = {
    processing: 'בטיפול',
    pending: 'ממתינה',
    shipped: 'נשלחה',
    delivered: 'נמסרה',
    cancelled: 'בוטלה',
};

export default function OrderConfirmationPage() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [order, setOrder] = useState(location.state?.order ?? null);
    const [loading, setLoading] = useState(!location.state?.order);
    const [error, setError] = useState('');

    useEffect(() => {
        const cached = location.state?.order || loadLastOrder();
        if (cached && String(cached._id) === String(orderId)) {
            setOrder(cached);
            setLoading(false);
        }

        const loadOrder = async () => {
            try {
                const data = await getOrderById(orderId);
                setOrder(data);
                setError('');
            } catch (err) {
                console.error(err);
                if (!cached) {
                    setError(err.response?.data?.msg || 'לא ניתן לטעון את פרטי ההזמנה');
                }
            } finally {
                setLoading(false);
            }
        };

        if (orderId) {
            loadOrder();
        }
    }, [orderId, location.state?.order]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3" dir="rtl">
                <svg className="animate-spin h-12 w-12 text-[#f2665e]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-600">טוען אישור הזמנה...</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4 px-4" dir="rtl">
                <p className="text-red-600 font-medium">{error || 'הזמנה לא נמצאה'}</p>
                <Link to="/products" className="text-[#f2665e] font-bold hover:underline">חזרה לחנות</Link>
            </div>
        );
    }

    const statusLabel = STATUS_LABELS[order.status] || STATUS_LABELS.processing;
    const orderDate = formatOrderDate(order.date_created || order.createdAt);

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4" dir="rtl">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-l from-[#f2665e] to-[#e85a52] px-8 py-10 text-center text-white">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                        ✓
                    </div>
                    <h1 className="text-3xl font-bold mb-2">ההזמנה בוצעה בהצלחה!</h1>
                    <p className="text-white/90">תודה על הרכישה — קיבלנו את ההזמנה שלך.</p>
                </div>

                <div className="p-8 space-y-6">
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-right">
                        <p className="font-bold text-amber-900 mb-1">מתי נטפל בהזמנה?</p>
                        <p className="text-amber-800 text-sm leading-relaxed">{ESTIMATED_HANDLING_TEXT}</p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-5 text-right space-y-3">
                        <p>
                            <span className="text-gray-500">מספר הזמנה: </span>
                            <span className="font-mono font-bold text-[#f2665e]">{String(order._id)}</span>
                        </p>
                        {orderDate && (
                            <p>
                                <span className="text-gray-500">תאריך הזמנה: </span>
                                <span className="font-medium">{orderDate}</span>
                            </p>
                        )}
                        <p>
                            <span className="text-gray-500">סטטוס: </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                {statusLabel}
                            </span>
                        </p>
                        <p>
                            <span className="text-gray-500">סה״כ שולם: </span>
                            <span className="font-bold text-lg">₪{Number(order.total_price).toFixed(2)}</span>
                        </p>
                        {order.discount > 0 && (
                            <p>
                                <span className="text-gray-500">הנחה: </span>
                                <span className="font-bold text-green-600">₪{Number(order.discount).toFixed(2)}</span>
                            </p>
                        )}
                    </div>

                    {order.items?.length > 0 && (
                        <div>
                            <h2 className="font-bold text-gray-800 mb-3 text-right">פריטים בהזמנה</h2>
                            <div className="space-y-2">
                                {order.items.map((item, index) => (
                                    <div
                                        key={item._id || item.id || index}
                                        className="flex justify-between items-center text-sm border border-gray-100 rounded-lg px-4 py-3 bg-white"
                                    >
                                        <span className="font-medium text-gray-800">
                                            {item.name} × {item.quantity}
                                        </span>
                                        <span className="text-gray-600">
                                            ₪{(Number(item.price) * Number(item.quantity)).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                        <button
                            type="button"
                            onClick={() => navigate('/profile')}
                            className="px-6 py-2.5 bg-[#f2665e] text-white rounded-full font-bold hover:bg-[#d95248] transition"
                        >
                            ההזמנות שלי
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/products')}
                            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-full font-bold hover:bg-gray-50 transition"
                        >
                            המשך קניות
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
