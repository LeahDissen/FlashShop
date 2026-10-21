import { MULTI_DROPZONE, ORIENTATION_OPTIONS } from './frameForm';

/** A frame in the admin's list: its image, size folder, orientation and type, with edit / delete */
export default function FrameCard({ frame, printSizes, isBeingEdited, onEdit, onDelete }) {
    const sizeLabel = printSizes.find((size) => size.key === frame.printSizeKey)?.label || 'כל המידות';
    const orientationLabel = ORIENTATION_OPTIONS.find((o) => o.value === (frame.orientation || 'any'))?.label;

    return (
        <div className={`border rounded-xl overflow-hidden p-4 flex flex-col justify-between ${
            isBeingEdited ? 'border-[#f2665e] ring-2 ring-[#f2665e]/30' : 'border-gray-100'
        }`}>
            <div>
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-800">{frame.title}</h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{frame.category}</span>
                </div>
                <div className="w-full h-36 bg-gray-50 rounded-lg overflow-hidden mb-3 flex items-center justify-center border border-gray-100">
                    <img src={frame.thumbnailUrl || frame.imageUrl} alt={frame.title} className="max-h-full max-w-full object-contain" />
                </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="text-xs bg-[#f2665e]/10 text-[#f2665e] px-2 py-0.5 rounded">{sizeLabel}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{orientationLabel}</span>
                {frame.isFixedOverlay !== false && (
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">Overlay קבוע</span>
                )}
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">{frame.layoutType === MULTI_DROPZONE ? 'קולאז׳' : 'מסגרת רגילה'}</span>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => onEdit(frame)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium"
                    >
                        עריכה
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(frame._id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium"
                    >
                        מחיקה
                    </button>
                </div>
            </div>
        </div>
    );
}
