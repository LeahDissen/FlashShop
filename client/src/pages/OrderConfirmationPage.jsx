import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getOrderById } from '../api/orders';

export default function OrderConfirmationPage() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadOrder = async () => {
            try {
                const data = await getOrderById(orderId);
                setOrder(data);
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.msg || 'לא ניתן לטעון את פרטי ההזמנה');
            } finally {
                setLoading(false);
            }
        };

        if (orderId) {
            loadOrder();
        }
    }, [orderId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-600">טוען אישור הזמנה...</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4 px-4" dir="rtl">
                <p className="text-red-600 font-medium">{error || 'הזמנה לא נמצאה'}</p>
                <Link to="/cart" className="text-[#f2665e] font-bold hover:underline">חזרה לעגלה</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-16 px-4" dir="rtl">
            <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                    ✓
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">התשלום בוצע בהצלחה!</h1>
                <p className="text-gray-500 mb-6">תודה על הרכישה. ההזמנה שלך נשמרה במערכת לאחר אישור התשלום.</p>

                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-right space-y-2">
                    <p>
                        <span className="text-gray-500">מספר הזמנה: </span>
                        <span className="font-mono font-bold text-[#f2665e]">{order._id}</span>
                    </p>
                    <p>
                        <span className="text-gray-500">סה"כ שולם: </span>
                        <span className="font-bold">₪{Number(order.total_price).toFixed(2)}</span>
                    </p>
                    {order.discount > 0 && (
                        <p>
                            <span className="text-gray-500">הנחה: </span>
                            <span className="font-bold text-green-600">₪{Number(order.discount).toFixed(2)}</span>
                        </p>
                    )}
                    <p>
                        <span className="text-gray-500">סטטוס: </span>
                        <span className="font-medium">בטיפול</span>
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => navigate('/profile')}
                        className="px-6 py-2.5 bg-[#f2665e] text-white rounded-full font-bold hover:bg-[#d95248] transition"
                    >
                        ההזמנות שלי
                    </button>
                    <button
                        onClick={() => navigate('/products')}
                        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-full font-bold hover:bg-gray-50 transition"
                    >
                        המשך קניות
                    </button>
                </div>
            </div>
        </div>
    );
}
