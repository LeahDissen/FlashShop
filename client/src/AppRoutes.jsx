import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import AdminRoute from "./components/AdminRoute";
import Layout from "./components/Layout";
import Terms from "./components/Terms";
import HomePage from "./pages/HomePage";

// עמודים שלא נדרשים בטעינה הראשונה נטענים רק כשנכנסים אליהם (חבילת JS קטנה יותר לדף הבית)
const AdminDashboardPage = lazy(() => import("./adminPage/AdminDashboardPage"));
const EditPages = lazy(() => import("./adminPage/EditPages"));
const OrderDetailPage = lazy(() => import("./adminPage/OrderDetailPage"));
const OrdersManagement = lazy(() => import("./adminPage/OrdersManagement"));
const ProductsManagement = lazy(() => import("./adminPage/ProductsManagement"));
const SendMailToClub = lazy(() => import("./adminPage/SendMailToClub"));
const UpdateCatalog = lazy(() => import("./adminPage/UpdateCatalog"));
const ViewMessages = lazy(() => import("./adminPage/ViewMessages"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const EditorPage = lazy(() => import("./pages/EditorPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const PhotoDevelopmentPage = lazy(() => import("./pages/PhotoDevelopmentPage"));
const ProductsPage = lazy(() => import("./pages/productsPage"));
const ProfilePage = lazy(() => import("./pages/profilePage"));
const ShoppingCartPage = lazy(() => import("./pages/ShoppingCartPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const TipsPage = lazy(() => import("./pages/TipsPage"));
const ProductSelectionPage = lazy(() => import("./pages/ProductSelectionPage"));
const CaptionIdeasPage = lazy(() => import("./pages/CaptionIdeasPage"));
const DesignFramesManagement = lazy(() => import("./adminPage/DesignFramesManagement"));
const EditorAssetsManagement = lazy(() => import("./adminPage/EditorAssetsManagement"));
const EditorSettingsManagement = lazy(() => import("./adminPage/EditorSettingsManagement"));
const ShopSettingsManagement = lazy(() => import("./adminPage/ShopSettingsManagement"));
const OrderConfirmationPage = lazy(() => import("./pages/OrderConfirmationPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));

/** מוצג לרגע בזמן שקוד העמוד נטען */
const PageLoader = () => (
    <div className="flex justify-center items-center min-h-[50vh]" role="status" aria-label="טוען">
        <div className="w-10 h-10 rounded-full border-4 border-[#f2665e]/20 border-t-[#f2665e] animate-spin" />
    </div>
);

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
            <Suspense fallback={<PageLoader />}>
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
                    <Route path="/editorassets" element={<AdminRoute><Layout><EditorAssetsManagement /></Layout></AdminRoute>} />
                    <Route path="/editorsettings" element={<AdminRoute><Layout><EditorSettingsManagement /></Layout></AdminRoute>} />
                    <Route path="/shopsettings" element={<AdminRoute><Layout><ShopSettingsManagement /></Layout></AdminRoute>} />
                    <Route path="/cart" element={<Layout> <ShoppingCartPage /> </Layout>} />
                    <Route path="/checkout" element={<Layout><CheckoutPage /></Layout>} />
                    <Route path="/order-confirmation/:orderId" element={<Layout><OrderConfirmationPage /></Layout>} />
                    <Route path="/products" element={<Layout> <ProductsPageWrapper /> </Layout>} />
                    <Route path="/editor/:productId" element={<Layout compact><EditorPageWrapper /></Layout>} />
                    <Route path="/photo-development" element={<Layout> <PhotoDevelopmentPage /> </Layout>} />
                    {/* Redirect to home */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Suspense>
        </Router>
    );
}