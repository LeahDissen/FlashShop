import { useState, useEffect } from "react";
import { FaBoxOpen, FaCheckCircle, FaClipboardList, FaClock, FaEllipsisV, FaEye, FaSearch, FaShippingFast, FaTimesCircle } from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";
import { Link } from "react-router-dom";
import { getOrders } from "../api/orders";

export default function OrdersManagement() {
    const [orders, setOrders] = useState([]);
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadOrders = async () => {
            try {
                const data = await getOrders();
                setOrders(data);
            } catch (error) {
                console.error("Failed to load orders:", error);
            } finally {
                setLoading(false);
            }
        };
        loadOrders();
    }, []);

    const filteredOrders = orders.filter(order => {
        const matchesStatus = filterStatus === "all" || order.status === filterStatus;
        const matchesSearch = order._id.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'processing' || o.status === 'pending').length,
        revenue: orders.reduce((sum, o) => o.status !== 'cancelled' ? sum + (o.total_price || 0) : sum, 0)
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'processing': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 flex items-center gap-1 w-fit"><FaClock /> בטיפול</span>;
            case 'pending': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 flex items-center gap-1 w-fit"><FaClock /> ממתין לטיפול</span>;
            case 'shipped': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 flex items-center gap-1 w-fit"><FaShippingFast /> נשלח</span>;
            case 'delivered': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 flex items-center gap-1 w-fit"><FaCheckCircle /> סופק</span>;
            case 'cancelled': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 flex items-center gap-1 w-fit"><FaTimesCircle /> בוטל</span>;
            default: return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">לא ידוע</span>;
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('he-IL', {
            day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <FaClipboardList className="text-[#f2665e]" />
                        ניהול הזמנות
                    </h1>
                    <p className="text-gray-500 mt-1">צפייה בכל ההזמנות, עדכון סטטוסים ומעקב משלוחים</p>
                </div>
                <Link
                    to="/admindashboard"
                    className="text-[#f2665e] transition-all font-bold p-2 gap-2 rounded-lg hover:bg-[#f2665e]/10 hover:-translate-y-1 flex items-center no-underline"
                >
                    <span>חזרה ללוח הבקרה</span>
                    <FiArrowLeft className="text-xl" />
                </Link>
            </div>
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

            <div className="max-w-7xl mx-auto bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-1/3">
                    <FaSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="חיפוש לפי שם לקוח או מספר הזמנה..."
                        className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#f2665e] focus:border-transparent outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
                    {['all', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap
                                ${filterStatus === status
                                    ? 'bg-[#f2665e] text-white shadow-md transform scale-105'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                        >
                            {status === 'all' ? 'הכל' :
                                status === 'processing' ? 'בטיפול' :
                                    status === 'shipped' ? 'נשלח' :
                                        status === 'delivered' ? 'סופק' : 'בוטל'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-10 text-center text-gray-500">טוען נתונים...</div>
                ) : filteredOrders.length === 0 ? (
                    <div className="p-10 text-center">
                        <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <FaBoxOpen size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-700">לא נמצאו הזמנות</h3>
                        <p className="text-gray-500">נסה לשנות את סינון החיפוש או הסטטוס</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead className="bg-gray-50 text-gray-600 text-sm uppercase font-semibold border-b border-gray-200">
                                <tr>
                                    <th className="p-5">הזמנה</th>
                                    <th className="p-5">לקוח</th>
                                    <th className="p-5">פריטים</th>
                                    <th className="p-5">תאריך</th>
                                    <th className="p-5">סה"כ לתשלום</th>
                                    <th className="p-5">סטטוס</th>
                                    <th className="p-5 text-center">פעולות</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredOrders.map((order) => (
                                    <tr key={order._id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="p-5 font-mono text-sm font-bold text-gray-700">
                                            {order._id}
                                        </td>
                                        <td className="p-5">
                                            <div className="text-sm text-gray-600 font-mono">
                                                {order.user_id ? String(order.user_id).slice(-8) : '—'}
                                            </div>
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
                                            {formatDate(order.date_created)}
                                        </td>
                                        <td className="p-5 font-bold text-[#f2665e]">
                                            ₪{order.total_price.toFixed(2)}
                                        </td>
                                        <td className="p-5">
                                            {getStatusBadge(order.status)}
                                        </td>
                                        <td className="p-5 text-center">
                                            <div className="flex justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100" title="צפה בפרטים">
                                                    <FaEye />
                                                </button>
                                                <button className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200" title="ערוך סטטוס">
                                                    <FaEllipsisV />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center text-sm text-gray-500">
                    <span>מציג {filteredOrders.length} מתוך {orders.length} הזמנות</span>
                    <div className="flex gap-1">
                        <button className="px-3 py-1 rounded bg-white border hover:bg-gray-100" disabled>&lt;</button>
                        <button className="px-3 py-1 rounded bg-[#f2665e] text-white shadow">1</button>
                        <button className="px-3 py-1 rounded bg-white border hover:bg-gray-100">2</button>
                        <button className="px-3 py-1 rounded bg-white border hover:bg-gray-100">3</button>
                        <button className="px-3 py-1 rounded bg-white border hover:bg-gray-100">&gt;</button>
                    </div>
                </div>
            </div>
        </div>
    );
}