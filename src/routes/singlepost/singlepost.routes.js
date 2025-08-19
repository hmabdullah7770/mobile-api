import express from 'express';
import {
    getAllSinglePosts,
    getSinglePostById,
    publishSinglePost
} from "../../controllers/singlepost/singlepost.controller.js";
import { getSinglePostsByCategory, getFollowingSinglePosts } from "../../controllers/singlepost/singlecategoury.controller.js";
import VerifyJwt from "../../middlewares/auth.middleware.js";
import { upload } from "../../middlewares/multer.middleware.js";

const router = express.Router();

// Get all single posts
router.get("/getall", VerifyJwt, getAllSinglePosts);

// Get single posts by category
router.get("/category", VerifyJwt, getSinglePostsByCategory);

// Get following single posts
router.get("/following", VerifyJwt, getFollowingSinglePosts);

// Create/publish a new single post
router.post("/create",
    VerifyJwt,
    upload.fields([
        { name: "imageFile1", maxCount: 1 },
        { name: "imageFile2", maxCount: 1 },
        { name: "imageFile3", maxCount: 1 },
        { name: "imageFile4", maxCount: 1 },
        { name: "imageFile5", maxCount: 1 },
        { name: "videoFile1", maxCount: 1 },
        { name: "videoFile2", maxCount: 1 },
        { name: "videoFile3", maxCount: 1 },
        { name: "videoFile4", maxCount: 1 },
        { name: "videoFile5", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 }
    ]),
    publishSinglePost
);

// Get a specific single post by ID
router.get("/:postId", VerifyJwt, getSinglePostById);

export default router;