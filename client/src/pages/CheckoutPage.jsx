import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createOrder } from '../api/orders';
import { fetchUserInfo } from '../api/auth';
import { getShopSettings } from '../api/shopSettings';
import useAuthStore from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { clearCheckoutDraft, loadCheckoutDraft } from '../utils/checkoutDraft';
import { toCheckoutItem } from '../utils/cartItem';
import { saveLastOrder } from '../utils/orderConfirmation';
import { validateCheckoutDetails } from '../utils/checkoutValidation';

const DELIVERY_FEE = 25;

const emptyCustomer = { name: '', phone: '', email: '' };
const emptyShipping = { city: '', street: '', houseNumber: '' };

export default function CheckoutPage() {
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const clearCart = useCartStore((state) => state.clearCart);
    const cartItems = useCartStore((state) => state.cartItems);

    const [draft, setDraft] = useState(null);
    const [step, setStep] = useState('method');
    const [fulfillmentMethod, setFulfillmentMethod] = useState(null);
    const [customer, setCustomer] = useState(emptyCustomer);
    const [shipping, setShipping] = useState(emptyShipping);
    const [isPaying, setIsPaying] = useState(false);
    const [paymentLinkUrl, setPaymentLinkUrl] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
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

    useEffect(() => {
        if (!isAuthenticated) return;

        const loadProfile = async () => {
            try {
                const response = await fetchUserInfo();
                const user = response.data;
                setCustomer((prev) => ({
                    ...prev,
                    name: prev.name || user?.name || '',
                    email: prev.email || user?.email || '',
                    phone: prev.phone || user?.phone || '',
                }));
            } catch {
                // אין פרופיל מזוהה — השדות נשארים למילוי ידני
            }
        };

        loadProfile();
    }, [isAuthenticated]);

    useEffect(() => {
        if (step !== 'payment') return;
        const loadPaymentLink = async () => {
            try {
                const settings = await getShopSettings();
                setPaymentLinkUrl(settings.paymentLinkUrl || '');
            } catch {
                setPaymentLinkUrl('');
            }
        };
        loadPaymentLink();
    }, [step]);

    const shippingFee = fulfillmentMethod === 'delivery' ? DELIVERY_FEE : 0;
    const payableTotal = draft ? Math.max(0, Number(draft.totalPrice) + shippingFee) : 0;

    const selectPickup = () => {
        setFulfillmentMethod('pickup');
        setStep('details');
    };

    const selectDelivery = () => {
        setFulfillmentMethod('delivery');
        setStep('details');
    };

    const updateCustomer = (field, value) => {
        setCustomer((prev) => ({ ...prev, [field]: value }));
        setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const updateShipping = (field, value) => {
        setShipping((prev) => ({ ...prev, [field]: value }));
        setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const handleDetailsContinue = (e) => {
        e.preventDefault();
        const errors = validateCheckoutDetails({
            fulfillmentMethod,
            customer,
            shipping,
        });
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;
        setStep('payment');
    };

    const handleSecurePayment = async () => {
        if (!draft || isPaying || !fulfillmentMethod) return;

        const errors = validateCheckoutDetails({
            fulfillmentMethod,
            customer,
            shipping,
        });
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setStep('details');
            return;
        }

        setIsPaying(true);
        try {
            const order = await createOrder({
                items: draft.items.map(toCheckoutItem),
                couponCode: draft.appliedCoupon || undefined,
                fulfillmentMethod,
                customer,
                shippingAddress: fulfillmentMethod === 'delivery' ? shipping : undefined,
            });

            paymentSubmittedRef.current = true;
            saveLastOrder(order);
            clearCheckoutDraft();
            clearCart();

            if (paymentLinkUrl) {
                window.open(paymentLinkUrl, '_blank', 'noopener,noreferrer');
            }

            const orderId = String(order._id);
            navigate(`/order-confirmation/${orderId}`, {
                replace: true,
                state: { order },
            });
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

    const fieldClass = (name, extra = '') =>
        `w-full border rounded-lg p-3 focus:outline-none ${
            fieldErrors[name] ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-[#f2665e]'
        } ${extra}`;

    const FieldError = ({ name }) =>
        fieldErrors[name] ? <p className="text-xs text-red-600 mt-1">{fieldErrors[name]}</p> : null;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4" dir="rtl">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-800">תשלום ומשלוחים</h1>
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
                        {shippingFee > 0 && (
                            <div className="flex justify-between text-gray-700">
                                <span>משלוח</span>
                                <span>₪{shippingFee.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-lg font-bold text-[#f2665e] pt-2">
                            <span>לתשלום</span>
                            <span>₪{payableTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {step === 'method' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                        <h2 className="text-xl font-bold text-gray-800">בחירת אופן קבלה</h2>
                        <p className="text-sm text-gray-500">לפני התשלום, בחרו איסוף עצמי או משלוח לבית.</p>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={selectPickup}
                                className="p-6 rounded-2xl border-2 border-gray-200 hover:border-[#f2665e] hover:bg-[#fff5f4] transition text-right"
                            >
                                <p className="text-lg font-bold text-gray-800">איסוף עצמי</p>
                                <p className="text-sm text-gray-500 mt-1">ללא תוספת תשלום</p>
                            </button>
                            <button
                                type="button"
                                onClick={selectDelivery}
                                className="p-6 rounded-2xl border-2 border-gray-200 hover:border-[#f2665e] hover:bg-[#fff5f4] transition text-right"
                            >
                                <p className="text-lg font-bold text-gray-800">משלוח</p>
                                <p className="text-sm text-gray-500 mt-1">תוספת 25 ₪ · עד 7 ימי עסקים</p>
                            </button>
                        </div>
                    </div>
                )}

                {step === 'details' && fulfillmentMethod === 'pickup' && (
                    <form noValidate onSubmit={handleDetailsContinue} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                        <h2 className="text-xl font-bold text-gray-800">פרטי לקוח לאיסוף עצמי</h2>
                        <p className="text-sm text-gray-500">אם אתם מחוברים, השם והמייל ממולאים אוטומטית וניתן לערוך אותם.</p>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
                            <input
                                type="text"
                                value={customer.name}
                                onChange={(e) => updateCustomer('name', e.target.value)}
                                className={fieldClass('name')}
                            />
                            <FieldError name="name" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
                            <input
                                type="tel"
                                dir="ltr"
                                value={customer.phone}
                                onChange={(e) => updateCustomer('phone', e.target.value)}
                                className={fieldClass('phone', 'text-left')}
                                placeholder="0501234567"
                            />
                            <FieldError name="phone" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">מייל</label>
                            <input
                                type="email"
                                dir="ltr"
                                value={customer.email}
                                onChange={(e) => updateCustomer('email', e.target.value)}
                                className={fieldClass('email', 'text-left')}
                            />
                            <FieldError name="email" />
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setStep('method')}
                                className="flex-1 border border-gray-200 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-50"
                            >
                                חזרה
                            </button>
                            <button
                                type="submit"
                                className="flex-1 bg-[#f2665e] text-white font-bold py-3 rounded-lg hover:bg-[#d95248]"
                            >
                                המשך לתשלום
                            </button>
                        </div>
                    </form>
                )}

                {step === 'details' && fulfillmentMethod === 'delivery' && (
                    <form noValidate onSubmit={handleDetailsContinue} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                        <h2 className="text-xl font-bold text-gray-800">פרטי משלוח</h2>
                        <p className="text-sm font-medium text-[#f2665e] bg-[#fff5f4] border border-[#f2665e]/20 rounded-xl px-4 py-3">
                            משלוח בתוספת 25 ₪ - עד 7 ימי עסקים
                        </p>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">שם</label>
                            <input
                                type="text"
                                value={customer.name}
                                onChange={(e) => updateCustomer('name', e.target.value)}
                                className={fieldClass('name')}
                            />
                            <FieldError name="name" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
                            <input
                                type="tel"
                                dir="ltr"
                                value={customer.phone}
                                onChange={(e) => updateCustomer('phone', e.target.value)}
                                className={fieldClass('phone', 'text-left')}
                                placeholder="0501234567"
                            />
                            <FieldError name="phone" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">עיר</label>
                            <input
                                type="text"
                                value={shipping.city}
                                onChange={(e) => updateShipping('city', e.target.value)}
                                className={fieldClass('city')}
                            />
                            <FieldError name="city" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">רחוב</label>
                            <input
                                type="text"
                                value={shipping.street}
                                onChange={(e) => updateShipping('street', e.target.value)}
                                className={fieldClass('street')}
                            />
                            <FieldError name="street" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">מספר בית</label>
                            <input
                                type="text"
                                value={shipping.houseNumber}
                                onChange={(e) => updateShipping('houseNumber', e.target.value)}
                                className={fieldClass('houseNumber')}
                            />
                            <FieldError name="houseNumber" />
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setStep('method')}
                                className="flex-1 border border-gray-200 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-50"
                            >
                                חזרה
                            </button>
                            <button
                                type="submit"
                                className="flex-1 bg-[#f2665e] text-white font-bold py-3 rounded-lg hover:bg-[#d95248]"
                            >
                                אישור
                            </button>
                        </div>
                    </form>
                )}

                {step === 'payment' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                        <h2 className="text-xl font-bold text-gray-800">פרטי תשלום</h2>
                        <p className="text-sm text-gray-500">
                            ההזמנה תישמר במערכת, ואז תועברו לתשלום מאובטח בקישור חיצוני.
                        </p>
                        {!paymentLinkUrl && (
                            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                                קישור התשלום עדיין לא הוגדר במסך ההגדרות. ההזמנה תישמר, אבל לא ייפתח מסך תשלום חיצוני.
                            </p>
                        )}
                        <p className="text-sm text-gray-600">
                            {fulfillmentMethod === 'delivery' ? 'משלוח לבית' : 'איסוף עצמי'} · {customer.name}
                        </p>
                        <button
                            type="button"
                            onClick={handleSecurePayment}
                            disabled={isPaying}
                            className="w-full bg-[#f2665e] text-white font-bold py-3 rounded-lg hover:bg-[#d95248] transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isPaying ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    מעבד הזמנה...
                                </>
                            ) : (
                                'מעבר לתשלום מאובטח'
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep('details')}
                            className="w-full text-sm text-gray-500 hover:text-gray-800"
                        >
                            חזרה לפרטים
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
