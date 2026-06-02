import { useState } from 'react';

/** פס תשלום תחתון — מחובר לכרטיס העגלה, עיצוב Figma */
export default function CartCheckoutBar({
  totalPrice,
  subtotal,
  discount,
  onCheckout,
  onCoupon,
  payBtnLabel = 'רוצה לשלם',
  couponBtnLabel = 'יש לי קופון',
  codePlaceholder = 'הזן קוד קופון',
  codeApplyLabel = 'החל',
  disabled = false,
  embedded = false,
}) {
  const [showCoupon, setShowCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setLoading(true);
    setMessage(null);
    const result = await onCoupon(couponCode);
    setLoading(false);
    setMessage({
      type: result.success ? 'success' : 'error',
      text: result.msg,
    });
  };

  return (
    <div className={embedded ? '' : 'mt-3'}>
      <div
        className={`bg-[#f2665e] px-4 py-3 sm:px-6 sm:py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 ${
          embedded ? '' : 'rounded-xl shadow-sm'
        }`}
      >
        <div className="text-white text-center sm:text-right order-2 sm:order-1">
          <span className="text-sm sm:text-base font-medium">סה&quot;כ לתשלום: </span>
          <span className="text-lg sm:text-xl font-bold tracking-wide">
            {totalPrice.toFixed(2)} ₪
          </span>
          {discount > 0 && (
            <p className="text-xs text-white/85 mt-0.5">
              לפני הנחה: {subtotal.toFixed(2)} ₪
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 sm:gap-3 order-1 sm:order-2">
          <button
            type="button"
            onClick={() => setShowCoupon((v) => !v)}
            className="min-w-[120px] text-sm bg-[#ffeae8] text-[#a83232] font-bold py-2 px-5 rounded-full border border-white/40 hover:bg-white transition-colors shadow-sm"
          >
            {couponBtnLabel}
          </button>
          <button
            type="button"
            onClick={onCheckout}
            disabled={disabled}
            className="min-w-[120px] text-sm bg-white text-[#f2665e] font-bold py-2 px-6 rounded-full hover:bg-gray-50 disabled:opacity-60 shadow-sm"
          >
            {payBtnLabel}
          </button>
        </div>
      </div>

      {showCoupon && (
        <div
          className={`bg-[#fff8f7] border-t border-[#f2665e]/15 px-4 py-3 text-right ${
            embedded ? '' : 'mt-3 rounded-xl border border-gray-100 shadow-sm'
          }`}
          dir="rtl"
        >
          <div className="flex flex-col sm:flex-row gap-2 max-w-md sm:mr-auto">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder={codePlaceholder}
              className="flex-1 p-2.5 text-sm border border-[#f2665e]/25 rounded-full text-right bg-white focus:outline-none focus:border-[#f2665e]"
            />
            <button
              type="button"
              onClick={handleApplyCoupon}
              disabled={loading}
              className="text-sm bg-[#f2665e] text-white font-bold px-5 py-2.5 rounded-full hover:bg-[#d95248] disabled:opacity-50 shrink-0"
            >
              {loading ? '...' : codeApplyLabel}
            </button>
          </div>
          {message && (
            <p
              className={`text-xs mt-2 ${message.type === 'success' ? 'text-green-700' : 'text-red-600'}`}
            >
              {message.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
