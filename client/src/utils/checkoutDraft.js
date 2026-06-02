const CHECKOUT_DRAFT_KEY = 'flashshop_checkout_draft';

export function saveCheckoutDraft(draft) {
    sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draft));
}

export function loadCheckoutDraft() {
    const raw = sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function clearCheckoutDraft() {
    sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
}
