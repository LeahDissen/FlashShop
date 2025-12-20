import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingCart, FaUser, FaDownload, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import useAppStore from '../store/appStore';
import useAuthStore from '../store/authStore';
import { useCartStore } from '../store/cartStore'; 
import MiniCart from './MiniCart'; 

export default function NavBar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false); 
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    const setClubOpen = useAppStore(state => state.setClubOpen);
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    const logout = useAuthStore(state => state.logout);
    const isAdmin = useAuthStore(state => state.isAdmin());
    const cartItems = useCartStore(state => state.cartItems);
    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const cartRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (cartRef.current && !cartRef.current.contains(event.target)) {
                setIsCartOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const linkStyle = "text-[#f2665e] font-bold px-4 py-2 rounded-full hover:bg-[#f2665e]/10 transition-all duration-200 flex items-center gap-2 whitespace-nowrap";
    const mobileLinkStyle = "text-[#f2665e] font-bold px-6 py-3 hover:bg-[#f2665e]/10 transition-all duration-200 flex items-center gap-2 w-full border-b border-gray-50";

    const NavLinks = ({ style, onClick }) => (
        <>
            {isAdmin &&
                <li>
                    <Link to="/admindashboard" className={style} onClick={onClick}>
                        ניהול מערכת
                    </Link>
                </li>
            }
            <li><Link to="/products" className={style} onClick={onClick}>מוצרים</Link></li>
            <li><Link to="/photo-development" className={style} onClick={onClick}>פיתוח תמונות</Link></li>
            <li><Link to="/tips" className={style} onClick={onClick}>בלוג</Link></li>
            <li>
                <button onClick={() => { setClubOpen(true); if(onClick) onClick(); }} className={`${style} bg-transparent border-none font-inherit cursor-pointer w-full text-right`}>
                    הצטרפות למועדון
                </button>
            </li>
            <li>
                <Link to="/My-Product-Catalog.pdf" download="Our-Catalog-2025.pdf" className={style} onClick={onClick}>
                    קטלוג
                    <FaDownload size={14} />
                </Link>
            </li>
        </>
    );

    return (
        <nav className="w-full h-full flex items-center justify-between pl-4 relative" aria-label="תפריט ראשי">

            {/* Hamburger Button (Mobile Only) */}
            <div className="md:hidden pr-4">
                <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="text-[#f2665e] p-2 hover:bg-[#f2665e]/10 rounded-full transition-colors"
                >
                    {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                </button>
            </div>

            {/* Desktop Links (Hidden on Mobile) */}
            <ul className="hidden md:flex items-center gap-1 text-base" dir="rtl">
                <NavLinks style={linkStyle} />
            </ul>

            {/* Icons Section */}
            <div className="flex items-center gap-3 sm:gap-5">
                {/* Cart Icon Section */}
                <div className="relative" ref={cartRef}>
                    <button 
                        onClick={() => setIsCartOpen(!isCartOpen)}
                        className="text-[#f2665e] hover:text-[#d95248] transition-colors p-2 rounded-full hover:bg-[#f2665e]/10 relative"
                    >
                        <FaShoppingCart size={22} />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-[#f2665e] text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                                {cartCount}
                            </span>
                        )}
                    </button>

                    {isCartOpen && (
                        <MiniCart onClose={() => setIsCartOpen(false)} />
                    )}
                </div>

                {/* User Menu Section */}
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
                                   <Link 
                                        to="/profile" 
                                        className="w-full px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-[#f2665e] flex items-center gap-2 transition-colors border-b border-gray-50"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <FaUser size={14} /> הפרופיל שלי
                                    </Link>
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

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="absolute top-full right-0 w-full bg-white shadow-xl z-40 border-t border-gray-100 md:hidden flex flex-col py-2">
                    <ul className="flex flex-col w-full" dir="rtl">
                        <NavLinks 
                            style={mobileLinkStyle} 
                            onClick={() => setIsMobileMenuOpen(false)} 
                        />
                    </ul>
                </div>
            )}
        </nav>
    );
}