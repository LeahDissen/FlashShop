import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createOrder } from '../api/orders';
import useAuthStore from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { clearCheckoutDraft, loadCheckoutDraft } from '../utils/checkoutDraft';
import { toCheckoutItem } from '../utils/cartItem';
import { saveLastOrder } from '../utils/orderConfirmation';

export default function CheckoutPage() {
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const clearCart = useCartStore((state) => state.clearCart);
    const cartItems = useCartStore((state) => state.cartItems);

    const [draft, setDraft] = useState(null);
    const [isPaying, setIsPaying] = useState(false);
    const [cardName, setCardName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const paymentSubmittedRef = useRef(false);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: '/checkout' } });
            return;
        }

        if (paymentSubmittedRef.current) return;

        const checkoutDraft = loadCheckoutDraft();
        const items = cartItems.length > 0 ? cartItems : checkoutDraft?.items;
        if (!items?.length) {
            navigate('/cart');
            return;
        }

        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        setDraft({
            items,
            subtotal: checkoutDraft?.subtotal ?? subtotal,
            discount: checkoutDraft?.discount ?? 0,
            totalPrice: checkoutDraft?.totalPrice ?? subtotal,
            appliedCoupon: checkoutDraft?.appliedCoupon ?? '',
        });
    }, [isAuthenticated, cartItems, navigate]);

    const handlePayment = async (e) => {
        e.preventDefault();
        if (!draft || isPaying) return;

        if (!cardName.trim() || cardNumber.replace(/\s/g, '').length < 8) {
            alert('נא למלא פרטי תשלום תקינים');
            return;
        }

        setIsPaying(true);
        try {
            const order = await createOrder({
                items: draft.items.map(toCheckoutItem),
                couponCode: draft.appliedCoupon || undefined,
            });

            paymentSubmittedRef.current = true;
            saveLastOrder(order);

            const orderId = String(order._id);
            navigate(`/order-confirmation/${orderId}`, {
                replace: true,
                state: { order },
            });

            clearCheckoutDraft();
            clearCart();
        } catch (error) {
            const msg = error.response?.data?.msg;
            if (error.response?.data?.code === 'TOKEN_EXPIRED') {
                alert('פג תוקף ההתחברות. יש להתחבר מחדש.');
                navigate('/login', { state: { from: '/checkout' } });
                return;
            }
            alert(msg || 'התשלום נכשל. נסי שוב.');
        } finally {
            setIsPaying(false);
        }
    };

    if (!draft) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-600">טוען...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4" dir="rtl">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-800">תשלום</h1>
                    <Link to="/cart" className="text-[#f2665e] font-medium hover:underline">
                        חזרה לעגלה
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">סיכום הזמנה</h2>
                    <div className="space-y-3 mb-4">
                        {draft.items.map((item) => (
                            <div key={item.id || item._id || item.name} className="flex justify-between text-sm border-b border-gray-100 pb-2">
                                <span className="text-gray-800">
                                    {item.name} × {item.quantity}
                                </span>
                                <span className="font-medium">
                                    ₪{(item.price * item.quantity).toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">סכום ביניים</span>
                            <span>₪{Number(draft.subtotal).toFixed(2)}</span>
                        </div>
                        {draft.discount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>הנחה</span>
                                <span>-₪{Number(draft.discount).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-lg font-bold text-[#f2665e] pt-2">
                            <span>לתשלום</span>
                            <span>₪{Number(draft.totalPrice).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handlePayment} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                    <h2 className="text-xl font-bold text-gray-800">פרטי תשלום</h2>
                    <p className="text-sm text-gray-500">
                        ההזמנה תיווצר במערכת רק לאחר אישור תשלום מוצלח.
                    </p>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">שם על הכרטיס</label>
                        <input
                            type="text"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-3"
                            placeholder="שם מלא"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">מספר כרטיס</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-3 ltr text-left"
                            placeholder="1234 5678 9012 3456"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isPaying}
                        className="w-full bg-[#f2665e] text-white font-bold py-3 rounded-lg hover:bg-[#d95248] transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isPaying ? (
                            <>
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                מעבד תשלום...
                            </>
                        ) : (
                            `שלם ₪${Number(draft.totalPrice).toFixed(2)}`
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
