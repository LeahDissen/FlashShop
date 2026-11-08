/** Preparation and delivery times for the chosen method (pickup / delivery), from the admin's checkout texts */
export default function FulfillmentNotice({ fulfillmentMethod, texts }) {
    const text = fulfillmentMethod === 'delivery' ? texts.deliveryNotice : texts.pickupNotice;
    if (!text) return null;
    return (
        <div className="rounded-xl bg-[#fff5f4] border border-[#f2665e]/20 px-4 py-3 text-sm text-gray-700 leading-relaxed" role="note">
            <p className="font-semibold text-gray-800 mb-1">{fulfillmentMethod === 'delivery' ? 'זמני הכנה ומשלוח' : 'איסוף עצמי'}</p>
            <p className="whitespace-pre-line">{text}</p>
        </div>
    );
}
