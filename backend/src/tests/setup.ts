/**
 * Jest Test Setup File
 * This file runs before all tests
 */

// Load environment variables
require('dotenv').config();

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'kajkam-super-secret-jwt-key-2025-dont-share';

// Increase timeout for all tests (MongoDB Atlas needs more time)
jest.setTimeout(60000);

console.log('✅ Test environment initialized');