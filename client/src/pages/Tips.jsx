import { useEffect } from "react";
import axios from "axios";
import { getAllTips } from '../api/pages.js';
import AdminControls from "../components/AdminControls.jsx";
import { useAdminControl } from "../hooks/useAdminControl.jsx";
import { Link } from "react-router-dom";
import { useTipsStore } from "../store/tipsStore.js";

export default function Tips() {
    const isAdmin = localStorage.getItem("admin");
    const adminControls = useAdminControl({ title: "", img: "" }, "tips");
    const { draft, updateDraft, editMode, previewMode } = adminControls;
    const tipsList = useTipsStore((state) => state.tipsList);

    useEffect(() => {
        axios.get("http://localhost:4000/api/page/tips").then((res) => {
            adminControls.setPage(res.data);
            adminControls.setDraft(res.data);
        }).catch(error => console.error("Error fetching main tips page data:", error));

        getAllTips().then((response) => {
            console.log("Tips data:", response.data);
            useTipsStore.getState().setTipsList(response.data);
        }).catch((error) => {
            console.error("Error fetching tips list:", error);
        });
    }, []);

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

    return (
        <>
            <AdminControls
                isAdmin={isAdmin}
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
                )}
            </div>
        </>
    );
}