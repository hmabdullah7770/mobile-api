import express from "express";
import { upload } from "../../middlewares/multer.middleware.js";
import VerfyJwt from "../../middlewares/auth.middleware.js";
import { verifyStoreOwner } from "../../middlewares/store.middleware.js";
import {
  createCarousel,
  getStoreCarousels,
  updateCarousel,
  deleteCarousel,
} from "../../controllers/store/store_carousel.controller.js";

const router = express.Router();

// Apply JWT verification middleware to all routes
router.use(VerfyJwt);

//my efforts 😂🥳
// router.get("/:storeId/carousels", getStoreCarousels);

// Routes that require store ownership verification
// router.use('/:storeId/m', verifyStoreOwner);

// Create a new carousel (store owner only)
router.post(
  // /:storeId/carousels/create
  // "/:storeId/carousels/create",
  "/carousels/:storeId/create",
  verifyStoreOwner,
  upload.fields([{ name: "images", maxCount: 10 }]),
  // verifyStoreOwner,
  createCarousel
);

// Get all carousels for a store (any authorized user)
  router.get('/carousels/store/:storeId', getStoreCarousels);
// router.get("/:storeId/carousels", getStoreCarousels);


// Update a carousel (store owner only)
router.patch(
  "/carousels/:carouselId/store/:storeId",
  verifyStoreOwner,
  upload.fields([{ name: "images", maxCount: 10 }]),
  updateCarousel
);

// Delete a carousel (store owner only)
router.delete(
  "/carousels/:carouselId/store/:storeId",
  verifyStoreOwner,
  deleteCarousel
);

export default router;










// import express from 'express';
// import { upload } from '../../middlewares/multer.middleware.js';
// import VerfyJwt from '../../middlewares/auth.middleware.js';
// import { verifyStoreOwner } from '../../middlewares/store.middleware.js';
// import {
//     createCarousel,
//     getStoreCarousels,
//     updateCarousel,
//     deleteCarousel
// } from '../../controllers/store/store_carousel.controller.js';

// const router = express.Router();

// // Apply JWT verification middleware to all routes
// router.use(VerfyJwt);

// // Routes for store carousels (listing)
// router.route("/store/:storeId/carousels")
//     .get(getStoreCarousels);

// // Routes for creating carousels
// router.route("/:storeId/carousels/create")
//     .post(
//         verifyStoreOwner,
//         upload.fields([
//             { name: 'images', maxCount: 10 }
//         ]),
//         createCarousel
//     );

// // Routes for specific carousel operations
// router.route("/carousels/:carouselId")
//     .patch(
//         verifyStoreOwner,
//         upload.fields([
//             { name: 'images', maxCount: 10 }
//         ]),
//         updateCarousel
//     );

// // Routes for deleting carousels
// router.route("/carousels/:carouselId/store/:storeId")
//     .delete(verifyStoreOwner, deleteCarousel);

// export default router;














