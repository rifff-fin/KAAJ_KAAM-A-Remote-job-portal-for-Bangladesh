import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Search, User, Briefcase, FileText, Users, 
  Star, MapPin, Clock, DollarSign, Calendar,
  Filter, X
} from 'lucide-react';
import API from '../api';

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'all';

  const [results, setResults] = useState({
    users: [],
    gigs: [],
    jobs: [],
    posts: []
  });
  const [counts, setCounts] = useState({
    users: 0,
    gigs: 0,
    jobs: 0,
    posts: 0
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [query, activeTab]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const typeParam = activeTab === 'all' ? '' : `&type=${activeTab}`;
      const response = await API.get(`/search?q=${encodeURIComponent(query)}${typeParam}`);
      
      if (response.data.success) {
        setResults(response.data.results);
        setCounts(response.data.counts);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'all', label: 'All', count: counts.users + counts.gigs + counts.jobs + counts.posts },
    { id: 'users', label: 'People', count: counts.users, icon: Users },
    { id: 'gigs', label: 'Gigs', count: counts.gigs, icon: Briefcase },
    { id: 'jobs', label: 'Jobs', count: counts.jobs, icon: FileText },
    { id: 'posts', label: 'Posts', count: counts.posts, icon: FileText }
  ];

  const totalResults = counts.users + counts.gigs + counts.jobs + counts.posts;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Search Results for "{query}"
          </h1>
          <p className="text-gray-600">
            {loading ? 'Searching...' : `${totalResults} results found`}
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center gap-1 p-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Users Results */}
            {(activeTab === 'all' || activeTab === 'users') && results.users?.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  People
                </h2>
                <div className="space-y-3">
                  {results.users.map((user) => (
                    <Link
                      key={user._id}
                      to={`/profile/${user._id}`}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {user.profile?.avatar ? (
                          <img 
                            src={user.profile.avatar} 
                            alt={user.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <User className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
                        <p className="text-sm text-gray-600 truncate">
                          {user.profile?.bio || 'No bio available'}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="capitalize px-2 py-1 bg-gray-100 rounded">
                            {user.role}
                          </span>
                          {user.rating?.average > 0 && (
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              {user.rating.average.toFixed(1)}
                            </span>
                          )}
                          {user.profile?.skills?.length > 0 && (
                            <span className="truncate">
                              {user.profile.skills.slice(0, 3).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Gigs Results */}
            {(activeTab === 'all' || activeTab === 'gigs') && results.gigs?.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Gigs
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.gigs.map((gig) => (
                    <Link
                      key={gig._id}
                      to={`/gig/${gig._id}`}
                      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
                    >
                      <div className="aspect-video bg-gray-200 relative overflow-hidden">
                        {gig.images?.[0] ? (
                          <img 
                            src={gig.images[0]} 
                            alt={gig.title} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Briefcase className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
                          {gig.title}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
                            {gig.seller?.profile?.avatar ? (
                              <img 
                                src={gig.seller.profile.avatar} 
                                alt={gig.seller.name}
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <User className="w-full h-full text-gray-400 p-1" />
                            )}
                          </div>
                          <span className="text-sm text-gray-600 truncate">
                            {gig.seller?.name}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          {gig.rating?.average > 0 && (
                            <span className="flex items-center gap-1 text-sm">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              {gig.rating.average.toFixed(1)}
                            </span>
                          )}
                          <span className="font-semibold text-gray-900">
                            From ৳{gig.priceTiers?.[0]?.price || 0}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Jobs Results */}
            {(activeTab === 'all' || activeTab === 'jobs') && results.jobs?.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Jobs
                </h2>
                <div className="space-y-3">
                  {results.jobs.map((job) => (
                    <div
                      key={job._id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                    >
                      <h3 className="font-semibold text-gray-900 mb-2">{job.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {job.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          ৳{job.budget?.toLocaleString()}
                        </span>
                        {job.deadline && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(job.deadline).toLocaleDateString()}
                          </span>
                        )}
                        <span className="capitalize px-2 py-1 bg-gray-100 rounded text-xs">
                          {job.category}
                        </span>
                      </div>
                      {job.skills?.length > 0 && (
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {job.skills.slice(0, 5).map((skill, idx) => (
                            <span 
                              key={idx}
                              className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Posts Results */}
            {(activeTab === 'all' || activeTab === 'posts') && results.posts?.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Posts
                </h2>
                <div className="space-y-3">
                  {results.posts.map((post) => (
                    <Link
                      key={post._id}
                      to={`/feed?post=${post._id}`}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition block"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                          {post.createdBy?.profile?.avatar ? (
                            <img 
                              src={post.createdBy.profile.avatar} 
                              alt={post.createdBy.name}
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <User className="w-full h-full text-gray-400 p-2" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {post.createdBy?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700 line-clamp-3">{post.body}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {!loading && totalResults === 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No results found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your search terms or browse all categories
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
