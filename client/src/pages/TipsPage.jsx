import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getPage } from '../api/pages';
import { getAllTips, createTip } from '../api/tips';
import AdminControls from "../components/AdminControls.jsx";
import { useAdminControl } from "../hooks/useAdminControl.jsx";
import useAuthStore from "../store/authStore.js";
import { useTipsStore } from "../store/tipsStore.js";

export default function TipsPage() {
    const isAdmin = useAuthStore(state => state.isAdmin());
    const adminControls = useAdminControl({
        title: "",
        img: "",
        tipsPerPage: 6
    }, "tips");
    const { setCurrentTip, tipsList } = useTipsStore();
    const { draft, updateDraft, editMode } = adminControls;
    const [editModeTip, setEditModeTip] = useState(false);
    const [tipDraft, setTipDraft] = useState({
        title: "",
        img: "",
        summary: "",
        content: ""
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalTipsCount, setTotalTipsCount] = useState(0);
    const limit = (draft?.tipsPerPage && !isNaN(parseInt(draft.tipsPerPage)))
        ? parseInt(draft.tipsPerPage)
        : 6;

    useEffect(() => {
        getPage("tips").then((data) => {
            adminControls.setPage(data);
            adminControls.setDraft(data);
        }).catch(error => console.error("Error fetching main tips page data:", error));
    }, []);

    useEffect(() => {
        getAllTips(currentPage, limit).then((data) => {
            const { tips, totalCount } = data;
            useTipsStore.getState().setTipsList(tips);
            setTotalTipsCount(totalCount);
        }).catch((error) => {
            console.error("Error fetching tips list:", error);
            useTipsStore.getState().setTipsList([]);
        });
    }, [currentPage, limit]);

    const enterEditMode = () => {
        if (!isAdmin) {
            console.warn("Attempt to enter edit mode without admin privileges.");
            return;
        }
        setTipDraft({ title: "", img: "", summary: "", content: "" });
        setEditModeTip(true);
    };

    const handleSave = async () => {
        if (!isAdmin || !tipDraft) return;

        try {
            const addTip = await createTip(tipDraft);
            useTipsStore.getState().setTipsList([addTip, ...tipsList]);
            setCurrentTip({});
            setEditModeTip(false);
            setCurrentPage(1);
            setTotalTipsCount(prevCount => prevCount + 1);

        } catch (error) {
            alert(error.message);
        }
    };
    const totalPages = limit > 0 ? Math.ceil(totalTipsCount / limit) : 0;

    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const EditContent = (
        <div className="p-8 bg-white">
            <input
                className="w-full h-64 p-4 border border-gray-300 rounded mb-4"
                value={draft.title}
                onChange={(e) => updateDraft({ title: e.target.value })}
                placeholder="כותרת ראשית לעמוד הטיפים"
            />
            <label className="block mb-2 font-semibold">🔗 Main Image URL:</label>
            <input
                className="w-full p-2 border border-gray-300 rounded"
                type="text"
                value={draft.img}
                onChange={(e) => updateDraft({ img: e.target.value })}
                placeholder="הזן כתובת URL לתמונת הרקע העליונה"
            />
            <label className="block mb-2 font-semibold">מספר טיפים בעמוד:</label>
            <input
                className="w-full p-2 border border-gray-300 rounded"
                type="text"
                value={draft.tipsPerPage}
                onChange={(e) => updateDraft({ tipsPerPage: e.target.value })}
                placeholder="הזן מספר טיפים בעמוד"
            />
        </div>
    );

    const ViewContent = (
        <div className="w-full relative">
            <div
                className="relative h-[240px] sm:h-[320px] bg-cover bg-center flex items-center justify-center text-white"
                style={{ backgroundImage: `url(${draft.img})` }}
            >
                <div className="absolute inset-0 bg-black/20"></div>

                <h1 className="relative z-10 text-5xl sm:text-6xl font-bold text-center drop-shadow-lg tracking-wide">
                    {draft.title}
                </h1>
                <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] rotate-180">
                    <svg className="relative block w-[calc(100%+1.3px)] h-[50px] md:h-[70px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                        <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#f9fafb"></path>
                    </svg>
                </div>
            </div>
        </div>
    );

    const PaginationControls = () => {
        if (!totalPages || totalPages <= 1) return null;
        const pageNumbers = [...Array(totalPages).keys()].map(i => i + 1);

        return (
            <div className="flex justify-center items-center mt-12 gap-4 rtl:space-x-reverse">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="עמוד קודם"
                >
                    &larr; קודם
                </button>

                {pageNumbers.map(number => (
                    <button
                        key={number}
                        onClick={() => handlePageChange(number)}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${number === currentPage
                            ? "!bg-[#f2665e] text-white shadow-md border border-[#f2665e]"
                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                            }`}
                        aria-current={number === currentPage ? "page" : undefined}
                    >
                        {number}
                    </button>
                ))}
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="עמוד הבא"
                >
                    הבא &rarr;
                </button>
            </div>
        );
    };


    return (
        <>
            <AdminControls
                editMode={editMode}
                previewContent={EditContent}
                adminControls={adminControls}
            >
                {ViewContent}
            </AdminControls>

            <div className="container mx-auto px-6 py-16">
                {tipsList.length === 0 ? (
                    <p className="text-center text-xl text-gray-600">טוען טיפים...</p>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {tipsList.map(tip => (
                                <Link
                                    to={`/tips/tip_page`}
                                    key={tip._id}
                                    onClick={() => useTipsStore.getState().setCurrentTip(tip)}
                                    className="group flex flex-col bg-[#f2665e] rounded-2xl shadow-md hover:shadow-xl overflow-hidden transform transition-all duration-300 hover:-translate-y-2 border border-gray-100"
                                >
                                    <div className="h-56 overflow-hidden relative">
                                        <img
                                            src={tip.img}
                                            alt={tip.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                                    </div>

                                    <div className="p-6 text-right flex flex-col flex-grow">
                                        <h4 className="text-xl font-bold mb-3 text-white transition-colors">
                                            {tip.title}
                                        </h4>
                                        <p className="text-gray-900 text-sm mb-4 leading-relaxed line-clamp-3 flex-grow font-medium">
                                            {tip.summary}
                                        </p>
                                        <div className="mt-auto pt-4 border-t border-white/20">
                                            <span className="text-white font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                                                קרא עוד
                                                <span className="text-lg leading-none transform translate-y-[1px]">&larr;</span>
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        <PaginationControls />
                    </>
                )}
            </div>

            {editModeTip && isAdmin && (
                <div className="container mx-auto px-4 py-12 bg-gray-50 rounded-lg shadow-inner mt-4 border border-gray-200">
                    <h2 className="text-3xl font-bold mb-6 text-right text-gray-800 border-b pb-2">הוספת טיפ חדש</h2>
                    <input
                        type="text"
                        onChange={(e) => setTipDraft({ ...tipDraft, title: e.target.value })}
                        className="text-3xl font-bold text-gray-900 w-full bg-transparent border-b-2 border-[#f2665e] focus:outline-none placeholder-gray-400 mb-4 text-right p-2"
                        placeholder="כותרת הטיפ"
                    />
                    <input
                        type="text"
                        onChange={(e) => setTipDraft({ ...tipDraft, img: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded mb-4 text-right"
                        placeholder="הזן כתובת URL לתמונת הטיפ"
                    />
                    <textarea
                        onChange={(e) => setTipDraft({ ...tipDraft, summary: e.target.value })}
                        className="text-lg text-gray-700 whitespace-pre-wrap w-full border border-gray-300 rounded focus:border-[#f2665e] focus:outline-none h-24 mb-6 text-right p-2"
                        placeholder="סיכום / פתיח הטיפ"
                    />
                    <textarea
                        onChange={(e) => setTipDraft({ ...tipDraft, content: e.target.value })}
                        className="text-base leading-relaxed text-gray-700 whitespace-pre-wrap w-full border border-gray-300 rounded p-4 focus:border-[#f2665e] focus:outline-none h-64 text-right"
                        placeholder="תוכן הטיפ המלא"
                    />
                </div>
            )}

            {isAdmin && (
                <div className="mt-12 flex justify-center space-x-2 pb-12">
                    {editModeTip ? (
                        <div className="flex gap-4 justify-center mt-8 rtl:space-x-reverse">
                        <button
                            onClick={handleSave}
                            className="bg-[#f2665e] text-white px-8 py-2 rounded-full font-bold hover:bg-[#d95248] transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1"
                        >
                            שמור
                        </button>
                        <button
                            onClick={() => setEditModeTip(false)}
                            className="bg-gray-200 text-gray-700 px-8 py-2 rounded-full font-bold hover:bg-gray-300 transition-all"
                        >
                            בטל
                        </button>
                    </div>
                    ) : (
                        <button onClick={enterEditMode} className="bg-[#f2665e] text-white px-8 py-3 rounded-full hover:bg-[#d95248] transition shadow-lg font-bold transform hover:-translate-y-1"> הוסף טיפ</button>
                    )}
                </div>
            )}
        </>
    );
}