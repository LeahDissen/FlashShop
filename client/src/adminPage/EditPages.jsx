import { useNavigate, useLocation } from 'react-router-dom';
import { FaHome, FaLightbulb, FaScroll, FaGift, FaWindowMaximize, FaWindowMinimize, FaMagic, FaCamera, FaTags } from 'react-icons/fa';
import { FiArrowLeft } from "react-icons/fi";
import useAuthStore from '../store/authStore';
import useAppStore from '../store/appStore';

export default function EditPages() {
    const isAdmin = useAuthStore(state => state.isAdmin());
    const navigate = useNavigate();
    const location = useLocation();
    const { setClubOpen, setTermsOpen } = useAppStore();

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center text-2xl font-bold text-gray-600">
                אין לך הרשאה לצפות בדף זה.
            </div>
        );
    }

    const pagesToEdit = [
        {
            id: 1,
            title: "עריכת דף הבית",
            description: "שינוי הטקסטים, תמונת הרקע הראשית ומוצרים מקודמים בדף הכניסה.",
            icon: <FaHome className="text-3xl text-white" />,
            link: "/",
            targetEndpoint: "home",
            type: "page" // סוג רגיל
        },
        {
            id: 2,
            title: "עריכת כותרת (Header)",
            description: "עדכון הלוגו והתפריט העליון המופיעים בכל דפי האתר.",
            icon: <FaWindowMaximize className="text-3xl text-white" />,
            link: "/",
            targetEndpoint: "header",
            type: "page" // למרות שזה ברכיב, זה מוצג בדף הבית בדרך כלל
        },
        {
            id: 3,
            title: "עריכת פוטר (Footer)",
            description: "עדכון פרטי יצירת קשר, זכויות יוצרים וקישורים בתחתית האתר.",
            icon: <FaWindowMinimize className="text-3xl text-white" />,
            link: "/",
            targetEndpoint: "footer",
            type: "page"
        },
        {
            id: 4,
            title: "עריכת עמוד טיפים",
            description: "ניהול הכותרת והתמונה הראשית של עמוד הטיפים.",
            icon: <FaLightbulb className="text-3xl text-white" />,
            link: "/tips",
            targetEndpoint: "tips",
            type: "page"
        },
        {
            id: 5,
            title: "עריכת תקנון",
            description: "עדכון הטקסט המשפטי ותנאי השימוש באתר.",
            icon: <FaScroll className="text-3xl text-white" />,
            link: null,
            targetEndpoint: "terms",
            type: "popup"
        },
        {
            id: 6,
            title: "עריכת פופ-אפ מועדון",
            description: "שינוי הטקסט והעיצוב של חלונית ההצטרפות למועדון הלקוחות.",
            icon: <FaGift className="text-3xl text-white" />,
            link: null,
            targetEndpoint: "club",
            type: "popup"
        },
        {
            id: 7,
            title: "עריכת עמוד מוצרים",
            description: "עדכון כותרות, תמונת רקע ורשימת המוצרים (תמונות ושמות) בעמוד הבחירה.",
            icon: <FaTags className="text-3xl text-white" />,
            link: "/products",
            targetEndpoint: "products",
            type: "page"
        },
        {
            id: 8,
            title: "עריכת עמוד פיתוח תמונות",
            description: "עדכון כותרות ותמונת הרקע בעמוד העלאת התמונות.",
            icon: <FaCamera className="text-3xl text-white" />,
            link: "/photo-development",
            targetEndpoint: "photos",
            type: "type"
        },
    ];

    const handleEditClick = (page) => {
        const stateData = { autoEdit: true, targetEndpoint: page.targetEndpoint };

        if (page.type === 'popup') {
            if (page.targetEndpoint === 'club') {
                setClubOpen(true);
            } else if (page.targetEndpoint === 'terms') {
                setTermsOpen(true);
            }
            navigate(location.pathname, { state: stateData, replace: true });
        } else {
            navigate(page.link, { state: stateData });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            <div className="bg-white shadow-sm border-b border-gray-100 mb-10">
                <div className="container mx-auto px-6 py-10">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-[#f2665e] rounded-full shadow-lg shadow-red-200">
                                <FaMagic className="text-2xl text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold text-gray-800">ניהול דפים ותוכן</h1>
                                <p className="text-gray-500 mt-1 text-lg">בחרי איזה דף או רכיב ברצונך לערוך.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate("/admindashboard")}
                            className="text-[#f2665e] transition-all font-bold p-2 gap-2 rounded-lg hover:bg-[#f2665e]/10 hover:-translate-y-1 flex items-center no-underline cursor-pointer"
                        >
                            <span>חזרה ללוח הבקרה</span>
                            <FiArrowLeft className="text-xl" />
                        </button>
                    </div>
                </div>
            </div>
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {pagesToEdit.map((page) => (
                        <div
                            key={page.id}
                            onClick={() => handleEditClick(page)}
                            className="group relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 transform hover:-translate-y-2 flex flex-col cursor-pointer">
                            <div className="h-36 relative overflow-hidden bg-gradient-to-br from-[#f2665e] to-[#d95248] flex items-center justify-center">
                                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                        <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                                    </svg>
                                </div>
                                <div className="relative z-10 p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-inner group-hover:scale-110 transition-transform duration-300 border border-white/30">
                                    {page.icon}
                                </div>
                            </div>
                            <div className="p-8 flex-1 flex flex-col items-center text-center">
                                <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-[#f2665e] transition-colors">
                                    {page.title}
                                </h3>
                                <p className="text-gray-600 leading-relaxed text-sm">
                                    {page.description}
                                </p>
                                <div className="mt-auto pt-6 opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                    <span className="text-[#f2665e] font-bold text-sm flex items-center gap-2">
                                        עבור לעריכה &larr;
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}