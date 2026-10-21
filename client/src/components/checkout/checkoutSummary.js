/** The order summary lines at checkout */
import { isPhotoPrint } from '../../store/cartStore';

/** Added to the order when it is delivered (the server adds the same) */
export const DELIVERY_FEE = 25;

/** Photo prints are summarized in one line, like in the cart; every other item has its own line */
export function buildSummaryLines(items) {
    const photoLines = items.filter(isPhotoPrint);
    return [
        ...(photoLines.length
            ? [{
                key: 'photos',
                label: `תמונות · ${photoLines.length} תמונות, ${photoLines.reduce((sum, item) => sum + Number(item.quantity || 0), 0)} הדפסות`,
                total: photoLines.reduce((sum, item) => sum + item.price * item.quantity, 0),
            }]
            : []),
        ...items.filter((item) => !isPhotoPrint(item)).map((item) => ({
            key: item.id || item._id || item.name,
            label: `${item.name} × ${item.quantity}`,
            total: item.price * item.quantity,
        })),
    ];
}
