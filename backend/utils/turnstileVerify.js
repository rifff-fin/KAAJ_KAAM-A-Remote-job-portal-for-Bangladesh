// backend/utils/turnstileVerify.js
const axios = require('axios');

/**
 * Verify Cloudflare Turnstile token
 * @param {string} token - The Turnstile response token from the frontend
 * @param {string} remoteip - Optional: The user's IP address
 * @returns {Promise<{success: boolean, message?: string}>}
 */
async function verifyTurnstileToken(token, remoteip = null) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.error('TURNSTILE_SECRET_KEY not configured in environment');
    return { 
      success: false, 
      message: 'Turnstile verification not configured' 
    };
  }

  if (!token) {
    return { 
      success: false, 
      message: 'Turnstile token is required' 
    };
  }

  try {
    // Create form data for the verification request
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    
    if (remoteip) {
      formData.append('remoteip', remoteip);
    }

    // Call Cloudflare's siteverify endpoint
    const response = await axios.post(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 5000, // 5 second timeout
      }
    );

    const data = response.data;

    if (data.success) {
      return { 
        success: true,
        hostname: data.hostname,
        challenge_ts: data.challenge_ts,
        action: data.action
      };
    } else {
      console.error('Turnstile verification failed:', data['error-codes']);
      return { 
        success: false, 
        message: 'Security verification failed. Please try again.',
        errorCodes: data['error-codes']
      };
    }
  } catch (error) {
    console.error('Turnstile verification error:', error.message);
    return { 
      success: false, 
      message: 'Security verification service unavailable. Please try again later.' 
    };
  }
}

module.exports = { verifyTurnstileToken };
