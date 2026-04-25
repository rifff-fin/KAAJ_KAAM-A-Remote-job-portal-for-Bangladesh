// backend/src/tests/22201964_email_notification.test.js
// Email Notification Feature Test Suite
// Tests for notification controller endpoints and email service
// Student ID: 22201964

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import modules to test
const notificationController = require('../../controllers/notificationController');
const { sendEmail } = require('../../services/emailService');
const Notification = require('../../models/Notification');
const User = require('../../models/User');
const { protect } = require('../../middleware/auth');

// Mock email service to prevent actual emails during tests
jest.mock('../../services/emailService', () => ({
    sendEmail: jest.fn().mockResolvedValue(true)
}));

// Create Express app for testing
const app = express();
app.use(express.json());

// Setup routes for testing
app.get('/api/notifications', protect, notificationController.getNotifications);
app.get('/api/notifications/unread-count', protect, notificationController.getUnreadCount);
app.put('/api/notifications/:notificationId/read', protect, notificationController.markAsRead);
app.put('/api/notifications/read/all', protect, notificationController.markAllAsRead);
app.delete('/api/notifications/:notificationId', protect, notificationController.deleteNotification);

// Test database setup
let mongoServer;
let testUser;
let authToken;

describe('Email Notification Feature Tests', () => {

    // ────────────────────────────────────────────────────────────
    // Setup: Before All Tests
    // ────────────────────────────────────────────────────────────
    beforeAll(async () => {
        // Start in-memory MongoDB
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();

        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        // Create test user
        testUser = await User.create({
            name: 'Test User',
            email: 'testuser@example.com',
            password: '$2a$10$XYZ...', // Pre-hashed password
            role: 'seller'
        });

        // Generate auth token
        authToken = jwt.sign(
            { id: testUser._id, role: testUser.role },
            process.env.JWT_SECRET || 'kajkam-secret-2025',
            { expiresIn: '1h' }
        );
    });

    // ────────────────────────────────────────────────────────────
    // Teardown: After All Tests
    // ────────────────────────────────────────────────────────────
    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    // ────────────────────────────────────────────────────────────
    // Cleanup: After Each Test
    // ────────────────────────────────────────────────────────────
    afterEach(async () => {
        await Notification.deleteMany({});
        jest.clearAllMocks();
    });

    // ══════════════════════════════════════════════════════════════
    // TEST SUITE 1: Get Notifications Endpoint
    // ══════════════════════════════════════════════════════════════
    describe('GET /api/notifications - Get Notifications', () => {

        test('Should return all notifications for authenticated user', async () => {
            // Arrange: Create test notifications
            await Notification.create([
                {
                    recipient: testUser._id,
                    type: 'order_created',
                    title: 'Order Created',
                    message: 'New order created',
                    isRead: false
                },
                {
                    recipient: testUser._id,
                    type: 'payment_received',
                    title: 'Payment Received',
                    message: 'Payment completed',
                    isRead: true
                }
            ]);

            // Act: Make request
            const response = await request(app)
                .get('/api/notifications')
                .set('x-auth-token', authToken);

            // Assert: Check response
            expect(response.status).toBe(200);
            expect(response.body.notifications).toHaveLength(2);
            expect(response.body.total).toBe(2);
            expect(response.body.unreadCount).toBe(1);
            expect(response.body).toHaveProperty('hasMore');
        });

        test('Should filter unread notifications only when unreadOnly=true', async () => {
            // Arrange: Create mixed notifications
            await Notification.create([
                { recipient: testUser._id, type: 'order_created', title: 'Test 1', message: 'Msg 1', isRead: false },
                { recipient: testUser._id, type: 'order_created', title: 'Test 2', message: 'Msg 2', isRead: false },
                { recipient: testUser._id, type: 'order_created', title: 'Test 3', message: 'Msg 3', isRead: true }
            ]);

            // Act: Request unread only
            const response = await request(app)
                .get('/api/notifications?unreadOnly=true')
                .set('x-auth-token', authToken);

            // Assert: Only unread notifications returned
            expect(response.status).toBe(200);
            expect(response.body.notifications).toHaveLength(2);
            expect(response.body.notifications.every(n => !n.isRead)).toBe(true);
        });

        test('Should respect limit and skip parameters for pagination', async () => {
            // Arrange: Create multiple notifications
            for (let i = 0; i < 5; i++) {
                await Notification.create({
                    recipient: testUser._id,
                    type: 'order_created',
                    title: `Notification ${i}`,
                    message: `Message ${i}`,
                    isRead: false
                });
            }

            // Act: Request with pagination
            const response = await request(app)
                .get('/api/notifications?limit=2&skip=1')
                .set('x-auth-token', authToken);

            // Assert: Check pagination
            expect(response.status).toBe(200);
            expect(response.body.notifications).toHaveLength(2);
            expect(response.body.total).toBe(5);
            expect(response.body.hasMore).toBe(true);
        });

        test('Should return 401 when no auth token provided', async () => {
            // Act: Request without token
            const response = await request(app)
                .get('/api/notifications');

            // Assert: Unauthorized
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('No token, access denied');
        });

        test('Should return empty array when user has no notifications', async () => {
            // Act: Request notifications (none exist)
            const response = await request(app)
                .get('/api/notifications')
                .set('x-auth-token', authToken);

            // Assert: Empty response
            expect(response.status).toBe(200);
            expect(response.body.notifications).toHaveLength(0);
            expect(response.body.total).toBe(0);
            expect(response.body.unreadCount).toBe(0);
        });
    });

    // ══════════════════════════════════════════════════════════════
    // TEST SUITE 2: Get Unread Count Endpoint
    // ══════════════════════════════════════════════════════════════
    describe('GET /api/notifications/unread-count - Get Unread Count', () => {

        test('Should return correct unread notification count', async () => {
            // Arrange: Create notifications
            await Notification.create([
                { recipient: testUser._id, type: 'order_created', title: 'Test 1', message: 'Msg 1', isRead: false },
                { recipient: testUser._id, type: 'order_created', title: 'Test 2', message: 'Msg 2', isRead: false },
                { recipient: testUser._id, type: 'order_created', title: 'Test 3', message: 'Msg 3', isRead: true }
            ]);

            // Act: Request unread count
            const response = await request(app)
                .get('/api/notifications/unread-count')
                .set('x-auth-token', authToken);

            // Assert: Count is correct
            expect(response.status).toBe(200);
            expect(response.body.unreadCount).toBe(2);
        });

        test('Should return 0 when all notifications are read', async () => {
            // Arrange: Create read notifications
            await Notification.create([
                { recipient: testUser._id, type: 'order_created', title: 'Test 1', message: 'Msg 1', isRead: true },
                { recipient: testUser._id, type: 'order_created', title: 'Test 2', message: 'Msg 2', isRead: true }
            ]);

            // Act: Request unread count
            const response = await request(app)
                .get('/api/notifications/unread-count')
                .set('x-auth-token', authToken);

            // Assert: Count is 0
            expect(response.status).toBe(200);
            expect(response.body.unreadCount).toBe(0);
        });

        test('Should require authentication', async () => {
            // Act: Request without token
            const response = await request(app)
                .get('/api/notifications/unread-count');

            // Assert: Unauthorized
            expect(response.status).toBe(401);
        });
    });

    // ══════════════════════════════════════════════════════════════
    // TEST SUITE 3: Mark Notification as Read Endpoint
    // ══════════════════════════════════════════════════════════════
    describe('PUT /api/notifications/:notificationId/read - Mark as Read', () => {

        test('Should mark notification as read successfully', async () => {
            // Arrange: Create unread notification
            const notification = await Notification.create({
                recipient: testUser._id,
                type: 'order_created',
                title: 'Test Notification',
                message: 'Test Message',
                isRead: false
            });

            // Act: Mark as read
            const response = await request(app)
                .put(`/api/notifications/${notification._id}/read`)
                .set('x-auth-token', authToken);

            // Assert: Successfully marked as read
            expect(response.status).toBe(200);
            expect(response.body.isRead).toBe(true);
            expect(response.body.readAt).toBeTruthy();

            // Verify in database
            const updatedNotification = await Notification.findById(notification._id);
            expect(updatedNotification.isRead).toBe(true);
            expect(updatedNotification.readAt).toBeTruthy();
        });

        test('Should return 404 for non-existent notification', async () => {
            // Arrange: Generate fake ObjectId
            const fakeId = new mongoose.Types.ObjectId();

            // Act: Try to mark non-existent notification
            const response = await request(app)
                .put(`/api/notifications/${fakeId}/read`)
                .set('x-auth-token', authToken);

            // Assert: Not found
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Notification not found');
        });

        test('Should return 403 when trying to mark another user\'s notification', async () => {
            // Arrange: Create another user and their notification
            const otherUser = await User.create({
                name: 'Other User',
                email: 'other@example.com',
                password: '$2a$10$XYZ...',
                role: 'buyer'
            });

            const otherNotification = await Notification.create({
                recipient: otherUser._id,
                type: 'order_created',
                title: 'Other Notification',
                message: 'Other Message',
                isRead: false
            });

            // Act: Try to mark other user's notification
            const response = await request(app)
                .put(`/api/notifications/${otherNotification._id}/read`)
                .set('x-auth-token', authToken);

            // Assert: Forbidden
            expect(response.status).toBe(403);
            expect(response.body.message).toBe('Unauthorized');
        });

        test('Should require authentication', async () => {
            // Arrange: Create notification
            const notification = await Notification.create({
                recipient: testUser._id,
                type: 'order_created',
                title: 'Test',
                message: 'Test',
                isRead: false
            });

            // Act: Request without token
            const response = await request(app)
                .put(`/api/notifications/${notification._id}/read`);

            // Assert: Unauthorized
            expect(response.status).toBe(401);
        });
    });

    // ══════════════════════════════════════════════════════════════
    // TEST SUITE 4: Mark All Notifications as Read Endpoint
    // ══════════════════════════════════════════════════════════════
    describe('PUT /api/notifications/read/all - Mark All as Read', () => {

        test('Should mark all user notifications as read', async () => {
            // Arrange: Create multiple unread notifications
            await Notification.create([
                { recipient: testUser._id, type: 'order_created', title: 'Test 1', message: 'Msg 1', isRead: false },
                { recipient: testUser._id, type: 'order_created', title: 'Test 2', message: 'Msg 2', isRead: false },
                { recipient: testUser._id, type: 'order_created', title: 'Test 3', message: 'Msg 3', isRead: false }
            ]);

            // Act: Mark all as read
            const response = await request(app)
                .put('/api/notifications/read/all')
                .set('x-auth-token', authToken);

            // Assert: Success message
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('All notifications marked as read');

            // Verify in database
            const unreadCount = await Notification.countDocuments({
                recipient: testUser._id,
                isRead: false
            });
            expect(unreadCount).toBe(0);
        });

        test('Should only affect current user\'s notifications', async () => {
            // Arrange: Create notifications for multiple users
            const otherUser = await User.create({
                name: 'Other User',
                email: 'other2@example.com',
                password: '$2a$10$XYZ...',
                role: 'buyer'
            });

            await Notification.create([
                { recipient: testUser._id, type: 'order_created', title: 'My Test', message: 'My Msg', isRead: false },
                { recipient: otherUser._id, type: 'order_created', title: 'Other Test', message: 'Other Msg', isRead: false }
            ]);

            // Act: Mark all as read for testUser
            await request(app)
                .put('/api/notifications/read/all')
                .set('x-auth-token', authToken);

            // Assert: Only testUser's notifications marked as read
            const myUnreadCount = await Notification.countDocuments({
                recipient: testUser._id,
                isRead: false
            });
            const otherUnreadCount = await Notification.countDocuments({
                recipient: otherUser._id,
                isRead: false
            });

            expect(myUnreadCount).toBe(0);
            expect(otherUnreadCount).toBe(1);
        });

        test('Should require authentication', async () => {
            // Act: Request without token
            const response = await request(app)
                .put('/api/notifications/read/all');

            // Assert: Unauthorized
            expect(response.status).toBe(401);
        });
    });

    // ══════════════════════════════════════════════════════════════
    // TEST SUITE 5: Delete Notification Endpoint
    // ══════════════════════════════════════════════════════════════
    describe('DELETE /api/notifications/:notificationId - Delete Notification', () => {

        test('Should delete notification successfully', async () => {
            // Arrange: Create notification
            const notification = await Notification.create({
                recipient: testUser._id,
                type: 'order_created',
                title: 'Test Notification',
                message: 'Test Message',
                isRead: false
            });

            // Act: Delete notification
            const response = await request(app)
                .delete(`/api/notifications/${notification._id}`)
                .set('x-auth-token', authToken);

            // Assert: Successfully deleted
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Notification deleted');

            // Verify deletion in database
            const deletedNotification = await Notification.findById(notification._id);
            expect(deletedNotification).toBeNull();
        });

        test('Should return 404 for non-existent notification', async () => {
            // Arrange: Generate fake ObjectId
            const fakeId = new mongoose.Types.ObjectId();

            // Act: Try to delete non-existent notification
            const response = await request(app)
                .delete(`/api/notifications/${fakeId}`)
                .set('x-auth-token', authToken);

            // Assert: Not found
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Notification not found');
        });

        test('Should return 403 when trying to delete another user\'s notification', async () => {
            // Arrange: Create another user and their notification
            const otherUser = await User.create({
                name: 'Other User',
                email: 'other3@example.com',
                password: '$2a$10$XYZ...',
                role: 'buyer'
            });

            const otherNotification = await Notification.create({
                recipient: otherUser._id,
                type: 'order_created',
                title: 'Other Notification',
                message: 'Other Message',
                isRead: false
            });

            // Act: Try to delete other user's notification
            const response = await request(app)
                .delete(`/api/notifications/${otherNotification._id}`)
                .set('x-auth-token', authToken);

            // Assert: Forbidden
            expect(response.status).toBe(403);
            expect(response.body.message).toBe('Unauthorized');

            // Verify notification still exists
            const stillExists = await Notification.findById(otherNotification._id);
            expect(stillExists).toBeTruthy();
        });

        test('Should require authentication', async () => {
            // Arrange: Create notification
            const notification = await Notification.create({
                recipient: testUser._id,
                type: 'order_created',
                title: 'Test',
                message: 'Test',
                isRead: false
            });

            // Act: Request without token
            const response = await request(app)
                .delete(`/api/notifications/${notification._id}`);

            // Assert: Unauthorized
            expect(response.status).toBe(401);
        });
    });

});
