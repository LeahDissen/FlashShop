import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { checkCouponRequest } from "../api/club";
import { getPage } from "../api/pages";
import { getProducts } from "../api/products";
import { saveCheckoutDraft } from "../utils/checkoutDraft";
import AdminControls from "../components/AdminControls";
import CartItem from "../components/CartItem";
import RecommendedProduct from "../components/RecommendedProduct";
import { useAdminControl } from "../hooks/useAdminControl";
import useAuthStore from "../store/authStore";
import { useCartStore } from "../store/cartStore";

const DEFAULT_CART_HERO_IMG = "https://images.unsplash.com/photo-1515488042361-ee00e616997e?w=1600&q=80";
const DEFAULT_RECOMMENDED_TITLE = "אולי תאהבו גם את אלה...";

/** כותרות ישנות/שגויות ב-Redis — מוחלפות בברירת המחדל */
const LEGACY_RECOMMENDED_TITLES = new Set([
  "מוצרים מומלצים",
  "מיצרים מומלצים",
  "מומלצים",
]);

function normalizeRecommendedTitle(value) {
  const trimmed = value?.trim();
  if (!trimmed || LEGACY_RECOMMENDED_TITLES.has(trimmed)) {
    return DEFAULT_RECOMMENDED_TITLE;
  }
  return trimmed;
}

