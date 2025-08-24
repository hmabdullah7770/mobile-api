import { Router } from "express";
import {
    addRating,
    deleteRating,
    getPostRatings,
    getPostRatingSummary,
    getUserRatingForPost,
    updateRating
} from "../controllers/rating.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router();

// ✅ Apply auth middleware to all rating routes
router.use(verifyJWT);

// ======================== RATINGS LIST & ADD ========================
router.route("/:postId")
    .get(getPostRatings)   // Get all ratings for a post
    .post(addRating);      // Add rating to a post

// ======================== UPDATE / DELETE RATING ========================
router.route("/rating/:ratingId")
    .patch(updateRating)   // Update user's rating
    .delete(deleteRating); // Delete user's rating

// ======================== SUMMARY ========================
router.route("/summary/:postId")
    .get(getPostRatingSummary); // Get rating summary (avg, count, distribution)

// ======================== USER'S RATING ========================
router.route("/user/:postId")
    .get(getUserRatingForPost); // Get current user's rating for a post

export default router;



// import { Router } from 'express';
// import {
//     addRating,
//     deleteRating,
//     getContentRatings,
//     getContentRatingSummary,
//     getUserRatingForContent,
//     updateRating
// } from "../controllers/rating.controller.js";
// import verifyJWT from "../middlewares/auth.middleware.js";

// const router = Router();

// router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

// // Routes for getting ratings
// router.route("/:contentType/:contentId")
//     .get(getContentRatings)
//     .post(addRating);

// // Routes for rating operations
// router.route("/:ratingId")
//     .patch(updateRating)
//     .delete(deleteRating);

// // Route for rating summary
// router.route("/summary/:contentType/:contentId")
//     .get(getContentRatingSummary);

// // Route for user's rating
// router.route("/user/:contentType/:contentId")
//     .get(getUserRatingForContent);

// export default router;