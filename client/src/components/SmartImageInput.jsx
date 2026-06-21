import { forwardRef, useId, useRef, useState } from 'react';
import { FaImage } from 'react-icons/fa';
import { uploadImageToCloudinary } from '../utils/cloudinaryUpload';

const SmartImageInput = forwardRef(function SmartImageInput(
    {
        value = '',
        onChange,
        placeholder,
        className = 'w-full border p-2 rounded ltr',
        style,
        disabled = false,
        required = false,
        showPreview = true,
        previewClassName = 'h-10 w-10 rounded border border-gray-200 object-cover shrink-0 bg-gray-50',
        id,
        name,
    },
    ref,
) {
    const fileInputRef = useRef(null);
    const generatedId = useId();
    const inputId = id || generatedId;
    const [uploading, setUploading] = useState(false);
    const [localPreview, setLocalPreview] = useState(null);
    const [error, setError] = useState(null);

    const previewSrc = localPreview || (typeof value === 'string' && value.trim() ? value.trim() : null);

    const handleTextChange = (e) => {
        setError(null);
        setLocalPreview(null);
        onChange?.(e.target.value);
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        const objectUrl = URL.createObjectURL(file);
        setLocalPreview(objectUrl);
        setUploading(true);
        setError(null);

        try {
            const secureUrl = await uploadImageToCloudinary(file);
            onChange?.(secureUrl);
        } catch (err) {
            setError(err?.message || 'העלאת התמונה נכשלה');
            setLocalPreview(null);
        } finally {
            setUploading(false);
            URL.revokeObjectURL(objectUrl);
        }
    };

    return (
        <div className="space-y-1.5">
            <div className="flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
                    <input
                        ref={ref}
                        type="text"
                        id={inputId}
                        name={name}
                        value={value ?? ''}
                        onChange={handleTextChange}
                        placeholder={placeholder}
                        disabled={disabled || uploading}
                        required={required}
                        className={`${className}${uploading ? ' pl-9' : ''}`}
                        style={style}
                        dir="ltr"
                    />
                    {uploading && (
                        <span
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                            aria-hidden="true"
                        >
                            <svg
                                className="animate-spin h-4 w-4 text-[#f2665e]"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                        </span>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || uploading}
                    className="shrink-0 flex items-center justify-center h-10 w-10 rounded border border-gray-200 bg-white text-gray-500 hover:text-[#f2665e] hover:border-[#f2665e]/40 hover:bg-[#fff5f4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="העלאת תמונה מהמחשב"
                    aria-label="העלאת תמונה מהמחשב"
                >
                    <FaImage className="text-base" />
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={disabled || uploading}
                />

                {showPreview && previewSrc && (
                    <img
                        src={previewSrc}
                        alt="תצוגה מקדימה"
                        className={previewClassName}
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                )}
            </div>

            {error && <p className="text-xs text-red-500 text-right">{error}</p>}
        </div>
    );
});

export default SmartImageInput;
