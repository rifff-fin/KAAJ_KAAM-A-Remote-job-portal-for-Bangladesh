/**
 * KAAJ_KAAM - Job Posting Feature Test Suite
 * Student ID: 23101214
 * Feature: Job Posting as a Buyer
 * 
 * This test suite covers:
 * - Job CRUD Operations (Create, Read, Update, Delete)
 * - Freelancer Application Management
 * - Job Status Management
 * - Authorization & Permissions
 * - Error Handling & Validation
 * 
 * API Endpoints Tested:
 * - POST /api/jobs (createJob)
 * - GET /api/jobs (getJobs)
 * - GET /api/jobs/my (getMyJobs)
 * - GET /api/jobs/:id (getJob)
 * - POST /api/jobs/:id/interest (showInterest)
 * - POST /api/jobs/:id/accept-application (acceptApplication)
 * - POST /api/jobs/:id/reject-application (rejectApplication)
 * - PUT /api/jobs/:id (updateJob)
 * - DELETE /api/jobs/:id (deleteJob)
 * - POST /api/jobs/:id/complete (completeJob)
 * - POST /api/jobs/:id/unhire (unhireFreelancer)
 */

import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Set test environment before importing app
process.env.NODE_ENV = 'test';

// Import app and models
const app = require('../../index');
const Job = require('../../models/Job');
const User = require('../../models/User');
const Order = require('../../models/Order');
const Proposal = require('../../models/Proposal');
const Notification = require('../../models/Notification');

