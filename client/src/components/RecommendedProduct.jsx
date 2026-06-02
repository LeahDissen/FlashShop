export default function RecommendedProduct({ product, onAddToCart }) {
  return (
    <article className="flex flex-col items-center text-center group">
      <div className="w-full max-w-[220px] rounded-2xl overflow-hidden bg-white shadow-md ring-1 ring-black/5 transition-transform group-hover:scale-[1.02]">
        <img
          src={product.image}
          alt={product.name}
          className="w-full aspect-[4/3] object-cover"
        />
      </div>
      <p className="mt-3 text-sm sm:text-base font-bold text-gray-800">
        {product.name}
        <span className="font-normal text-gray-600"> - {product.price.toFixed(2)} ₪</span>
      </p>
      <button
        type="button"
        onClick={() => onAddToCart?.(product)}
        className="mt-2.5 bg-[#f2665e] text-white text-sm font-bold py-2 px-6 rounded-full hover:bg-[#d95248] transition-colors shadow-sm"
      >
        הוספה לסל
      </button>
    </article>
  );
}