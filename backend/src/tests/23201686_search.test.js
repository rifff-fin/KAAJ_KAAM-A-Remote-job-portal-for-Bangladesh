const { globalSearch, searchSuggestions } = require('../../controllers/searchController');
const User = require('../../models/User');
const Gig = require('../../models/Gig');
const Job = require('../../models/Job');
const Feed = require('../../models/Feed');

// Mock the models
jest.mock('../../models/User');
jest.mock('../../models/Gig');
jest.mock('../../models/Job');
jest.mock('../../models/Feed');

describe('Search Controller', () => {
  let req, res;

  beforeEach(() => {
    // Reset all mocks 
    jest.clearAllMocks();

    // Setup request and response objects
    req = {
      query: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('globalSearch', () => {
    const mockUsers = [
      {
        _id: 'user1',
        name: 'John Developer',
        email: 'john@example.com',
        profile: {
          avatar: 'avatar1.jpg',
          bio: 'Full stack developer',
          skills: ['JavaScript', 'React']
        },
        role: 'freelancer',
        rating: { average: 4.5 },
        stats: {}
      }
    ];

    const mockGigs = [
      {
        _id: 'gig1',
        title: 'Web Development Service',
        description: 'I will build your website',
        category: 'Web Development',
        tags: ['react', 'nodejs'],
        status: 'active',
        seller: {
          _id: 'user1',
          name: 'John Developer',
          profile: { avatar: 'avatar1.jpg' },
          rating: { average: 4.5 }
        },
        stats: { rating: 4.8 }
      }
    ];

    const mockJobs = [
      {
        _id: 'job1',
        title: 'Build E-commerce Website',
        description: 'Need a full stack developer',
        category: 'Web Development',
        skills: ['React', 'Node.js'],
        tags: ['ecommerce'],
        status: 'open',
        postedBy: {
          _id: 'user2',
          name: 'Jane Client',
          profile: { avatar: 'avatar2.jpg' }
        }
      }
    ];

    const mockPosts = [
      {
        _id: 'post1',
        body: 'Looking for React developers',
        createdBy: {
          _id: 'user2',
          name: 'Jane Client',
          profile: { avatar: 'avatar2.jpg' }
        }
      }
    ];

    beforeEach(() => {
      // Setup mock chains for User
      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUsers)
      });
      User.countDocuments = jest.fn().mockResolvedValue(1);

      // Setup mock chains for Gig
      Gig.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockGigs)
      });
      Gig.countDocuments = jest.fn().mockResolvedValue(1);

      // Setup mock chains for Job
      Job.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockJobs)
      });
      Job.countDocuments = jest.fn().mockResolvedValue(1);

      // Setup mock chains for Feed
      Feed.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockPosts)
      });
      Feed.countDocuments = jest.fn().mockResolvedValue(1);
    });

    test('should return 400 if search query is empty', async () => {
      req.query = { q: '' };

      await globalSearch(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Search query is required'
      });
    });

    test('should return 400 if search query is missing', async () => {
      req.query = {};

      await globalSearch(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Search query is required'
      });
    });

    test('should search across all entities when no type is specified', async () => {
      req.query = { q: 'developer' };

      await globalSearch(req, res);

      expect(User.find).toHaveBeenCalled();
      expect(Gig.find).toHaveBeenCalled();
      expect(Job.find).toHaveBeenCalled();
      expect(Feed.find).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          query: 'developer',
          results: expect.objectContaining({
            users: mockUsers,
            gigs: mockGigs,
            jobs: mockJobs,
            posts: mockPosts
          }),
          counts: expect.any(Object),
          pagination: expect.any(Object)
        })
      );
    });

    test('should search only users when type is "users"', async () => {
      req.query = { q: 'developer', type: 'users' };

      await globalSearch(req, res);

      expect(User.find).toHaveBeenCalled();
      expect(Gig.find).not.toHaveBeenCalled();
      expect(Job.find).not.toHaveBeenCalled();
      expect(Feed.find).not.toHaveBeenCalled();
    });

    test('should search only gigs when type is "gigs"', async () => {
      req.query = { q: 'website', type: 'gigs' };

      await globalSearch(req, res);

      expect(User.find).not.toHaveBeenCalled();
      expect(Gig.find).toHaveBeenCalled();
      expect(Job.find).not.toHaveBeenCalled();
      expect(Feed.find).not.toHaveBeenCalled();
    });

    test('should search only jobs when type is "jobs"', async () => {
      req.query = { q: 'react', type: 'jobs' };

      await globalSearch(req, res);

      expect(User.find).not.toHaveBeenCalled();
      expect(Gig.find).not.toHaveBeenCalled();
      expect(Job.find).toHaveBeenCalled();
      expect(Feed.find).not.toHaveBeenCalled();
    });

    test('should search only posts when type is "posts"', async () => {
      req.query = { q: 'looking', type: 'posts' };

      await globalSearch(req, res);

      expect(User.find).not.toHaveBeenCalled();
      expect(Gig.find).not.toHaveBeenCalled();
      expect(Job.find).not.toHaveBeenCalled();
      expect(Feed.find).toHaveBeenCalled();
    });

    test('should handle pagination correctly', async () => {
      req.query = { q: 'developer', page: '2', limit: '5' };

      await globalSearch(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: {
            page: 2,
            limit: 5,
            total: 4 // 1 user + 1 gig + 1 job + 1 post
          }
        })
      );
    });

    test('should use default pagination values', async () => {
      req.query = { q: 'developer' };

      await globalSearch(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: {
            page: 1,
            limit: 10,
            total: 4
          }
        })
      );
    });

    test('should trim whitespace from search query', async () => {
      req.query = { q: '  developer  ' };

      await globalSearch(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'developer'
        })
      );
    });

    test('should return empty results when no matches found', async () => {
      User.find().lean.mockResolvedValue([]);
      Gig.find().lean.mockResolvedValue([]);
      Job.find().lean.mockResolvedValue([]);
      Feed.find().lean.mockResolvedValue([]);

      User.countDocuments.mockResolvedValue(0);
      Gig.countDocuments.mockResolvedValue(0);
      Job.countDocuments.mockResolvedValue(0);
      Feed.countDocuments.mockResolvedValue(0);

      req.query = { q: 'nonexistent' };

      await globalSearch(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          results: {
            users: [],
            gigs: [],
            jobs: [],
            posts: []
          },
          counts: {
            users: 0,
            gigs: 0,
            jobs: 0,
            posts: 0
          }
        })
      );
    });

    test('should handle database errors gracefully', async () => {
      const errorMessage = 'Database connection error';
      User.find = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      req.query = { q: 'developer' };

      await globalSearch(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error performing search',
        error: errorMessage
      });
    });

    test('should filter users by isActive and isSuspended', async () => {
      req.query = { q: 'developer', type: 'users' };

      await globalSearch(req, res);

      expect(User.find).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
          isSuspended: false
        })
      );
    });

    test('should only search active gigs', async () => {
      req.query = { q: 'website', type: 'gigs' };

      await globalSearch(req, res);

      expect(Gig.find).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active'
        })
      );
    });

    test('should search jobs with open or active status', async () => {
      req.query = { q: 'react', type: 'jobs' };

      await globalSearch(req, res);

      expect(Job.find).toHaveBeenCalledWith(
        expect.objectContaining({
          status: { $in: ['open', 'active'] }
        })
      );
    });
  });

  describe('searchSuggestions', () => {
    const mockUserSuggestions = [
      {
        _id: 'user1',
        name: 'John Developer',
        profile: { avatar: 'avatar1.jpg' },
        role: 'freelancer'
      }
    ];

    const mockGigSuggestions = [
      {
        _id: 'gig1',
        title: 'Web Development',
        images: ['image1.jpg']
      }
    ];

    const mockJobSuggestions = [
      {
        _id: 'job1',
        title: 'React Developer Needed',
        budget: { min: 500, max: 1000 }
      }
    ];

    beforeEach(() => {
      // Setup mock chains for User suggestions
      User.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUserSuggestions)
      });

      // Setup mock chains for Gig suggestions
      Gig.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockGigSuggestions)
      });

      // Setup mock chains for Job suggestions
      Job.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockJobSuggestions)
      });
    });

    test('should return empty suggestions when query is missing', async () => {
      req.query = {};

      await searchSuggestions(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        suggestions: []
      });
    });

    test('should return empty suggestions when query is empty', async () => {
      req.query = { q: '' };

      await searchSuggestions(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        suggestions: []
      });
    });

    test('should return suggestions for all categories', async () => {
      req.query = { q: 'developer' };

      await searchSuggestions(req, res);

      expect(User.find).toHaveBeenCalled();
      expect(Gig.find).toHaveBeenCalled();
      expect(Job.find).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        suggestions: {
          users: [
            {
              id: 'user1',
              name: 'John Developer',
              avatar: 'avatar1.jpg',
              role: 'freelancer',
              type: 'user'
            }
          ],
          gigs: [
            {
              id: 'gig1',
              title: 'Web Development',
              image: 'image1.jpg',
              type: 'gig'
            }
          ],
          jobs: [
            {
              id: 'job1',
              title: 'React Developer Needed',
              budget: { min: 500, max: 1000 },
              type: 'job'
            }
          ],
          posts: []
        }
      });
    });

    test('should limit suggestions to 5 per category', async () => {
      req.query = { q: 'dev' };

      await searchSuggestions(req, res);

      // Check that limit(5) was called for each model
      const userMock = User.find();
      const gigMock = Gig.find();
      const jobMock = Job.find();

      expect(userMock.limit).toHaveBeenCalledWith(5);
      expect(gigMock.limit).toHaveBeenCalledWith(5);
      expect(jobMock.limit).toHaveBeenCalledWith(5);
    });

    test('should handle suggestions with missing optional fields', async () => {
      User.find().lean.mockResolvedValue([
        {
          _id: 'user1',
          name: 'John',
          profile: {},
          role: 'freelancer'
        }
      ]);

      Gig.find().lean.mockResolvedValue([
        {
          _id: 'gig1',
          title: 'Service',
          images: []
        }
      ]);

      req.query = { q: 'test' };

      await searchSuggestions(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        suggestions: expect.objectContaining({
          users: [
            expect.objectContaining({
              avatar: undefined
            })
          ],
          gigs: [
            expect.objectContaining({
              image: undefined
            })
          ]
        })
      });
    });

    test('should trim whitespace from query', async () => {
      req.query = { q: '  developer  ' };

      await searchSuggestions(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });

    test('should handle database errors gracefully', async () => {
      const errorMessage = 'Database error';
      User.find = jest.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });

      req.query = { q: 'developer' };

      await searchSuggestions(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error fetching suggestions',
        error: errorMessage
      });
    });

    test('should return empty arrays when no suggestions found', async () => {
      User.find().lean.mockResolvedValue([]);
      Gig.find().lean.mockResolvedValue([]);
      Job.find().lean.mockResolvedValue([]);

      req.query = { q: 'nonexistent' };

      await searchSuggestions(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        suggestions: {
          users: [],
          gigs: [],
          jobs: [],
          posts: []
        }
      });
    });

    test('should filter users by isActive and isSuspended', async () => {
      req.query = { q: 'developer' };

      await searchSuggestions(req, res);

      expect(User.find).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
          isSuspended: false
        })
      );
    });

    test('should only search active gigs', async () => {
      req.query = { q: 'website' };

      await searchSuggestions(req, res);

      expect(Gig.find).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active'
        })
      );
    });

    test('should search jobs with open or active status', async () => {
      req.query = { q: 'react' };

      await searchSuggestions(req, res);

      expect(Job.find).toHaveBeenCalledWith(
        expect.objectContaining({
          status: { $in: ['open', 'active'] }
        })
      );
    });
  });
});
