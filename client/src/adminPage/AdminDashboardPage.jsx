import React from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaBoxOpen, FaComments, FaClipboardList, FaFilePdf, FaEdit, FaMagic } from 'react-icons/fa';
import useAuthStore from '../store/authStore';

export default function AdminDashboardPage() {
  const isAdmin = useAuthStore(state => state.isAdmin());

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center text-2xl font-bold text-gray-600">
        אין לך הרשאה לצפות בדף זה.
      </div>
    );
  }

  const dashboardOptions = [
    {
      id: 1,
      title: "שליחת מייל למועדון",
      description: "שליחת עדכונים, מבצעים וחדשות לכל חברי מועדון הלקוחות.",
      icon: <FaEnvelope className="text-3xl text-white" />,
      link: "/sendmail",
    },
    {
      id: 2,
      title: "ניהול מוצרים",
      description: "הוספה, עריכה ומחיקה של מוצרים בחנות, כולל עדכון מלאי ומחירים.",
      icon: <FaBoxOpen className="text-3xl text-white" />,
      link: "/productsmanagement",
    },
    {
      id: 3,
      title: "הודעות מהאתר",
      description: "צפייה בכל הפניות שנשלחו דרך טופס יצירת הקשר ב-Footer.",
      icon: <FaComments className="text-3xl text-white" />,
      link: "/viewmessages",
    },
    {
      id: 4,
      title: "ניהול הזמנות",
      description: "צפייה בכל ההזמנות באתר, סטטוס משלוח ופרטי לקוחות.",
      icon: <FaClipboardList className="text-3xl text-white" />,
      link: "/ordersmanagement",
    },
    {
      id: 5,
      title: "ניהול קטלוג",
      description: "החלפת קובץ הקטלוג (PDF) הניתן להורדה באתר.",
      icon: <FaFilePdf className="text-3xl text-white" />,
      link: "/updatecatalog",
    },
    {
      id: 6,
      title: "עריכת דפים",
      description: "מעבר מהיר לעריכת התוכן בדפי הבית, אודות, טיפים ועוד.",
      icon: <FaEdit className="text-3xl text-white" />,
      link: "/editpages",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-100 mb-10">
        <div className="container mx-auto px-6 py-10">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-[#f2665e] rounded-full shadow-lg shadow-red-200">
              <FaMagic className="text-2xl text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-800">לוח בקרה למנהלת</h1>
              <p className="text-gray-500 mt-1 text-lg">ברוכה הבאה! מכאן תוכלי לנהל את כל האתר בקלות.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {dashboardOptions.map((option) => (
            <Link 
              to={option.link} 
              key={option.id}
              className="group relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 transform hover:-translate-y-2 flex flex-col"
            >
              {/* Card Header with Brand Color Gradient */}
              <div className="h-36 relative overflow-hidden bg-gradient-to-br from-[#f2665e] to-[#d95248] flex items-center justify-center">
                
                {/* Abstract Background Shapes */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                   <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                   </svg>
                </div>
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-white opacity-10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                
                {/* Icon Container */}
                <div className="relative z-10 p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-inner group-hover:scale-110 transition-transform duration-300 border border-white/30">
                  {option.icon}
                </div>
              </div>

              {/* Card Content */}
              <div className="p-8 flex-1 flex flex-col items-center text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-[#f2665e] transition-colors">
                  {option.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {option.description}
                </p>
                
                {/* Fake button style at bottom */}
                <div className="mt-auto pt-6 opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    <span className="text-[#f2665e] font-bold text-sm flex items-center gap-2">
                        לחצי לכניסה &larr;
                    </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}