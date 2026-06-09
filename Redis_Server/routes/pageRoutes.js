import express from "express";
import {
    getAboutPage,
    updateAboutPage,
    getClubPage,
    updateClubPage,
    getHeaderPage,
    updateHeaderPage,
    getFooterPage,
    updateFooterPage,
    getTermsPage,
    updateTermsPage,
    getHomePage,
    updateHomePage,
    getTipsPage,
    updateTipsPage,
    getProductsPage,
    updateProductsPage,
    getPhotosPage,
    updatePhotosPage,
    getCartPage,
    updateCartPage,
    getProductCategoriesPage,
    updateProductCategoriesPage,
} from "../controllers/pageController.js";
import { authAdmin } from "../middlewares/auth.js";

const router = express.Router();

// Headers Page Routes
router.get("/header", getHeaderPage);
router.put("/header", authAdmin, updateHeaderPage);

// Home Page Routes
router.get("/home", getHomePage);
router.put("/home", authAdmin, updateHomePage);

// About Page Routes
router.get("/about", getAboutPage);
router.put("/about", authAdmin, updateAboutPage);

// Terms Page Routes
router.get("/terms", getTermsPage);
router.put("/terms", authAdmin, updateTermsPage);

// Tips Page Routes
router.get("/tips", getTipsPage);
router.put("/tips", authAdmin, updateTipsPage);

// Club Page Routes
router.get("/club", getClubPage);
router.put("/club", authAdmin, updateClubPage);

// Products Page Routes
router.get("/products", getProductsPage);
router.put("/products", authAdmin, updateProductsPage);

// Photos Developer Page Routes
router.get("/photos", getPhotosPage);
router.put("/photos", authAdmin, updatePhotosPage);

// Cart Page Routes
router.get("/cart", getCartPage);
router.put("/cart", authAdmin, updateCartPage);

// Footer Page Routes
router.get("/footer", getFooterPage);
router.put("/footer", authAdmin, updateFooterPage);

// Product Categories (custom admin-defined)
router.get("/product-categories", getProductCategoriesPage);
router.put("/product-categories", authAdmin, updateProductCategoriesPage);

export default router;
