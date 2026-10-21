import { DELIVERY_FEE } from './checkoutSummary';

/** The first step: pickup or delivery */
export default function FulfillmentMethodStep({ onSelect }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-800">בחירת אופן קבלה</h2>
            <p className="text-sm text-gray-500">לפני התשלום, בחרו איסוף עצמי או משלוח לבית.</p>
            <div className="grid sm:grid-cols-2 gap-4">
                <button
                    type="button"
                    onClick={() => onSelect('pickup')}
                    className="p-6 rounded-2xl border-2 border-gray-200 hover:border-[#f2665e] hover:bg-[#fff5f4] transition text-right"
                >
                    <p className="text-lg font-bold text-gray-800">איסוף עצמי</p>
                    <p className="text-sm text-gray-500 mt-1">ללא תוספת תשלום</p>
                </button>
                <button
                    type="button"
                    onClick={() => onSelect('delivery')}
                    className="p-6 rounded-2xl border-2 border-gray-200 hover:border-[#f2665e] hover:bg-[#fff5f4] transition text-right"
                >
                    <p className="text-lg font-bold text-gray-800">משלוח</p>
                    <p className="text-sm text-gray-500 mt-1">תוספת {DELIVERY_FEE} ₪ · עד 7 ימי עסקים</p>
                </button>
            </div>
        </div>
    );
}
