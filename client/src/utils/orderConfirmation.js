const LAST_ORDER_KEY = 'flashshop_last_order';

export function saveLastOrder(order) {
    try {
        sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
    } catch {
        // ignore quota errors
    }
}

export function loadLastOrder() {
    try {
        const raw = sessionStorage.getItem(LAST_ORDER_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function clearLastOrder() {
    sessionStorage.removeItem(LAST_ORDER_KEY);
}

export function formatOrderDate(dateValue) {
    if (!dateValue) return '';
    return new Date(dateValue).toLocaleDateString('he-IL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export const ESTIMATED_HANDLING_TEXT =
    'ההזמנה תטופל תוך 3–5 ימי עסקים. נשלח אליכם עדכון כשההזמנה תצא לייצור.';
