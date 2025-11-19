
import { Router } from "express";
import { get100PercentDiscount ,get80PercentDiscount ,get50To80PercentDiscount,getlessthan100price} from "../../../controllers/store/DiscountProduct/discountproduct.controller.js";
import  VerfyJwt from "../../../middlewares/auth.middleware.js";

import express from 'express';

// const router = Router();

const router = express.Router();

// Apply JWT verification to all routes
// router.use(VerfyJwt)

// Public route - anyone can view all-time best selling products
// router.route("/alltimeproducts").get(getAllTimeProducts);
router.get("/100-products/alltime", VerfyJwt, get100PercentDiscount);

router.get("/80-products/alltime", VerfyJwt,get80PercentDiscount);

router.get("/50to80-products/alltime", VerfyJwt,get50To80PercentDiscount);

router.get("/lessthan100-products/alltime", VerfyJwt,getlessthan100price);

// OR if you want it protected (only logged-in users can see)
// router.route("/alltime").get(verifyJWT, getAllTimeProducts);

export default router;