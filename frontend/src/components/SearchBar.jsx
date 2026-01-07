import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Briefcase, FileText, Users, X } from 'lucide-react';
import API from '../api';

export default function SearchBar({ placeholder = "Search for anything...", className = "" }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const debounceTimeout = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions when user types
  const fetchSuggestions = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setSuggestions(null);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    try {
      const response = await API.get(`/search/suggestions?q=${encodeURIComponent(searchQuery)}`);
      if (response.data.success) {
        setSuggestions(response.data.suggestions);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search input
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    // Clear previous timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Set new timeout
    debounceTimeout.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  // Handle enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      setShowDropdown(false);
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setShowDropdown(false);
    setQuery('');

    if (suggestion.type === 'user') {
      navigate(`/profile/${suggestion.id}`);
    } else if (suggestion.type === 'gig') {
      navigate(`/gig/${suggestion.id}`);
    } else if (suggestion.type === 'job') {
      navigate(`/jobs?id=${suggestion.id}`);
    } else if (suggestion.type === 'post') {
      navigate(`/feed?post=${suggestion.id}`);
    }
  };

  // Handle search button click
  const handleSearch = () => {
    if (query.trim()) {
      setShowDropdown(false);
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  // Clear search
  const handleClear = () => {
    setQuery('');
    setSuggestions(null);
    setShowDropdown(false);
  };

  const hasSuggestions = suggestions && (
    suggestions.users?.length > 0 || 
    suggestions.gigs?.length > 0 || 
    suggestions.jobs?.length > 0
  );

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="flex items-center bg-white rounded-full shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <Search className="w-5 h-5 text-gray-400 ml-4" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onFocus={() => query.trim() && hasSuggestions && setShowDropdown(true)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2.5 outline-none text-gray-700 bg-transparent rounded-full"
        />
        {query && (
          <button
            onClick={handleClear}
            className="p-2 text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-full hover:bg-blue-700 transition font-medium mr-1"
        >
          Search
        </button>
      </div>

      {/* Dropdown Suggestions */}
      {showDropdown && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : hasSuggestions ? (
            <div className="py-2">
              {/* Users */}
              {suggestions.users?.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    People
                  </div>
                  {suggestions.users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSuggestionClick(user)}
                      className="w-full px-4 py-2.5 hover:bg-gray-50 transition flex items-center gap-3 text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Gigs */}
              {suggestions.gigs?.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Gigs
                  </div>
                  {suggestions.gigs.map((gig) => (
                    <button
                      key={gig.id}
                      onClick={() => handleSuggestionClick(gig)}
                      className="w-full px-4 py-2.5 hover:bg-gray-50 transition flex items-center gap-3 text-left"
                    >
                      <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {gig.image ? (
                          <img src={gig.image} alt={gig.title} className="w-full h-full object-cover" />
                        ) : (
                          <Briefcase className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{gig.title}</p>
                        <p className="text-xs text-gray-500">Gig</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Jobs */}
              {suggestions.jobs?.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Jobs
                  </div>
                  {suggestions.jobs.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => handleSuggestionClick(job)}
                      className="w-full px-4 py-2.5 hover:bg-gray-50 transition flex items-center gap-3 text-left"
                    >
                      <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{job.title}</p>
                        <p className="text-xs text-gray-500">৳{job.budget.toLocaleString()}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* View all results */}
              <button
                onClick={handleSearch}
                className="w-full px-4 py-3 text-center text-sm font-medium text-blue-600 hover:bg-blue-50 transition border-t border-gray-100 mt-2"
              >
                View all results for "{query}"
              </button>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500 text-sm">
              No suggestions found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
