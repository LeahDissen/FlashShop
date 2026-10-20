import { describe, expect, it } from 'vitest';
import { filterOrders, orderStats, pageNumbers } from './ordersList';

const order = (id, status, date, extra = {}) => ({ _id: id, status, date_created: date, total_price: 10, ...extra });
const orders = [
    order('aaa111', 'processing', '2026-01-01', { customer: { name: 'דנה', phone: '050-1', email: 'dana@x.co' } }),
    order('bbb222', 'delivered', '2026-03-01', { customer: { name: 'רון' } }),
    order('ccc333', 'awaiting_payment', '2026-02-01', { total_price: 99 }),
    order('ddd444', 'cancelled', '2026-04-01', { total_price: 50 }),
];

describe('filterOrders', () => {
    it('filters by status and sorts newest first', () => {
        expect(filterOrders(orders, 'all', '').map((o) => o._id)).toEqual(['ddd444', 'bbb222', 'ccc333', 'aaa111']);
        expect(filterOrders(orders, 'processing', '').map((o) => o._id)).toEqual(['aaa111']);
    });

    it('searches the id, name, phone and email, ignoring case', () => {
        expect(filterOrders(orders, 'all', 'BBB').map((o) => o._id)).toEqual(['bbb222']);
        expect(filterOrders(orders, 'all', 'דנה').map((o) => o._id)).toEqual(['aaa111']);
        expect(filterOrders(orders, 'all', '050-1').map((o) => o._id)).toEqual(['aaa111']);
        expect(filterOrders(orders, 'all', 'DANA@').map((o) => o._id)).toEqual(['aaa111']);
    });
});

describe('orderStats', () => {
    it('leaves unpaid orders out of the count and unpaid or cancelled ones out of the revenue', () => {
        expect(orderStats(orders)).toEqual({ total: 3, pending: 1, revenue: 20 });
    });
});

describe('pageNumbers', () => {
    it('shows up to 5 pages around the current one', () => {
        expect(pageNumbers(1, 3)).toEqual([1, 2, 3]);
        expect(pageNumbers(1, 10)).toEqual([1, 2, 3, 4, 5]);
        expect(pageNumbers(6, 10)).toEqual([4, 5, 6, 7, 8]);
        expect(pageNumbers(10, 10)).toEqual([6, 7, 8, 9, 10]);
    });
});
