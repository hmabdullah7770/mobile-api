import express from 'express';
import { upload } from '../../middlewares/multer.middleware.js';
import VerfyJwt from '../../middlewares/auth.middleware.js';
import { verifyStoreOwner } from '../../middlewares/store.middleware.js';
import {
    addBanner,
    getStoreBanners,
    updateBanner,
    deleteBanner
} from '../../controllers/store/store_banner.controller.js';

const router = express.Router();

// All routes require authentication
router.use(VerfyJwt);

// Route to get banners doesn't require ownership verification
router.get('/:storeId/banners', getStoreBanners);

// Routes that require store ownership verification
// router.use('/:storeId', verifyStoreOwner);

// Add a banner
router.post(
    '/:storeId/banners',
    verifyStoreOwner,
    upload.fields([
        { name: 'bannerImage', maxCount: 1 }
    ]),
    addBanner
);

// Update a banner
router.put(
    '/:storeId/banners/:bannerId',
    verifyStoreOwner,
    upload.fields([
        { name: 'bannerImage', maxCount: 1 }
    ]),
    updateBanner
);

// Delete a banner
router.delete('/:storeId/banners/:bannerId', verifyStoreOwner,deleteBanner);

export default router; 