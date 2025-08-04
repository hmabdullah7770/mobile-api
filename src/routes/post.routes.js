import express from 'express';
import {
    deletePost,
    getAllPosts,
    getPostById,
    publishPost,
    togglePublishStatus,
    updatePost,
    incrementSocialLinkView,
    removeMediaFiles
} from "../controllers/post.controller.js";
import VerifyJwt from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// Get all posts
router.get("/post", VerifyJwt, getAllPosts);

// Create/publish a new post
router.post("/post/create",
    VerifyJwt,
    upload.fields([
        { name: "imageFiles", maxCount: 10 },  // Multiple images
        { name: "videoFiles", maxCount: 5 },   // Multiple videos
        { name: "audioFiles", maxCount: 5 },   // Multiple audio files
        { name: "thumbnail", maxCount: 1 }     // Single thumbnail
    ]),
    publishPost
);

// Get a specific post by ID
router.get("/post/:postId", VerifyJwt, getPostById);

// Delete a post
router.delete("/post/:postId", VerifyJwt, deletePost);

// Update a post
router.patch("/post/:postId",
    VerifyJwt,
    upload.fields([
        { name: "imageFiles", maxCount: 10 },  // Additional images
        { name: "videoFiles", maxCount: 5 },   // Additional videos
        { name: "audioFiles", maxCount: 5 },   // Additional audio files
        { name: "thumbnail", maxCount: 1 }     // Update thumbnail
    ]),
    updatePost
);

// Toggle publish status
router.patch("/post/toggle/publish/:postId", VerifyJwt, togglePublishStatus);

// Increment social link view count
router.get("/post/:postId/social/:linkType", incrementSocialLinkView);

// Remove specific media files from post
router.patch("/post/:postId/remove-media", VerifyJwt, removeMediaFiles);

export default router;

// Alternative format (commented out) - using Router() with .use() middleware
// import { Router } from 'express';
// import {
//     deletePost,
//     getAllPosts,
//     getPostById,
//     publishPost,
//     togglePublishStatus,
//     updatePost,
//     incrementSocialLinkView,
//     removeMediaFiles
// } from "../controllers/post.controller.js"
// import VerifyJwt from "../middlewares/auth.middleware.js"
// import {upload} from "../middlewares/multer.middleware.js"

// const router = Router();
// router.use(VerifyJwt); // Apply verifyJWT middleware to all routes in this file

// router
//     .route("/post")
//     .get(getAllPosts)
//     .post(
//         upload.fields([
//             {
//                 name: "imageFiles",
//                 maxCount: 10,
//             },
//             {
//                 name: "videoFiles",
//                 maxCount: 5,
//             },
//             {
//                 name: "audioFiles",
//                 maxCount: 5,
//             },
//             {
//                 name: "thumbnail",
//                 maxCount: 1,
//             },
//         ]),
//         publishPost
//     );

// router
//     .route("/post/:postId")
//     .get(getPostById)
//     .delete(deletePost)
//     .patch(
//         upload.fields([
//             {
//                 name: "imageFiles",
//                 maxCount: 10,
//             },
//             {
//                 name: "videoFiles",
//                 maxCount: 5,
//             },
//             {
//                 name: "audioFiles",
//                 maxCount: 5,
//             },
//             {
//                 name: "thumbnail",
//                 maxCount: 1,
//             },
//         ]),
//         updatePost
//     );

// router.route("/post/toggle/publish/:postId").patch(togglePublishStatus);

// // Additional routes for post-specific functionality
// router.route("/post/:postId/social/:linkType").get(incrementSocialLinkView);
// router.route("/post/:postId/remove-media").patch(removeMediaFiles);

// export default router