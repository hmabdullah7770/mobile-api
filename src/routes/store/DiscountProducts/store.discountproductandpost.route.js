
import { Router } from "express";
import { get100PercentDiscountpost ,get80PercentDiscountpost ,get50To80PercentDiscountpost,getlessthan100pricepost} from "../../../controllers/store/DiscountProduct/dscountproductpost.controller.js";
import  VerfyJwt from "../../../middlewares/auth.middleware.js";

import express from 'express';

// const router = Router();

const router = express.Router();

// Apply JWT verification to all routes
// router.use(VerfyJwt)

// Public route - anyone can view all-time best selling products
// router.route("/alltimeproducts").get(getAllTimeProducts);
router.get("/100-productspost/alltime", VerfyJwt,get100PercentDiscountpost);

router.get("/80-productspost/alltime", VerfyJwt,get80PercentDiscountpost);

router.get("/50to80-productspost/alltime", VerfyJwt,get50To80PercentDiscountpost);

router.get("/lessthan100-productspost/alltime", VerfyJwt,getlessthan100pricepost);

// OR if you want it protected (only logged-in users can see)
// router.route("/alltime").get(verifyJWT, getAllTimeProducts);

export default router;