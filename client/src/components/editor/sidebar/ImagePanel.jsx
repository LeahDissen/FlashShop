import { useRef } from 'react';
import { ImageIcon, XIcon } from '../../icons';

/** Upload a photo to the canvas, or add one of the customer's photos again */
const ImagePanel = ({ addImageElement, uploadedImages, deleteUploadedImage }) => {
    const fileInputRef = useRef(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const addImageToCanvas = (src) => {
        const img = new Image();
        img.onload = () => {
            const maxWidth = 150;
            const maxHeight = 200;
            let { width, height } = img;
            const naturalWidth = img.width;
            const naturalHeight = img.height;

            if (width > maxWidth) {
                height = (maxWidth / width) * height;
                width = maxWidth;
            }
            if (height > maxHeight) {
                width = (maxHeight / height) * width;
                height = maxHeight;
            }

            addImageElement(src, width, height, naturalWidth, naturalHeight);
        };
        img.src = src;
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result;
                if (result) {
                    addImageToCanvas(result);
                }
            };
            reader.readAsDataURL(file);
        }
        if (event.target) {
            event.target.value = '';
        }
    };

    return (
        <div className="p-4 text-right">
            <h3 className="font-semibold text-gray-800 mb-4">תמונות</h3>
            <button
                onClick={handleUploadClick}
                className="w-full flex items-center justify-center p-3 mb-6 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
                <ImageIcon className="w-5 h-5 ml-2 text-gray-600" />
                <span className="font-semibold text-gray-700">העלה תמונה</span>
            </button>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/gif"
                onChange={handleFileChange}
            />

            <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold text-gray-700 text-sm mb-3">התמונות שלך</h4>
                {uploadedImages.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                        {uploadedImages.map((src, index) => (
                            <div key={index} className="relative group aspect-square">
                                <button
                                    onClick={() => addImageToCanvas(src)}
                                    className="w-full h-full bg-gray-100 rounded-md overflow-hidden hover:ring-2 ring-offset-1 ring-red-400 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-400 transition-shadow"
                                    aria-label={`Add uploaded image ${index + 1} to canvas`}
                                >
                                    <img src={src} alt={`Uploaded image ${index + 1}`} className="w-full h-full object-cover pointer-events-none" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteUploadedImage(src); }}
                                    className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center text-gray-700 hover:bg-red-500 hover:text-white transition-all duration-200 z-10 opacity-0 group-hover:opacity-100"
                                    aria-label="Delete uploaded image"
                                >
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-sm text-gray-500 py-4 rounded-md bg-gray-50">
                        <p>אין תמונות שהועלו.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImagePanel;
