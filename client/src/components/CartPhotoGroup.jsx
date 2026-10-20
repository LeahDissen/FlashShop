import { useState } from 'react';
import { Link } from 'react-router-dom';
import CartItem from './CartItem';
import { optimizeImageUrl } from '../utils/imageUrl';
import { PHOTO_DEVELOPMENT_PATH } from '../utils/photoOrderDraft';

const PREVIEW_COUNT = 4;
const THUMB_PIXELS = 112;

/**
 * All photo prints of the cart as one line ("תמונות" + total), so 100 photos don't become 100 lines.
 * "פירוט" opens the usual per-photo rows for changing copies or removing a photo.
 */
export default function CartPhotoGroup({ items, onRemove, onRemoveAll, onSetQuantity }) {
  const [expanded, setExpanded] = useState(false);
  const prints = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const previews = items.slice(0, PREVIEW_COUNT);

  return (
    <div className="border-b border-gray-200">
      <div className="flex flex-col gap-3 px-3 sm:px-6 py-4 sm:grid sm:grid-cols-12 sm:items-center sm:gap-2">
        <div className="sm:col-span-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onRemoveAll}
            className="text-[#f2665e] hover:text-[#d95248] text-xl font-bold shrink-0 leading-none w-8 h-8 flex items-center justify-center"
            aria-label="הסרת כל התמונות מהסל"
          >
            ×
          </button>
          <div className="flex -space-x-3 rtl:space-x-reverse shrink-0" aria-hidden="true">
            {previews.map((item) => (
              <img
                key={item.id}
                src={optimizeImageUrl(item.image, { width: THUMB_PIXELS, height: THUMB_PIXELS })}
                alt=""
                loading="lazy"
                className="w-12 h-12 object-cover rounded border-2 border-white shadow-sm bg-gray-50"
              />
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-medium text-gray-800 block">תמונות</span>
            <span className="text-xs text-gray-500 block">
              {items.length} תמונות · {prints} הדפסות
            </span>
            <span className="flex gap-3 mt-1 text-xs">
              <button
                type="button"
                onClick={() => setExpanded((open) => !open)}
                className="text-[#f2665e] font-semibold hover:underline"
                aria-expanded={expanded}
              >
                {expanded ? 'הסתרת הפירוט' : 'פירוט ועריכה'}
              </button>
              <Link to={PHOTO_DEVELOPMENT_PATH} className="text-gray-500 hover:text-gray-800 hover:underline">
                הוספת תמונות
              </Link>
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between sm:contents px-1">
          <span className="text-xs text-gray-500 sm:col-span-3 sm:text-center">{prints} הדפסות</span>
          <div className="font-semibold text-gray-800 whitespace-nowrap sm:col-span-3 sm:text-center">
            {total.toFixed(2)} ₪
          </div>
        </div>
      </div>

      {expanded && (
        <div className="bg-gray-50/70 border-t border-gray-100 max-h-[60vh] overflow-y-auto">
          {items.map((item) => (
            <CartItem key={item.id} item={item} onRemove={onRemove} onSetQuantity={onSetQuantity} />
          ))}
        </div>
      )}
    </div>
  );
}
