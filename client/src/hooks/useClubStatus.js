import { useEffect, useState } from 'react';
import { getMyClubStatus } from '../api/club';
import useAppStore from '../store/appStore';
import useAuthStore from '../store/authStore';

const NOT_A_MEMBER = { isMember: false, giftAvailable: false, giftPending: false };

let cached = null; // { key, value }: one request per login / join, shared by all the product cards
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
    const [status, setStatus] = useState(() => (cached && cached.key === key ? cached.value : NOT_A_MEMBER));

    useEffect(() => {
        if (!key) return undefined;
        if (cached?.key === key) {
            setStatus(cached.value);
            return undefined;
        }
        let cancelled = false;
        if (request?.key !== key) {
            request = {
                key,
                promise: getMyClubStatus().catch(() => NOT_A_MEMBER),
            };
        }
        request.promise.then((value) => {
            cached = { key, value };
            if (!cancelled) setStatus(value);
        });
        return () => { cancelled = true; };
    }, [key]);

    if (!key) {
        return clubJoinedAt ? { isMember: true, giftAvailable: false, giftPending: true } : NOT_A_MEMBER;
    }
    return status;
}
