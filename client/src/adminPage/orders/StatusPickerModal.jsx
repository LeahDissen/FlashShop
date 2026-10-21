import { FaTimes } from 'react-icons/fa';
import { STATUS_ACTIVE, STATUS_OPTIONS, STATUS_STYLES, getCustomerName, shortOrderId } from '../orderStatus';

/** Choosing an order's new status (the customer gets the status email). Used by the orders list and the order page. */
export default function StatusPickerModal({ order, updating, onPick, onClose }) {
    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => !updating && onClose()}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">עדכון סטטוס</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            הזמנה #{shortOrderId(order._id)} · {getCustomerName(order)}
                        </p>
                    </div>
                    <button
                        type="button"
                        disabled={updating}
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-50"
                    >
                        <FaTimes />
                    </button>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                    {STATUS_OPTIONS.map(({ value, label, icon: Icon }) => {
                        const isCurrent = order.status === value;
                        return (
                            <button
                                key={value}
                                type="button"
                                disabled={updating || isCurrent}
                                onClick={() => onPick(value)}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium
                                    ${isCurrent ? `${STATUS_ACTIVE[value]} cursor-default` : `${STATUS_STYLES[value]} cursor-pointer`} disabled:opacity-60`}
                            >
                                <Icon size={20} />
                                {label}
                                {isCurrent && <span className="text-xs opacity-70">(נוכחי)</span>}
                            </button>
                        );
                    })}
                </div>
                {updating && <p className="text-center text-sm text-gray-400 pb-4">מעדכן...</p>}
            </div>
        </div>
    );
}
