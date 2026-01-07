const Feed = require('../models/Feed');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

/* ===============================
   CREATE A NEW FEED POST
================================ */
exports.createPost = async (req, res) => {
  try {
    const { body } = req.body;
    const createdBy = req.user.id;

    if (!body || body.trim() === '') {
      return res.status(400).json({ message: 'Post body is required' });
    }

    let media = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'kaaj-kaam/feed',
            resource_type: 'auto'
          });
          
          let mediaType = 'image';
          if (result.resource_type === 'video') {
            mediaType = 'video';
          } else if (result.format === 'pdf' || result.resource_type === 'raw') {
            mediaType = 'document';
          }

          media.push({
            url: result.secure_url,
            type: mediaType
          });
          
          fs.unlink(file.path, () => {});
        } catch (err) {
          console.error('Media upload failed:', err);
        }
      }
    }

    const post = await Feed.create({
      createdBy,
      body,
      media
    });

    const populatedPost = await Feed.findById(post._id)
      .populate('createdBy', 'name email profile.avatar')
      .populate('comment.createdBy', 'name profile.avatar');

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: populatedPost
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===============================
   GET ALL FEED POSTS
================================ */
exports.getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt' } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.user?.id;

    let posts = [];

    // If user is logged in, prioritize posts from followed users
    if (userId) {
      const user = await require('../models/User').findById(userId);
      
      if (user && user.following.length > 0) {
        // Get posts from followed users
        const followingPosts = await Feed.find({ createdBy: { $in: user.following } })
          .sort({ [sortBy]: -1 })
          .populate('createdBy', 'name email profile.avatar profile.bio')
          .populate('comment.createdBy', 'name profile.avatar')
          .populate('upvote', 'name')
          .populate('downvote', 'name');

        // Get remaining posts (not from followed users)
        const remainingPostsCount = Number(limit) - followingPosts.length;
        let otherPosts = [];
        
        if (remainingPostsCount > 0) {
          otherPosts = await Feed.find({ 
            createdBy: { $nin: [...user.following, userId] } 
          })
            .sort({ [sortBy]: -1 })
            .limit(remainingPostsCount)
            .populate('createdBy', 'name email profile.avatar profile.bio')
            .populate('comment.createdBy', 'name profile.avatar')
            .populate('upvote', 'name')
            .populate('downvote', 'name');
        }

        posts = [...followingPosts, ...otherPosts].slice(skip, skip + Number(limit));
      } else {
        // User not following anyone, show all posts
        posts = await Feed.find()
          .sort({ [sortBy]: -1 })
          .skip(skip)
          .limit(Number(limit))
          .populate('createdBy', 'name email profile.avatar profile.bio')
          .populate('comment.createdBy', 'name profile.avatar')
          .populate('upvote', 'name')
          .populate('downvote', 'name');
      }
    } else {
      // User not logged in, show all posts
      posts = await Feed.find()
        .sort({ [sortBy]: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('createdBy', 'name email profile.avatar profile.bio')
        .populate('comment.createdBy', 'name profile.avatar')
        .populate('upvote', 'name')
        .populate('downvote', 'name');
    }

    const total = await Feed.countDocuments();

    res.status(200).json({
      success: true,
      posts,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===============================
   GET A SINGLE POST
================================ */
exports.getPost = async (req, res) => {
  try {
    const post = await Feed.findById(req.params.id)
      .populate('createdBy', 'name email profile.avatar profile.bio')
      .populate('comment.createdBy', 'name profile.avatar')
      .populate('upvote', 'name')
      .populate('downvote', 'name');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.status(200).json({
      success: true,
      post
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===============================
   GET USER'S POSTS
================================ */
exports.getUserPosts = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const posts = await Feed.find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('createdBy', 'name email profile.avatar')
      .populate('comment.createdBy', 'name profile.avatar');

    const total = await Feed.countDocuments({ createdBy: userId });

    res.status(200).json({
      success: true,
      posts,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===============================
   UPDATE A POST
================================ */
exports.updatePost = async (req, res) => {
  try {
    const { body } = req.body;
    const post = await Feed.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    if (body) post.body = body;

    await post.save();

    const updatedPost = await Feed.findById(post._id)
      .populate('createdBy', 'name email profile.avatar')
      .populate('comment.createdBy', 'name profile.avatar');

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      post: updatedPost
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===============================
   DELETE A POST
================================ */
exports.deletePost = async (req, res) => {
  try {
    const post = await Feed.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Feed.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===============================
   UPVOTE A POST
================================ */
exports.upvotePost = async (req, res) => {
  try {
    const post = await Feed.findById(req.params.id);
    const userId = req.user.id;

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user already upvoted
    const upvoteIndex = post.upvote.indexOf(userId);
    const downvoteIndex = post.downvote.indexOf(userId);

    // Remove from downvote if exists
    if (downvoteIndex > -1) {
      post.downvote.splice(downvoteIndex, 1);
    }

    // Toggle upvote
    if (upvoteIndex > -1) {
      post.upvote.splice(upvoteIndex, 1);
    } else {
      post.upvote.push(userId);
    }

    await post.save();

    const updatedPost = await Feed.findById(post._id)
      .populate('createdBy', 'name email profile.avatar')
      .populate('comment.createdBy', 'name profile.avatar');

    res.status(200).json({
      success: true,
      message: upvoteIndex > -1 ? 'Upvote removed' : 'Post upvoted',
      post: updatedPost
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===============================
   DOWNVOTE A POST
================================ */
exports.downvotePost = async (req, res) => {
  try {
    const post = await Feed.findById(req.params.id);
    const userId = req.user.id;

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user already downvoted
    const downvoteIndex = post.downvote.indexOf(userId);
    const upvoteIndex = post.upvote.indexOf(userId);

    // Remove from upvote if exists
    if (upvoteIndex > -1) {
      post.upvote.splice(upvoteIndex, 1);
    }

    // Toggle downvote
    if (downvoteIndex > -1) {
      post.downvote.splice(downvoteIndex, 1);
    } else {
      post.downvote.push(userId);
    }

    await post.save();

    const updatedPost = await Feed.findById(post._id)
      .populate('createdBy', 'name email profile.avatar')
      .populate('comment.createdBy', 'name profile.avatar');

    res.status(200).json({
      success: true,
      message: downvoteIndex > -1 ? 'Downvote removed' : 'Post downvoted',
      post: updatedPost
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===============================
   ADD A COMMENT
================================ */
exports.addComment = async (req, res) => {
  try {
    const { body } = req.body;
    const post = await Feed.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!body || body.trim() === '') {
      return res.status(400).json({ message: 'Comment body is required' });
    }

    post.comment.push({
      createdBy: req.user.id,
      body: body.trim()
    });

    await post.save();

    const updatedPost = await Feed.findById(post._id)
      .populate('createdBy', 'name email profile.avatar')
      .populate('comment.createdBy', 'name profile.avatar');

    res.status(200).json({
      success: true,
      message: 'Comment added successfully',
      post: updatedPost
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===============================
   DELETE A COMMENT
================================ */
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const post = await Feed.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comment.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    post.comment.pull(commentId);
    await post.save();

    const updatedPost = await Feed.findById(post._id)
      .populate('createdBy', 'name email profile.avatar')
      .populate('comment.createdBy', 'name profile.avatar');

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      post: updatedPost
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===============================
   SHARE A POST
================================ */
exports.sharePost = async (req, res) => {
  try {
    const post = await Feed.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.share += 1;
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post shared successfully',
      shareCount: post.share
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
