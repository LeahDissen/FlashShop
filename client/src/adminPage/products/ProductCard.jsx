import { FaEdit, FaLink, FaTrash } from 'react-icons/fa';
import SalePrice from '../../components/SalePrice';
import { DISPLAY_TYPES } from '../../constants/productCategories';

const showsPrintSize = (product) => (product.printWidth || product.printHeight)
    && product.displayType !== DISPLAY_TYPES.SIMPLE
    && product.displayType !== DISPLAY_TYPES.MAGNET;

/** A product in the admin's list: its details and copy-link / edit / delete */
export default function ProductCard({ product, isBeingEdited, onCopyLink, onEdit, onDelete }) {
    return (
        <div className={`bg-white p-4 rounded-xl shadow-sm border transition-all ${isBeingEdited ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-100'}`}>
            <div className="flex gap-4">
                <img src={product.image} alt={product.name} className="w-24 h-24 object-cover rounded-lg bg-gray-100" />
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        <h3 className="font-bold text-gray-800">{product.name}</h3>
                        <p className="text-xs text-gray-500 bg-gray-100 inline-block px-2 py-1 rounded mt-1">{product.category}</p>
                        {product.size && (
                            <p className="text-xs text-[#f2665e] mt-1">גודל: {product.size}</p>
                        )}
                        {showsPrintSize(product) && (
                            <p className="text-xs text-[#f2665e] mt-1">
                                הדפסה: {product.printWidth ?? 12}×{product.printHeight ?? 18} ס&quot;מ
                            </p>
                        )}
                    </div>
                    <div className="mt-2 flex justify-between items-end">
                        <div>
                            <SalePrice product={product} priceClassName="font-bold text-[#f2665e]" />
                            {product.isOnSale && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f2665e] text-white">מבצע</span>
                            )}
                            {product.priceTiers?.length > 0 && (
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                    + {product.priceTiers.length} מדרגות מחיר
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onCopyLink(product._id)}
                                className="text-gray-500 hover:text-gray-700 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                                title="העתק קישור ישיר"
                            >
                                <FaLink />
                            </button>
                            <button
                                onClick={() => onEdit(product)}
                                className="text-blue-500 hover:text-blue-700 p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                                title="ערוך"
                            >
                                <FaEdit />
                            </button>
                            <button
                                onClick={() => onDelete(product._id)}
                                className="text-red-400 hover:text-red-600 p-2 bg-red-50 rounded-lg hover:bg-red-100 transition"
                                title="מחק"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
