import React, { useEffect } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function MessageNotification({ message, onClose, onClick }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div 
      onClick={onClick}
      className="fixed top-20 right-4 bg-white rounded-xl shadow-2xl p-4 max-w-[20rem] w-full z-50 border border-gray-200 cursor-pointer hover:shadow-xl transition-shadow"
      style={{ maxWidth: 'calc(100vw - 2rem)' }}
    >
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <img
            src={message.sender?.profile?.avatar || `https://i.pravatar.cc/40?u=${message.sender?.name}`}
            alt={message.sender?.name}
            className="w-12 h-12 rounded-full object-cover"
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || 'User')}&background=random`;
            }}
          />
          <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1">
            <MessageSquare className="w-3 h-3 text-white" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 text-sm truncate">
                {message.sender?.name}
              </h4>
              <p className="text-xs text-gray-500 truncate">
                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-sm text-gray-700 mt-2 line-clamp-2 break-words">
            {message.text}
          </p>
        </div>
      </div>
    </div>
  );
}