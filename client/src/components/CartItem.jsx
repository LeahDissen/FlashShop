export default function CartItem({ item, onRemove }) {
  const lineItemTotal = item.price * item.quantity;

  return (
    <div className="p-4 grid grid-cols-6 gap-4 items-center border-b">
      
      <div className="col-span-6 sm:col-span-3 flex items-center gap-4">
        <button
          onClick={() => onRemove(item.id)}
          className="text-red-500 hover:text-red-700 text-xl font-bold p-2"
        >
          X
        </button>

        <img
          src={item.image}
          alt={item.name}
          className="w-20 h-20 object-cover rounded-md border"
        />
        
        <div>
            <h3 className="font-semibold text-lg text-gray-800">{item.name}</h3>
            {item.size && (
                <span className="text-sm text-gray-500">גודל: {item.size} ס"מ</span>
            )}
        </div>
      </div>

      <div className="col-span-3 sm:col-span-1 text-center text-gray-700">
        {item.price.toFixed(2)} ש"ח
      </div>

      <div className="col-span-3 sm:col-span-1 text-center text-gray-700">
        {item.quantity}
      </div>

      <div className="col-span-3 sm:col-span-1 text-center font-semibold text-gray-900">
        {lineItemTotal.toFixed(2)} ש"ח
      </div>
    </div>
  );
}