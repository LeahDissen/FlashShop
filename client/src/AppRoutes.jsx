import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import Blog from "./components/Blog";
import TermsModal from "./components/Terms";
import LoginPage from "./pages/LoginPage";
import Tips from "./pages/Tips";
import ProductsPage from "./pages/productsPage";
import EditorPage from "./pages/EditorPage";

// Wrapper to provide navigation prop to ProductsPage if needed, 
// though ProductsPage could also use useNavigate directly.
// For now, keeping onNavigate prop as requested in original code structure.
const ProductsPageWrapper = () => {
    const navigate = useNavigate();
    return <ProductsPage onNavigate={(path) => navigate(path)} />;
};

const EditorPageWrapper = () => {
    const navigate = useNavigate();
    return <EditorPage onNavigateToHome={() => navigate('/')} />;
};

export default function AppRoutes() {
    return (
        <Router>
            <Routes>
                {/* Login route - without Layout */}
                <Route path="/logIn" element={<LoginPage />} />

                {/* All other routes - with Layout */}
                <Route path="/" element={<Layout>  <HomePage /> </Layout>} />
                <Route path="/tips/*" element={<Layout><Blog /></Layout>} />
                <Route path="/terms" element={<Layout> <TermsModal /> </Layout>} />
                <Route path="/tips" element={<Layout> <Tips /> </Layout>} />

                <Route path="/products" element={<Layout> <ProductsPageWrapper /> </Layout>} />
                <Route path="/editor" element={<Layout> <EditorPageWrapper /> </Layout>} />

                {/* Redirect to home */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
}