import { Router } from 'express';
import {
    getUserFollowing,
    getUserFollowers,
    toggleFollow,
    isFollowing,
    getUserFollowStats
} from "../controllers/followlist.controller.js"
import verifyJWT from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

// Toggle follow status
router.route("/toggle/:followingId").post(toggleFollow);

// Get user followers
router.route("/followers/:userId").get(getUserFollowers);

// Get user following
router.route("/following/:userId").get(getUserFollowing);

// Check if user is following another user
router.route("/is-following/:userId").get(isFollowing);

// Get user follow stats
router.route("/stats/:userId").get(getUserFollowStats);

export default router