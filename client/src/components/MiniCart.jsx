import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { XIcon } from './icons'; 

export default function MiniCart({ onClose }) {
    const navigate = useNavigate();
    const cartItems = useCartStore((state) => state.cartItems);
    const removeFromCart = useCartStore((state) => state.removeFromCart);
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handleNavigation = (path) => {
        onClose();
        navigate(path);
    };

    return (
        <div 
            className="absolute top-full left-0 mt-4 w-80 bg-[#f8dcdb] rounded-3xl shadow-xl z-50 overflow-hidden border border-red-100 animate-fade-in text-right font-sans"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="p-4 text-center border-b border-white/50">
                <h3 className="text-gray-800 font-medium text-lg">
                    יש לי {totalItems} פריטים בסל
                </h3>
            </div>

            {/* Items List */}
            <div className="max-h-80 overflow-y-auto px-4 py-2 space-y-3 custom-scrollbar">
                {cartItems.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm py-6">העגלה ריקה</p>
                ) : (
                    cartItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 bg-white/40 p-2 rounded-xl transition-colors hover:bg-white/60">
                            {/* Image */}
                            <img 
                                src={item.image} 
                                alt={item.name} 
                                className="w-14 h-14 object-cover rounded-lg border border-white bg-gray-100"
                            />
                            
                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <h4 className="text-gray-800 font-bold text-sm truncate" title={item.name}>
                                    {item.name}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                                    <span>כמות: {item.quantity}</span>
                                    {item.size && <span>| {item.size}</span>}
                                </div>
                            </div>

                            {/* Price & Remove */}
                            <div className="flex flex-col items-end gap-1 pl-1">
                                <span className="font-bold text-[#f2665e] text-sm whitespace-nowrap">
                                    {item.price.toFixed(2)} ₪
                                </span>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}
                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                    title="הסר פריט"
                                >
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Total */}
            <div className="px-6 py-3 bg-[#f8dcdb] border-t border-white/50">
                <div className="flex justify-between items-center">
                    <span className="text-[#a83232] font-bold text-lg">סה"כ לתשלום:</span>
                    <span className="text-[#a83232] font-bold text-xl">{totalPrice.toFixed(2)} ₪</span>
                </div>
            </div>

            {/* Buttons */}
            <div className="p-4 flex gap-3 bg-[#f8dcdb]">
                <button
                    onClick={() => handleNavigation('/cart')}
                    className="flex-1 bg-[#f2665e] text-white font-bold py-2.5 rounded-full hover:bg-[#d95248] transition-colors shadow-sm text-sm"
                >
                    לתשלום
                </button>
                <button
                    onClick={() => handleNavigation('/cart')}
                    className="flex-1 bg-[#ffeae8] text-[#f2665e] font-bold py-2.5 rounded-full hover:bg-white transition-colors shadow-sm border border-[#f2665e]/20 text-sm"
                >
                    לעגלה
                </button>
            </div>
        </div>
    );
}