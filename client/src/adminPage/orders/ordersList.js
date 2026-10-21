/** The orders list: filtering, paging and the summary numbers */
import { getCustomerName } from '../orderStatus';

export const PAGE_SIZE = 10;

/** The status filter tabs, in order */
export const FILTER_TABS = [
    { status: 'all', label: 'הכל' },
    { status: 'processing', label: 'בטיפול' },
    { status: 'shipped', label: 'נשלח' },
    { status: 'delivered', label: 'ההזמנה מוכנה' },
    { status: 'cancelled', label: 'בוטל' },
    { status: 'awaiting_payment', label: 'ממתין לתשלום' },
];

/** Orders of the status ('all' for any) whose id, customer name, phone or email contain the term; newest first */
export function filterOrders(orders, filterStatus, searchTerm) {
    const term = searchTerm.toLowerCase();
    return orders
        .filter((order) => {
            const matchesStatus = filterStatus === "all" || order.status === filterStatus;
            const matchesSearch =
                order._id.toLowerCase().includes(term) ||
                getCustomerName(order).toLowerCase().includes(term) ||
                String(order.customer?.phone || "").toLowerCase().includes(term) ||
                String(order.customer?.email || "").toLowerCase().includes(term);
            return matchesStatus && matchesSearch;
        })
        .sort((a, b) => new Date(b.date_created) - new Date(a.date_created));
}

/** Orders (not counting unpaid ones), orders waiting for handling, and revenue (not cancelled or unpaid) */
export function orderStats(orders) {
    return {
total: orders.filter(o => o.status !== 'awaiting_payment').length,
pending: orders.filter(o => o.status === 'processing' || o.status === 'pending').length,
revenue: orders.reduce((sum, o) => o.status !== 'cancelled' && o.status !== 'awaiting_payment' ? sum + (o.total_price || 0) : sum, 0)
    };
}

/** Up to 5 page numbers around the current page */
export function pageNumbers(currentPage, totalPages) {
    const pages = [];
    const windowSize = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    for (let page = start; page <= end; page += 1) {
        pages.push(page);
    }
    return pages;
}
