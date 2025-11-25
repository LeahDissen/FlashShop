import { Link } from "react-router-dom";
import { FaBoxOpen } from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";

export default function ProductsManagement() {
    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <FaBoxOpen className="text-[#f2665e]" />
                        ניהול מוצרים
                    </h1>
                    <p className="text-gray-500 mt-1">הוספה, עריכה ומחיקה של מוצרים בחנות</p>
                </div>
                <Link
                    to="/admindashboard"
                    className="text-[#f2665e] transition-all font-bold p-2 gap-2 rounded-lg hover:bg-[#f2665e]/10 hover:-translate-y-1 flex items-center no-underline">
                    <span>חזרה ללוח הבקרה</span>
                    <FiArrowLeft className="text-xl" />
                </Link>
            </div>
            <div className="max-w-7xl mx-auto bg-white p-10 rounded-2xl shadow-md text-center text-gray-500">
                <p>כאן יוצג ממשק ניהול המוצרים...</p>
            </div>
        </div>
    );
}