import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingCart, FaUser, FaDownload, FaSignOutAlt } from 'react-icons/fa';
import useAppStore from '../store/appStore';
import useAuthStore from '../store/authStore';

export default function NavBar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const setClubOpen = useAppStore(state => state.setClubOpen);
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    const logout = useAuthStore(state => state.logout);
    const linkStyle = "text-[#f2665e] font-bold px-4 py-2 rounded-full hover:bg-[#f2665e]/10 transition-all duration-200 flex items-center gap-2";

    return (
        <nav className="w-full h-full flex items-center justify-between pl-4" aria-label="תפריט ראשי">

            {/* אזור הקישורים (סדר הפוך: מוצרים מימין, קטלוג משמאל) */}
            <ul className="flex items-center gap-4 text-base" dir="rtl">
                <li><Link to="/products" className={linkStyle}>מוצרים</Link></li>
                <li><Link to="/photo-development" className={linkStyle}>פיתוח תמונות</Link></li>
                <li><Link to="/tips" className={linkStyle}>בלוג</Link></li>
                <li>
                    <button onClick={() => setClubOpen(true)} className={`${linkStyle} bg-transparent border-none font-inherit cursor-pointer`}>
                        הצטרפות למועדון
                    </button>
                </li>
                <li>
                    <Link to="/My-Product-Catalog.pdf" download="Our-Catalog-2025.pdf" className={linkStyle}>
                        קטלוג
                        <FaDownload size={14} />
                    </Link>
                </li>
            </ul>

            {/* אזור האייקונים */}
            <div className="flex items-center gap-5">

                <button className="text-[#f2665e] hover:text-[#d95248] transition-colors p-2 rounded-full hover:bg-[#f2665e]/10">
                    <FaShoppingCart size={22} />
                </button>
                <div className="relative">
                    {isAuthenticated ? (
                        <>
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="w-7 h-7 rounded-full bg-[#f2665e] flex items-center justify-center text-white hover:bg-[#d95248] transition-all shadow-md"
                            >
                                <FaUser size={12} />
                            </button>
                            {isMenuOpen && (
                                <div className="absolute top-full left-0 mt-3 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 text-right" dir="rtl">
                                    <button onClick={logout} className="w-full px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-[#f2665e] flex items-center gap-2 transition-colors">
                                        <FaSignOutAlt /> התנתק
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <Link to="/login" className="w-7 h-7 rounded-full bg-[#f2665e] flex items-center justify-center text-white hover:bg-[#d95248] transition-all shadow-md">
                            <FaUser size={12} />
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}