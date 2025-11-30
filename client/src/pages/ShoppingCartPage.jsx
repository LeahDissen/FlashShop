import React, { useState } from "react";
import CartItem from "../components/CartItem";
import CartSummary from "../components/CartSummary";
import RecommendedProduct from "../components/RecommendedProduct";

// The data from your design image, which shows the "per-item" price
const INITIAL_CART_ITEMS = [
  {
    id: 1,
    name: "פאזל מודפס",
    quantity: 1,
    price: 45.9,
    image: "https://c.animaapp.com/ssXwMPGd/img/puzzle@2x.png",
  },
  {
    id: 2,
    name: "כרית מפנקת",
    quantity: 1,
    price: 29.8,
    image: "https://c.animaapp.com/ssXwMPGd/img/pillow@2x.png",
  },
  {
    id: 3,
    name: "תמונות לפיתוח",
    quantity: 26,
    price: 26.0, // 26.00 per photo * 26 photos = 676.00
    image:
      "https://c.animaapp.com/ssXwMPGd/img/woman-sitting-desk-looking-printed-photos-remember-nostalgia-day@2x.png",
  },
];

const RECOMMENDED_PRODUCTS = [
  {
    id: 3, // Corresponds to "חולצה"
    name: "חולצה",
    price: 45.9,
    image: "https://c.animaapp.com/ssXwMPGd/img/shirt@2x.png",
  },
  {
    id: 2, // Corresponds to "קנבס"
    name: "קנבס",
    price: 45.9,
    image: "https://c.animaapp.com/ssXwMPGd/img/canvas@2x.png",
  },
  {
    id: 1, // Corresponds to "שעון קיר"
    name: "שעון קיר",
    price: 45.9,
    image:
      "https://c.animaapp.com/ssXwMPGd/img/wall-clock-mockup-right-view@2x.png",
  },
];

export default function ShoppingCartPage() {
  const [cartItems, setCartItems] = useState(INITIAL_CART_ITEMS);
  const [recommendedProducts] = useState(RECOMMENDED_PRODUCTS);

  // This formula is correct based on your design
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Calculates total number of items (1 + 1 + 26 = 28)
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleRemoveItem = (itemId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    console.log(`Remove item ${itemId}`);
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
        {/* Main Content (Cart + Summary) */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Cart Items (Main Column) */}
          <main className="flex-grow lg:w-2/3 bg-gray-50 rounded-lg shadow-md border">
            {/* Cart Header */}
            <div className="p-4 bg-[#f2665e] rounded-t-lg">
              <h2 className="text-xl font-semibold text-white">
                יש לי {totalItems} פריטים בסל
              </h2>
            </div>
            
            {/* Desktop Headers */}
            <div className="hidden md:grid grid-cols-6 gap-4 p-4 font-semibold text-gray-600 border-b">
              <div className="col-span-3">פריט</div>
              <div className="col-span-1 text-center">מחיר</div>
              <div className="col-span-1 text-center">כמות</div>
              <div className="col-span-1 text-center">סה"כ</div>
            </div>

            {/* Items List */}
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

          {/* Summary (Sidebar) */}
          <aside className="lg:w-1/3">
            <CartSummary
              totalPrice={totalPrice}
              onCheckout={handleCheckout}
              onCoupon={handleCoupon}
            />
          </aside>
        </div>

        {/* Wavy Divider SVG */}
        {/* This is positioned absolutely relative to the whole page wrapper */}
        <img
          className="absolute w-full top-1/2 left-0 -z-10 opacity-60"
          alt="Wavy background"
          src="https://c.animaapp.com/ssXwMPGd/img/vector.svg"
        />

        {/* Recommended Products */}
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