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
        <nav
            className="w-full bg-white shadow-sm"
            aria-label="תפריט ראשי"
        >
            <ul
                dir="rtl"
                className="flex justify-start items-center gap-6 p-4"
            >
                <li>
                    <Link to="/products" className="hover:underline">
                        מוצרים
                    </Link>
                </li>
                <li>
                    <Link to="/photo-development" className="hover:underline">
                        פיתוח תמונות
                    </Link>
                    
                </li>
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