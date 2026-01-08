// backend/utils/orderCronJobs.js
const cron = require('node-cron');
const { cancelExpiredOrders } = require('../controllers/orderController');

/**
 * Initialize order-related cron jobs
 */
const initOrderCronJobs = () => {
    // Run every hour to check for expired payment deadlines
    cron.schedule('0 * * * *', async () => {
        console.log('[CRON] Checking for expired payment deadlines...');
        try {
            const cancelledCount = await cancelExpiredOrders();
            if (cancelledCount > 0) {
                console.log(`[CRON] Auto-cancelled ${cancelledCount} expired orders`);
            } else {
                console.log('[CRON] No expired orders found');
            }
        } catch (error) {
            console.error('[CRON] Error checking expired orders:', error);
        }
    });

    console.log('[CRON] Order cron jobs initialized - checking for expired orders every hour');
};

module.exports = { initOrderCronJobs };