export default function ShoppingCartPage() {
  const cartItems = useCartStore((state) => state.cartItems);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const updateItemQuantity = useCartStore((state) => state.updateItemQuantity);
  const addToCart = useCartStore((state) => state.addToCart);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [recommendedProducts, setRecommendedProducts] = useState([]);

  const adminControls = useAdminControl({
    img: DEFAULT_CART_HERO_IMG,
    title: "עגלת קניות",
    emptyCartText: "העגלה שלך ריקה",
    recommendedTitle: DEFAULT_RECOMMENDED_TITLE,
    payBtn: "רוצה לשלם",
    codePlaceholder: "הזן קוד קופון",
    codeBtn: "החל",
  }, "cart");
  const { draft, updateDraft, editMode } = adminControls;

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalPrice = Math.max(0, subtotal - discount);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleRemoveItem = (itemId) => removeFromCart(itemId);
  const handleQuantityChange = (itemId, delta) => updateItemQuantity(itemId, delta);

  const handleAddRecommended = (product) => {
    const mongoId = product._id || product.id;
    if (!mongoId) return;
    addToCart([
      {
        ...product,
        id: `${mongoId}-rec-${Date.now()}`,
        _id: mongoId,
        productId: mongoId,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
      },
    ]);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return alert("העגלה ריקה!");
    if (!isAuthenticated) return navigate('/login', { state: { from: '/checkout' } });

    saveCheckoutDraft({ items: cartItems, subtotal, discount, totalPrice, appliedCoupon });
    navigate('/checkout');
  };

  const handleCoupon = async (code) => {
    if (!code) return { success: false, msg: "נא להזין קוד" };
    if (appliedCoupon === code) return { success: false, msg: "קופון זה כבר הוזן" };

    const result = await checkCouponRequest(code);
    if (result.valid) {
      let discountAmount = result.discountType === 'percent' ? subtotal * (result.discountValue / 100) : result.discountValue;
      discountAmount = Math.min(discountAmount, subtotal);
      setDiscount(discountAmount);
      setAppliedCoupon(code);
      return { success: true, msg: `קופון התקבל!` };
    } else {
      setDiscount(0);
      setAppliedCoupon("");
      return { success: false, msg: "קופון לא תקין" };
    }
  };

  useEffect(() => {
    getProducts()
      .then((data) => setRecommendedProducts(Array.isArray(data) ? data.slice(0, 3) : []))
      .catch(() => setRecommendedProducts([]));
  }, []);

  useEffect(() => {
    getPage("cart").then((data) => {
      if (data && Object.keys(data).length > 0) {
        const merged = {
          ...data,
          img: data.img?.trim() || DEFAULT_CART_HERO_IMG,
          title: data.title?.trim() || "עגלת קניות",
          recommendedTitle: normalizeRecommendedTitle(data.recommendedTitle),
        };
        adminControls.setPage(merged);
        adminControls.setDraft(merged);
      }
    });
  }, []);

  const EditContent = (
    <div className="bg-white p-6 rounded-lg space-y-4 text-right" dir="rtl">
      <h3 className="font-bold text-lg border-b pb-2 text-[#f2665e]">עריכת תוכן עמוד עגלה</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-bold text-gray-700">תמונת כותרת (URL):</label>
          <input type="text" value={draft.img} onChange={(e) => updateDraft({ img: e.target.value })} className="w-full border p-2 rounded ltr" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700">כותרת ראשית:</label>
          <input type="text" value={draft.title} onChange={(e) => updateDraft({ title: e.target.value })} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700">טקסט עגלה ריקה:</label>
          <input type="text" value={draft.emptyCartText} onChange={(e) => updateDraft({ emptyCartText: e.target.value })} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700">כותרת מוצרים מומלצים:</label>
          <input type="text" value={draft.recommendedTitle} onChange={(e) => updateDraft({ recommendedTitle: e.target.value })} className="w-full border p-2 rounded" />
        </div>
      </div>
    </div>
  );

  const heroImage = draft.img?.trim() || DEFAULT_CART_HERO_IMG;

  return (
    <AdminControls editMode={editMode} previewContent={EditContent} adminControls={adminControls}>
      <div className="bg-white min-h-screen text-gray-800 font-sans" dir="rtl">
        
        {/* באנר עליון */}
        <header className="w-full relative select-none">
          <div
            className="relative h-[260px] sm:h-[320px] flex items-center justify-center overflow-hidden bg-[#f8dcdb]"
            style={{
              backgroundImage: `url(${heroImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center center',
            }}
          >
            <div className="absolute inset-0 bg-black/5" />
            <h1 className="relative z-10 text-[38px] sm:text-[46px] font-bold text-white text-center tracking-wide drop-shadow-sm">
              {draft.title || "עגלת קניות"}
            </h1>
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-white" style={{ clipPath: "ellipse(60% 100% at 50% 100%)" }} />
          </div>
        </header>

        {/* תוכן מרכזי */}
        <div className="max-w-4xl mx-auto px-4 py-4">
          
          {cartItems.length > 0 ? (
            <div className="space-y-6">
              
              {/* באנר עליון: כמות הפריטים בסל - עודכן לגודל text-xl */}
              <div className="w-full bg-[#f2665e] rounded-full py-3 px-6 text-center shadow-sm max-w-2xl mx-auto">
                <p className="text-xl font-bold text-white tracking-wide">
                  יש לי {totalItems} פריטים בסל
                </p>
              </div>

              {/* כותרות + פריטים — אותה פריסת grid (6-3-3) */}
              <div className="max-w-2xl mx-auto">
                <div className="grid grid-cols-12 px-6 text-base font-bold text-slate-800 pb-2 border-b border-gray-100">
                  <div className="col-span-6 text-right">פריטים</div>
                  <div className="col-span-3 text-center">כמות</div>
                  <div className="col-span-3 text-center">מחיר</div>
                </div>
                {cartItems.map((item) => (
                  <CartItem
                    key={item.id || item._id}
                    item={item}
                    onRemove={handleRemoveItem}
                    onQuantityChange={handleQuantityChange}
                  />
                ))}
              </div>

              {/* באר סיכום הזמנה ותשלום תחתון */}
              <div className="max-w-2xl mx-auto pt-2">
                <div className="w-full bg-[#f2665e] rounded-full py-4 px-6 sm:px-8 shadow-md flex flex-row items-center justify-between text-white">
                  
                  {/* כפתורי פעולה */}
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleCheckout}
                      className="bg-white text-[#f2665e] hover:bg-[#f8dcdb] text-xs sm:text-sm font-medium px-6 py-2 rounded-full transition-all duration-200 shadow-sm whitespace-nowrap"
                    >
                      {draft.payBtn || "רוצה לשלם"}
                    </button>

                    <button 
                      onClick={() => {
                        const code = prompt(draft.codePlaceholder || "הזן קוד קופון");
                        if (code !== null) handleCoupon(code).then(res => alert(res.msg));
                      }}
                      className="bg-[#f8dcdb]/80 text-[#f2665e] hover:bg-white text-xs sm:text-sm font-medium px-5 py-2 rounded-full transition-all duration-200 shadow-sm whitespace-nowrap"
                    >
                      {appliedCoupon ? `קופון: ${appliedCoupon}` : "יש לי קופון"}
                    </button>
                  </div>

                  {/* סה"כ לתשלום - עודכן לגודל אחיד text-xl עבור הכיתוב והמחיר כאחד */}
                  <div className="text-left flex flex-row items-center gap-2 text-xl font-bold">
                    <span className="opacity-95">סה"כ לתשלום:</span>
                    <span className="tracking-tight">₪{totalPrice.toFixed(2)}</span>
                  </div>

                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-400">{draft.emptyCartText || "העגלה שלך ריקה"}</p>
            </div>
          )}
        </div>

        {/* מומלצים */}
        <section className="relative mt-20 bg-[#f8dcdb] pb-16 pt-16">
          <div className="absolute top-0 left-0 right-0 h-12 bg-white" style={{ clipPath: "ellipse(60% 100% at 50% 0%)" }} />
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-xl sm:text-2xl font-bold text-center text-[#f2665e] mb-10">
              {draft.recommendedTitle || DEFAULT_RECOMMENDED_TITLE}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {recommendedProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-3xl p-4 shadow-sm hover:shadow-md transition-all">
                  <RecommendedProduct product={product} onAddToCart={handleAddRecommended} />
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </AdminControls>
  );
}