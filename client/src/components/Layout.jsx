import Header from "./Header";
import NavBar from "./NavBar";
import Footer from "./Footer";
import Club from "./Club";
import Terms from "./Terms";

export default function Layout({ children }) {
    return (
        <div className="flex flex-col min-h-screen font-sans">
            <Terms />
            <Club />
            
            <header className="w-full bg-white/60 backdrop-blur-md shadow-sm sticky top-0 z-40 h-20 transition-all duration-300">
                <div className="max-w-screen-2xl mx-auto px-4 h-full flex items-center">
                    
                    <div className="flex-shrink-0 ml-8">
                        <Header />
                    </div>

                    <div className="flex-1 h-full">
                        <NavBar />
                    </div>
                    
                </div>
            </header>

            <main className="flex-1 bg-gray-50">
                {children}
            </main>
            <Footer />
        </div>
    );
}