import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaDownload, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import useAppStore from '../store/appStore';
import useAuthStore from '../store/authStore';

export default function NavBar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const setClubOpen = useAppStore(state => state.setClubOpen);
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    const logout = useAuthStore(state => state.logout);
    const userRole = useAuthStore(state => state.role);

    const isAdmin = userRole === 'admin';

    return (
        <nav className="w-full bg-white shadow-sm relative z-40" aria-label="תפריט ראשי">
            <ul dir="rtl" className="flex justify-start items-center gap-6 p-4 text-gray-700 font-medium">
                {isAuthenticated ? (
                    <li className="relative">
                        <Link
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="flex items-center justify-center transition-transform hover:scale-105 focus:outline-none"
                            title="אזור אישי"
                        >
                            <FaUserCircle className="text-[#f2665e] text-4xl bg-white rounded-full shadow-sm cursor-pointer" />
                        </Link>
                        {isMenuOpen && (
                            <div
                                className="absolute top-full right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-fade-in"
                                dir="rtl"
                            >
                                <div className="absolute -top-2 right-5 w-4 h-4 bg-white transform rotate-45 border-l border-t border-gray-100"></div>

                                <div className="relative z-10">
                                    <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 text-right">
                                        <p className="text-xs text-gray-500 mb-1">שלום,</p>
                                        <p className="text-base font-bold text-gray-800">לקוח יקר</p>
                                    </div>

                                    <button
                                        onClick={logout}
                                        className="w-full text-right px-5 py-3 text-gray-600 hover:bg-red-50 hover:text-[#f2665e] transition-colors flex items-center gap-3 justify-start text-sm font-medium"
                                    >
                                        <FaSignOutAlt className="text-lg" />
                                        <span>התנתק מהמערכת</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </li>
                ) : (
                    <li>
                        <Link to="/login" className="text-red-500 hover:text-red-600 font-bold text-sm">
                            כניסה
                        </Link>
                    </li>
                )}
                {isAdmin && (
                    <li>
                        <Link to="/admindashboard" className="text-red-500 hover:text-red-600 font-bold text-sm">
                            ניהול
                        </Link>
                    </li>
                )}

                <li><Link to="/home" className="hover:text-[#f2665e] transition-colors">מוצרים</Link></li>
                <li><Link to="/home" className="hover:text-[#f2665e] transition-colors">פיתוח תמונות</Link></li>
                <li>
                    <Link
                        onClick={() => setClubOpen(true)}
                        className="hover:text-[#f2665e] transition-colors cursor-pointer bg-transparent border-none p-0 font-inherit"
                    >
                        הצטרפות למועדון
                    </Link>
                </li>
                <li><Link to="/tips" className="hover:text-[#f2665e] transition-colors">טיפים לצילום</Link></li>
                <li>
                    <Link to="/My-Product-Catalog.pdf" download="Our-Catalog-2025.pdf" className="flex items-center gap-2 hover:text-[#f2665e] transition-colors">
                        קטלוג <FaDownload size={12} />
                    </Link>
                </li>
            </ul>
        </nav>
    );
}