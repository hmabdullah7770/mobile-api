import express from 'express';
import { upload } from '../../middlewares/multer.middleware.js';
import VerfyJwt from '../../middlewares/auth.middleware.js';
import { verifyStoreOwner } from '../../middlewares/store.middleware.js';
import {
    addProduct,
    getStoreProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    removeProductImage
} from '../../controllers/store/store.product.controller.js';

const router = express.Router();

// All routes require authentication
router.use(VerfyJwt);

// Routes that don't require ownership verification
router.get('/:storeId/products', getStoreProducts);
router.get('/products/:productId', getProductById);

// Routes that require store ownership verification
// router.use('/:storeId', verifyStoreOwner);

// Add a product
router.post(
    '/:storeId/products',
    verifyStoreOwner,
    upload.fields([
        { name: 'productImages', maxCount: 10 }
    ]),
    addProduct
);

// Update a product
router.put(
    '/:storeId/products/:productId',
    verifyStoreOwner,
    upload.fields([
        { name: 'productImages', maxCount: 10 }
    ]),
    updateProduct
);

// Delete a product
router.delete('/:storeId/products/:productId',verifyStoreOwner, deleteProduct);

// Remove a product image
router.patch('/:storeId/products/:productId/remove-image',verifyStoreOwner, removeProductImage);

export default router; 