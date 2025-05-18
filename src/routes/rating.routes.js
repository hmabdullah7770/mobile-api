import { Router } from 'express';
import {
    addRating,
    deleteRating,
    getContentRatings,
    getContentRatingSummary,
    getUserRatingForContent,
    updateRating
} from "../controllers/rating.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

// Routes for getting ratings
router.route("/:contentType/:contentId")
    .get(getContentRatings)
    .post(addRating);

// Routes for rating operations
router.route("/:ratingId")
    .patch(updateRating)
    .delete(deleteRating);

// Route for rating summary
router.route("/summary/:contentType/:contentId")
    .get(getContentRatingSummary);

// Route for user's rating
router.route("/user/:contentType/:contentId")
    .get(getUserRatingForContent);

export default router;