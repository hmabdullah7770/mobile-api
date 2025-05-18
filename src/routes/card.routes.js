import express from 'express';
import { 
    deleteCard,
    getAllCards,
    getCardById,
    publishCard,
    togglePublishStatus,
    updateCard 
} from "../controllers/card.controller.js";
import VerifyJwt from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// Get all cards
router.get("/", VerifyJwt, getAllCards);

// Create/publish a new card
router.post("/", 
    VerifyJwt,
    upload.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 }
    ]),
    publishCard
);

// Get a specific card by ID
router.get("/:cardId", VerifyJwt, getCardById);

// Delete a card
router.delete("/:cardId", VerifyJwt, deleteCard);

// Update a card
router.patch("/:cardId", 
    VerifyJwt,
    upload.single("thumbnail"),
    updateCard
);

// Toggle publish status
router.patch("/toggle/publish/:cardId", VerifyJwt, togglePublishStatus);

export default router;















// import { Router } from 'express';
// import {
//     deleteCard,
//     getAllCards,
//     getCardById,
//     publishCard,
//     togglePublishStatus,
//     updateCard,
// } from "../controllers/card.controller.js"
// import VerifyJwt from "../middlewares/auth.middleware.js"
// import {upload} from "../middlewares/multer.middleware.js"

// const router = Router();
// router.use(VerifyJwt); // Apply verifyJWT middleware to all routes in this file

// router
//     .route("/")
//     .get(getAllCards)
//     .post(
//         upload.fields([
//             {
//                 name: "videoFile",
//                 maxCount: 1,
//             },
//             {
//                 name: "thumbnail",
//                 maxCount: 1,
//             },
            
//         ]),
//         publishCard
//     );

// router
//     .route("/:cardId")
//     .get(getCardById)
//     .delete(deleteCard)
//     .patch(upload.single("thumbnail"), updateCard);

// router.route("/toggle/publish/:cardId").patch(togglePublishStatus);

// export default router