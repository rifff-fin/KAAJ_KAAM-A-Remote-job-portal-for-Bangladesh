// backend/routes/order.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
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

// New payment flow routes
router.post('/:orderId/accept', orderController.acceptOrder);
router.post('/:orderId/reject', orderController.rejectOrder);
router.post('/:orderId/payment', orderController.completePayment);
router.post('/:orderId/deliver', upload.array('files', 10), orderController.deliverOrder);
router.post('/:orderId/delivery/accept', orderController.acceptDelivery);
router.post('/:orderId/delivery/reject', orderController.rejectDelivery);

// Extension routes
router.post('/:orderId/extension/request', orderController.requestExtension);
router.post('/:orderId/extension/:extensionId/respond', orderController.respondToExtension);
router.post('/:orderId/extension/direct', orderController.extendPaymentDeadline);

module.exports = router;
