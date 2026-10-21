import { DELIVERY_FEE } from './checkoutSummary';

/** A text field of the details form, red with its message when it failed validation */
function CheckoutField({ label, type = 'text', value, onChange, error, ltr = false, placeholder }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
                type={type}
                dir={ltr ? 'ltr' : undefined}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full border rounded-lg p-3 focus:outline-none ${
                    error ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-[#f2665e]'
                } ${ltr ? 'text-left' : ''}`}
                placeholder={placeholder}
            />
            {error ? <p className="text-xs text-red-600 mt-1">{error}</p> : null}
        </div>
    );
}

/**
 * The customer's details: name, phone and email for pickup; name, phone and address for delivery.
 * `errors` holds a message per field name.
 */
export default function CheckoutDetailsForm({
    fulfillmentMethod,
    customer,
    shipping,
    errors,
    onCustomerChange,
    onShippingChange,
    onSubmit,
    onBack,
}) {
    const isDelivery = fulfillmentMethod === 'delivery';

    return (
        <form noValidate onSubmit={onSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            {isDelivery ? (
                <>
                    <h2 className="text-xl font-bold text-gray-800">פרטי משלוח</h2>
                    <p className="text-sm font-medium text-[#f2665e] bg-[#fff5f4] border border-[#f2665e]/20 rounded-xl px-4 py-3">
                        משלוח בתוספת {DELIVERY_FEE} ₪ - עד 7 ימי עסקים
                    </p>
                </>
            ) : (
                <>
                    <h2 className="text-xl font-bold text-gray-800">פרטי לקוח לאיסוף עצמי</h2>
                    <p className="text-sm text-gray-500">אם אתם מחוברים, השם והמייל ממולאים אוטומטית וניתן לערוך אותם.</p>
                </>
            )}

            <CheckoutField label={isDelivery ? 'שם' : 'שם מלא'} value={customer.name} onChange={(v) => onCustomerChange('name', v)} error={errors.name} />
            <CheckoutField label="טלפון" type="tel" ltr placeholder="0501234567" value={customer.phone} onChange={(v) => onCustomerChange('phone', v)} error={errors.phone} />
            {isDelivery ? (
                <>
                    <CheckoutField label="עיר" value={shipping.city} onChange={(v) => onShippingChange('city', v)} error={errors.city} />
                    <CheckoutField label="רחוב" value={shipping.street} onChange={(v) => onShippingChange('street', v)} error={errors.street} />
                    <CheckoutField label="מספר בית" value={shipping.houseNumber} onChange={(v) => onShippingChange('houseNumber', v)} error={errors.houseNumber} />
                </>
            ) : (
                <CheckoutField label="מייל" type="email" ltr value={customer.email} onChange={(v) => onCustomerChange('email', v)} error={errors.email} />
            )}

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex-1 border border-gray-200 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-50"
                >
                    חזרה
                </button>
                <button
                    type="submit"
                    className="flex-1 bg-[#f2665e] text-white font-bold py-3 rounded-lg hover:bg-[#d95248]"
                >
                    {isDelivery ? 'אישור' : 'המשך לתשלום'}
                </button>
            </div>
        </form>
    );
}
