import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, Loader2 } from "lucide-react";
import { getProductById } from "../api/products";
import { CAPTION_CATEGORIES } from "../constants/captionCategories";

export default function CaptionIdeasPage() {
    const { productId } = useParams();
    const navigate = useNavigate();

    const [captions, setCaptions] = useState([]);
    const [productName, setProductName] = useState("");
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);
    const [activeCategory, setActiveCategory] = useState("הכל");

    useEffect(() => {
        if (!productId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        getProductById(productId)
            .then((product) => {
                setProductName(product?.name ?? "");
                setCaptions(product?.captionIdeas ?? []);
            })
            .catch((error) => {
                console.error("Failed to load product captions:", error);
                setCaptions([]);
            })
            .finally(() => setLoading(false));
    }, [productId]);

    const categories = useMemo(() => {
        const fromData = [...new Set(captions.map((c) => c.category).filter(Boolean))];
        return [
            "הכל",
            ...CAPTION_CATEGORIES.filter((c) => fromData.includes(c) || c === "כללי"),
            ...fromData.filter((c) => !CAPTION_CATEGORIES.includes(c)),
        ];
    }, [captions]);

    const filteredCaptions = useMemo(() => {
        if (activeCategory === "הכל") return captions;
        return captions.filter((c) => c.category === activeCategory);
    }, [captions, activeCategory]);

    const handleCopy = async (caption) => {
        try {
            await navigator.clipboard.writeText(caption.text);
            setCopiedId(caption._id);
            window.setTimeout(() => setCopiedId(null), 2000);
        } catch {
            alert("לא ניתן להעתיק. נסו לסמן ולהעתיק ידנית.");
        }
    };

    return (
        <div className="min-h-screen bg-[#faf8f6]" dir="rtl">
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                    <button
                        type="button"
                        onClick={() => navigate(productId ? `/product-selection/${productId}` : "/products")}
                        className="flex items-center gap-2 text-gray-500 hover:text-[#f2665e] transition-colors font-medium text-sm mb-6 cursor-pointer"
                    >
                        <ArrowLeft size={18} className="rotate-180" />
                        חזרה למוצר
                    </button>
                    <h1 className="text-3xl sm:text-4xl font-bold text-[#f2665e] mb-3">רעיונות לכיתובים</h1>
                    <p className="text-gray-600 max-w-2xl leading-relaxed">
                        {productName
                            ? `משפטים מתאימים להדפסה על ${productName}. לחצו על "העתקה" והדביקו בעורך העיצוב.`
                            : "השראה לכיתובים שאפשר להדפיס על המוצרים שלכם. לחצו על \"העתקה\" והדביקו בעורך העיצוב."}
                    </p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
                {captions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-bold border transition-all cursor-pointer ${
                                    activeCategory === cat
                                        ? "bg-[#f2665e] text-white border-[#f2665e]"
                                        : "bg-white text-[#f2665e] border-[#f2665e]/20 hover:bg-[#f2665e]/10"
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-16 text-gray-500">
                        <Loader2 className="animate-spin mr-2" size={20} />
                        טוען רעיונות...
                    </div>
                ) : filteredCaptions.length === 0 ? (
                    <p className="text-center text-gray-500 py-16">
                        {captions.length === 0
                            ? "עדיין לא הוגדרו משפטים מתאימים למוצר זה"
                            : "אין כיתובים בקטגוריה זו"}
                    </p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filteredCaptions.map((caption) => (
                            <div
                                key={caption._id}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <span className="text-xs font-bold text-[#f2665e] bg-[#f2665e]/10 px-3 py-1 rounded-full shrink-0">
                                        {caption.category || "כללי"}
                                    </span>
                                </div>
                                <p className="text-lg font-semibold text-gray-800 leading-relaxed flex-1">
                                    &quot;{caption.text}&quot;
                                </p>
                                <button
                                    type="button"
                                    onClick={() => handleCopy(caption)}
                                    className="self-start flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border border-[#f2665e]/20 text-[#f2665e] hover:bg-[#f2665e]/10 transition-all cursor-pointer"
                                >
                                    <Copy size={15} />
                                    {copiedId === caption._id ? "הועתק!" : "העתקה"}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
