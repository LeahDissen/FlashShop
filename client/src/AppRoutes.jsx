import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import BlogPage from "./pages/BlogPage"
import Terms from "./components/Terms";
import LoginPage from "./pages/LoginPage";
import TipsPage from "./pages/TipsPage";
import SignUpPage from "./pages/SignUpPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";

export default function AppRoutes() {
    return (
        <Router>
            <Routes>
                {/* Login route - without Layout */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/forgot" element={<ForgotPasswordPage />} />
                {/* All other routes - with Layout */}
                <Route path="/" element={<Layout>  <HomePage /> </Layout>} />
                <Route path="/tips/*" element={<Layout><BlogPage /></Layout>} />
                <Route path="/terms" element={<Layout> <Terms /> </Layout>} />
                <Route path="/tips" element={<Layout> <TipsPage /> </Layout>} />
                {/* Redirect to home */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
}