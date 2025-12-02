import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // 1. Import useNavigate
import CartItem from "../components/CartItem";
import CartSummary from "../components/CartSummary";
import RecommendedProduct from "../components/RecommendedProduct";
import { useCartStore } from "../store/cartStore";
import useAuthStore from "../store/authStore"; // 2. Import Auth Store
import { checkCouponRequest } from "../api/club";

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
  
  // 3. Get Auth state and navigate function
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  const [discount, setDiscount] = useState(0); 
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [recommendedProducts] = useState(RECOMMENDED_PRODUCTS);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const totalPrice = Math.max(0, subtotal - discount);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleRemoveItem = (itemId) => {
    removeFromCart(itemId);
  };

  // --- NEW FUNCTION ---
  /**
   * Handles adding a recommended product to the cart.
   * It also removes that product from the recommended list.
   */
  const handleAddRecommendedToCart = (productToAdd) => {
    // 1. Add item to cart (or update quantity if it already exists)
    setCartItems((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.id === productToAdd.id
      );

      if (existingItem) {
        // Item already in cart, just increase quantity
        return prevCart.map((item) =>
          item.id === productToAdd.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // New item, add it to the cart with quantity 1
        return [...prevCart, { ...productToAdd, quantity: 1 }];
      }
      // Note: You would also send a POST/PUT request to your API here
    });

    // 2. Remove the item from the recommended products list
    setRecommendedProducts((prevRecs) =>
      prevRecs.filter((product) => product.id !== productToAdd.id)
    );

    console.log(`Added ${productToAdd.name} to cart.`);
  };
  // --- END NEW FUNCTION ---

  const handleCheckout = () => {
    if (cartItems.length === 0) {
        alert("העגלה ריקה!");
        return;
    }

    // 4. Check if logged in
    if (!isAuthenticated) {
        // Redirect to login, but remember we came from '/cart'
        if (confirm("עליך להתחבר כדי להמשיך לתשלום. לעבור להתחברות?")) {
            navigate('/login', { state: { from: '/cart' } });
        }
        return;
    }

    // Proceed to checkout logic
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

  if (isLoading) {
    /* ... loading JSX ... */
  }
  if (error) {
    /* ... error JSX ... */
  }

  return (
    <div className="bg-white min-h-screen relative overflow-x-hidden">
      
    <div className="bg-white min-h-screen relative overflow-x-hidden" dir="rtl">
      {/* ... Header ... */}
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
                <p className="p-12 text-center text-gray-500 text-lg">
                  העגלה שלך ריקה.
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
            אולי תאהבו גם את אלה...
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {recommendedProducts.map((product) => (
              <RecommendedProduct
                key={product.id}
                product={product}
                // --- PASS THE NEW FUNCTION AS A PROP ---
                onAddToCart={handleAddRecommendedToCart}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}