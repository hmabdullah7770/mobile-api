import { Router } from "express";
import { getAllTimeProducts } from "../../../controllers/store/mostSellingProduct/alltimeproduct.controller.js";
import  VerifyJWT from "../../../middlewares/auth.middleware.js";

const router = Router();

// Apply JWT verification to all routes
router.use(VerifyJWT);

// Public route - anyone can view all-time best selling products
router.route("/alltimeprdoucts").get(getAllTimeProducts);

// OR if you want it protected (only logged-in users can see)
// router.route("/alltime").get(verifyJWT, getAllTimeProducts);

export default router;