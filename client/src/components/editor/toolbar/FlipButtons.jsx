import { FlipHorizontalIcon, FlipVerticalIcon } from '../../icons';

/** Mirror a shape or an image horizontally / vertically */
export default function FlipButtons({ element, onChange }) {
    return (
        <div className="flex items-center gap-1">
            <button
                onClick={() => onChange('scaleX', element.scaleX === 1 ? -1 : 1)}
                className={`w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 ${element.scaleX === -1 ? 'bg-blue-50 text-blue-600 border border-blue-200' : ''}`}
                data-tooltip="היפוך אופקי"
                data-tooltip-pos="bottom"
            >
                <FlipHorizontalIcon className="w-5 h-5" />
            </button>
            <button
                onClick={() => onChange('scaleY', element.scaleY === 1 ? -1 : 1)}
                className={`w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 ${element.scaleY === -1 ? 'bg-blue-50 text-blue-600 border border-blue-200' : ''}`}
                data-tooltip="היפוך אנכי"
                data-tooltip-pos="bottom"
            >
                <FlipVerticalIcon className="w-5 h-5" />
            </button>
        </div>
    );
}
