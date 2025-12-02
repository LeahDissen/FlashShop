// src/components/RecommendedProduct.js

// 1. Accept the new 'onAddToCart' prop
export default function RecommendedProduct({ product, onAddToCart }) {
  return (
    // 2. Add 'flex' and 'flex-col' to make the card a flex container
    <article className="border border-gray-200 rounded-lg shadow-md overflow-hidden text-center bg-white flex flex-col">
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-60 object-cover"
      />
      {/* 3. Add 'flex', 'flex-col', and 'flex-grow' to make this div fill the space */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
        <p className="text-gray-600 mt-1">{product.price.toFixed(2)} ש"ח</p>

        {/* 4. This empty div will grow and push the button to the bottom */}
        <div className="flex-grow"></div>

        {/* 5. The new "Add to Cart" button */}
        <button
          onClick={() => onAddToCart(product)} // 6. Call the prop on click
          className="mt-4 w-full bg-[#f2665e] text-white py-2 px-4 rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
        >
          הוספה לסל
        </button>
      </div>
    </article>
  );
}