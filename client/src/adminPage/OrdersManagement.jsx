// file: client/src/adminPage/OrdersManagement.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    FaClipboardList,
    FaSearch,
    FaFilter,
    FaCheckCircle,
    FaTimesCircle,
    FaClock,
    FaShippingFast,
    FaBoxOpen,
    FaEye,
    FaEllipsisV
} from "react-icons/fa";

export default function OrdersManagement() {
    // --- Mock Data (נתונים לדוגמה) ---
    const mockOrders = [
        {
            _id: "ORD-789012",
            customer: { name: "ישראל ישראלי", email: "israel@gmail.com", avatar: "https://i.pravatar.cc/150?u=1" },
            items: [
                { name: "פאזל מודפס", quantity: 1, price: 45.9 },
                { name: "כרית מפנקת", quantity: 2, price: 29.8 }
            ],
            total_price: 105.5,
            status: "pending",
            date_created: "2025-11-24T10:00:00Z"
        },
        {
            _id: "ORD-789013",
            customer: { name: "נועה כהן", email: "noa@gmail.com", avatar: "https://i.pravatar.cc/150?u=2" },
            items: [
                { name: "תמונות לפיתוח (10x15)", quantity: 50, price: 1.2 }
            ],
            total_price: 60.0,
            status: "shipped",
            date_created: "2025-11-23T14:30:00Z"
        },
        {
            _id: "ORD-789014",
            customer: { name: "דני רופ", email: "danny@gmail.com", avatar: "https://i.pravatar.cc/150?u=3" },
            items: [
                { name: "קנבס 50x70", quantity: 1, price: 120.0 },
                { name: "ספל מודפס", quantity: 3, price: 35.0 }
            ],
            total_price: 225.0,
            status: "delivered",
            date_created: "2025-11-20T09:15:00Z"
        },
        {
            _id: "ORD-789015",
            customer: { name: "רונית שחר", email: "ronit@gmail.com", avatar: "https://i.pravatar.cc/150?u=4" },
            items: [
                { name: "חולצה מודפסת", quantity: 10, price: 40.0 }
            ],
            total_price: 400.0,
            status: "cancelled",
            date_created: "2025-11-19T18:20:00Z"
        }
    ];

    const [orders, setOrders] = useState([]);
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // כאן תהיה קריאת ה-API האמיתית בעתיד
        // למשל: getAllOrders().then(data => setOrders(data));

        // סימולציה של טעינה
        setTimeout(() => {
            setOrders(mockOrders);
            setLoading(false);
        }, 800);
    }, []);

    // סינון וחיפוש
    const filteredOrders = orders.filter(order => {
        const matchesStatus = filterStatus === "all" || order.status === filterStatus;
        const matchesSearch =
            order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    // חישוב סטטיסטיקות
    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        revenue: orders.reduce((sum, o) => o.status !== 'cancelled' ? sum + o.total_price : sum, 0)
    };

    // פונקציות עזר לסטטוסים
    const getStatusBadge = (status) => {
        switch (status) {
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

            {/* כותרת וחזרה לדשבורד */}
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
                    className="bg-white text-gray-600 hover:text-[#f2665e] border border-gray-200 px-6 py-2 rounded-full shadow-sm hover:shadow transition-all font-medium"
                >
                    חזרה ללוח הבקרה &larr;
                </Link>
            </div>

            {/* כרטיסי סטטיסטיקה */}
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

            {/* סרגל כלים: חיפוש וסינון */}
            <div className="max-w-7xl mx-auto bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">

                {/* חיפוש */}
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

                {/* סינון לפי סטטוס */}
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
                    {['all', 'pending', 'shipped', 'delivered', 'cancelled'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap
                                ${filterStatus === status
                                    ? 'bg-[#f2665e] text-white shadow-md transform scale-105'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                        >
                            {status === 'all' ? 'הכל' :
                                status === 'pending' ? 'ממתין' :
                                    status === 'shipped' ? 'נשלח' :
                                        status === 'delivered' ? 'סופק' : 'בוטל'}
                        </button>
                    ))}
                </div>
            </div>

            {/* טבלת הזמנות */}
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
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={order.customer.avatar}
                                                    alt={order.customer.name}
                                                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                                />
                                                <div>
                                                    <div className="font-bold text-gray-800">{order.customer.name}</div>
                                                    <div className="text-xs text-gray-500">{order.customer.email}</div>
                                                </div>
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

                {/* Footer של הטבלה (Pagination למשל) */}
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