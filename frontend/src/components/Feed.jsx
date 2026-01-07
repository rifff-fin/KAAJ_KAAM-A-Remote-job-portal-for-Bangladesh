import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ThumbsUp, 
  ThumbsDown, 
  MessageCircle, 
  Share2, 
  Send, 
  Image as ImageIcon,
  X
} from 'lucide-react';
import API from '../api';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState({ body: '', media: [] });
  const [mediaPreview, setMediaPreview] = useState([]);
  const [commentText, setCommentText] = useState({});
  const [showComments, setShowComments] = useState({});
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await API.get('/feed');
      setPosts(response.data.posts || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.body.trim() && mediaPreview.length === 0) {
      alert('Please add some content or media to your post');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('body', newPost.body);
      
      newPost.media.forEach((file) => {
        formData.append('media', file);
      });

      const response = await API.post('/feed', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setPosts([response.data.post, ...posts]);
      setNewPost({ body: '', media: [] });
      setMediaPreview([]);
    } catch (err) {
      console.error('Error creating post:', err);
      alert('Failed to create post');
    }
  };

  const handleMediaSelect = (e) => {
    const files = Array.from(e.target.files);
    setNewPost({ ...newPost, media: files });
    
    const previews = files.map(file => URL.createObjectURL(file));
    setMediaPreview(previews);
  };

  const removeMediaPreview = (index) => {
    const newMedia = [...newPost.media];
    const newPreviews = [...mediaPreview];
    
    URL.revokeObjectURL(newPreviews[index]);
    newMedia.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setNewPost({ ...newPost, media: newMedia });
    setMediaPreview(newPreviews);
  };

  const handleUpvote = async (postId) => {
    try {
      const response = await API.post(`/feed/${postId}/upvote`);
      setPosts(posts.map(post => 
        post._id === postId ? response.data.post : post
      ));
    } catch (err) {
      console.error('Error upvoting post:', err);
    }
  };

  const handleDownvote = async (postId) => {
    try {
      const response = await API.post(`/feed/${postId}/downvote`);
      setPosts(posts.map(post => 
        post._id === postId ? response.data.post : post
      ));
    } catch (err) {
      console.error('Error downvoting post:', err);
    }
  };

  const handleAddComment = async (postId) => {
    const text = commentText[postId]?.trim();
    if (!text) return;

    try {
      const response = await API.post(`/feed/${postId}/comment`, { body: text });
      setPosts(posts.map(post => 
        post._id === postId ? response.data.post : post
      ));
      setCommentText({ ...commentText, [postId]: '' });
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;

    try {
      await API.delete(`/feed/${postId}`);
      setPosts(posts.filter(post => post._id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  const handleShare = async (postId) => {
    try {
      await API.post(`/feed/${postId}/share`);
      alert('Post shared!');
      fetchPosts();
    } catch (err) {
      console.error('Error sharing post:', err);
    }
  };

  const toggleComments = (postId) => {
    setShowComments({ ...showComments, [postId]: !showComments[postId] });
  };

  const isUpvoted = (post) => {
    return post.upvote?.some(id => id === user?.id || id._id === user?.id);
  };

  const isDownvoted = (post) => {
    return post.downvote?.some(id => id === user?.id || id._id === user?.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-6 px-4">
        {/* Create Post */}
        {user && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <form onSubmit={handleCreatePost}>
              <textarea
                value={newPost.body}
                onChange={(e) => setNewPost({ ...newPost, body: e.target.value })}
                placeholder="What's on your mind?"
                className="w-full border-0 focus:ring-0 resize-none text-sm"
                rows="2"
              />

              {mediaPreview.length > 0 && (
                <div className="mt-2 flex gap-2 overflow-x-auto">
                  {mediaPreview.map((preview, index) => (
                    <div key={index} className="relative flex-shrink-0">
                      <img src={preview} alt="" className="w-20 h-20 object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => removeMediaPreview(index)}
                        className="absolute -top-1 -right-1 bg-gray-800 text-white rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 flex items-center justify-between border-t pt-3">
                <label className="cursor-pointer text-gray-500 hover:text-gray-700">
                  <ImageIcon className="w-5 h-5" />
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleMediaSelect}
                    className="hidden"
                  />
                </label>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700"
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Posts */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-500 text-sm">No posts yet</p>
            </div>
          ) : (
            posts.map(post => (
              <div key={post._id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Post Header */}
                <div className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <Link to={`/profile/${post.createdBy?._id}`} className="flex items-center gap-3">
                      {post.createdBy?.profile?.avatar ? (
                        <img 
                          src={post.createdBy.profile.avatar} 
                          alt={post.createdBy.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-600 text-sm font-medium">
                            {post.createdBy?.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-sm text-gray-900">
                          {post.createdBy?.name || 'Unknown'}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {new Date(post.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </Link>

                    {user?.id === post.createdBy?._id && (
                      <button
                        onClick={() => handleDeletePost(post._id)}
                        className="text-gray-400 hover:text-red-500 text-sm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Post Body */}
                  <p className="mt-3 text-sm text-gray-800 whitespace-pre-wrap">{post.body}</p>
                </div>

                {/* Media */}
                {post.media && post.media.length > 0 && (
                  <div className={`${post.media.length === 1 ? '' : 'grid grid-cols-2 gap-0.5'}`}>
                    {post.media.map((item, index) => (
                      <div key={index}>
                        {item.type === 'video' ? (
                          <video src={item.url} controls className="w-full" />
                        ) : (
                          <img src={item.url} alt="" className="w-full" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Engagement Bar */}
                <div className="px-4 py-2 flex items-center justify-between text-xs text-gray-500 border-t">
                  <span>{post.upvoteCount || 0} upvotes</span>
                  <span>{post.commentCount || 0} comments</span>
                </div>

                {/* Actions */}
                <div className="px-4 py-2 flex items-center justify-around border-t">
                  <button
                    onClick={() => handleUpvote(post._id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
                      isUpvoted(post) ? 'text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-xs">Like</span>
                  </button>

                  <button
                    onClick={() => toggleComments(post._id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-50"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-xs">Comment</span>
                  </button>

                  <button
                    onClick={() => handleShare(post._id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-50"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="text-xs">Share</span>
                  </button>
                </div>

                {/* Comments Section */}
                {showComments[post._id] && (
                  <div className="px-4 py-3 border-t bg-gray-50">
                    {user && (
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          value={commentText[post._id] || ''}
                          onChange={(e) => setCommentText({ ...commentText, [post._id]: e.target.value })}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post._id)}
                          placeholder="Write a comment..."
                          className="flex-1 border border-gray-300 rounded-full px-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => handleAddComment(post._id)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className="space-y-2">
                      {post.comment && post.comment.length > 0 ? (
                        post.comment.map(comment => (
                          <div key={comment._id} className="flex gap-2">
                            <Link 
                              to={`/profile/${comment.createdBy?._id}`} 
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0"
                            >
                              {comment.createdBy?.profile?.avatar ? (
                                <img 
                                  src={comment.createdBy.profile.avatar} 
                                  alt={comment.createdBy.name}
                                  className="w-8 h-8 rounded-full object-cover hover:opacity-80 transition"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition">
                                  <span className="text-gray-600 text-xs">
                                    {comment.createdBy?.name?.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </Link>
                            <div className="flex-1 bg-white rounded-lg px-3 py-2">
                              <Link 
                                to={`/profile/${comment.createdBy?._id}`} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-xs text-gray-900 hover:text-blue-600 transition"
                              >
                                {comment.createdBy?.name || 'Unknown'}
                              </Link>
                              <p className="text-sm text-gray-700 mt-0.5">{comment.body}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-xs text-center py-2">No comments yet</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
