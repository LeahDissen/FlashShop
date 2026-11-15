import { isOptionSoldOut } from '../../utils/productVariants';

/** Color swatches and size buttons on the product page; sold-out options are greyed out */
export default function VariantPicker({ product, value, onChange, showError }) {
    const colors = product.colors || [];
    const sizes = product.sizes || [];
    if (!colors.length && !sizes.length) return null;

    return (
        <div className="space-y-3">
            {colors.length > 0 && (
                <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1.5">
                        צבע{value.color ? `: ${value.color}` : ''}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {colors.map((color) => {
                            const soldOut = isOptionSoldOut(product, { color: color.name, size: value.size || undefined });
                            const selected = value.color === color.name;
                            return (
                                <button
                                    key={color.name}
                                    type="button"
                                    disabled={soldOut}
                                    onClick={() => onChange({ ...value, color: color.name })}
                                    title={soldOut ? `${color.name} – אזל` : color.name}
                                    aria-label={soldOut ? `${color.name} – אזל` : color.name}
                                    aria-pressed={selected}
                                    className={`relative h-9 w-9 rounded-full border-2 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-35 ${selected ? 'border-[#f2665e] ring-2 ring-[#f2665e]/30' : 'border-gray-300 hover:border-[#f2665e]/60'}`}
                                    style={{ backgroundColor: color.hex || '#FFFFFF' }}
                                >
                                    {soldOut && <span className="absolute inset-0 flex items-center justify-center text-gray-700 text-lg leading-none">/</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {sizes.length > 0 && (
                <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1.5">מידה</p>
                    <div className="flex flex-wrap gap-2">
                        {sizes.map((size) => {
                            const soldOut = isOptionSoldOut(product, { size, color: value.color || undefined });
                            const selected = value.size === size;
                            return (
                                <button
                                    key={size}
                                    type="button"
                                    disabled={soldOut}
                                    onClick={() => onChange({ ...value, size })}
                                    aria-pressed={selected}
                                    className={`min-w-11 px-3 py-1.5 rounded-lg border text-sm font-semibold transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-35 disabled:line-through ${selected ? 'border-[#f2665e] bg-[#f2665e] text-white' : 'border-gray-300 bg-white text-gray-800 hover:border-[#f2665e]/60'}`}
                                >
                                    {size}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {showError && (
                <p className="text-sm font-semibold text-red-600" role="alert">
                    יש לבחור {[colors.length && !value.color && 'צבע', sizes.length && !value.size && 'מידה'].filter(Boolean).join(' ו')}
                </p>
            )}
        </div>
    );
}
