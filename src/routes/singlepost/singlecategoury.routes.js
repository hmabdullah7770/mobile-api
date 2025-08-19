import express from "express";
import VerifyJwt from "../../middlewares/auth.middleware.js";
import {
  getSinglePostsByCategory,
  getFollowingSinglePosts
} from "../../controllers/singlepost/singlecategoury.controller.js";

const router = express.Router();

// Get single posts by category (query: ?category=Name&page=1&limit=10)
router.get("/category", VerifyJwt, getSinglePostsByCategory);

// Get following users' single posts (query: ?category=All&page=1&limit=10)
router.get("/following", VerifyJwt, getFollowingSinglePosts);

export default router;