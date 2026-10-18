import { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import AdminRoute from "./components/AdminRoute";
import Layout from "./components/Layout";
import Terms from "./components/Terms";
import HomePage from "./pages/HomePage";
import { getReturnPathAfterAdd } from './utils/photoOrderDraft';
import { useProductStore } from './store/productStore';
import { lazyWithReload } from "./utils/lazyWithReload";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { GOOGLE_CLIENT_ID } from "./config/api";

// Pages not needed on the first load are loaded only when visited (a smaller JS bundle for the home page)
const AdminDashboardPage = lazyWithReload(() => import("./adminPage/AdminDashboardPage"));
const EditPages = lazyWithReload(() => import("./adminPage/EditPages"));
const OrderDetailPage = lazyWithReload(() => import("./adminPage/OrderDetailPage"));
const OrdersManagement = lazyWithReload(() => import("./adminPage/OrdersManagement"));
const OrderEmailsManagement = lazyWithReload(() => import("./adminPage/OrderEmailsManagement"));
const ProductsManagement = lazyWithReload(() => import("./adminPage/ProductsManagement"));
const SendMailToClub = lazyWithReload(() => import("./adminPage/SendMailToClub"));
const UpdateCatalog = lazyWithReload(() => import("./adminPage/UpdateCatalog"));
const ViewMessages = lazyWithReload(() => import("./adminPage/ViewMessages"));
const BlogPage = lazyWithReload(() => import("./pages/BlogPage"));
const EditorPage = lazyWithReload(() => import("./pages/EditorPage"));
const ForgotPasswordPage = lazyWithReload(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazyWithReload(() => import("./pages/ResetPasswordPage"));
const LoginPage = lazyWithReload(() => import("./pages/LoginPage"));
const PhotoDevelopmentPage = lazyWithReload(() => import("./pages/PhotoDevelopmentPage"));
const ProductsPage = lazyWithReload(() => import("./pages/productsPage"));
const ProfilePage = lazyWithReload(() => import("./pages/profilePage"));
const ShoppingCartPage = lazyWithReload(() => import("./pages/ShoppingCartPage"));
const SignUpPage = lazyWithReload(() => import("./pages/SignUpPage"));
const TipsPage = lazyWithReload(() => import("./pages/TipsPage"));
const ProductSelectionPage = lazyWithReload(() => import("./pages/ProductSelectionPage"));
const CaptionIdeasPage = lazyWithReload(() => import("./pages/CaptionIdeasPage"));
const DesignFramesManagement = lazyWithReload(() => import("./adminPage/DesignFramesManagement"));
const EditorAssetsManagement = lazyWithReload(() => import("./adminPage/EditorAssetsManagement"));
const EditorSettingsManagement = lazyWithReload(() => import("./adminPage/EditorSettingsManagement"));
const PhotoPricingManagement = lazyWithReload(() => import("./adminPage/PhotoPricingManagement"));
const ShopSettingsManagement = lazyWithReload(() => import("./adminPage/ShopSettingsManagement"));
const PopupsManagement = lazyWithReload(() => import("./adminPage/PopupsManagement"));
const OrderConfirmationPage = lazyWithReload(() => import("./pages/OrderConfirmationPage"));
const PaymentResultPage = lazyWithReload(() => import("./pages/PaymentResultPage"));
const CheckoutPage = lazyWithReload(() => import("./pages/CheckoutPage"));

/** The Google sign-in script (~100KB) loads only on the login and signup pages */
const GoogleAuth = ({ children }) => (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{children}</GoogleOAuthProvider>
);

/** Shown briefly while the page's code loads */
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
        <EditorPage onNavigateToHome={() => navigate(getReturnPathAfterAdd(useProductStore.getState().selectedProduct, '/products'))} />
    );
};

export default function AppRoutes() {
    return (
        <Router>
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    {/* Login route - without Layout */}
                    <Route path="/login" element={<GoogleAuth><LoginPage /></GoogleAuth>} />
                    <Route path="/signup" element={<GoogleAuth><SignUpPage /></GoogleAuth>} />
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
                    <Route path="/orderemails" element={<AdminRoute><Layout><OrderEmailsManagement /></Layout></AdminRoute>} />
                    <Route path="/productsmanagement" element={<AdminRoute><Layout><ProductsManagement /></Layout></AdminRoute>} />
                    <Route path="/sendmail" element={<AdminRoute><Layout><SendMailToClub /></Layout></AdminRoute>} />
                    <Route path="/updatecatalog" element={<AdminRoute><Layout><UpdateCatalog /></Layout></AdminRoute>} />
                    <Route path="/viewmessages" element={<AdminRoute><Layout><ViewMessages /></Layout></AdminRoute>} />
                    <Route path="/designframes" element={<AdminRoute><Layout><DesignFramesManagement /></Layout></AdminRoute>} />
                    <Route path="/editorassets" element={<AdminRoute><Layout><EditorAssetsManagement /></Layout></AdminRoute>} />
                    <Route path="/editorsettings" element={<AdminRoute><Layout><EditorSettingsManagement /></Layout></AdminRoute>} />
                    <Route path="/photopricing" element={<AdminRoute><Layout><PhotoPricingManagement /></Layout></AdminRoute>} />
                    <Route path="/shopsettings" element={<AdminRoute><Layout><ShopSettingsManagement /></Layout></AdminRoute>} />
                    <Route path="/popups" element={<AdminRoute><Layout><PopupsManagement /></Layout></AdminRoute>} />
                    <Route path="/cart" element={<Layout> <ShoppingCartPage /> </Layout>} />
                    <Route path="/checkout" element={<Layout><CheckoutPage /></Layout>} />
                    <Route path="/order-confirmation/:orderId" element={<Layout><OrderConfirmationPage /></Layout>} />
                    <Route path="/payment/result" element={<Layout><PaymentResultPage /></Layout>} />
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