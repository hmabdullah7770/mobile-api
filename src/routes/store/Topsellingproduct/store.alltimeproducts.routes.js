import { Router } from "express";
import { getAllTimeProducts } from "../../../controllers/store/mostSellingProduct/alltimeproduct.controller.js";
import  VerfyJwt from "../../../middlewares/auth.middleware.js";

import express from 'express';

// const router = Router();

const router = express.Router();

// Apply JWT verification to all routes
// router.use(VerfyJwt)

// Public route - anyone can view all-time best selling products
// router.route("/alltimeproducts").get(getAllTimeProducts);
router.get("/top-products/alltime", VerfyJwt,getAllTimeProducts);

// OR if you want it protected (only logged-in users can see)
// router.route("/alltime").get(verifyJWT, getAllTimeProducts);

export default router;