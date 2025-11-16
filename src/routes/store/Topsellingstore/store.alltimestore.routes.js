import { Router } from "express";
import { getAllTimeTopStore } from "../../../controllers/store/mostSellingStore/alltimestore.controller.js";
import  VerfyJwt from "../../../middlewares/auth.middleware.js";

import express from 'express';

// const router = Router();

const router = express.Router();

// Apply JWT verification to all routes
// router.use(VerfyJwt)

// Public route - anyone can view all-time best selling products
// router.route("/alltimeproducts").get(getAllTimeProducts);
router.get("/top-store/alltime", VerfyJwt,getAllTimeTopStore);

// OR if you want it protected (only logged-in users can see)
// router.route("/alltime").get(verifyJWT, getAllTimeProducts);

export default router;