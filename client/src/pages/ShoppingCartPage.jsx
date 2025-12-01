import React, { useState } from "react";
import CartItem from "../components/CartItem";
import CartSummary from "../components/CartSummary";
import RecommendedProduct from "../components/RecommendedProduct";
import { useCartStore } from "../store/cartStore";

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
  // Use global store
  const cartItems = useCartStore((state) => state.cartItems);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  
  const [recommendedProducts] = useState(RECOMMENDED_PRODUCTS);

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleRemoveItem = (itemId) => {
    removeFromCart(itemId);
  };

  const handleCheckout = () => {
    console.log("Proceed to checkout");
  };

  const handleCoupon = (couponCode) => {
    console.log(`Apply coupon: ${couponCode}`);
  };

  return (
    <div className="bg-white min-h-screen relative overflow-x-hidden">
      
      <header className="relative h-48 md:h-64 flex items-center justify-center mb-8">
        <img
          src="https://c.animaapp.com/ssXwMPGd/img/vector-6.png"
          alt="Header"
          className="absolute top-0 left-0 w-full h-full object-cover"
        />
        <h1 className="text-5xl md:text-6xl font-bold text-white z-10 relative">
          עגלת קניות
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
                <p className="p-8 text-center text-gray-500">
                  העגלה שלך ריקה.
                </p>
              )}
            </div>
          </main>

          <aside className="lg:w-1/3">
            <CartSummary
              totalPrice={totalPrice}
              onCheckout={handleCheckout}
              onCoupon={handleCoupon}
            />
          </aside>
        </div>

        {/* ... Rest of the component (Recommended Products, etc.) ... */}
        <section className="mt-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-[#f2665e] mb-8">
            אולי תאהבו גם את אלה...
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
}