/** Add a text box, or a caption at the bottom of the photo */
const TextPanel = ({ addTextElement, addCaptionElement, captionDefaults }) => {
    return (
        <div className="p-4">
            <div className="space-y-3">
                <h3 className="text-xl font-bold text-gray-800 mb-1 text-right">סגנון טקסט</h3>
                <p className="text-sm text-gray-500 mb-4 text-right">הקש על טקסט כדי להוסיף לדף</p>
                <button
                    onClick={addTextElement}
                    className="w-full text-center py-3 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
                >
                    הוסף תיבת טקסט
                </button>
                <button
                    onClick={addCaptionElement}
                    className="w-full text-center py-3 rounded-lg border border-red-200 bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors"
                >
                    {captionDefaults?.buttonLabel || 'הוסף כתובית לתמונה'}
                </button>
                <p className="text-xs text-gray-500 text-right">
                    הכתובית נוספת בתחתית התמונה. אחרי הבחירה ניתן לשנות גופן, צבע וגודל בסרגל העליון.
                </p>
            </div>
        </div>
    );
};

export default TextPanel;
