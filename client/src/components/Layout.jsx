import Club from "./Club";
import Footer from "./Footer";
import Header from "./Header";
import NavBar from "./NavBar";
import PopupHost from "./PopupHost";
import Terms from "./Terms";
import ToastHost from "./ToastHost";

export default function Layout({ children, compact = false }) {
    return (
        <div className={`flex flex-col font-sans ${compact ? 'h-[100dvh] max-h-[100dvh] overflow-hidden' : 'min-h-screen'}`}>
            <Terms />
            <Club />
            <ToastHost />
            {!compact && <PopupHost />}

            {/* In the editor: hide the navigation on mobile to make room for the canvas */}
            <header
                className={`w-full bg-white/60 backdrop-blur-md shadow-sm sticky top-0 z-50 h-20 transition-all duration-300 overflow-visible ${
                    compact ? 'hidden lg:block' : ''
                }`}
            >
                <div className="max-w-screen-2xl mx-auto px-4 h-full flex items-center overflow-visible">
                    <div className="flex-shrink-0 ml-3 sm:ml-8">
                        <Header />
                    </div>
                    <div className="flex-1 h-full overflow-visible">
                        <NavBar />
                    </div>
                </div>
            </header>

            <main className="flex-1 bg-gray-50 flex flex-col min-h-0 overflow-hidden">
                {children}
            </main>
            {!compact && <Footer />}
        </div>
    );
}
