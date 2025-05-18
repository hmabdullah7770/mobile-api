import express from "express";
import {
    createBanner,
    getAvailableSlots,
    getAllBanners,
    deleteBanner,
    getMonthlyBannerCount
} from "../controllers/banner.controller.js";
import VerifyJwt from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// Apply JWT verification to all routes
router.use(VerifyJwt);

// Create banner route
router.post(
    "/",
    upload.fields([
        {
            name: "backgroundImage",
            maxCount: 1
        }
    ]),
    createBanner
);

// Get available slots route
router.get("/slots", getAvailableSlots);

// Get all banners route
router.get("/", getAllBanners);

// Delete banner route
router.delete("/:bannerId", deleteBanner);

// Get monthly banner count route
router.get("/monthly-count", getMonthlyBannerCount);

export default router;
