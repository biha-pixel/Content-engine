/**
 * Test script to verify Omniroute LLM Provider connection
 * Run with: node test-omniroute.js
 */

require('dotenv').config({ path: '.env.local' });

async function testOmniroute() {
  const apiKey = process.env.OMNIROUTE_API_KEY;
  const baseURL = process.env.OMNIROUTE_BASE_URL || 'http://localhost:20128';
  const model = process.env.OMNIROUTE_MODEL || 'default';

  console.log('🔍 Testing Omniroute LLM Provider...\n');
  console.log(`API Key: ${apiKey ? apiKey.substring(0, 15) + '...' : 'NOT SET'}`);
  console.log(`Base URL: ${baseURL}`);
  console.log(`Model: ${model}\n`);

  // Test 1: Check if endpoint is reachable
  console.log('Test 1: Checking endpoint availability...');
  try {
    const endpoint = baseURL.endsWith('/v1')
      ? `${baseURL}/models`
      : `${baseURL}/v1/models`;

    const headers = {};
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(endpoint, {
      method: 'GET',
      headers,
    });

    if (response.ok) {
      console.log('✅ Endpoint is reachable');
      const data = await response.json();
      console.log('Available models:', data);
    } else {
      console.log(`❌ Endpoint returned status ${response.status}`);
      const errorText = await response.text();
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.log('❌ Failed to reach endpoint:', error.message);
  }

  console.log('\nTest 2: Sending a simple chat completion request...');
  try {
    const endpoint = baseURL.endsWith('/v1')
      ? `${baseURL}/chat/completions`
      : `${baseURL}/v1/chat/completions`;

    const headers = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: 'Say "Hello from Omniroute!" if you can read this.',
          },
        ],
        max_tokens: 50,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.log(`❌ API error (${response.status}):`, errorBody);
      return;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (content) {
      console.log('✅ Chat completion successful!');
      console.log('Response:', content);
    } else {
      console.log('❌ No content in response');
      console.log('Full response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('❌ Chat completion failed:', error.message);
  }

  console.log('\n✨ Test complete!');
}

testOmniroute();
