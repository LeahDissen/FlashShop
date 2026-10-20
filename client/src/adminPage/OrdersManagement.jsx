import { useState, useEffect, useMemo } from "react";
import { FaBoxOpen, FaClipboardList, FaEnvelope } from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { deleteOrders, getOrders, updateOrderStatus } from "../api/orders";
import DeleteOrdersModal from "./orders/DeleteOrdersModal";
import OrderRow from "./orders/OrderRow";
import OrdersPagination from "./orders/OrdersPagination";
import OrdersStats from "./orders/OrdersStats";
import OrdersToolbar from "./orders/OrdersToolbar";
import StatusPickerModal from "./orders/StatusPickerModal";
import { PAGE_SIZE, filterOrders, orderStats } from "./orders/ordersList";

/** Admin: all the orders – search, filter by status, change a status, delete, open an order */
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

    const filteredOrders = useMemo(
        () => filterOrders(orders, filterStatus, searchTerm),
        [orders, filterStatus, searchTerm]
    );

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
    const openOrder = (orderId) => navigate(`/ordersmanagement/${orderId}`);

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
                <div className="flex items-center gap-2">
                    <Link
                        to="/orderemails"
                        className="text-gray-600 font-bold px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-2 no-underline text-sm"
                    >
                        <FaEnvelope />
                        <span>מיילים ללקוחות</span>
                    </Link>
                    <Link
                        to="/admindashboard"
                        className="text-[#f2665e] transition-all font-bold p-2 gap-2 rounded-lg hover:bg-[#f2665e]/10 hover:-translate-y-1 flex items-center no-underline"
                    >
                        <span>חזרה ללוח הבקרה</span>
                        <FiArrowLeft className="text-xl" />
                    </Link>
                </div>
            </div>
            <OrdersStats stats={orderStats(orders)} />

            <OrdersToolbar
                searchTerm={searchTerm}
                onSearch={setSearchTerm}
                filterStatus={filterStatus}
                onFilter={setFilterStatus}
                selectedCount={selectedIds.length}
                onDelete={() => setShowDeleteConfirm(true)}
            />

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
                                    <th className="p-5">קבלה</th>
                                    <th className="p-5">פריטים</th>
                                    <th className="p-5">תאריך</th>
                                    <th className="p-5">סה"כ לתשלום</th>
                                    <th className="p-5">סטטוס</th>
                                    <th className="p-5 text-center">פעולות</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {pagedOrders.map((order) => (
                                    <OrderRow
                                        key={order._id}
                                        order={order}
                                        selected={selectedIds.includes(order._id)}
                                        onToggleSelect={() => toggleSelect(order._id)}
                                        onOpen={() => openOrder(order._id)}
                                        onEditStatus={() => setStatusEditOrder(order)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <OrdersPagination
                    page={safePage}
                    totalPages={totalPages}
                    shownCount={pagedOrders.length}
                    totalCount={filteredOrders.length}
                    onPage={setCurrentPage}
                />
            </div>

            {statusEditOrder && (
                <StatusPickerModal
                    order={statusEditOrder}
                    updating={updatingStatus}
                    onPick={(status) => handleStatusChange(statusEditOrder._id, status)}
                    onClose={() => setStatusEditOrder(null)}
                />
            )}
            {showDeleteConfirm && (
                <DeleteOrdersModal
                    count={selectedIds.length}
                    deleting={deleting}
                    onConfirm={handleDeleteSelected}
                    onClose={() => setShowDeleteConfirm(false)}
                />
            )}
        </div>
    );
}
