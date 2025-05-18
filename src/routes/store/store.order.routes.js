import express from 'express';
import VerfyJwt from '../../middlewares/auth.middleware.js';
import {
    createOrder,
    getStoreOrders,
    getOrderById,
    updateOrderStatus,
    getCustomerOrders,
    deleteOrderByOwner,
    deleteOrderbycustomer
} from '../../controllers/store/store.order.controller.js';
import { verifyStoreOwner } from '../../middlewares/store.middleware.js';

const router = express.Router();

// Apply JWT verification middleware to all routes
router.use(VerfyJwt);

// Customer routes
// router.post('/order/:storeId/create', createOrder);
router.post('/orders/create', createOrder);
router.get('/orders/my-orders', getCustomerOrders);
router.get('/:orderId/:storeId', verifyStoreOwner,getOrderById);
router.delete('/order/:orderId',deleteOrderbycustomer)          

// Store owner routes
router.get('/orders/store/:storeId', verifyStoreOwner,getStoreOrders);
// router.get('/orders/:orderId', verifyStoreOwner,getPendingOrder)
// router.get('/orders/:orderId/:storeId',verifyStoreOwner,getDeliveredOrder)
router.patch('/orders/:orderId/status',verifyStoreOwner,updateOrderStatus);
router.delete('/orders/:orderId/:storeId', verifyStoreOwner,deleteOrderByOwner);
export default router;