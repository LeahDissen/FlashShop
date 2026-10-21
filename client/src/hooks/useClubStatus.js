import { useEffect, useState } from 'react';
import { getMyClubStatus } from '../api/club';
import useAppStore from '../store/appStore';
import useAuthStore from '../store/authStore';

const NOT_A_MEMBER = { isMember: false, giftAvailable: false, giftPending: false };

/** How long a status is reused: long enough for a page of product cards, short enough to see the gift used */
const STATUS_TTL_MS = 60_000;

let cached = null; // { key, value, at }: shared by all the product cards
let request = null;

/**
 * Whether the visitor is a club member and her join gift is waiting: from the server for a logged-in
 * customer (by her account email, like checkout), and right after joining in this visit (even before
 * logging in) – the email confirmation still has to come, so the gift counts as pending.
 */
export function useClubStatus() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const userId = useAuthStore((state) => state.userId);
    const clubJoinedAt = useAppStore((state) => state.clubJoinedAt);
    const key = isAuthenticated ? `${userId}:${clubJoinedAt}` : null;
    const fresh = () => cached?.key === key && Date.now() - cached.at < STATUS_TTL_MS;
    const [status, setStatus] = useState(() => (fresh() ? cached.value : NOT_A_MEMBER));

    useEffect(() => {
        if (!key) return undefined;
        if (cached?.key === key && Date.now() - cached.at < STATUS_TTL_MS) {
            setStatus(cached.value);
            return undefined;
        }
        let cancelled = false;
        if (request?.key !== key || request.done) {
            const next = { key, done: false };
            next.promise = getMyClubStatus().catch(() => NOT_A_MEMBER).finally(() => { next.done = true; });
            request = next;
        }
        request.promise.then((value) => {
            cached = { key, value, at: Date.now() };
            if (!cancelled) setStatus(value);
        });
        return () => { cancelled = true; };
    }, [key]);

    if (!key) {
        return clubJoinedAt ? { isMember: true, giftAvailable: false, giftPending: true } : NOT_A_MEMBER;
    }
    return status;
}
