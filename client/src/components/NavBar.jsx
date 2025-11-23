import { Link } from 'react-router-dom';
import { FaDownload } from 'react-icons/fa';
import useAppStore from '../store/appStore';

export default function NavBar() {
    const setClubOpen = useAppStore(state => state.setClubOpen);

    return (
        <nav className="w-full bg-white shadow-sm" aria-label="תפריט ראשי">
            <ul dir="rtl" className="flex justify-start items-center gap-6 p-4">
                <li>
                    <Link to="/home" className="hover:underline">
                        מוצרים
                    </Link>
                </li>
                <li>
                    <Link to="/home" className="hover:underline">
                        פיתוח תמונות
                    </Link>
                </li>
                <li>
                    <Link
                        onClick={() => setClubOpen(true)}
                        className="hover:underline"
                    >
                        הצטרפות למועדון
                    </Link>
                </li>
                <li>
                    <Link to="/tips" className="hover:underline">
                        טיפים לצילום
                    </Link>
                </li>
                <li>
                    <Link
                        to="/My-Product-Catalog.pdf"
                        download="Our-Catalog-2025.pdf"
                        className="flex items-center gap-2 hover:underline"
                    >
                        קטלוג
                        <FaDownload />
                    </Link>
                </li>
            </ul>
        </nav>
    )
}