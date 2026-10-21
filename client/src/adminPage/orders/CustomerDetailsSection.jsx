import { FaCopy, FaEnvelope, FaPhone, FaShippingFast, FaUser } from 'react-icons/fa';
import { formatOrderDate, getCustomerName, isDeliveryOrder } from '../orderStatus';
import { copyText } from './orderItemFiles';

const Field = ({ label, children, className = 'bg-gray-50 rounded-xl p-4 border border-gray-100' }) => (
    <div className={className}>
        <p className="text-gray-500 mb-1">{label}</p>
        {children}
    </div>
);
const NotGiven = () => <p className="text-gray-400">לא צוין</p>;

/** Who ordered, how to reach her, and how the order is received (pickup or delivery to her address) */
export default function CustomerDetailsSection({ order }) {
    const account = order.user_id && typeof order.user_id === 'object' ? order.user_id : null;
    const isDelivery = isDeliveryOrder(order);
    const email = order.customer?.email || account?.email;

    return (
        <section className={`bg-white rounded-2xl shadow-sm border p-6 ${isDelivery ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-100'}`}>
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaUser className="text-[#f2665e]" />
                פרטי לקוח
                {isDelivery && (
                    <span className="mr-auto px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 inline-flex items-center gap-1">
                        <FaShippingFast /> למשלוח
                    </span>
                )}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <Field label="שם מלא">
                    <p className="font-bold text-gray-800">{order.customer?.name || getCustomerName(order)}</p>
                </Field>
                <Field label="טלפון">
                    {order.customer?.phone ? (
                        <p className="flex items-center gap-2 font-medium text-gray-800">
                            <FaPhone className="text-[#f2665e]" size={12} />
                            <a href={`tel:${order.customer.phone}`} className="hover:underline" dir="ltr">{order.customer.phone}</a>
                        </p>
                    ) : <NotGiven />}
                </Field>
                <Field label="מייל">
                    {email ? (
                        <div className="flex items-center gap-2">
                            <FaEnvelope className="text-[#f2665e]" size={12} />
                            <a href={`mailto:${email}`} className="font-medium text-[#f2665e] break-all">{email}</a>
                            <button type="button" onClick={() => copyText(email)} className="text-gray-400 hover:text-gray-700" title="העתק">
                                <FaCopy size={12} />
                            </button>
                        </div>
                    ) : <NotGiven />}
                </Field>
                <Field label="אופן קבלה">
                    <p className="font-bold text-gray-800">{isDelivery ? 'משלוח לבית (+25 ₪)' : 'איסוף עצמי'}</p>
                </Field>
                {isDelivery && (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 sm:col-span-2">
                        <p className="text-blue-700 mb-2 font-semibold flex items-center gap-2">
                            <FaShippingFast /> כתובת למשלוח
                        </p>
                        <p className="text-gray-800 font-medium">
                            {order.shipping_address?.street} {order.shipping_address?.houseNumber}
                        </p>
                        <p className="text-gray-800">{order.shipping_address?.city}</p>
                    </div>
                )}
                <Field label="מזהה לקוח">
                    <p className="font-mono text-xs text-gray-700 break-all">{account?._id || order.user_id || '—'}</p>
                </Field>
                <Field label="תאריך הצטרפות">
                    <p className="text-gray-800">{formatOrderDate(account?.createdAt)}</p>
                </Field>
            </div>
        </section>
    );
}
