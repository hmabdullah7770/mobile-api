import express from 'express';
import { upload } from '../../middlewares/multer.middleware.js';
import VerfyJwt from '../../middlewares/auth.middleware.js';
import { verifyStoreOwner } from '../../middlewares/store.middleware.js';
import {
    createStore,
    getUserStores,
    getStoreById,
    updateStore,
    deleteStore,
    togglePublishStatus
} from '../../controllers/store/store.createstore.controller.js';

const router = express.Router();

// Routes that require authentication
router.use(VerfyJwt);

// Create a new store
router.post(
    '/create',
    upload.fields([
        { name: 'storeLogo', maxCount: 1 }
    ]),
    createStore
);

// Get all stores for the authenticated user
router.get('/user-stores', getUserStores);

// Get a specific store by ID
router.get('/:storeId', getStoreById);

// Routes that require store ownership verification
// router.use('/:storeId', verifyStoreOwner);

// Update a store
router.put(
    '/:storeId',
    upload.fields([
        { name: 'storeLogo', maxCount: 1 }
    ]),
    verifyStoreOwner,
    updateStore
);

// Delete a store
router.delete('/:storeId',verifyStoreOwner, deleteStore);



export default router;
