const express = require('express');
const {
  createPost,
  getAllPosts,
  getPost,
  getUserPosts,
  updatePost,
  deletePost,
  upvotePost,
  downvotePost,
  addComment,
  deleteComment,
  sharePost
} = require('../controllers/feedController');
const { protect, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Create a new post (protected)
router.post('/', protect, upload.array('media', 5), createPost);

// Get all posts (public but prioritizes followed users if logged in)
router.get('/', optionalAuth, getAllPosts);

// Get user's posts (protected)
router.get('/user/:userId?', protect, getUserPosts);

// Get single post by ID (public)
router.get('/:id', getPost);

// Update post (protected)
router.put('/:id', protect, updatePost);

// Delete post (protected)
router.delete('/:id', protect, deletePost);

// Upvote post (protected)
router.post('/:id/upvote', protect, upvotePost);

// Downvote post (protected)
router.post('/:id/downvote', protect, downvotePost);

// Add comment (protected)
router.post('/:id/comment', protect, addComment);

// Delete comment (protected)
router.delete('/:id/comment/:commentId', protect, deleteComment);

// Share post (protected)
router.post('/:id/share', protect, sharePost);

module.exports = router;
