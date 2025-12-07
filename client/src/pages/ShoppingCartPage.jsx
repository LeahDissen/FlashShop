import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CartItem from "../components/CartItem";
import CartSummary from "../components/CartSummary";
import RecommendedProduct from "../components/RecommendedProduct";
import { useCartStore } from "../store/cartStore";
import useAuthStore from "../store/authStore";
import { checkCouponRequest } from "../api/club";
import AdminControls from "../components/AdminControls";
import { useAdminControl } from "../hooks/useAdminControl";
import { getPage } from "../api/pages";

const RECOMMENDED_PRODUCTS = [
  {
    id: 3,
    name: "חולצה",
    price: 45.9,
    image: "https://c.animaapp.com/ssXwMPGd/img/shirt@2x.png",
  },
  {
    id: 2,
    name: "קנבס",
    price: 45.9,
    image: "https://c.animaapp.com/ssXwMPGd/img/canvas@2x.png",
  },
  {
    id: 1,
    name: "שעון קיר",
    price: 45.9,
    image:
      "https://c.animaapp.com/ssXwMPGd/img/wall-clock-mockup-right-view@2x.png",
  },
];

export default function ShoppingCartPage() {
  const cartItems = useCartStore((state) => state.cartItems);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [recommendedProducts] = useState(RECOMMENDED_PRODUCTS);

  const adminControls = useAdminControl({
    img: "",
    title: "",
    emptyCartText: "",
    recommendedTitle: "",
    endText: "",
    paySum: "",
    payBtn: "",
    codeLabel: "",
    codePlaceholder: "",
    codeBtn: ""
  }, "cart");
  const { draft, updateDraft, editMode } = adminControls;

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const totalPrice = Math.max(0, subtotal - discount);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleRemoveItem = (itemId) => {
    removeFromCart(itemId);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert("העגלה ריקה!");
      return;
    }

    if (!isAuthenticated) {
      if (confirm("עליך להתחבר כדי להמשיך לתשלום. לעבור להתחברות?")) {
        navigate('/login', { state: { from: '/cart' } });
      }
      return;
    }

    console.log("Proceeding to checkout...", {
      items: cartItems,
      total: totalPrice,
      coupon: appliedCoupon
    });
    alert("מעבר לתשלום...");
  };

  const handleCoupon = async (code) => {
    if (!code) return { success: false, msg: "נא להזין קוד" };

    if (appliedCoupon === code) return { success: false, msg: "קופון זה כבר הוזן" };

    const result = await checkCouponRequest(code);

    if (result.valid) {
      let discountAmount = 0;

      if (result.discountType === 'percent') {
        discountAmount = subtotal * (result.discountValue / 100);
      } else if (result.discountType === 'fixed') {
        discountAmount = result.discountValue;
      }

      discountAmount = Math.min(discountAmount, subtotal);

      setDiscount(discountAmount);
      setAppliedCoupon(code);
      return { success: true, msg: result.msg || `קופון התקבל! חסכת ${discountAmount.toFixed(2)} ש"ח` };
    } else {
      setDiscount(0);
      setAppliedCoupon("");
      return { success: false, msg: result.msg || "קופון לא תקין" };
    }
  };

  useEffect(() => {
    getPage("cart").then((data) => {
      if (data && Object.keys(data).length > 0) {
        adminControls.setPage(data);
        adminControls.setDraft(data);
      }
    });
  }, []);

  const EditContent = (
    <div className="bg-white p-6 rounded-lg space-y-4 text-right" dir="rtl">
      <h3 className="font-bold text-lg border-b pb-2 text-[#f2665e]">עריכת תוכן עמוד עגלה</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-bold text-gray-700">תמונת כותרת (URL):</label>
          <input
            type="text"
            value={draft.img}
            onChange={(e) => updateDraft({ img: e.target.value })}
            className="w-full border p-2 rounded ltr bg-gray-50"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700">כותרת ראשית:</label>
          <input
            type="text"
            value={draft.title}
            onChange={(e) => updateDraft({ title: e.target.value })}
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700">טקסט עגלה ריקה:</label>
          <input
            type="text"
            value={draft.emptyCartText}
            onChange={(e) => updateDraft({ emptyCartText: e.target.value })}
            className="w-full border p-2 rounded"
          />
        </div>
      </div>

      {/* חלק תחתון - עריכת סיכום הזמנה */}
      <h3 className="font-bold text-lg border-b pb-2 mt-6 text-[#f2665e]">עריכת סיכום הזמנה וקופונים</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-700">כותרת הסיכום:</label>
          <input
            type="text"
            value={draft.endText}
            onChange={(e) => updateDraft({ endText: e.target.value })}
            className="w-full border p-2 rounded"
            placeholder="למשל: סיכום הזמנה"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700">טקסט כפתור תשלום:</label>
          <input
            type="text"
            value={draft.payBtn}
            onChange={(e) => updateDraft({ payBtn: e.target.value })}
            className="w-full border p-2 rounded"
            placeholder="למשל: רוצה לשלם"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700">כותרת שדה קופון:</label>
          <input
            type="text"
            value={draft.codeLabel}
            onChange={(e) => updateDraft({ codeLabel: e.target.value })}
            className="w-full border p-2 rounded"
            placeholder="למשל: הזן קוד קופון"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700">טקסט בתוך שדה קופון (Placeholder):</label>
          <input
            type="text"
            value={draft.codePlaceholder}
            onChange={(e) => updateDraft({ codePlaceholder: e.target.value })}
            className="w-full border p-2 rounded"
            placeholder="למשל: יש לי קופון"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700">טקסט כפתור החל:</label>
          <input
            type="text"
            value={draft.codeBtn}
            onChange={(e) => updateDraft({ codeBtn: e.target.value })}
            className="w-full border p-2 rounded"
            placeholder="למשל: החל"
          />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <label className="block text-sm font-bold text-gray-700">כותרת מוצרים מומלצים:</label>
        <input
          type="text"
          value={draft.recommendedTitle}
          onChange={(e) => updateDraft({ recommendedTitle: e.target.value })}
          className="w-full border p-2 rounded"
        />
      </div>
    </div>
  );

  const ViewContent = (
    <div className="bg-white min-h-screen relative overflow-x-hidden">
      <header className="relative h-48 md:h-64 flex items-center justify-center mb-8">
        <img
          src={draft.img}
          alt="Header"
          className="absolute top-0 left-0 w-full h-full object-cover"
        />
        <h1 className="text-5xl md:text-6xl font-bold text-white z-10 relative drop-shadow-md">
          {draft.title}
        </h1>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:flex-row gap-8">

          <main className="flex-grow lg:w-2/3 bg-gray-50 rounded-lg shadow-md border">
            <div className="p-4 bg-[#f2665e] rounded-t-lg">
              <h2 className="text-xl font-semibold text-white">
                יש לי {totalItems} פריטים בסל
              </h2>
            </div>

            <div className="hidden md:grid grid-cols-6 gap-4 p-4 font-semibold text-gray-600 border-b">
              <div className="col-span-3">פריט</div>
              <div className="col-span-1 text-center">מחיר</div>
              <div className="col-span-1 text-center">כמות</div>
              <div className="col-span-1 text-center">סה"כ</div>
            </div>

            <div className="divide-y divide-gray-200">
              {cartItems.length > 0 ? (
                cartItems.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onRemove={handleRemoveItem}
                  />
                ))
              ) : (
                <p className="p-12 text-center text-gray-500 text-lg">
                  {draft.emptyCartText}
                </p>
              )}
            </div>
          </main>

          <aside className="lg:w-1/3">
            <CartSummary
              subtotal={subtotal}
              discount={discount}
              totalPrice={totalPrice}
              onCheckout={handleCheckout}
              onCoupon={handleCoupon}
              content={draft}
            />
          </aside>
        </div>

        <img
          className="absolute w-full top-1/2 left-0 -z-10 opacity-60 pointer-events-none"
          alt="Wavy background"
          src="https://c.animaapp.com/ssXwMPGd/img/vector.svg"
        />

        <section className="mt-16 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-[#f2665e] mb-8">
            {draft.recommendedTitle}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {recommendedProducts.map((product) => (
              <RecommendedProduct key={product.id} product={product} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );

  return (
    <AdminControls
      editMode={editMode}
      previewContent={EditContent}
      adminControls={adminControls}
    >
      {ViewContent}
    </AdminControls>
  );
}