import { FaSearch, FaTrash } from 'react-icons/fa';
import { FILTER_TABS } from './ordersList';

/** Search, the status filter and – once orders are selected – deleting them */
export default function OrdersToolbar({ searchTerm, onSearch, filterStatus, onFilter, selectedCount, onDelete }) {
    return (
        <div className="max-w-7xl mx-auto bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-1/3">
                <FaSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="חיפוש לפי שם לקוח או מספר הזמנה..."
                    className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#f2665e] focus:border-transparent outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => onSearch(e.target.value)}
                />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar items-center">
                {FILTER_TABS.map(({ status, label }) => (
                    <button
                        key={status}
                        onClick={() => onFilter(status)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap
                            ${filterStatus === status
                                ? 'bg-[#f2665e] text-white shadow-md transform scale-105'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                    >
                        {label}
                    </button>
                ))}
                {selectedCount > 0 && (
                    <button
                        type="button"
                        onClick={onDelete}
                        className="px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-2"
                    >
                        <FaTrash size={12} />
                        מחיקת {selectedCount} שנבחרו
                    </button>
                )}
            </div>
        </div>
    );
}
