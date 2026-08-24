import { useState } from 'react';

/** פס תשלום תחתון — רספונסיבי, סה״כ + כפתורים בלי חפיפה */
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
        className={`bg-[#f2665e] px-4 py-4 sm:px-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${
          embedded ? '' : 'rounded-2xl sm:rounded-full shadow-md'
        }`}
      >
        <div className="text-white text-center sm:text-right shrink-0">
          <p className="text-base sm:text-lg font-bold leading-snug">
            <span className="opacity-95">סה&quot;כ לתשלום: </span>
            <span className="tracking-tight whitespace-nowrap">
              {totalPrice.toFixed(2)} ₪
            </span>
          </p>
          {discount > 0 && (
            <p className="text-xs text-white/85 mt-1">
              לפני הנחה: {subtotal.toFixed(2)} ₪
            </p>
          )}
        </div>

        <div className="flex flex-row w-full sm:w-auto items-stretch sm:items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setShowCoupon((v) => !v)}
            className="flex-1 sm:flex-none text-sm bg-[#ffeae8] text-[#a83232] font-bold py-2.5 px-3 sm:px-4 rounded-full border border-white/40 hover:bg-white transition-colors shadow-sm whitespace-nowrap"
          >
            {couponBtnLabel}
          </button>
          <button
            type="button"
            onClick={onCheckout}
            disabled={disabled}
            className="flex-1 sm:flex-none text-sm bg-white text-[#f2665e] font-bold py-2.5 px-3 sm:px-5 rounded-full hover:bg-gray-50 disabled:opacity-60 shadow-sm whitespace-nowrap"
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
