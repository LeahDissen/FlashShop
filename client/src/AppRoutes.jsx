import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import Blog from "./components/Blog";
import TermsModal from "./components/Terms";
import LoginPage from "./pages/LoginPage";
import Tips from "./pages/Tips";

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

                {/* Redirect to home */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
}