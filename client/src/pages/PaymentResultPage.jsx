import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { confirmOrderPayment } from '../api/orders';
import { useCartStore } from '../store/cartStore';
import { clearCheckoutDraft } from '../utils/checkoutDraft';
import { saveLastOrder } from '../utils/orderConfirmation';

/**
 * Hyp sends the customer back here after a successful payment (the URL is set in the Hyp portal).
 * The server verifies the transaction, and only then the cart is emptied and the order confirmation is shown.
 */
export default function PaymentResultPage() {
    const navigate = useNavigate();
    const clearCart = useCartStore((state) => state.clearCart);
    const [error, setError] = useState('');
    const [reviewMessage, setReviewMessage] = useState('');
    const startedRef = useRef(false);

    useEffect(() => {
        if (startedRef.current) return;
        startedRef.current = true;

        const redirectQuery = window.location.search;
        const orderId = new URLSearchParams(redirectQuery).get('Order');
        if (!orderId) {
            setError('לא התקבלו פרטי תשלום.');
            return;
        }

        confirmOrderPayment(orderId, redirectQuery)
            .then((order) => {
                if (order.review) {
                    // Charged but not verified automatically: the shop checks it by hand, so the cart is not offered again
                    clearCheckoutDraft();
                    clearCart();
                    setReviewMessage(order.msg);
                    return;
                }
                saveLastOrder(order);
                clearCheckoutDraft();
                clearCart();
                navigate(`/order-confirmation/${orderId}`, { replace: true, state: { order } });
            })
            .catch((err) => setError(err.response?.data?.msg || 'לא הצלחנו לאמת את התשלום.'));
    }, [clearCart, navigate]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-6" dir="rtl">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center space-y-4">
                {reviewMessage ? (
                    <>
                        <h1 className="text-xl font-bold text-gray-800">התשלום התקבל</h1>
                        <p className="text-gray-600">{reviewMessage}</p>
                        <Link to="/" className="inline-block bg-[#f2665e] text-white font-bold py-2.5 px-6 rounded-full hover:bg-[#d95248]">
                            חזרה לדף הבית
                        </Link>
                    </>
                ) : error ? (
                    <>
                        <h1 className="text-xl font-bold text-gray-800">התשלום לא הושלם</h1>
                        <p className="text-gray-600">{error}</p>
                        <p className="text-sm text-gray-500">אם הכרטיס חויב, אל דאגה – צרי איתנו קשר ונבדוק מיד.</p>
                        <Link to="/checkout" className="inline-block bg-[#f2665e] text-white font-bold py-2.5 px-6 rounded-full hover:bg-[#d95248]">
                            חזרה לתשלום
                        </Link>
                    </>
                ) : (
                    <>
                        <div className="mx-auto w-10 h-10 rounded-full border-4 border-[#f2665e]/20 border-t-[#f2665e] animate-spin" role="status" aria-label="מאמת" />
                        <p className="text-gray-700 font-medium">מאמתים את התשלום...</p>
                    </>
                )}
            </div>
        </div>
    );
}
