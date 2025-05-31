import express from "express";
import {
     createbanner,
     getBanner ,
 deleteBanner,
   
} from "../controllers/banner.controller.js";
import VerifyJwt from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";



// // Apply JWT verification to all routes
// router.use(VerifyJwt);
const router = express.Router();
// Create banner route
router.post(
    "/createbanner",
    upload.fields([
        {
            name: "bannerImage",
            maxCount: 1
        }
    ]),
    VerifyJwt,
   createbanner
);

// Get available slots route
router.get("/getbanner",  getBanner);

// // Get all banners route
// router.get("/", getAllBanners);

// Delete banner route
router.delete("/deletebanner",VerifyJwt ,deleteBanner);

// // Get monthly banner count route
// router.get("/monthly-count", getMonthlyBannerCount);

export default router;
