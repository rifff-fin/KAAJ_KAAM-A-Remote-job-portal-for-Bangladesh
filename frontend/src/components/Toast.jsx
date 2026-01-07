import React, { useEffect } from 'react';
import { Check, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'success', duration = 3000, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const icons = {
    success: <Check className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />
  };

  return (
    <div
      className={`fixed top-4 right-4 flex items-center gap-3 px-6 py-4 border rounded-lg shadow-lg z-[9999] animate-in fade-in slide-in-from-top-5 ${styles[type]}`}
    >
      {icons[type]}
      <span className="font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-4 hover:opacity-70 transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
