import React from 'react';
import { Star, User } from 'lucide-react';
import { formatRelativeTime } from '../utils/formatters';

export default function ReviewCard({ review }) {
  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
      {/* Reviewer Info */}
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0">
          {review.reviewer?.profile?.avatar ? (
            <img
              src={review.reviewer.profile.avatar}
              alt={review.reviewer.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-gray-900">
              {review.isAnonymous ? 'Anonymous User' : review.reviewer?.name || 'User'}
            </h4>
            <span className="text-sm text-gray-500">
              {formatRelativeTime(review.createdAt)}
            </span>
          </div>
          
          {/* Rating Stars */}
          <div className="flex items-center gap-1 mb-2">
            {renderStars(review.rating)}
            <span className="ml-2 text-sm font-medium text-gray-700">
              {review.rating}.0
            </span>
          </div>
        </div>
      </div>

      {/* Review Comment */}
      <p className="text-gray-700 leading-relaxed mb-4">
        {review.comment}
      </p>

      {/* Category Ratings */}
      {review.categories && (
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
          {review.categories.communication && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Communication</span>
              <div className="flex items-center gap-1">
                {renderStars(review.categories.communication)}
              </div>
            </div>
          )}
          {review.categories.quality && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Quality</span>
              <div className="flex items-center gap-1">
                {renderStars(review.categories.quality)}
              </div>
            </div>
          )}
          {review.categories.timeliness && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Timeliness</span>
              <div className="flex items-center gap-1">
                {renderStars(review.categories.timeliness)}
              </div>
            </div>
          )}
          {review.categories.professionalism && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Professionalism</span>
              <div className="flex items-center gap-1">
                {renderStars(review.categories.professionalism)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}