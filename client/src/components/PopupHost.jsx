import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getActivePopups } from "../api/popups";
import useAppStore from "../store/appStore";

const dismissedKey = (id) => `popup-dismissed-${id}`;

const wasDismissed = (popup) => {
    if (!popup.showOncePerSession) return false;
    try {
        return sessionStorage.getItem(dismissedKey(popup._id)) === "1";
    } catch {
        return false;
    }
};

const markDismissed = (popup) => {
    try {
        sessionStorage.setItem(dismissedKey(popup._id), "1");
    } catch {
        // אחסון חסום (מצב פרטי) – פשוט נציג שוב בביקור הבא
    }
};

const isExternal = (url) => /^https?:\/\//i.test(url);

/**
 * מציג את הפופאפ הראשון שמתאים לעמוד הנוכחי, אחרי ההשהיה שהמנהלת הגדירה.
 * לא עולה מעל פופאפ המועדון או התקנון, ולא בעמודי הניהול/ההתחברות.
 */
export default function PopupHost() {
    const { pathname } = useLocation();
    const { isClubOpen, isTermsOpen } = useAppStore();
    const [popup, setPopup] = useState(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let cancelled = false;
        let timer = null;
        setVisible(false);
        setPopup(null);

        getActivePopups(pathname)
            .then((list) => {
                if (cancelled) return;
                const next = (Array.isArray(list) ? list : []).find((item) => !wasDismissed(item));
                if (!next) return;
                setPopup(next);
                timer = setTimeout(() => {
                    if (!cancelled) setVisible(true);
                }, (Number(next.delaySeconds) || 0) * 1000);
            })
            .catch(() => {});

        return () => {
            cancelled = true;
            if (timer) clearTimeout(timer);
        };
    }, [pathname]);

    if (!popup || !visible || isClubOpen || isTermsOpen) return null;

    const close = () => {
        markDismissed(popup);
        setVisible(false);
    };

    const cta = popup.ctaText && popup.ctaUrl ? (
        isExternal(popup.ctaUrl) ? (
            <a
                href={popup.ctaUrl}
                target="_blank"
                rel="noreferrer"
                onClick={close}
                className="inline-block bg-[#f0645a] text-white px-10 py-2.5 rounded-full hover:bg-[#d95248] font-bold shadow-md transition-all"
            >
                {popup.ctaText}
            </a>
        ) : (
            <Link
                to={popup.ctaUrl}
                onClick={close}
                className="inline-block bg-[#f0645a] text-white px-10 py-2.5 rounded-full hover:bg-[#d95248] font-bold shadow-md transition-all"
            >
                {popup.ctaText}
            </Link>
        )
    ) : null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[60] p-4" role="dialog" aria-modal="true" aria-labelledby="site-popup-title">
            <div className="bg-white rounded-xl shadow-2xl relative flex flex-col items-center text-center max-w-md w-full mx-auto border border-gray-100 overflow-hidden" dir="rtl">
                <button
                    type="button"
                    onClick={close}
                    className="absolute top-2 left-2 z-10 w-8 h-8 rounded-full bg-white/80 text-gray-500 hover:text-gray-800 font-bold"
                    aria-label="סגירה"
                >
                    ✕
                </button>
                {popup.imageUrl && (
                    <img src={popup.imageUrl} alt="" className="w-full max-h-64 object-cover" />
                )}
                <div className="p-8 flex flex-col items-center gap-4">
                    <h2 id="site-popup-title" className="text-2xl font-bold text-[#f0645a] whitespace-pre-line leading-snug">
                        {popup.title}
                    </h2>
                    {popup.body && (
                        <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">{popup.body}</p>
                    )}
                    {cta}
                </div>
            </div>
        </div>
    );
}
