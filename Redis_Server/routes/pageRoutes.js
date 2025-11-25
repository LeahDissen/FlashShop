import express from "express";
import {
    getAboutPage,
    updateAboutPage,
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
    getClubPage,
    updateClubPage
} from "../controllers/pageController.js";

const router = express.Router();

// Headers Page Routes
router.get("/header", getHeaderPage);
router.put("/header", updateHeaderPage);

// Home Page Routes
router.get("/home", getHomePage);
router.put("/home", updateHomePage);

// About Page Routes
router.get("/about", getAboutPage);
router.put("/about", updateAboutPage);

// Terms Page Routes
router.get("/terms", getTermsPage);
router.put("/terms", updateTermsPage);

// Tips Page Routes
router.get("/tips", getTipsPage);
router.put("/tips", updateTipsPage);

// Club Page Routes
router.get("/club", getClubPage);
router.put("/club", updateClubPage);

// Footer Page Routes
router.get("/footer", getFooterPage);
router.put("/footer", updateFooterPage);
export default router;
