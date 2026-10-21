import { FaBoxOpen, FaCheckCircle, FaClock } from 'react-icons/fa';

/** The three numbers above the orders list */
export default function OrdersStats({ stats }) {
    return (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-sm font-medium">סה"כ הזמנות</p>
                    <h3 className="text-3xl font-bold text-gray-800">{stats.total}</h3>
                </div>
                <div className="bg-blue-50 p-3 rounded-full text-blue-500"><FaBoxOpen size={24} /></div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-sm font-medium">הזמנות בטיפול</p>
                    <h3 className="text-3xl font-bold text-yellow-600">{stats.pending}</h3>
                </div>
                <div className="bg-yellow-50 p-3 rounded-full text-yellow-500"><FaClock size={24} /></div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-sm font-medium">סה"כ הכנסות</p>
                    <h3 className="text-3xl font-bold text-green-600">₪{stats.revenue.toFixed(2)}</h3>
                </div>
                <div className="bg-green-50 p-3 rounded-full text-green-500"><FaCheckCircle size={24} /></div>
            </div>
        </div>
    );
}
