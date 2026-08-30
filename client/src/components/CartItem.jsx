import QuantityInput from './QuantityInput';

export default function CartItem({ item, onRemove, onSetQuantity }) {
  const itemKey = item.id;
  const lineTotal = item.price * item.quantity;
  const isDesignerService = item.customization?.type === 'designer-service';

  if (!itemKey) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 px-3 sm:px-6 py-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50/80 sm:grid sm:grid-cols-12 sm:items-center sm:gap-2">
      {/* פריט */}
      <div className="sm:col-span-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onRemove(itemKey)}
            className="text-[#f2665e] hover:text-[#d95248] text-xl font-bold shrink-0 leading-none w-8 h-8 flex items-center justify-center"
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
          <div className="min-w-0 flex-1">
            <span className="font-medium text-gray-800 block truncate">{item.name}</span>
            {isDesignerService && (
              <span className="text-xs text-gray-500 block">עיצוב מותאם אישית על ידי גרפיקאית</span>
            )}
            {item.size && (
              <span className="text-xs text-gray-500">גודל: {item.size} ס&quot;מ</span>
            )}
          </div>
        </div>
      </div>

      {/* כמות + מחיר במובייל בשורה אחת; בדסקטופ בעמודות נפרדות */}
      <div className="flex items-center justify-between gap-3 sm:contents px-1">
        <div className="flex items-center gap-2 sm:col-span-3 sm:flex sm:justify-center">
          <span className="text-xs text-gray-500 sm:hidden">כמות</span>
          <QuantityInput
            quantity={item.quantity}
            onQuantityChange={(qty) => onSetQuantity(itemKey, qty)}
            variant="cart"
          />
        </div>
        <div className="font-semibold text-gray-800 whitespace-nowrap sm:col-span-3 sm:text-center">
          <span className="text-xs text-gray-500 font-normal ml-1 sm:hidden">מחיר </span>
          {lineTotal.toFixed(2)} ₪
        </div>
      </div>
    </div>
  );
}
