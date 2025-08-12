import { Router } from 'express';
import {
    newAddComment,
    newDeleteComment,
    newGetComments,
    newGetCommentsWithRatings,
    newUpdateComment,
    newAddReply,           // New function
    newGetReplies          // New function
} from "../controllers/newcomment.controller.js"
import verifyJWT from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js"

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

// Comment routes
router.route("/:postId")
    .get(newGetComments)
    .post(
        upload.fields([
            { name: "audioComment", maxCount: 1 },
            { name: "videoComment", maxCount: 1 },
            { name: "sticker", maxCount: 1 }
        ]),
        newAddComment
    );

// Comment with ratings route
router.route("/with-ratings/:postId")
    .get(newGetCommentsWithRatings);

// Comment operations routes
router.route("/:commentId")
    .patch(
        upload.fields([
            { name: "audioComment", maxCount: 1 },
            { name: "videoComment", maxCount: 1 },
            { name: "sticker", maxCount: 1 }
        ]),
        newUpdateComment
    )
    .delete(newDeleteComment);

// Reply routes
router.route("/:commentId/replies")
    .get(newGetReplies);

router.route("/:commentId/reply")
    .post(
        upload.fields([
            { name: "audioComment", maxCount: 1 },
            { name: "videoComment", maxCount: 1 },
            { name: "sticker", maxCount: 1 }
        ]),
        newAddReply
    );

export default router;