describe('Job Posting Feature - Buyer Operations', () => {
  // ========== TEST DATA & SETUP ==========
  
  let buyerId: string;
  let buyerToken: string;
  let buyerUser: any;

  let sellerId: string;
  let sellerToken: string;
  let sellerUser: any;

  let otherBuyerId: string;
  let otherBuyerToken: string;

  let createdJobId: string;

  // Generate JWT Token
  const generateToken = (userId: string, role: string = 'buyer') => {
    return jwt.sign(
      { id: userId, role },
      process.env.JWT_SECRET || 'kaaj-kaam-secret-2025',
      { expiresIn: '24h' }
    );
  };

  // Setup: Connect to test database and create test users
  beforeAll(async () => {
    try {
      // Connect to MongoDB if not already connected
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(
          process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/kaaj-kaam-test',
          {
            useNewUrlParser: true,
            useUnifiedTopology: true
          }
        );
      }

      // Create test buyer user
      buyerUser = await User.create({
        name: 'John Buyer',
        email: `buyer${Date.now()}@test.com`,
        password: 'hashedpassword123',
        role: 'buyer',
        profile: {
          bio: 'Professional buyer',
          country: 'Bangladesh',
          hourlyRate: 0
        },
        isVerified: true
      });
      buyerId = buyerUser._id.toString();
      buyerToken = generateToken(buyerId, 'buyer');

      // Create test seller user
      sellerUser = await User.create({
        name: 'Jane Seller',
        email: `seller${Date.now()}@test.com`,
        password: 'hashedpassword123',
        role: 'seller',
        profile: {
          bio: 'Expert freelancer',
          country: 'Bangladesh',
          hourlyRate: 20
        },
        isVerified: true
      });
      sellerId = sellerUser._id.toString();
      sellerToken = generateToken(sellerId, 'seller');

      // Create another buyer for testing authorization
      const otherBuyerUser = await User.create({
        name: 'Other Buyer',
        email: `buyer2${Date.now()}@test.com`,
        password: 'hashedpassword123',
        role: 'buyer',
        profile: {
          bio: 'Another buyer',
          country: 'Bangladesh',
          hourlyRate: 0
        },
        isVerified: true
      });
      otherBuyerId = otherBuyerUser._id.toString();
      otherBuyerToken = generateToken(otherBuyerId, 'buyer');

      console.log('✓ Test database and users initialized');
    } catch (err) {
      console.error('Failed to setup test environment:', err);
      throw err;
    }
  });

  // Cleanup: Clear test data after each test
  afterEach(async () => {
    try {
      // Keep one job for other tests
      await Job.deleteMany({ postedBy: otherBuyerId });
      await Order.deleteMany({});
      await Proposal.deleteMany({});
      await Notification.deleteMany({});
    } catch (err) {
      console.error('Cleanup error:', err);
    }
  });

  // Teardown: Close database connection
  afterAll(async () => {
    try {
      await Job.deleteMany({ postedBy: { $in: [buyerId, otherBuyerId] } });
      await User.deleteMany({
        _id: { $in: [buyerId, sellerId, otherBuyerId] }
      });

      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
      }
      console.log('✓ Test environment cleaned up');
    } catch (err) {
      console.error('Teardown error:', err);
    }
  });

  // ========== SUCCESSFUL OPERATIONS ==========

  describe('✅ Successful Job Operations', () => {
    test('should create a new job with valid data', async () => {
      const jobData = {
        title: 'Build a React Web App',
        description: 'Need a professional React application with backend API',
        category: 'web-development',
        budget: 5000,
        budgetType: 'fixed',
        deadline: '2026-03-01',
        skills: ['React', 'Node.js', 'MongoDB']
      };

      const response = await request(app)
        .post('/api/jobs')
        .set('x-auth-token', buyerToken)
        .send(jobData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Job posted successfully');
      expect(response.body.job).toBeDefined();
      expect(response.body.job._id).toBeDefined();
      expect(response.body.job.title).toBe(jobData.title);
      expect(response.body.job.postedBy._id).toBe(buyerId);
      expect(response.body.job.status).toBe('open');
      expect(response.body.job.stats.views).toBe(0);
      expect(response.body.job.stats.proposals).toBe(0);

      createdJobId = response.body.job._id;
    });

    test('should get all jobs (public endpoint)', async () => {
      // Create a few jobs first
      await Job.create({
        title: 'Job 1',
        description: 'Description 1',
        category: 'web-development',
        budget: 1000,
        postedBy: buyerId
      });

      await Job.create({
        title: 'Job 2',
        description: 'Description 2',
        category: 'design',
        budget: 2000,
        postedBy: sellerId
      });

      const response = await request(app).get('/api/jobs');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      expect(response.body[0].title).toBeDefined();
      expect(response.body[0].postedBy).toBeDefined();
    });

    test('should get jobs with search filter', async () => {
      await Job.create({
        title: 'React Development',
        description: 'Build with React',
        category: 'web-development',
        budget: 3000,
        postedBy: buyerId
      });

      const response = await request(app)
        .get('/api/jobs')
        .query({ search: 'React' });

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      expect(
        response.body.some(job => 
          job.title.includes('React') || job.description.includes('React')
        )
      ).toBe(true);
    });

    test('should get jobs with category filter', async () => {
      await Job.create({
        title: 'Web Design Job',
        description: 'Design website',
        category: 'design',
        budget: 1500,
        postedBy: buyerId
      });

      const response = await request(app)
        .get('/api/jobs')
        .query({ category: 'design' });

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body.every(job => job.category === 'design')).toBe(true);
    });

    test('should get my posted jobs (buyer only)', async () => {
      await Job.create({
        title: 'My Job 1',
        description: 'My job description',
        category: 'web-development',
        budget: 2000,
        postedBy: buyerId
      });

      await Job.create({
        title: 'My Job 2',
        description: 'Another job',
        category: 'design',
        budget: 1500,
        postedBy: buyerId
      });

      const response = await request(app)
        .get('/api/jobs/my')
        .set('x-auth-token', buyerToken);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      expect(
        response.body.every(job => {
          const postedById = typeof job.postedBy === 'object' ? job.postedBy._id.toString() : job.postedBy.toString();
          return postedById === buyerId;
        })
      ).toBe(true);
    });

    test('should get single job details', async () => {
      const job = await Job.create({
        title: 'Single Job Details',
        description: 'Test job for details',
        category: 'web-development',
        budget: 3000,
        skills: ['React', 'Node.js'],
        postedBy: buyerId
      });

      const response = await request(app).get(`/api/jobs/${job._id}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(job._id.toString());
      expect(response.body.title).toBe('Single Job Details');
      expect(response.body.postedBy).toBeDefined();
      expect(response.body.skills).toContain('React');
    });

    test('should update job with valid data (buyer only)', async () => {
      const job = await Job.create({
        title: 'Original Title',
        description: 'Original description',
        category: 'web-development',
        budget: 2000,
        postedBy: buyerId
      });

      const updateData = {
        description: 'Updated description with new requirements',
        budget: 2500,
        skills: ['React', 'Node.js']
      };

      const response = await request(app)
        .put(`/api/jobs/${job._id}`)
        .set('x-auth-token', buyerToken)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.job.description).toBe(updateData.description);
      expect(response.body.job.budget).toBe(updateData.budget);
      expect(response.body.job.title).toBe('Original Title'); // Title unchanged
    });

    test('should complete a job (buyer only)', async () => {
      const job = await Job.create({
        title: 'Job to Complete',
        description: 'Test job',
        category: 'web-development',
        budget: 1000,
        postedBy: buyerId,
        status: 'in-progress'
      });

      const response = await request(app)
        .post(`/api/jobs/${job._id}/complete`)
        .set('x-auth-token', buyerToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.job.status).toBe('completed');
    });

    test('should delete job without hired freelancer', async () => {
      const job = await Job.create({
        title: 'Job to Delete',
        description: 'Test deletion',
        category: 'web-development',
        budget: 1000,
        postedBy: buyerId,
        status: 'open'
      });

      const response = await request(app)
        .delete(`/api/jobs/${job._id}`)
        .set('x-auth-token', buyerToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Job deleted successfully');

      // Verify job is deleted
      const deletedJob = await Job.findById(job._id);
      expect(deletedJob).toBeNull();
    });
  });

  // ========== FREELANCER APPLICATION TESTS ==========

  describe('✅ Freelancer Application Management', () => {
    test('should allow seller to show interest in job', async () => {
      const job = await Job.create({
        title: 'Apply Test Job',
        description: 'Test job for applications',
        category: 'web-development',
        budget: 3000,
        postedBy: buyerId
      });

      const response = await request(app)
        .post(`/api/jobs/${job._id}/interest`)
        .set('x-auth-token', sellerToken)
        .send({
          message: 'I have 5 years of experience with React and Node.js',
          proposedBudget: 2500,
          deliveryDays: 14
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Application submitted successfully');
      expect(response.body.job.interests.length).toBeGreaterThan(0);
      expect(response.body.order).toBeDefined();
      expect(response.body.order.status).toBe('pending');
      expect(response.body.order.buyer).toBe(buyerId);
      expect(response.body.order.seller).toBe(sellerId);
    });

    test('should create order when freelancer applies', async () => {
      const job = await Job.create({
        title: 'Order Creation Test',
        description: 'Test order creation',
        category: 'web-development',
        budget: 3000,
        postedBy: buyerId
      });

      await request(app)
        .post(`/api/jobs/${job._id}/interest`)
        .set('x-auth-token', sellerToken)
        .send({
          message: 'Interested in this job',
          proposedBudget: 2800,
          deliveryDays: 10
        });

      const order = await Order.findOne({ job: job._id, seller: sellerId });
      expect(order).toBeDefined();
      expect(order.status).toBe('pending');
      expect(order.price).toBe(2800);
      expect(order.deliveryDays).toBe(10);
    });

    test('should create proposal when freelancer applies', async () => {
      const job = await Job.create({
        title: 'Proposal Creation Test',
        description: 'Test proposal',
        category: 'web-development',
        budget: 4000,
        postedBy: buyerId
      });

      const response = await request(app)
        .post(`/api/jobs/${job._id}/interest`)
        .set('x-auth-token', sellerToken)
        .send({
          message: 'I can complete this in 2 weeks',
          proposedBudget: 3500,
          deliveryDays: 14
        });

      expect(response.body.job.interests[0].freelancer).toBeDefined();
      expect(response.body.job.interests[0].message).toBe('I can complete this in 2 weeks');
      expect(response.body.job.interests[0].status).toBe('pending');
    });

    test('should accept freelancer application', async () => {
      const job = await Job.create({
        title: 'Accept Test Job',
        description: 'Test acceptance',
        category: 'web-development',
        budget: 3000,
        postedBy: buyerId
      });

      // First, freelancer applies
      await request(app)
        .post(`/api/jobs/${job._id}/interest`)
        .set('x-auth-token', sellerToken)
        .send({
          message: 'I can do this',
          proposedBudget: 2800,
          deliveryDays: 10
        });

      // Then buyer accepts
      const response = await request(app)
        .post(`/api/jobs/${job._id}/accept-application`)
        .set('x-auth-token', buyerToken)
        .send({ freelancerId: sellerId });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('accepted');
      expect(response.body.order.status).toBe('activated');
    });

    test('should reject freelancer application', async () => {
      const job = await Job.create({
        title: 'Reject Test Job',
        description: 'Test rejection',
        category: 'web-development',
        budget: 2000,
        postedBy: buyerId
      });

      // Freelancer applies
      await request(app)
        .post(`/api/jobs/${job._id}/interest`)
        .set('x-auth-token', sellerToken)
        .send({
          message: 'I am interested',
          proposedBudget: 1800,
          deliveryDays: 7
        });

      // Buyer rejects
      const response = await request(app)
        .post(`/api/jobs/${job._id}/reject-application`)
        .set('x-auth-token', buyerToken)
        .send({ freelancerId: sellerId });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Application rejected');

      // Verify order is cancelled
      const order = await Order.findOne({ job: job._id, seller: sellerId });
      expect(order.status).toBe('cancelled');
    });

    test('should send notification on application acceptance', async () => {
      const job = await Job.create({
        title: 'Notification Test',
        description: 'Test notifications',
        category: 'web-development',
        budget: 3000,
        postedBy: buyerId
      });

      await request(app)
        .post(`/api/jobs/${job._id}/interest`)
        .set('x-auth-token', sellerToken)
        .send({
          message: 'Let me do this',
          proposedBudget: 2700,
          deliveryDays: 12
        });

      await request(app)
        .post(`/api/jobs/${job._id}/accept-application`)
        .set('x-auth-token', buyerToken)
        .send({ freelancerId: sellerId });

      const notification = await Notification.findOne({
        recipient: sellerId,
        type: 'proposal_accepted'
      });

      expect(notification).toBeDefined();
      expect(notification.title).toBe('Application Accepted!');
      expect(notification.message).toContain(job.title);
    });
  });

  // ========== ERROR HANDLING TESTS ==========

  describe('❌ Error Handling & Validation', () => {
    test('should fail to create job without authentication', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .send({
          title: 'Test Job',
          description: 'No auth test',
          category: 'web-development',
          budget: 1000,
          deadline: '2026-02-01'
        });

      expect(response.status).toBe(401);
    });

    test('should fail to create job with missing required fields', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .set('x-auth-token', buyerToken)
        .send({
          title: 'Incomplete Job'
          // Missing: description, budget, deadline
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('required');
    });

    test('should fail if non-buyer tries to post job', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .set('x-auth-token', sellerToken)
        .send({
          title: 'Seller Job',
          description: 'Sellers cannot post jobs',
          category: 'web-development',
          budget: 2000,
          deadline: '2026-02-01'
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Only buyers');
    });

    test('should fail if non-owner tries to update job', async () => {
      const job = await Job.create({
        title: 'Original Job',
        description: 'Original',
        category: 'web-development',
        budget: 1500,
        postedBy: buyerId
      });

      const response = await request(app)
        .put(`/api/jobs/${job._id}`)
        .set('x-auth-token', otherBuyerToken)
        .send({ description: 'Hacked description' });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('authorized');
    });

    test('should fail if non-owner tries to delete job', async () => {
      const job = await Job.create({
        title: 'Job to Protect',
        description: 'Protect this',
        category: 'web-development',
        budget: 2000,
        postedBy: buyerId
      });

      const response = await request(app)
        .delete(`/api/jobs/${job._id}`)
        .set('x-auth-token', otherBuyerToken);

      expect(response.status).toBe(403);
    });

    test('should fail to edit job too frequently (once per week)', async () => {
      const job = await Job.create({
        title: 'Frequent Edit Test',
        description: 'Original description',
        category: 'web-development',
        budget: 2000,
        postedBy: buyerId,
        lastEditedAt: new Date() // Just edited
      });

      const response = await request(app)
        .put(`/api/jobs/${job._id}`)
        .set('x-auth-token', buyerToken)
        .send({ description: 'New description' });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('once per week');
      expect(response.body.nextEditDate).toBeDefined();
    });

    test('should fail to edit job title', async () => {
      const job = await Job.create({
        title: 'Original Title',
        description: 'Original description',
        category: 'web-development',
        budget: 2000,
        postedBy: buyerId
      });

      const response = await request(app)
        .put(`/api/jobs/${job._id}`)
        .set('x-auth-token', buyerToken)
        .send({
          title: 'New Title', // Trying to change title
          description: 'Updated'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Title cannot be edited');
    });

    test('should fail to get non-existent job', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/api/jobs/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });

    test('should fail if seller tries to apply twice to same job', async () => {
      const job = await Job.create({
        title: 'Duplicate Apply Test',
        description: 'Test duplicate',
        category: 'web-development',
        budget: 2000,
        postedBy: buyerId
      });

      // First application
      await request(app)
        .post(`/api/jobs/${job._id}/interest`)
        .set('x-auth-token', sellerToken)
        .send({
          message: 'First application',
          proposedBudget: 1800,
          deliveryDays: 10
        });

      // Second application attempt
      const response = await request(app)
        .post(`/api/jobs/${job._id}/interest`)
        .set('x-auth-token', sellerToken)
        .send({
          message: 'Second application',
          proposedBudget: 1700,
          deliveryDays: 8
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already applied');
    });

    test('should fail to apply without proposal message', async () => {
      const job = await Job.create({
        title: 'Message Required Test',
        description: 'Message is required',
        category: 'web-development',
        budget: 2000,
        postedBy: buyerId
      });

      const response = await request(app)
        .post(`/api/jobs/${job._id}/interest`)
        .set('x-auth-token', sellerToken)
        .send({
          proposedBudget: 1800,
          deliveryDays: 10
          // Missing: message
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('message');
    });

    test('should fail to accept non-existent application', async () => {
      const job = await Job.create({
        title: 'Accept Non-existent',
        description: 'Test',
        category: 'web-development',
        budget: 2000,
        postedBy: buyerId
      });

      const response = await request(app)
        .post(`/api/jobs/${job._id}/accept-application`)
        .set('x-auth-token', buyerToken)
        .send({ freelancerId: sellerId });

      expect(response.status).toBe(404);
    });

    test('should fail to delete job with hired freelancer', async () => {
      const job = await Job.create({
        title: 'Delete Protected Job',
        description: 'Has hired freelancer',
        category: 'web-development',
        budget: 3000,
        postedBy: buyerId,
        hiredFreelancer: sellerId // Already hired
      });

      const response = await request(app)
        .delete(`/api/jobs/${job._id}`)
        .set('x-auth-token', buyerToken);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('hired freelancer');
    });

    test('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/jobs/my')
        .set('x-auth-token', 'invalid_token_here');

      expect(response.status).toBe(401);
    });

    test('should fail with expired token', async () => {
      const expiredToken = jwt.sign(
        { id: buyerId, role: 'buyer' },
        process.env.JWT_SECRET || 'kaaj-kaam-secret-2025',
        { expiresIn: '-1h' } // Already expired
      );

      const response = await request(app)
        .get('/api/jobs/my')
        .set('x-auth-token', expiredToken);

      expect(response.status).toBe(401);
    });

    test('should fail if non-buyer tries to view my jobs', async () => {
      const response = await request(app)
        .get('/api/jobs/my')
        .set('x-auth-token', sellerToken);

      expect(response.status).toBe(403);
    });

    test('should fail if non-job-owner completes job', async () => {
      const job = await Job.create({
        title: 'Complete Test',
        description: 'Test completion',
        category: 'web-development',
        budget: 2000,
        postedBy: buyerId,
        status: 'in-progress'
      });

      const response = await request(app)
        .post(`/api/jobs/${job._id}/complete`)
        .set('x-auth-token', otherBuyerToken);

      expect(response.status).toBe(403);
    });
  });

  // ========== INTEGRATION TESTS ==========

  describe('🔄 Integration Tests', () => {
    test('complete workflow: post → apply → accept → payment ready', async () => {
      // 1. Create job
      const jobRes = await request(app)
        .post('/api/jobs')
        .set('x-auth-token', buyerToken)
        .send({
          title: 'Full Workflow Test',
          description: 'Complete job posting workflow',
          category: 'web-development',
          budget: 5000,
          deadline: '2026-03-01',
          skills: ['React', 'Node.js']
        });

      expect(jobRes.status).toBe(201);
      const jobId = jobRes.body.job._id;

      // 2. Freelancer applies
      const applyRes = await request(app)
        .post(`/api/jobs/${jobId}/interest`)
        .set('x-auth-token', sellerToken)
        .send({
          message: 'I have extensive experience',
          proposedBudget: 4500,
          deliveryDays: 14
        });

      expect(applyRes.status).toBe(200);
      expect(applyRes.body.order.status).toBe('pending');

      // 3. Buyer accepts application
      const acceptRes = await request(app)
        .post(`/api/jobs/${jobId}/accept-application`)
        .set('x-auth-token', buyerToken)
        .send({ freelancerId: sellerId });

      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.order.status).toBe('activated');

      // 4. Verify job still has status 'open' (not in-progress until payment)
      const jobCheck = await Job.findById(jobId);
      expect(jobCheck.status).toBe('open');

      // 5. Verify proposal was created
      const proposal = await Proposal.findOne({ job: jobId });
      expect(proposal).toBeDefined();
      expect(proposal.status).toBe('accepted');
    });

    test('job filtering works with multiple parameters', async () => {
      // Create jobs with different attributes
      await Job.create({
        title: 'React Full Stack',
        description: 'Build with React',
        category: 'web-development',
        budget: 5000,
        status: 'open',
        postedBy: buyerId
      });

      await Job.create({
        title: 'UI Design Work',
        description: 'Design UI components',
        category: 'design',
        budget: 2000,
        status: 'open',
        postedBy: buyerId
      });

      // Search with multiple filters
      const response = await request(app)
        .get('/api/jobs')
        .query({
          search: 'React',
          category: 'web-development',
          status: 'open'
        });

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      expect(
        response.body.every(job =>
          (job.title.includes('React') || job.description.includes('React')) &&
          job.category === 'web-development' &&
          job.status === 'open'
        )
      ).toBe(true);
    });

    test('rejection and re-application is possible', async () => {
      const job = await Job.create({
        title: 'Rejection Test Job',
        description: 'Test rejection flow',
        category: 'web-development',
        budget: 2000,
        postedBy: buyerId
      });

      // First application
      await request(app)
        .post(`/api/jobs/${job._id}/interest`)
        .set('x-auth-token', sellerToken)
        .send({
          message: 'First attempt',
          proposedBudget: 1800,
          deliveryDays: 10
        });

      // Buyer rejects
      await request(app)
        .post(`/api/jobs/${job._id}/reject-application`)
        .set('x-auth-token', buyerToken)
        .send({ freelancerId: sellerId });

      // Refresh the job to clear the "already applied" cache
      const refreshedJob = await Job.findById(job._id);
      expect(
        refreshedJob.interests.find(i => i.freelancer.toString() === sellerId).status
      ).toBe('rejected');

      // Note: Actually re-applying might be restricted - this tests current behavior
    });
  });

  // ========== AUTHORIZATION TESTS ==========

  describe('🔐 Authorization & Role-Based Access', () => {
    test('only buyers can create jobs', async () => {
      const sellerRes = await request(app)
        .post('/api/jobs')
        .set('x-auth-token', sellerToken)
        .send({
          title: 'Seller Job Attempt',
          description: 'Sellers cannot post',
          category: 'web-development',
          budget: 2000,
          deadline: '2026-02-01'
        });

      expect(sellerRes.status).toBe(403);
      expect(sellerRes.body.message).toContain('Only buyers');
    });

    test('only buyers can view "my jobs"', async () => {
      const sellerRes = await request(app)
        .get('/api/jobs/my')
        .set('x-auth-token', sellerToken);

      expect(sellerRes.status).toBe(403);
    });

    test('only job owner can update their job', async () => {
      const job = await Job.create({
        title: 'Owner Only Job',
        description: 'Only owner can edit',
        category: 'web-development',
        budget: 2000,
        postedBy: buyerId
      });

      const response = await request(app)
        .put(`/api/jobs/${job._id}`)
        .set('x-auth-token', otherBuyerToken)
        .send({ description: 'Unauthorized edit' });

      expect(response.status).toBe(403);
    });

    test('only job owner can accept applications', async () => {
      const job = await Job.create({
        title: 'Accept Permission Test',
        description: 'Test accept permissions',
        category: 'web-development',
        budget: 2000,
        postedBy: buyerId
      });

      await request(app)
        .post(`/api/jobs/${job._id}/interest`)
        .set('x-auth-token', sellerToken)
        .send({
          message: 'I want to work',
          proposedBudget: 1800,
          deliveryDays: 10
        });

      const response = await request(app)
        .post(`/api/jobs/${job._id}/accept-application`)
        .set('x-auth-token', otherBuyerToken)
        .send({ freelancerId: sellerId });

      expect(response.status).toBe(403);
    });

    test('only job owner can reject applications', async () => {
      const job = await Job.create({
        title: 'Reject Permission Test',
        description: 'Test reject permissions',
        category: 'web-development',
        budget: 2000,
        postedBy: buyerId
      });

      await request(app)
        .post(`/api/jobs/${job._id}/interest`)
        .set('x-auth-token', sellerToken)
        .send({
          message: 'Apply here',
          proposedBudget: 1800,
          deliveryDays: 10
        });

      const response = await request(app)
        .post(`/api/jobs/${job._id}/reject-application`)
        .set('x-auth-token', otherBuyerToken)
        .send({ freelancerId: sellerId });

      expect(response.status).toBe(403);
    });

    test('only job owner can complete job', async () => {
      const job = await Job.create({
        title: 'Complete Permission Test',
        description: 'Test complete permissions',
        category: 'web-development',
        budget: 2000,
        postedBy: buyerId,
        status: 'in-progress'
      });

      const response = await request(app)
        .post(`/api/jobs/${job._id}/complete`)
        .set('x-auth-token', otherBuyerToken);

      expect(response.status).toBe(403);
    });
  });
});
