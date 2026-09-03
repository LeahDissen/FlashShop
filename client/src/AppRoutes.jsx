import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import AdminDashboardPage from "./adminPage/AdminDashboardPage";
import EditPages from "./adminPage/EditPages";
import OrderDetailPage from "./adminPage/OrderDetailPage";
import OrdersManagement from "./adminPage/OrdersManagement";
import ProductsManagement from "./adminPage/ProductsManagement";
import SendMailToClub from "./adminPage/SendMailToClub";
import UpdateCatalog from "./adminPage/UpdateCatalog";
import ViewMessages from "./adminPage/ViewMessages";
import AdminRoute from "./components/AdminRoute";
import Layout from "./components/Layout";
import Terms from "./components/Terms";
import BlogPage from "./pages/BlogPage";
import EditorPage from "./pages/EditorPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import PhotoDevelopmentPage from "./pages/PhotoDevelopmentPage";
import ProductsPage from "./pages/productsPage";
import ProfilePage from "./pages/profilePage";
import ShoppingCartPage from "./pages/ShoppingCartPage";
import SignUpPage from "./pages/SignUpPage";
import TipsPage from "./pages/TipsPage";
import ProductSelectionPage from "./pages/ProductSelectionPage";
import CaptionIdeasPage from "./pages/CaptionIdeasPage";
import DesignFramesManagement from "./adminPage/DesignFramesManagement";
import EditorSettingsManagement from "./adminPage/EditorSettingsManagement";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import CheckoutPage from "./pages/CheckoutPage";

const ProductsPageWrapper = () => {
    const navigate = useNavigate();
    return <ProductsPage onNavigate={(path) => navigate(path)} />;
};

const EditorPageWrapper = () => {
    const navigate = useNavigate();
    return (
        <EditorPage
            onNavigateToHome={() => navigate('/products')}
            onNavigateToCart={() => navigate('/cart')}
        />
    );
};

export default function AppRoutes() {
    return (
        <Router>
            <Routes>
                {/* Login route - without Layout */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/forgot" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                {/* All other routes - with Layout */}
                <Route path="/" element={<Layout><HomePage /></Layout>} />
                <Route path="/tips/*" element={<Layout><BlogPage /></Layout>} />
                <Route path="/terms" element={<Layout><Terms /></Layout>} />
                <Route path="/tips" element={<Layout><TipsPage /></Layout>} />
                <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
                <Route path="/product-selection/:productId" element={<Layout><ProductSelectionPage /></Layout>} />
                <Route path="/product-selection/:productId/caption-ideas" element={<Layout><CaptionIdeasPage /></Layout>} />
                {/* Only admin can see this link */}
                <Route path="/admindashboard" element={<AdminRoute><Layout><AdminDashboardPage /></Layout></AdminRoute>} />
                <Route path="/editpages" element={<AdminRoute><Layout><EditPages /></Layout></AdminRoute>} />
                <Route path="/ordersmanagement" element={<AdminRoute><Layout><OrdersManagement /></Layout></AdminRoute>} />
                <Route path="/ordersmanagement/:orderId" element={<AdminRoute><Layout><OrderDetailPage /></Layout></AdminRoute>} />
                <Route path="/productsmanagement" element={<AdminRoute><Layout><ProductsManagement /></Layout></AdminRoute>} />
                <Route path="/sendmail" element={<AdminRoute><Layout><SendMailToClub /></Layout></AdminRoute>} />
                <Route path="/updatecatalog" element={<AdminRoute><Layout><UpdateCatalog /></Layout></AdminRoute>} />
                <Route path="/viewmessages" element={<AdminRoute><Layout><ViewMessages /></Layout></AdminRoute>} />
                <Route path="/designframes" element={<AdminRoute><Layout><DesignFramesManagement /></Layout></AdminRoute>} />
                <Route path="/editorsettings" element={<AdminRoute><Layout><EditorSettingsManagement /></Layout></AdminRoute>} />
                <Route path="/cart" element={<Layout> <ShoppingCartPage /> </Layout>} />
                <Route path="/checkout" element={<Layout><CheckoutPage /></Layout>} />
                <Route path="/order-confirmation/:orderId" element={<Layout><OrderConfirmationPage /></Layout>} />
                <Route path="/products" element={<Layout> <ProductsPageWrapper /> </Layout>} />
                <Route path="/editor/:productId" element={<Layout compact><EditorPageWrapper /></Layout>} />
                <Route path="/photo-development" element={<Layout> <PhotoDevelopmentPage /> </Layout>} />
                {/* Redirect to home */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
}