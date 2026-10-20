import { PAGE_SIZE, pageNumbers } from './ordersList';

/** "Showing x–y of n" and the page buttons */
export default function OrdersPagination({ page, totalPages, shownCount, totalCount, onPage }) {
    return (
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-gray-500">
            <span>
                מציג {shownCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
                –{(page - 1) * PAGE_SIZE + shownCount}
                {" "}מתוך {totalCount} הזמנות
            </span>
            <div className="flex gap-1 items-center">
                <button
                    type="button"
                    className="px-3 py-1 rounded bg-white border hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white"
                    disabled={page <= 1}
                    onClick={() => onPage(Math.max(1, page - 1))}
                >
                    &lt;
                </button>
                {pageNumbers(page, totalPages).map((number) => (
                    <button
                        key={number}
                        type="button"
                        onClick={() => onPage(number)}
                        className={`px-3 py-1 rounded border ${
                            number === page
                                ? "bg-[#f2665e] text-white shadow border-[#f2665e]"
                                : "bg-white hover:bg-gray-100"
                        }`}
                    >
                        {number}
                    </button>
                ))}
                <button
                    type="button"
                    className="px-3 py-1 rounded bg-white border hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white"
                    disabled={page >= totalPages}
                    onClick={() => onPage(Math.min(totalPages, page + 1))}
                >
                    &gt;
                </button>
            </div>
        </div>
    );
}
