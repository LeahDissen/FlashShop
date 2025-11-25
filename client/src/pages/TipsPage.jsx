import { useEffect, useState, useMemo } from "react";
import AdminControls from "../components/AdminControls.jsx";
import { useAdminControl } from "../hooks/useAdminControl.jsx";
import { Link } from "react-router-dom";
import { useTipsStore } from "../store/tipsStore.js";
import useAuthStore from "../store/authStore.js";
import { getPage } from '../api/pages';
import { getAllTips, createTip } from '../api/tips';

export default function TipsPage() {
    const TIPS_PER_PAGE = 9;
    const isAdmin = useAuthStore(state => state.isAdmin());
    const adminControls = useAdminControl({ title: "", img: "" }, "tips");
    const { currentTip, setCurrentTip, tipsList, setTipsList } = useTipsStore();
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

    useEffect(() => {
        getPage("tips").then((data) => {
            adminControls.setPage(data);
            adminControls.setDraft(data);
        }).catch(error => console.error("Error fetching main tips page data:", error));
    }, []);

    useEffect(() => {
        getAllTips(currentPage, TIPS_PER_PAGE).then((data) => {
            const { tips, totalCount } = data;
            useTipsStore.getState().setTipsList(tips);
            setTotalTipsCount(totalCount);
        }).catch((error) => {
            console.error("Error fetching tips list:", error);
            useTipsStore.getState().setTipsList([]);
        });
    }, [currentPage]);

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
            useTipsStore.getState().setTipsList([...tipsList, addTip]);
            setCurrentTip({});
            setEditModeTip(false);
            setCurrentPage(1);
            setTotalTipsCount(prevCount => prevCount + 1);

        } catch (error) {
            alert(error.message);
        }
    };
    const totalPages = Math.ceil(totalTipsCount / TIPS_PER_PAGE);

    // const currentTips = useMemo(() => {
    //     const startIndex = (currentPage - 1) * TIPS_PER_PAGE;
    //     const endIndex = startIndex + TIPS_PER_PAGE;
    //     return tipsList.slice(startIndex, endIndex);
    // }, [tipsList, currentPage]);

    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
            // אפשר להוסיף כאן גלילה אוטומטית למעלה: window.scrollTo(0, 0);
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
        </div>
    );

    const ViewContent = (
        <div className="w-full">
            <div
                className="relative h-[300px] sm:h-[400px] bg-cover bg-center flex items-end justify-center text-white p-6"
                style={{ backgroundImage: `url(${draft.img})` }}
            >
                <div className="absolute inset-0 bg-black opacity-40"></div>
                <h1 className="relative z-10 text-4xl sm:text-5xl font-bold text-center drop-shadow-lg">
                    {draft.title}
                </h1>
            </div>
        </div>
    );

    const PaginationControls = () => {
        if (totalPages <= 1) return null;
        const pageNumbers = [...Array(totalPages).keys()].map(i => i + 1);

        return (
            <div className="flex justify-center items-center mt-8 space-x-2 rtl:space-x-reverse">
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
                            ? "!bg-pink-500 text-white shadow-md"
                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
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
            <div className="container mx-auto px-4 py-12">
                {tipsList.length === 0 ? (
                    <p className="text-center text-xl text-gray-600">טוען טיפים...</p>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {tipsList.map(tip => (
                                <div
                                    key={tip._id}
                                    className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                                >
                                    <img
                                        src={tip.img}
                                        alt={tip.title}
                                        className="w-full h-48 object-cover"
                                    />
                                    <div className="p-6 text-right">
                                        <h4 className="text-2xl font-bold mb-3 text-gray-800">
                                            {tip.title}
                                        </h4>
                                        <p className="text-gray-600 text-base mb-4 leading-relaxed">
                                            {tip.summary}
                                        </p>
                                        <Link
                                            to={`/tips/tip_page`}
                                            onClick={() => useTipsStore.getState().setCurrentTip(tip)}
                                            className="inline-block px-6 py-2 bg-pink-500 text-white font-semibold rounded-full hover:bg-pink-600 transition-colors duration-300"
                                        >
                                            קרא עוד
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <PaginationControls />
                    </>
                )}
            </div>

            {editModeTip && isAdmin && (
                <div className="container mx-auto px-4 py-12 bg-gray-50 rounded-lg shadow-inner mt-4">
                    <h2 className="text-3xl font-bold mb-6 text-right text-gray-800 border-b pb-2">➕ הוספת טיפ חדש</h2>
                    <input
                        type="text"
                        onChange={(e) => setTipDraft({ ...tipDraft, title: e.target.value })}
                        className="text-4xl md:text-5xl font-extrabold text-gray-900 w-full bg-transparent border-b-2 border-pink-500 focus:outline-none placeholder-gray-500 drop-shadow-lg mb-4 text-right p-2"
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
                        className="text-xl font-semibold text-gray-700 whitespace-pre-wrap w-full border-b-2 border-pink-500 focus:outline-none h-24 mb-6 text-right p-2"
                        placeholder="סיכום / פתיח הטיפ"
                    />
                    <textarea
                        onChange={(e) => setTipDraft({ ...tipDraft, content: e.target.value })}
                        className="text-lg leading-relaxed text-gray-700 whitespace-pre-wrap w-full border-2 border-pink-500 rounded-lg p-4 focus:outline-none h-96 text-right"
                        placeholder="תוכן הטיפ המלא"
                    />
                </div>
            )}

            {isAdmin && (
                <div className="mt-12 flex justify-center space-x-2">
                    {editModeTip ? (
                        <>
                            <button onClick={handleSave} className="!bg-blue-600 !text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition shadow-xl font-bold text-lg">💾 שמור טיפ חדש</button>
                            <button onClick={() => setEditModeTip(false)} className="!bg-red-500 !text-white px-6 py-3 rounded-xl hover:bg-red-600 transition shadow-xl font-bold text-lg">❌ בטל הוספה</button>
                        </>
                    ) : (
                        <button onClick={enterEditMode} className="!bg-green-600 !text-white px-6 py-3 rounded-xl hover:bg-green-700 transition shadow-xl font-bold text-lg">➕ הוסף טיפ</button>
                    )}
                </div>
            )}
        </>
    );
}