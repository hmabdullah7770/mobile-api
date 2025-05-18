import express from 'express';
import { upload } from '../../middlewares/multer.middleware.js';
import VerfyJwt from '../../middlewares/auth.middleware.js';
import { verifyStoreOwner } from '../../middlewares/store.middleware.js';
import {
    add3DVideo,
    getStore3DVideos,
    update3DVideo,
    delete3DVideo
} from '../../controllers/store/store.3dvideo.controller.js';

const router = express.Router();

// All routes require authentication
router.use(VerfyJwt);

// Route to get 3D videos doesn't require ownership verification
router.get('/:storeId/3d-videos', getStore3DVideos);

// Routes that require store ownership verification
// router.use('/:storeId', verifyStoreOwner);

// Add a 3D video
router.post(
    '/:storeId/3d-videos',
    verifyStoreOwner,
    upload.fields([
        { name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 }
    ]),
    add3DVideo
);

// Update a 3D video
router.put(
    '/:storeId/3d-videos/:videoId',
    verifyStoreOwner,
    upload.fields([
        { name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 }
    ]),
    update3DVideo
);

// Delete a 3D video
router.delete('/:storeId/3d-videos/:videoId', verifyStoreOwner,delete3DVideo);

export default router; 