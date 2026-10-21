import { uploadImageToCloudinary } from '../../utils/cloudinaryUpload';
import { PRODUCT_SHAPES } from '../../utils/productShapes';

/** The product's shape in the editor: a rectangle, a built-in shape, or the admin's own PNG */
export default function ProductShapeField({ shapeType, shapeMaskUrl, onChange }) {
    const uploadMask = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        try {
            onChange({ shapeMaskUrl: await uploadImageToCloudinary(file) });
        } catch (err) {
            alert(err?.message || 'העלאת הצורה נכשלה');
        }
    };

    return (
        <div className="mt-3 space-y-2">
            <label htmlFor="product-shape" className="block text-sm font-medium text-gray-700">צורת המוצר בעורך</label>
            <select
                id="product-shape"
                value={shapeType}
                onChange={(e) => onChange({ shapeType: e.target.value })}
                className="w-full p-2 border rounded-lg"
            >
                <option value="">מלבן רגיל</option>
                {PRODUCT_SHAPES.map((shape) => (
                    <option key={shape.value} value={shape.value}>{shape.label}</option>
                ))}
                <option value="custom">צורה משלי (קובץ PNG)</option>
            </select>
            {shapeType === 'custom' && (
                <div className="space-y-1">
                    <input
                        type="file"
                        accept="image/png"
                        aria-label="קובץ הצורה"
                        onChange={uploadMask}
                        className="w-full text-sm"
                    />
                    {shapeMaskUrl && (
                        <img src={shapeMaskUrl} alt="הצורה" className="h-16 w-16 object-contain border rounded bg-gray-50" />
                    )}
                    <p className="text-xs text-gray-500">PNG שבו הצורה אטומה ומחוץ לה שקוף. בעורך יוצג רק מה שבתוך הצורה.</p>
                </div>
            )}
        </div>
    );
}
