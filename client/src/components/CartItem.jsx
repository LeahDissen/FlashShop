export default function CartItem({ item, onRemove, onQuantityChange }) {
  const itemKey = item.id || item._id;
  const lineTotal = item.price * item.quantity;
  const isDesignerService = item.customization?.type === 'designer-service';

  return (
    <div className="grid grid-cols-12 px-6 py-3 border-b border-gray-200 last:border-b-0 items-center hover:bg-gray-50/80">
      <div className="col-span-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onRemove(itemKey)}
            className="text-[#f2665e] hover:text-[#d95248] text-lg font-bold shrink-0"
            aria-label="הסר פריט"
          >
            ×
          </button>
          {item.image ? (
            <img
              src={item.image}
              alt=""
              className="w-14 h-14 object-cover rounded border border-gray-200 bg-gray-50 shrink-0"
            />
          ) : (
            <div
              className="w-14 h-14 rounded border border-dashed border-gray-300 bg-gray-100 shrink-0 flex items-center justify-center text-[10px] text-gray-400 text-center px-1"
              title="תצוגת עיצוב"
            >
              עיצוב אישי
            </div>
          )}
          <div className="min-w-0">
            <span className="font-medium text-gray-800 block">{item.name}</span>
            {isDesignerService && (
              <span className="text-xs text-gray-500 block">עיצוב מותאם אישית על ידי גרפיקאית</span>
            )}
            {item.size && (
              <span className="text-xs text-gray-500">גודל: {item.size} ס&quot;מ</span>
            )}
          </div>
        </div>
      </div>
      <div className="col-span-3 flex justify-center">
        <div className="inline-flex items-center border border-gray-300 rounded overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => onQuantityChange(itemKey, -1)}
            disabled={item.quantity <= 1}
            className="px-2.5 py-1 text-gray-700 hover:bg-gray-100 disabled:opacity-40"
            aria-label="הפחת כמות"
          >
            −
          </button>
          <span className="px-3 py-1 border-x border-gray-300 font-medium min-w-[2rem] text-center">
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={() => onQuantityChange(itemKey, 1)}
            className="px-2.5 py-1 text-gray-700 hover:bg-gray-100"
            aria-label="הוסף כמות"
          >
            +
          </button>
        </div>
      </div>
      <div className="col-span-3 text-center font-semibold text-gray-800 whitespace-nowrap">
        {lineTotal.toFixed(2)} ₪
      </div>
    </div>
  );
}
