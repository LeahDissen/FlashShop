import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getPage } from '../api/pages';
import { getShopSettings } from '../api/shopSettings';
import useAuthStore from '../store/authStore';

const DEFAULT_CLOSED_MESSAGE = 'האתר בהכנה ויפתח בקרוב 💛';
/** Open while the shop is closed, so the admin can log in (and reset her password) */
const ALWAYS_OPEN_PATHS = ['/login', '/forgot', '/reset-password'];

/**
 * While the shop is closed to the public (shop settings > "האתר סגור לציבור"), visitors see a "coming
 * soon" page; the logged-in admin sees and edits the whole site, with a reminder bar on top.
 */
export default function SiteGate({ children }) {
    const { pathname } = useLocation();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const isAdmin = useAuthStore((state) => state.role === 'admin');
    // null until the settings arrive; a failure keeps the shop open
    const [closed, setClosed] = useState(null);
    const [message, setMessage] = useState('');
    const [logo, setLogo] = useState('');

    useEffect(() => {
        getShopSettings()
            .then((settings) => {
                setClosed(Boolean(settings.siteClosed));
                setMessage(settings.closedMessage || '');
            })
            .catch(() => setClosed(false));
    }, []);

    // The shop's logo (set in the header editor) for the "coming soon" page
    useEffect(() => {
        if (closed && !isAdmin) getPage('header').then((page) => setLogo(page.logo || ''));
    }, [closed, isAdmin]);

    if (ALWAYS_OPEN_PATHS.some((path) => pathname.startsWith(path))) return children;
    // Wait for the settings (and for the login when the shop is closed), so visitors never glimpse the shop
    if (closed === null || (closed && isAuthenticated === null)) {
        return <div className="min-h-screen bg-white" aria-busy="true" />;
    }
    if (!closed) return children;

    if (isAdmin) {
        return (
            <>
                <div className="bg-amber-100 text-amber-900 text-sm text-center px-4 py-2 font-medium" dir="rtl" role="status">
                    האתר סגור כרגע לציבור, ורק את רואה אותו.{' '}
                    <Link to="/shopsettings" className="underline font-bold">לפתיחת האתר</Link>
                </div>
                {children}
            </>
        );
    }

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-[#fff5f4] px-6 text-center" dir="rtl">
            {logo && <img src={logo} alt="" className="h-20 mb-6 object-contain" />}
            <h1 className="text-3xl sm:text-4xl font-bold text-[#f2665e] mb-4">בקרוב 🎉</h1>
            <p className="text-lg text-gray-700 max-w-md whitespace-pre-line">{message || DEFAULT_CLOSED_MESSAGE}</p>
        </main>
    );
}
