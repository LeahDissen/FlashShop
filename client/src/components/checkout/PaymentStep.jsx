/** The last step: a reminder of the order and the button that creates it and moves to the secure payment page */
export default function PaymentStep({ fulfillmentMethod, customerName, isPaying, onPay, onBack }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-800">פרטי תשלום</h2>
            <p className="text-sm text-gray-500">
                ההזמנה תישמר, ותועברו לדף תשלום מאובטח. פרטי האשראי לא נשמרים באתר.
            </p>
            <p className="text-sm text-gray-600">
                {fulfillmentMethod === 'delivery' ? 'משלוח לבית' : 'איסוף עצמי'} · {customerName}
            </p>
            <button
                type="button"
                onClick={onPay}
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
                onClick={onBack}
                className="w-full text-sm text-gray-500 hover:text-gray-800"
            >
                חזרה לפרטים
            </button>
        </div>
    );
}
