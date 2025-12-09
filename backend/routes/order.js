// backend/routes/order.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const orderController = require('../controllers/orderController');

// Middleware to verify authentication
router.use(protect);

// Order routes
router.post('/from-gig', orderController.createOrderFromGig);
router.post('/from-proposal', orderController.createOrderFromProposal);
router.get('/', orderController.getOrders);
router.get('/:orderId', orderController.getOrderDetails);
router.put('/:orderId/status', orderController.updateOrderStatus);
router.delete('/:orderId', orderController.cancelOrder);

module.exports = router;
