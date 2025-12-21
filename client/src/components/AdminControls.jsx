import useAuthStore from '../store/authStore';
import { FaPen, FaTimes, FaSave, FaEye } from 'react-icons/fa';

const AdminControls = ({
    editMode,
    children,
    previewContent,
    adminControls,
    className = ""
}) => {
    const isAdmin = useAuthStore(state => state.isAdmin());
    const {
        setEditMode,
        saveChanges,
        cancelEdit,
        previewMode,
        setPreviewMode
    } = adminControls;
    if (!isAdmin) return children;

    if (editMode) {
        return (
            <div className="relative z-50 w-full my-4 animate-fade-in">
                <div className="bg-white border-b-2 border-[#f2665e] shadow-lg p-3 rounded-t-xl flex justify-between items-center px-4" dir="rtl">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-[#f2665e] flex items-center gap-2 text-sm">
                            <FaPen className="text-xs" /> עריכת רכיב
                        </span>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setPreviewMode(!previewMode)}
                            className="flex items-center gap-2 px-3 py-1 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 transition text-xs font-bold"
                        >
                            {previewMode ? (
                                <> <FaPen /> חזור לערוך </>
                            ) : (
                                <> <FaEye /> תצוגה מקדימה </>
                            )}
                        </button>

                        <button
                            onClick={saveChanges}
                            className="bg-[#f2665e] text-white px-4 py-1 rounded-full font-bold hover:bg-[#d95248] transition shadow-md flex items-center gap-2 text-xs"
                        >
                            <FaSave /> שמור
                        </button>

                        <button
                            onClick={cancelEdit}
                            className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full font-bold hover:bg-gray-300 transition flex items-center gap-1 text-xs"
                        >
                            <FaTimes /> ביטול
                        </button>
                    </div>
                </div>

                <div className={`bg-white border-2 border-[#f2665e] border-t-0 rounded-b-xl shadow-xl overflow-hidden p-4 relative ${previewMode ? 'p-0 border-0' : ''}`}>
                    {previewMode ? children : previewContent}
                </div>
            </div>
        );
    }

    return (
        <div className={`relative group w-full ${className}`}>
            <div className="absolute inset-0 border-2 border-dashed border-[#f2665e] opacity-0 group-hover:opacity-30 pointer-events-none rounded-lg transition-opacity z-10"></div>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setEditMode(true);
                }}
                className="absolute top-2 left-2 z-20 bg-white text-[#f2665e] border border-[#f2665e] px-3 py-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-90 group-hover:scale-100 hover:bg-[#f2665e] hover:text-white flex items-center gap-2 text-xs font-bold"
            >
                <FaPen /> ערוך אזור זה
            </button>
            {children}
        </div>
    );
};

export default AdminControls;