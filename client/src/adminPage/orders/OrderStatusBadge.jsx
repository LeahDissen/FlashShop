import { FaCheckCircle, FaClock, FaShippingFast, FaTimesCircle } from 'react-icons/fa';

const BADGES = {
    processing: { className: 'bg-yellow-100 text-yellow-700', icon: FaClock, label: 'בטיפול' },
    pending: { className: 'bg-yellow-100 text-yellow-700', icon: FaClock, label: 'ממתין לטיפול' },
    awaiting_payment: { className: 'bg-gray-100 text-gray-600', icon: FaClock, label: 'ממתין לתשלום' },
    shipped: { className: 'bg-blue-100 text-blue-700', icon: FaShippingFast, label: 'נשלח' },
    delivered: { className: 'bg-green-100 text-green-700', icon: FaCheckCircle, label: 'ההזמנה מוכנה' },
    cancelled: { className: 'bg-red-100 text-red-700', icon: FaTimesCircle, label: 'בוטל' },
};

/** The order's status as a colored badge */
export default function OrderStatusBadge({ status }) {
    const badge = BADGES[status];
    if (!badge) {
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">לא ידוע</span>;
    }
    const Icon = badge.icon;
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.className} flex items-center gap-1 w-fit`}>
            <Icon /> {badge.label}
        </span>
    );
}
