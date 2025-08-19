import { Router } from 'express';
import {
    getSinglePostComments,
    addSinglePostComment,
    addSinglePostReply,
    getSinglePostReplies
} from "../../controllers/singlepost/singlepostcomment.controller.js";
import verifyJWT from "../../middlewares/auth.middleware.js";
import { upload } from "../../middlewares/multer.middleware.js";

const router = Router();
router.use(verifyJWT);

router.route("/:postId")
    .get(getSinglePostComments)
    .post(
        upload.fields([
            { name: "audioComment", maxCount: 1 },
            { name: "videoComment", maxCount: 1 },
            { name: "sticker", maxCount: 1 }
        ]),
        addSinglePostComment
    );

router.route("/:commentId/reply")
    .post(
        upload.fields([
            { name: "audioComment", maxCount: 1 },
            { name: "videoComment", maxCount: 1 },
            { name: "sticker", maxCount: 1 }
        ]),
        addSinglePostReply
    );

router.route("/:commentId/replies")
    .get(getSinglePostReplies);

export default router;