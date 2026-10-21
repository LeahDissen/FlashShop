import { FaEdit, FaEye, FaGoogleDrive, FaShippingFast, FaStore } from 'react-icons/fa';
import { formatOrderDate, getCustomerName, isDeliveryOrder, shortOrderId } from '../orderStatus';
import OrderStatusBadge from './OrderStatusBadge';

/** One order in the list: opens the order; its checkbox, status and Drive buttons do not */
export default function OrderRow({ order, selected, onToggleSelect, onOpen, onEditStatus }) {
    return (
            <tr
                key={order._id}
                onClick={onOpen}
                className={`hover:bg-gray-50/50 transition-colors group cursor-pointer ${
                    isDeliveryOrder(order) ? "bg-blue-50/70 border-r-4 border-r-blue-500" : ""
                }`}
            >
                <td className="p-5">
                    <input
                        type="checkbox"
                        checked={selected}
                        onChange={onToggleSelect}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`בחירת הזמנה ${shortOrderId(order._id)}`}
                    />
                </td>
                <td className="p-5">
                    <span className="font-mono text-sm font-bold text-gray-700" title={order._id}>
                        #{shortOrderId(order._id)}
                    </span>
                </td>
                <td className="p-5">
                    <div className="text-sm text-gray-800 font-medium">
                        {getCustomerName(order)}
                    </div>
                    {order.customer?.phone && (
                        <div className="text-xs text-gray-500 mt-0.5" dir="ltr">
                            {order.customer.phone}
                        </div>
                    )}
                </td>
                <td className="p-5 whitespace-nowrap">
                    {isDeliveryOrder(order) ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 inline-flex items-center gap-1.5 whitespace-nowrap">
                            <FaShippingFast /> משלוח
                        </span>
                    ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1.5 whitespace-nowrap">
                            <FaStore /> איסוף עצמי
                        </span>
                    )}
                </td>
                <td className="p-5">
                    <div className="text-sm text-gray-600">
                        {order.items.length === 1
                            ? order.items[0].name
                            : `${order.items[0].name} (+${order.items.length - 1} נוספים)`
                        }
                    </div>
                </td>
                <td className="p-5 text-sm text-gray-600">
                    {formatOrderDate(order.date_created)}
                </td>
                <td className="p-5 font-bold text-[#f2665e]">
                    ₪{order.total_price.toFixed(2)}
                </td>
                <td className="p-5">
                    <OrderStatusBadge status={order.status} />
                    {order.payment?.status === 'review' && (
                        <span className="mt-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 w-fit block">חיוב לבדיקה</span>
                    )}
                </td>
                <td className="p-5 text-center">
                    <div className="flex justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpen();
                            }}
                            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                            title="צפה בפרטים"
                        >
                            <FaEye />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEditStatus();
                            }}
                            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                            title="ערוך סטטוס"
                        >
                            <FaEdit />
                        </button>
                        {order.drive?.folderUrl && (
                            <a
                                href={order.drive.folderUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 no-underline"
                                title="תיקיית העיצובים ב-Google Drive"
                            >
                                <FaGoogleDrive />
                            </a>
                        )}
                    </div>
                </td>
            </tr>
    );
}
