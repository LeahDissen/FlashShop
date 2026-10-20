/** The order's lines, its discounts (as the server priced them), shipping and the total to pay */
export default function OrderSummaryCard({ summaryLines, subtotal, quote, discount, shippingFee, total }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">סיכום הזמנה</h2>
            <div className="space-y-3 mb-4">
                {summaryLines.map((line) => (
                    <div key={line.key} className="flex justify-between text-sm border-b border-gray-100 pb-2">
                        <span className="text-gray-800">{line.label}</span>
                        <span className="font-medium">₪{line.total.toFixed(2)}</span>
                    </div>
                ))}
            </div>
            <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-500">סכום ביניים</span>
                    <span>₪{subtotal.toFixed(2)}</span>
                </div>
                {quote
                    ? quote.discounts.map((line) => (
                        <div key={line.kind} className="flex justify-between text-green-600">
                            <span>{line.label}</span>
                            <span>-₪{Number(line.amount).toFixed(2)}</span>
                        </div>
                    ))
                    : discount > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>הנחה</span>
                            <span>-₪{discount.toFixed(2)}</span>
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
                    <span>₪{total.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
}
