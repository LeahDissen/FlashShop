import { useEffect } from 'react';
import PersonalizationSection from '../components/PersonalizationSection';
import { useProductStore } from '../store/productStore';
import AdminControls from '../components/AdminControls';
import { useAdminControl } from '../hooks/useAdminControl';
import { getPage } from '../api/pages';


const ProductsPage = ({ onNavigate }) => {
    const { selectedProduct, setSelectedProduct } = useProductStore();
    const adminControls = useAdminControl({
        title: "",
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

    const EditContent = (
        <div className="bg-white p-6 rounded-lg space-y-4 text-right" dir="rtl">
            <h3 className="font-bold text-lg border-b pb-2">עריכת כותרת עליונה (Hero)</h3>
            <div>
                <label className="block text-sm font-bold text-gray-700">כותרת עמוד ראשית:</label>
                <input type="text" value={draft.title} onChange={(e) => updateDraft({ title: e.target.value })} className="w-full border p-2 rounded" />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700">קישור לתמונת רקע עליונה:</label>
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
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700">טקסט כפתור:</label>
                    <input type="text" value={draft.buttonText} onChange={(e) => updateDraft({ buttonText: e.target.value })} className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700">הודעת שגיאה (כשלא נבחר מוצר):</label>
                    <input type="text" value={draft.msg} onChange={(e) => updateDraft({ msg: e.target.value })} className="w-full border p-2 rounded" />
                </div>
            </div>
        </div>
    );

    // תוכן התצוגה - משתמש ב-draft המעודכן
    const ViewContent = (
        <div className="min-h-screen bg-white">
            <div className="w-full relative">
                <div
                    className="relative h-[240px] sm:h-[320px] bg-cover bg-center flex items-center justify-center text-white"
                    // כאן השינוי המשמעותי - שימוש ב-draft.img
                    style={{ backgroundImage: `url(${draft.img})` }}
                >
                    <div className="absolute inset-0 bg-black/20"></div>

                    {/* שימוש ב-draft.title */}
                    <h1 className="relative z-10 text-5xl sm:text-6xl font-bold text-center drop-shadow-lg tracking-wide">
                        {draft.title}
                    </h1>

                    <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] rotate-180">
                        <svg
                            className="relative block w-[calc(100%+1.3px)] h-[50px] md:h-[70px]"
                            data-name="Layer 1"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 1200 120"
                            preserveAspectRatio="none"
                        >
                            <path
                                d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                                fill="#ffffff"
                            ></path>
                        </svg>
                    </div>
                </div>
            </div>

            <div className="pt-8 min-h-[60vh]">
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