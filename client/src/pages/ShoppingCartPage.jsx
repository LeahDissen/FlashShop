import React, { useState, useEffect } from "react";
import CartItem from "../components/CartItem";
import CartSummary from "../components/CartSummary";
import RecommendedProduct from "../components/RecommendedProduct";
import{getProducts} from "../api/products"
// import { fetchCartItems, fetchRecommendedProducts } from "../api/cartApi";
export default function ShoppingCartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cartResponse, recommendedResponse] = await Promise.all([
          fetch("/api/cart"),
           getProducts()// <-- Your cart API
        ]);

        if (!cartResponse.ok || !recommendedResponse.ok) {
          throw new Error("Network response was not ok");
        }

        const cartData = await cartResponse.json();
        const recommendedData = await recommendedResponse.json();

        setCartItems(cartData);
        setRecommendedProducts(recommendedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleRemoveItem = (itemId) => {
    // In a real app, you'd also send a DELETE request to your API
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    console.log(`Remove item ${itemId}`);
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
    console.log("Proceed to checkout");
  };

  const handleCoupon = (couponCode) => {
    console.log(`Apply coupon: ${couponCode}`);
  };

  if (isLoading) {
    /* ... loading JSX ... */
  }
  if (error) {
    /* ... error JSX ... */
  }

  return (
  
      
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
        {/* ... Main Content (Cart + Summary) ... */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ... Cart Items (Main Column) ... */}
          <main className="flex-grow lg:w-2/3 bg-gray-50 rounded-lg shadow-md border">
            {/* ... Cart Header ... */}
            <div className="p-4 bg-[#f2665e] rounded-t-lg">
              <h2 className="text-xl font-semibold text-white">
                יש לי {totalItems} פריטים בסל
              </h2>
            </div>
            {/* ... Desktop Headers ... */}
            <div className="hidden md:grid grid-cols-6 gap-4 p-4 font-semibold text-gray-600 border-b">
              <div className="col-span-3">פריט</div>
              <div className="col-span-1 text-center">מחיר</div>
              <div className="col-span-1 text-center">כמות</div>
              <div className="col-span-1 text-center">סה"כ</div>
            </div>
            {/* ... Items List ... */}
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

          {/* ... Summary (Sidebar) ... */}
          <aside className="lg:w-1/3">
            <CartSummary
              totalPrice={totalPrice}
              onCheckout={handleCheckout}
              onCoupon={handleCoupon}
            />
          </aside>
        </div>

        {/* ... Wavy Divider SVG ... */}
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