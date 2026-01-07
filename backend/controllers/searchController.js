const User = require('../models/User');
const Gig = require('../models/Gig');
const Job = require('../models/Job');
const Feed = require('../models/Feed');

// Global search across all entities
const globalSearch = async (req, res) => {
  try {
    const { q, type, page = 1, limit = 10 } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query is required' 
      });
    }

    const searchQuery = q.trim();
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const results = {
      users: [],
      gigs: [],
      jobs: [],
      posts: []
    };

    const counts = {
      users: 0,
      gigs: 0,
      jobs: 0,
      posts: 0
    };

    // Search users (both freelancers and buyers)
    if (!type || type === 'users') {
      const userQuery = {
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } },
          { 'profile.bio': { $regex: searchQuery, $options: 'i' } },
          { 'profile.skills': { $regex: searchQuery, $options: 'i' } }
        ],
        isActive: true,
        isSuspended: false
      };

      results.users = await User.find(userQuery)
        .select('name email profile.avatar profile.bio profile.skills role rating stats')
        .sort({ 'rating.average': -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

      counts.users = await User.countDocuments(userQuery);
    }

    // Search gigs
    if (!type || type === 'gigs') {
      const gigQuery = {
        $or: [
          { title: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } },
          { category: { $regex: searchQuery, $options: 'i' } },
          { tags: { $regex: searchQuery, $options: 'i' } }
        ],
        status: 'active'
      };

      results.gigs = await Gig.find(gigQuery)
        .populate('seller', 'name profile.avatar rating')
        .sort({ 'stats.rating': -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

      counts.gigs = await Gig.countDocuments(gigQuery);
    }

    // Search jobs
    if (!type || type === 'jobs') {
      const jobQuery = {
        $or: [
          { title: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } },
          { category: { $regex: searchQuery, $options: 'i' } },
          { skills: { $regex: searchQuery, $options: 'i' } },
          { tags: { $regex: searchQuery, $options: 'i' } }
        ],
        status: { $in: ['open', 'active'] }
      };

      results.jobs = await Job.find(jobQuery)
        .populate('postedBy', 'name profile.avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

      counts.jobs = await Job.countDocuments(jobQuery);
    }

    // Search posts
    if (!type || type === 'posts') {
      const postQuery = {
        body: { $regex: searchQuery, $options: 'i' }
      };

      results.posts = await Feed.find(postQuery)
        .populate('createdBy', 'name profile.avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

      counts.posts = await Feed.countDocuments(postQuery);
    }

    res.status(200).json({
      success: true,
      query: searchQuery,
      results,
      counts,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total: counts.users + counts.gigs + counts.jobs + counts.posts
      }
    });

  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error performing search', 
      error: error.message 
    });
  }
};

// Quick search suggestions (for dropdown autocomplete)
const searchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(200).json({ 
        success: true, 
        suggestions: [] 
      });
    }

    const searchQuery = q.trim();
    const limit = 5; // Limit suggestions to 5 per category

    const suggestions = {
      users: [],
      gigs: [],
      jobs: [],
      posts: []
    };

    // Get user suggestions
    const users = await User.find({
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        { 'profile.skills': { $regex: searchQuery, $options: 'i' } }
      ],
      isActive: true,
      isSuspended: false
    })
      .select('name profile.avatar role')
      .limit(limit)
      .lean();

    suggestions.users = users.map(u => ({
      id: u._id,
      name: u.name,
      avatar: u.profile?.avatar,
      role: u.role,
      type: 'user'
    }));

    // Get gig suggestions
    const gigs = await Gig.find({
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { tags: { $regex: searchQuery, $options: 'i' } }
      ],
      status: 'active'
    })
      .select('title images')
      .limit(limit)
      .lean();

    suggestions.gigs = gigs.map(g => ({
      id: g._id,
      title: g.title,
      image: g.images?.[0],
      type: 'gig'
    }));

    // Get job suggestions
    const jobs = await Job.find({
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { skills: { $regex: searchQuery, $options: 'i' } }
      ],
      status: { $in: ['open', 'active'] }
    })
      .select('title budget')
      .limit(limit)
      .lean();

    suggestions.jobs = jobs.map(j => ({
      id: j._id,
      title: j.title,
      budget: j.budget,
      type: 'job'
    }));

    res.status(200).json({
      success: true,
      suggestions
    });

  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching suggestions', 
      error: error.message 
    });
  }
};

module.exports = {
  globalSearch,
  searchSuggestions
};
