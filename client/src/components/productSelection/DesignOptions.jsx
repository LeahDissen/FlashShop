import { Loader2, Palette, Sparkles, Type, Upload } from 'lucide-react';
import PrintOptionButton from '../PrintOptionButton';

const optionButtonClass = 'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium border transition-colors cursor-pointer';

/**
 * The ways to get a designed product: design it yourself, the shop's designer, upload a ready design,
 * caption ideas – and from quantity 2, a separate design for each copy.
 * `options` holds the button texts and hints (editable by the admin).
 */
export default function DesignOptions({
    options,
    quantity,
    designerFormOpen,
    isUploading,
    onDesign,
    onToggleDesigner,
    onUpload,
    onCaptionIdeas,
}) {
    const { selfDesign, designer, upload, captions, perCopy } = options;

    return (
        <>
            <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                <PrintOptionButton
                    hint={selfDesign.hint}
                    onClick={() => onDesign(false)}
                    className={`${optionButtonClass} border-[#f2665e]/30 text-[#f2665e] bg-white hover:bg-[#fff5f4] hover:border-[#f2665e]/50`}
                >
                    <Palette size={17} />
                    {selfDesign.label}
                </PrintOptionButton>

                <PrintOptionButton
                    hint={designer.hint}
                    onClick={onToggleDesigner}
                    className={`${optionButtonClass} ${
                        designerFormOpen
                            ? 'bg-[#f2665e] text-white border-[#f2665e]'
                            : 'border-[#f2665e]/30 text-[#f2665e] bg-white hover:bg-[#fff5f4] hover:border-[#f2665e]/50'
                    }`}
                >
                    <Sparkles size={17} />
                    {designer.label}
                </PrintOptionButton>

                <PrintOptionButton
                    hint={upload.hint}
                    onClick={onUpload}
                    disabled={isUploading}
                    className={`${optionButtonClass} border-[#f2665e] text-[#f2665e] bg-[#fff5f4] hover:bg-[#f2665e]/10 disabled:opacity-50`}
                >
                    {isUploading ? <Loader2 size={17} className="animate-spin" /> : <Upload size={17} />}
                    {isUploading ? 'מעלה...' : upload.label}
                </PrintOptionButton>

                <PrintOptionButton
                    hint={captions.hint}
                    onClick={onCaptionIdeas}
                    className={`${optionButtonClass} border-[#f2665e]/30 text-[#f2665e] bg-white hover:bg-[#fff5f4] hover:border-[#f2665e]/50`}
                >
                    <Type size={17} />
                    {captions.label}
                </PrintOptionButton>
            </div>

            {quantity > 1 && (
                <div className="w-full max-w-lg mt-3 space-y-2">
                    <p className="text-xs text-gray-600 leading-relaxed bg-[#fff5f4] border border-[#f2665e]/15 rounded-xl px-3 py-2">
                        תוכלו לעצב עיצוב אישי לכל אחד מעותקי המוצר שבחרתם בבחירה ב&quot;{perCopy.label}&quot;, או להשתמש באופציית &quot;{selfDesign.label}&quot; לעיצוב אחיד עבור כולם.
                    </p>
                    <PrintOptionButton
                        hint={perCopy.hint}
                        onClick={() => onDesign(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border border-[#f2665e] text-white bg-[#f2665e] hover:bg-[#d95248] transition-colors cursor-pointer"
                    >
                        <Palette size={17} />
                        {perCopy.label} ({quantity})
                    </PrintOptionButton>
                </div>
            )}
        </>
    );
}
