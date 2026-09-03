import { useState, useEffect, useMemo } from "react";
import { FaBoxOpen, FaCheckCircle, FaClipboardList, FaClock, FaEdit, FaEye, FaGoogleDrive, FaSearch, FaShippingFast, FaTimes, FaTimesCircle, FaTrash } from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { deleteOrders, getOrders, updateOrderStatus } from "../api/orders";
import {
    STATUS_ACTIVE,
    STATUS_OPTIONS,
    STATUS_STYLES,
    formatOrderDate,
    getCustomerName,
    shortOrderId,
} from "./orderStatus";

const PAGE_SIZE = 10;

export default function OrdersManagement() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [filterStatus, setFilterStatus] = useState("processing");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [statusEditOrder, setStatusEditOrder] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

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

    const handleStatusChange = async (orderId, newStatus) => {
        setUpdatingStatus(true);
        try {
            const updated = await updateOrderStatus(orderId, { status: newStatus });
            setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: updated.status } : o)));
            setStatusEditOrder(null);
        } catch (error) {
            console.error("Failed to update order status:", error);
            alert("שגיאה בעדכון סטטוס ההזמנה");
        } finally {
            setUpdatingStatus(false);
        }
    };

    const filteredOrders = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return orders
            .filter((order) => {
                const matchesStatus = filterStatus === "all" || order.status === filterStatus;
                const matchesSearch =
                    order._id.toLowerCase().includes(term) ||
                    getCustomerName(order).toLowerCase().includes(term);
                return matchesStatus && matchesSearch;
            })
            .sort((a, b) => new Date(b.date_created) - new Date(a.date_created));
    }, [orders, filterStatus, searchTerm]);

    const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const pagedOrders = filteredOrders.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    const pageIds = pagedOrders.map((order) => order._id);
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    const somePageSelected = pageIds.some((id) => selectedIds.includes(id));

    useEffect(() => {
        setCurrentPage(1);
        setSelectedIds([]);
    }, [filterStatus, searchTerm]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const toggleSelect = (orderId) => {
        setSelectedIds((prev) =>
            prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
        );
    };

    const toggleSelectPage = () => {
        if (allPageSelected) {
            setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
            return;
        }
        setSelectedIds((prev) => [...new Set([...prev, ...pageIds])]);
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return;
        setDeleting(true);
        try {
            await deleteOrders(selectedIds);
            setOrders((prev) => prev.filter((order) => !selectedIds.includes(order._id)));
            setSelectedIds([]);
            setShowDeleteConfirm(false);
        } catch (error) {
            console.error("Failed to delete orders:", error);
            alert(error.response?.data?.msg || "שגיאה במחיקת ההזמנות");
        } finally {
            setDeleting(false);
        }
    };

    const getPageNumbers = () => {
        const pages = [];
        const windowSize = 5;
        let start = Math.max(1, safePage - 2);
        let end = Math.min(totalPages, start + windowSize - 1);
        start = Math.max(1, end - windowSize + 1);
        for (let page = start; page <= end; page += 1) {
            pages.push(page);
        }
        return pages;
    };

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
            case 'delivered': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 flex items-center gap-1 w-fit"><FaCheckCircle /> ההזמנה מוכנה</span>;
            case 'cancelled': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 flex items-center gap-1 w-fit"><FaTimesCircle /> בוטל</span>;
            default: return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">לא ידוע</span>;
        }
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

                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar items-center">
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
                                        status === 'delivered' ? 'ההזמנה מוכנה' : 'בוטל'}
                        </button>
                    ))}
                    {selectedIds.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-2"
                        >
                            <FaTrash size={12} />
                            מחיקת {selectedIds.length} שנבחרו
                        </button>
                    )}
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
                                    <th className="p-5 w-12">
                                        <input
                                            type="checkbox"
                                            checked={allPageSelected}
                                            ref={(el) => {
                                                if (el) el.indeterminate = somePageSelected && !allPageSelected;
                                            }}
                                            onChange={toggleSelectPage}
                                            aria-label="בחירת כל ההזמנות בעמוד"
                                        />
                                    </th>
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
                                {pagedOrders.map((order) => (
                                    <tr
                                        key={order._id}
                                        onClick={() => navigate(`/ordersmanagement/${order._id}`)}
                                        className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                                    >
                                        <td className="p-5">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(order._id)}
                                                onChange={() => toggleSelect(order._id)}
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
                                            {getStatusBadge(order.status)}
                                        </td>
                                        <td className="p-5 text-center">
                                            <div className="flex justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/ordersmanagement/${order._id}`);
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
                                                        setStatusEditOrder(order);
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-gray-500">
                    <span>
                        מציג {pagedOrders.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}
                        –{(safePage - 1) * PAGE_SIZE + pagedOrders.length}
                        {" "}מתוך {filteredOrders.length} הזמנות
                    </span>
                    <div className="flex gap-1 items-center">
                        <button
                            type="button"
                            className="px-3 py-1 rounded bg-white border hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white"
                            disabled={safePage <= 1}
                            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        >
                            &lt;
                        </button>
                        {getPageNumbers().map((page) => (
                            <button
                                key={page}
                                type="button"
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-1 rounded border ${
                                    page === safePage
                                        ? "bg-[#f2665e] text-white shadow border-[#f2665e]"
                                        : "bg-white hover:bg-gray-100"
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            type="button"
                            className="px-3 py-1 rounded bg-white border hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white"
                            disabled={safePage >= totalPages}
                            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                        >
                            &gt;
                        </button>
                    </div>
                </div>
            </div>

            {statusEditOrder && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={() => !updatingStatus && setStatusEditOrder(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">עדכון סטטוס</h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    הזמנה #{shortOrderId(statusEditOrder._id)} · {getCustomerName(statusEditOrder)}
                                </p>
                            </div>
                            <button
                                type="button"
                                disabled={updatingStatus}
                                onClick={() => setStatusEditOrder(null)}
                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-50"
                            >
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-3">
                            {STATUS_OPTIONS.map(({ value, label, icon: Icon }) => (
                                <button
                                    key={value}
                                    type="button"
                                    disabled={updatingStatus || statusEditOrder.status === value}
                                    onClick={() => handleStatusChange(statusEditOrder._id, value)}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium
                                        ${statusEditOrder.status === value
                                            ? `${STATUS_ACTIVE[value]} cursor-default`
                                            : `${STATUS_STYLES[value]} cursor-pointer`
                                        } disabled:opacity-60`}
                                >
                                    <Icon size={20} />
                                    {label}
                                    {statusEditOrder.status === value && (
                                        <span className="text-xs opacity-70">(נוכחי)</span>
                                    )}
                                </button>
                            ))}
                        </div>
                        {updatingStatus && (
                            <p className="text-center text-sm text-gray-400 pb-4">מעדכן...</p>
                        )}
                    </div>
                </div>
            )}
            {showDeleteConfirm && (
                <div
                    className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={() => !deleting && setShowDeleteConfirm(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-lg font-bold text-gray-800 mb-2">אישור מחיקה</h2>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            האם אתה בטוח שברצונך למחוק {selectedIds.length} הזמנות שנבחרו? פעולה זו אינה הפיכה
                        </p>
                        <div className="mt-6 flex gap-3 justify-end">
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 disabled:opacity-50"
                            >
                                ביטול
                            </button>
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={handleDeleteSelected}
                                className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                <FaTrash size={12} />
                                {deleting ? "מוחק..." : "מחק הזמנות"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}