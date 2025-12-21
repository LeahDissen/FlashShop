export default function RecommendedProduct({ product, onAddToCart }) {
  return (
    <article className="border border-gray-200 rounded-lg shadow-md overflow-hidden text-center bg-white flex flex-col">
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-60 object-cover"
      />
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
        <p className="text-gray-600 mt-1">{product.price.toFixed(2)} ש"ח</p>
        <div className="flex-grow"></div>
        <button
          onClick={() => onAddToCart(product)}
          className="mt-4 w-full bg-[#f2665e] text-white py-2 px-4 rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
        >
          הוספה לסל
        </button>
      </div>
    </article>
  );
}