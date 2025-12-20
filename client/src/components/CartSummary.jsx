import { useState } from "react";

export default function CartSummary({ subtotal, discount, totalPrice, onCheckout, onCoupon, content }) {
  const [couponCode, setCouponCode] = useState("");
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
      text: result.msg
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 sticky top-8">
      <h2 className="text-2xl font-semibold mb-4 border-b pb-3 text-gray-800 text-right">
        {content.endText}
      </h2>
      <div className="space-y-2 mb-4">
        {discount > 0 && (
          <div className="flex justify-between items-center text-gray-600 text-sm">
            <span>סכום ביניים:</span>
            <span>{subtotal.toFixed(2)} ש"ח</span>
          </div>
        )}

        {discount > 0 && (
          <div className="flex justify-between items-center text-green-600 text-sm font-medium">
            <span>הנחת קופון:</span>
            <span>-{discount.toFixed(2)} ש"ח</span>
          </div>
        )}

        <div className="flex justify-between items-center pt-2">
          <span className="text-lg text-gray-700">{content.paySum}</span>
          <span className="text-2xl font-bold text-[#f2665e]">
            {totalPrice.toFixed(2)} ש"ח
          </span>
        </div>
      </div>

      {/* Checkout Button */}
      <button
        onClick={onCheckout}
        className="w-full bg-[#f2665e] text-white font-bold py-3 rounded-md hover:opacity-90 transition-opacity text-lg mb-6 shadow-md"
      >{content.payBtn}</button>

      {/* Coupon Area */}
      <div className="space-y-2 text-right">
        <label htmlFor="coupon" className="text-sm font-medium text-gray-600 block">
          {content.codeLabel}
        </label>
        <div className="flex gap-2">
          <button
            onClick={handleApplyCoupon}
            disabled={loading}
            className="bg-gray-200 text-gray-700 font-semibold px-4 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            {loading ? '...' : content.codeBtn}
          </button>
          <input
            type="text"
            id="coupon"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder={content.codePlaceholder}
            className="flex-grow p-2 border border-gray-300 rounded-md text-right focus:outline-none focus:border-[#f2665e] focus:ring-1 focus:ring-[#f2665e]"
          />
        </div>

        {/* Feedback Message */}
        {message && (
          <p className={`text-sm mt-2 ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}