import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import AdminRoute from "./components/AdminRoute";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import BlogPage from "./pages/BlogPage"
import Terms from "./components/Terms";
import LoginPage from "./pages/LoginPage";
import TipsPage from "./pages/TipsPage";
import ProductsPage from "./pages/productsPage";
import EditorPage from "./pages/EditorPage";
import PhotoDevelopmentPage from "./pages/PhotoDevelopmentPage";
import SignUpPage from "./pages/SignUpPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import AdminDashboardPage from "./adminPage/AdminDashboardPage";
import EditPages from "./adminPage/EditPages";
import OrdersManagement from "./adminPage/OrdersManagement";
import ProductsManagement from "./adminPage/ProductsManagement";
import SendMailToClub from "./adminPage/SendMailToClub";
import UpdateCatalog from "./adminPage/UpdateCatalog";
import ViewMessages from "./adminPage/ViewMessages";
import ShoppingCartPage from "./pages/ShoppingCartPage";

// Wrapper to provide navigation prop to ProductsPage if needed, 
// though ProductsPage could also use useNavigate directly.
// For now, keeping onNavigate prop as requested in original code structure.
const ProductsPageWrapper = () => {
    const navigate = useNavigate();
    return <ProductsPage onNavigate={(path) => navigate(path)} />;
};

const EditorPageWrapper = () => {
    const navigate = useNavigate();
    return <EditorPage onNavigateToHome={() => navigate('/products')} />;
};

export default function AppRoutes() {
    return (
        <Router>
            <Routes>
                {/* Login route - without Layout */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/forgot" element={<ForgotPasswordPage />} />
                {/* All other routes - with Layout */}
                <Route path="/" element={<Layout><HomePage /></Layout>} />
                <Route path="/tips/*" element={<Layout><BlogPage /></Layout>} />
                <Route path="/terms" element={<Layout><Terms /></Layout>} />
                <Route path="/tips" element={<Layout><TipsPage /></Layout>} />

                {/* Only admin can see this link */}
                <Route path="/admindashboard" element={<AdminRoute><Layout><AdminDashboardPage /></Layout></AdminRoute>} />
                <Route path="/editpages" element={<AdminRoute><Layout><EditPages /></Layout></AdminRoute>} />
                <Route path="/ordersmanagement" element={<AdminRoute><Layout><OrdersManagement /></Layout></AdminRoute>} />
                <Route path="/productsmanagement" element={<AdminRoute><Layout><ProductsManagement /></Layout></AdminRoute>} />
                <Route path="/sendmail" element={<AdminRoute><Layout><SendMailToClub /></Layout></AdminRoute>} />
                <Route path="/updatecatalog" element={<AdminRoute><Layout><UpdateCatalog /></Layout></AdminRoute>} />
                <Route path="/viewmessages" element={<AdminRoute><Layout><ViewMessages /></Layout></AdminRoute>} />
                <Route path="/cart" element={<Layout> <ShoppingCartPage /> </Layout>} />
                <Route path="/products" element={<Layout> <ProductsPageWrapper /> </Layout>} />
                <Route path="/editor" element={<Layout> <EditorPageWrapper /> </Layout>} />
                <Route path="/photo-development" element={<Layout> <PhotoDevelopmentPage /> </Layout>} />
                {/* Redirect to home */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
}