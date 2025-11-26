import { useEffect, useState } from "react";
import axios from "axios";
import { useTipsStore } from "../store/tipsStore.js";
import { getAllTips } from '../api/pages.js';

const saveTipChanges = async (tipId, updatedData) => {
    try {
        const response = await axios.put(`http://localhost:5000/tips/${tipId}`, updatedData);
        return response.data;

    } catch (error) {
        console.error("Error saving tip changes:", error);
        throw new Error("שמירת השינויים נכשלה. (ייתכן שאינך מורשה)");
    }
};

export default function Blog() {
    const [isAdmin, setIsAdmin] = useState(false);

    const { currentTip, setCurrentTip, tipsList, setTipsList, updateTipInList } = useTipsStore();
    const [editMode, setEditMode] = useState(false);
    const [draft, setDraft] = useState({});

    useEffect(() => {
        const adminStatus = localStorage.getItem("admin") === "true";
        setIsAdmin(adminStatus);
        const handleStorageChange = () => {
            setIsAdmin(localStorage.getItem("admin") === "true");
        };
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    useEffect(() => {
        if (!tipsList || tipsList.length === 0) {
            getAllTips().then((response) => {
                console.log("Tips data:", response.data);
                useTipsStore.getState().setTipsList(response.data);
            }).catch((error) => {
                console.error("Error fetching tips list:", error);
            });
        } else {
            if (!currentTip && tipsList.length > 0) {
                setCurrentTip(tipsList[0]);
            }
        }
    }, [currentTip, tipsList, setCurrentTip]);
    useEffect(() => {
        if (currentTip && !editMode) {
            setDraft({
                title: currentTip.title,
                img: currentTip.img,
                content: currentTip.content,
                summary: currentTip.summary || ""
            });
        }
    }, [currentTip, editMode]);

    const index = currentTip ? tipsList.findIndex(t => t._id === currentTip._id) : -1;
    const prevTip = index > 0 ? tipsList[index - 1] : null;
    const nextTip = (index >= 0 && index < tipsList.length - 1) ? tipsList[index + 1] : null;

    const enterEditMode = () => {
        if (!isAdmin) {
            console.warn("Attempt to enter edit mode without admin privileges.");
            return;
        }

        if (!currentTip) return;
        setDraft({
            title: currentTip.title,
            img: currentTip.img,
            content: currentTip.content,
            summary: currentTip.summary || ""
        });
        setEditMode(true);
    };

    const handleSave = async () => {
        if (!isAdmin || !currentTip) return;

        try {
            const updatedTip = await saveTipChanges(currentTip._id, draft);
            setCurrentTip(updatedTip);
            if (updateTipInList) updateTipInList(updatedTip);
            setEditMode(false);
        } catch (error) {
            alert(error.message);
        }
    };

    const goToPrev = () => {
        if (!prevTip) return;
        setCurrentTip(prevTip);
    };

    const goToNext = () => {
        if (!nextTip) return;
        setCurrentTip(nextTip);
    };

    if (!currentTip) return <p className="text-center p-12">טוען נתונים...</p>;

    const displayData = editMode ? draft : currentTip;

    return (
        <div className="container mx-auto px-4 py-12 min-h-screen">
            {/* 1. אזור הכותרת והתמונה הראשית (באנר) */}
            <div className="relative mb-12">
                <img
                    src={displayData.img}
                    alt={displayData.title}
                    className="w-full h-[400px] object-cover shadow-xl"
                />

                {/* הכותרת על התמונה */}
                <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-3/4 max-w-4xl">
                    <div className="p-4 md:p-6 text-center">
                        {editMode && isAdmin ? (
                            <input
                                type="text"
                                value={draft.title}
                                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                                className="text-4xl md:text-5xl font-extrabold text-white w-full bg-transparent border-b-2 border-white focus:outline-none placeholder-white drop-shadow-lg"
                                placeholder="כותרת הטיפ"
                            />
                        ) : (
                            <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg">
                                {displayData.title}
                            </h1>
                        )}
                    </div>
                </div>

            </div>
            {/* 2. אזור התוכן */}
            <div className="mb-8 text-right max-w-5xl mx-auto">
                {editMode && isAdmin ? (
                    <textarea
                        value={draft.summary}
                        onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
                        className="text-xl font-semibold text-gray-700 whitespace-pre-wrap w-full border-b-2 border-blue-500 focus:outline-none h-24 mb-6"
                        placeholder="סיכום/פתיח הטיפ"
                    />
                ) : (
                    <p className="text-xl font-semibold text-gray-700 whitespace-pre-wrap mb-6 leading-relaxed">
                        {displayData.summary}
                    </p>
                )}
                {editMode && isAdmin ? (
                    <textarea
                        value={draft.content}
                        onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                        className="text-lg leading-relaxed text-gray-700 whitespace-pre-wrap w-full border-2 border-blue-500 rounded-lg p-4 focus:outline-none h-96"
                        placeholder="תוכן הטיפ המלא"
                    />
                ) : (
                    <p className="text-lg leading-relaxed text-gray-700 whitespace-pre-wrap indent-8">
                        {displayData.content}
                    </p>
                )}
            </div>
            {isAdmin && (
                <div className="mt-12 flex justify-center space-x-2">
                    {editMode ? (
                        <>
                            <button onClick={handleSave} className="!bg-blue-600 !text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition shadow-xl font-bold text-lg">💾 שמור שינויים</button>
                            <button onClick={() => setEditMode(false)} className="!bg-red-500 !text-white px-6 py-3 rounded-xl hover:bg-red-600 transition shadow-xl font-bold text-lg">❌ בטל</button>
                        </>
                    ) : (
                        <button onClick={enterEditMode} className="!bg-green-600 !text-white px-6 py-3 rounded-xl hover:bg-green-700 transition shadow-xl font-bold text-lg">✏️ ערוך טיפ</button>
                    )}
                </div>
            )}

            {/* 3. פוסט קודם/הבא - תוקן JSX ומיקום תמונה */}
            <div className="w-full flex justify-between gap-6 mt-16 border-t pt-8 border-gray-200 max-w-5xl mx-auto">
                {prevTip && (
                    <div onClick={goToPrev} className="flex items-center w-full max-w-sm cursor-pointer bg-white rounded-xl shadow-md hover:shadow-lg transition p-3 text-right border border-gray-100">

                        {/* 1. התמונה ראשונה ב-JSX = תופיע בימין (ב-RTL) */}
                        <img src={prevTip.img} alt={prevTip.title} className="w-24 h-20 object-cover rounded-md flex-shrink-0" />

                        {/* 2. הטקסט שני ב-JSX = יופיע בשמאל */}
                        <div className="mr-4">
                            <span className="text-xs text-blue-500 font-bold mb-1 block">➡️ טיפ קודם</span>
                            <h4 className="text-lg font-bold text-gray-800 line-clamp-2">{prevTip.title}</h4>
                            <p className="text-xs text-gray-700 font-semibold mt-1 line-clamp-1">{prevTip.summary}</p>
                        </div>
                    </div> // סגירת תגית DIV
                )}

                {/* כדי לוודא ששני הכרטיסים לא מחוברים אחד לשני כששניהם קיימים */}
                {(!prevTip && nextTip) && <div className="w-1/2 max-w-sm"></div>}

                {nextTip && (
                    <div onClick={goToNext} className="flex items-center w-full max-w-sm cursor-pointer bg-white rounded-xl shadow-md hover:shadow-lg transition p-3 text-right border border-gray-100">

                        {/* התמונה בחוץ (שמאל) */}
                        <img src={nextTip.img} alt={nextTip.title} className="w-24 h-20 object-cover rounded-md flex-shrink-0" />

                        {/* הטקסט בפנים (ימין) */}
                        <div className="mr-4">
                            <span className="text-xs text-blue-500 font-bold mb-1 block">⬅️ טיפ הבא</span>
                            <h4 className="text-lg font-bold text-gray-800 line-clamp-2">{nextTip.title}</h4>
                            <p className="text-xs text-gray-700 font-semibold mt-1 line-clamp-1">{nextTip.summary}</p>
                        </div>
                    </div> // סגירת תגית DIV
                )}

                {/* כדי לוודא ששני הכרטיסים לא מחוברים אחד לשני כששניהם קיימים */}
                {(prevTip && !nextTip) && <div className="w-1/2 max-w-sm"></div>}
            </div>
        </div>
    );
}