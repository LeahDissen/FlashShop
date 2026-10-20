import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createOrder, quoteOrder } from '../api/orders';
import { fetchUserInfo } from '../api/auth';
import { getShopSettings } from '../api/shopSettings';
import CheckoutDetailsForm from '../components/checkout/CheckoutDetailsForm';
import ClubSavingsBanner from '../components/checkout/ClubSavingsBanner';
import FulfillmentMethodStep from '../components/checkout/FulfillmentMethodStep';
import OrderSummaryCard from '../components/checkout/OrderSummaryCard';
import PaymentStep from '../components/checkout/PaymentStep';
import { DELIVERY_FEE, buildSummaryLines } from '../components/checkout/checkoutSummary';
import useAuthStore from '../store/authStore';
import useAppStore from '../store/appStore';
import { useCartStore } from '../store/cartStore';
import { clearCheckoutDraft, loadCheckoutDraft } from '../utils/checkoutDraft';
import { toCheckoutItem } from '../utils/cartItem';
import { saveLastOrder } from '../utils/orderConfirmation';
import { validateCheckoutDetails } from '../utils/checkoutValidation';

const emptyCustomer = { name: '', phone: '', email: '' };
const emptyShipping = { city: '', street: '', houseNumber: '' };

/** Checkout: the order summary, then pickup or delivery, the customer's details and the move to payment */
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
    const stepRef = useRef(null);
    const [quote, setQuote] = useState(null);
    const [quoteError, setQuoteError] = useState('');
    const [accountEmail, setAccountEmail] = useState('');
    const openClubWithEmail = useAppStore((state) => state.openClubWithEmail);
    const clubJoinedAt = useAppStore((state) => state.clubJoinedAt);

    // A long order summary pushes the steps below the fold: bring the next step (and its button) into view
    const firstStepRef = useRef(true);
    useEffect(() => {
        // Not on arrival: the customer first sees the order summary and total
        if (firstStepRef.current) {
            firstStepRef.current = false;
            return;
        }
        stepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [step]);

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
                setAccountEmail(user?.email || '');
                setCustomer((prev) => ({
                    ...prev,
                    name: prev.name || user?.name || '',
                    email: prev.email || user?.email || '',
                    phone: prev.phone || user?.phone || '',
                }));
            } catch {
                // No recognized profile — the fields stay for manual entry
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

    // The server prices the order (club discounts for members, coupon) – the same calculation the order will use.
    // Recalculated after joining the club from this page.
    useEffect(() => {
        if (!draft?.items?.length) return undefined;
        let cancelled = false;
        quoteOrder(draft.items.map(toCheckoutItem), draft.appliedCoupon || undefined)
            .then((data) => { if (!cancelled) { setQuote(data); setQuoteError(''); } })
            .catch((err) => { if (!cancelled) { setQuote(null); setQuoteError(err.response?.data?.msg || ''); } });
        return () => { cancelled = true; };
    }, [draft, clubJoinedAt]);

    const shippingFee = fulfillmentMethod === 'delivery' ? DELIVERY_FEE : 0;
    const orderSubtotal = quote ? quote.subtotal : Number(draft?.subtotal || 0);
    const orderDiscount = quote ? quote.discount : Number(draft?.discount || 0);
    const payableTotal = draft ? Math.max(0, orderSubtotal - orderDiscount) + shippingFee : 0;

    const selectMethod = (method) => {
        setFulfillmentMethod(method);
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

            // Payment connected: go to the secure payment page. The cart is kept until the payment is verified (PaymentResultPage)
            if (order.paymentUrl) {
                window.location.assign(order.paymentUrl);
                return;
            }

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

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4" dir="rtl">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-800">תשלום ומשלוחים</h1>
                    <Link to="/cart" className="text-[#f2665e] font-medium hover:underline">
                        חזרה לעגלה
                    </Link>
                </div>

                <OrderSummaryCard
                    summaryLines={buildSummaryLines(draft.items)}
                    subtotal={orderSubtotal}
                    quote={quote}
                    discount={orderDiscount}
                    shippingFee={shippingFee}
                    total={payableTotal}
                />

                {quoteError && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{quoteError}</p>
                )}
                <ClubSavingsBanner quote={quote} onJoin={() => openClubWithEmail(accountEmail || customer.email)} />

                <div ref={stepRef} className="space-y-6 scroll-mt-6">
                    {step === 'method' && <FulfillmentMethodStep onSelect={selectMethod} />}

                    {step === 'details' && fulfillmentMethod && (
                        <CheckoutDetailsForm
                            fulfillmentMethod={fulfillmentMethod}
                            customer={customer}
                            shipping={shipping}
                            errors={fieldErrors}
                            onCustomerChange={updateCustomer}
                            onShippingChange={updateShipping}
                            onSubmit={handleDetailsContinue}
                            onBack={() => setStep('method')}
                        />
                    )}

                    {step === 'payment' && (
                        <PaymentStep
                            fulfillmentMethod={fulfillmentMethod}
                            customerName={customer.name}
                            isPaying={isPaying}
                            onPay={handleSecurePayment}
                            onBack={() => setStep('details')}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
