const axios = require('axios');

// Test script to check conversations API
async function testConversationsAPI() {
  try {
    // You need to replace this with a valid token from your localStorage
    const token = 'YOUR_TOKEN_HERE';
    
    const response = await axios.get('http://localhost:8080/api/chat/conversations', {
      headers: {
        'x-auth-token': token
      }
    });
    
    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Error!');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.message);
    console.log('Full error:', error.message);
  }
}

testConversationsAPI();