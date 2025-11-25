import Header from "./Header";
import NavBar from "./NavBar";
import Footer from "./Footer";
import Club from "./Club";
import Terms from "./Terms";

export default function Layout({ children }) {
    return (
        <div className="flex flex-col min-h-screen">
            <Terms />
            <Club />
            <header className="w-full">
                <div className="flex items-center justify-between w-full">
                    <div className="flex-1">
                        <NavBar />
                    </div>
                    <div className="w-40 md:w-56 lg:w-72 flex-shrink-0">
                        <Header />
                    </div>
                </div>
            </header>
            <main className="flex-1">
                {children}
            </main>
            <Footer />
        </div>
    );
}