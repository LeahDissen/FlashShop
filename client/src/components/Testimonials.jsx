import { useState, useEffect } from 'react';

const DEFAULT_TESTIMONIALS = [
    {
        id: 1,
        text: "המלצה חמה מלקוח מרוצה על השירות המעולה, המוצרים האיכותיים והחוויה הנפלאה. הכל היה מושלם מההתחלה ועד הסוף.",
        name: "מיכל לוי"
    },
    {
        id: 2,
        text: "פשוט וואו! לא האמנתי שאקבל יחס כזה אישי ומקצועי. ממליץ בחום לכל מי שמתלבט. בטוח אחזור שוב.",
        name: "דניאל כהן"
    },
    {
        id: 3,
        text: "המשלוח הגיע מהר מאוד, האריזה הייתה מושקעת והמוצר עצמו בדיוק כמו בתמונות. תודה רבה!",
        name: "נועה אברהם"
    }
];

/**
 * @param {{ items?: Array<{ id?: number|string, text?: string, name?: string }> }} props
 */
const Testimonials = ({ items }) => {
    const testimonials = Array.isArray(items) && items.length > 0
        ? items
        : DEFAULT_TESTIMONIALS;

    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        setCurrentIndex(0);
    }, [testimonials.length]);

    useEffect(() => {
        if (testimonials.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
        }, 4000);
        return () => clearInterval(interval);
    }, [testimonials.length]);

    return (
        <div className="max-w-md mx-auto relative px-4">
            <div className="overflow-hidden">
                <div
                    className="flex transition-transform duration-700 ease-in-out"
                    style={{ transform: `translateX(${currentIndex * 100}%)` }}
                >
                    {testimonials.map((item, index) => (
                        <div key={item.id ?? index} className="min-w-full flex justify-center p-2">
                            <div className="w-full text-center relative">
                                <p className="text-white text-sm md:text-base leading-relaxed mb-3">
                                    "{item.text}"
                                </p>
                                <h4 className="text-red-600 font-bold text-xs md:text-sm">
                                    {item.name}
                                </h4>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {testimonials.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                    {testimonials.map((_, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => setCurrentIndex(index)}
                            className={`h-2 w-2 rounded-full transition-all duration-300 ${
                                index === currentIndex ? "bg-white scale-125" : "bg-white/40"
                            }`}
                            aria-label={`עדות ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Testimonials;
export { DEFAULT_TESTIMONIALS };
