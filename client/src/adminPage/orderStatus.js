import { FaCheckCircle, FaClock, FaShippingFast, FaTimesCircle } from "react-icons/fa";

export const STATUS_OPTIONS = [
    { value: "processing", label: "בטיפול", icon: FaClock },
    { value: "shipped", label: "נשלח", icon: FaShippingFast },
    { value: "delivered", label: "ההזמנה מוכנה", icon: FaCheckCircle },
    { value: "cancelled", label: "בוטל", icon: FaTimesCircle },
];

export const STATUS_STYLES = {
    processing: "bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100",
    shipped: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
    delivered: "bg-green-50 border-green-200 text-green-700 hover:bg-green-100",
    cancelled: "bg-red-50 border-red-200 text-red-700 hover:bg-red-100",
};

export const STATUS_ACTIVE = {
    processing: "ring-2 ring-yellow-400 bg-yellow-100 border-yellow-300",
    shipped: "ring-2 ring-blue-400 bg-blue-100 border-blue-300",
    delivered: "ring-2 ring-green-400 bg-green-100 border-green-300",
    cancelled: "ring-2 ring-red-400 bg-red-100 border-red-300",
};

export const shortOrderId = (id) => String(id).slice(-8).toUpperCase();

export const formatOrderDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("he-IL", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const getCustomerName = (order) => {
    if (order?.user_id && typeof order.user_id === "object") {
        return order.user_id.name || "—";
    }
    return "—";
};
