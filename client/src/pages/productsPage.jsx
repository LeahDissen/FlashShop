import { useEffect } from 'react';
import { getPage } from '../api/pages';
import AdminControls from '../components/AdminControls';
import PersonalizationSection from '../components/PersonalizationSection';
import { useAdminControl } from '../hooks/useAdminControl';
import { useProductStore } from '../store/productStore';

const ProductsPage = ({ onNavigate }) => {
    const { selectedProduct, setSelectedProduct } = useProductStore();
    const adminControls = useAdminControl({
        title: "המוצרים שלנו", // ברירת מחדל מהפיגמה
        img: "", 
        sectionTitle: "",
        sectionDescription: "",
        buttonText: "",
        msg: ""
    }, "products");
    const { draft, updateDraft, editMode } = adminControls;

    useEffect(() => {
        getPage("products").then((data) => {
            adminControls.setPage(data);
            adminControls.setDraft(data);
        });
    }, []);

    // אזור עריכת מנהל (Admin)
    const EditContent = (
        <div className="bg-white p-6 rounded-lg space-y-4 text-right" dir="rtl">
            <h3 className="font-bold text-lg border-b pb-2">עריכת כותרת עליונה (Hero)</h3>
            <div>
                <label className="block text-sm font-bold text-gray-700">כותרת עמוד ראשית:</label>
                <input type="text" value={draft.title} onChange={(e) => updateDraft({ title: e.target.value })} className="w-full border p-2 rounded" />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700">קישור לתמונת רקע עליונה (אופציונלי):</label>
                <input type="text" value={draft.img} onChange={(e) => updateDraft({ img: e.target.value })} className="w-full border p-2 rounded ltr" />
            </div>

            <h3 className="font-bold text-lg border-b pb-2 mt-6">עריכת אזור בחירת מוצרים</h3>
            <div>
                <label className="block text-sm font-bold text-gray-700">כותרת משנית:</label>
                <input type="text" value={draft.sectionTitle} onChange={(e) => updateDraft({ sectionTitle: e.target.value })} className="w-full border p-2 rounded" />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700">תיאור:</label>
                <textarea value={draft.sectionDescription} onChange={(e) => updateDraft({ sectionDescription: e.target.value })} className="w-full border p-2 rounded h-24" />
            </div>
        </div>
    );

    // תצוגת הגולש (View)
    const ViewContent = (
        <div className="min-h-screen bg-[#faf8f6] text-right" dir="rtl">
            
            {/* Hero Banner בגובה ובעיצוב המדויק מהפיגמה */}
            <div className="w-full relative">
                <div 
                    className="relative h-[280px] sm:h-[320px] flex items-center justify-center text-white"
                    style={{ 
                        backgroundColor: '#f8dcdb', // בדיוק כמו הוורוד בעמוד העגלה
                        backgroundImage: draft.img ? `url(${draft.img})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    {/* שכבת כהות עדינה מאוד רק אם קיימת תמונת רקע כדי שהטקסט הלבן ייקרא טוב */}
                    {draft.img && <div className="absolute inset-0 bg-black/10"></div>}
                    
                    {/* כותרת בעיצוב המדויק: גודל 50px, פונט Noto Sans Hebrew, משקל Bold */}
                    <h1 
                        className="relative z-10 text-[50px] font-bold text-center text-white tracking-wide drop-shadow-sm"
                        style={{ fontFamily: "'Noto Sans Hebrew', sans-serif" }}
                    >
                        {draft.title || "המוצרים שלנו"}
                    </h1>

                    {/* הגל הלבן שמתמזג עם הרקע החדש */}
                    <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] rotate-180">
                        <svg
                            className="relative block w-[calc(100%+1.3px)] h-[60px] md:h-[90px]"
                            data-name="Layer 1"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 1200 120"
                            preserveAspectRatio="none"
                        >
                            <path
                                d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                                fill="#faf8f6" // מתמזג לחלוטין עם רקע העמוד החדש
                            ></path>
                        </svg>
                    </div>
                </div>
            </div>

            {/* אזור גריד המוצרים והקטגוריות */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
                <PersonalizationSection
                    onNavigateToEditor={() => onNavigate('/editor')}
                    onSelectProduct={setSelectedProduct}
                    selectedProduct={selectedProduct}
                    content={draft}
                />
            </div>

        </div>
    );

    return (
        <AdminControls
            editMode={editMode}
            previewContent={EditContent}
            adminControls={adminControls}
        >
            {ViewContent}
        </AdminControls>
    );
};

export default ProductsPage;