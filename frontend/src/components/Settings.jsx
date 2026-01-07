// frontend/src/components/Settings.jsx
import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Mail, Save, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

export default function Settings() {
  const navigate = useNavigate();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await API.get('/settings');
      setEmailNotifications(response.data.emailNotifications);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');
      await API.put('/settings/email-notifications', { emailNotifications });
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Bell className="w-8 h-8 text-blue-500" />
            Settings
          </h1>
          <p className="text-gray-600 mt-2">Manage your notification preferences</p>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('success') 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message}
          </div>
        )}

        {/* Settings Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8 space-y-6">
            {/* Email Notifications Section */}
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-500" />
                Email Notifications
              </h2>
              <p className="text-gray-600 text-sm">
                Receive email updates for important events
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {emailNotifications ? (
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Bell className="w-6 h-6 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <BellOff className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-gray-800 font-semibold text-lg">
                      Email Notifications
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {emailNotifications ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    emailNotifications ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      emailNotifications ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {emailNotifications && (
                <div className="mt-6 pl-16 space-y-2 text-sm text-gray-700">
                  <p className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Order updates and status changes
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Payment confirmations
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Delivery notifications
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> New messages and chat notifications
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Review notifications
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Job application updates
                  </p>
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            <strong>Note:</strong> Email notifications will be sent to your registered email address. 
            Make sure your email is verified to receive notifications.
          </p>
        </div>
      </div>
    </div>
  );
}
