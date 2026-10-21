import { optimizeImageUrl, screenWidthImageSize } from '../../utils/imageUrl';

/** The banner at the top of the product page: the products page image with the product name and a wave */
export default function ProductHeroBanner({ title, imageUrl }) {
    return (
        <div className="w-full relative">
            <div
                className="relative h-[160px] sm:h-[200px] bg-cover bg-center flex items-center justify-center text-white"
                style={{ backgroundImage: `url(${optimizeImageUrl(imageUrl || '', { width: screenWidthImageSize() })})`, backgroundColor: '#a39589' }}
            >
                <div className="absolute inset-0 bg-black/15"></div>
                <h1 className="relative z-10 text-3xl sm:text-4xl font-bold text-center text-white tracking-wide drop-shadow-sm" style={{ fontFamily: "'Noto Sans Hebrew', sans-serif" }}>
                    {title}
                </h1>
                <div className="absolute -bottom-px left-0 w-full leading-[0] rotate-180 z-10">
                    <svg
                        className="relative block w-full h-[42px] sm:h-[52px]"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 1200 120"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                    >
                        <path
                            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                            fill="#faf8f6"
                        />
                    </svg>
                </div>
            </div>
        </div>
    );
}
