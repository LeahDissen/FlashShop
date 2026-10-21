/** A tab of the editor's tools: a tall button on desktop, a compact one in the phone's bottom bar */
const SidebarTab = ({ icon, label, isActive, onClick, compact = false }) => {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center text-xs font-medium transition-colors rounded-md ${
                compact
                    ? `flex-1 min-w-0 py-2 px-1 gap-0.5 ${isActive ? 'bg-red-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`
                    : `w-full p-3 h-20 ${isActive ? 'bg-red-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`
            }`}
            aria-pressed={isActive}
        >
            {icon}
            <span className={compact ? 'text-[10px] sm:text-xs truncate max-w-full' : 'mt-1'}>{label}</span>
        </button>
    );
};

export default SidebarTab;
