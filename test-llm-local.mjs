/**
 * Test LLM invocation locally to debug Meta-Agent chat
 */

import { config } from 'dotenv';
config();

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL || 'https://forge.manus.im';
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!FORGE_API_KEY) {
  console.error('❌ BUILT_IN_FORGE_API_KEY not found in environment');
  process.exit(1);
}

async function testLLM() {
  console.log('🧪 Testing LLM invocation...');
  console.log(`API URL: ${FORGE_API_URL}/v1/chat/completions`);
  console.log(`API Key: ${FORGE_API_KEY.substring(0, 10)}...`);
  
  const payload = {
    model: "gemini-2.5-flash",
    messages: [
      {
        role: "system",
        content: "You are a helpful AI assistant. Respond in Spanish."
      },
      {
        role: "user",
        content: "Hola, ¿cómo estás?"
      }
    ],
    temperature: 0.8,
    max_tokens: 32768,
    thinking: {
      budget_tokens: 128
    }
  };

  console.log('\n📤 Sending payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(`${FORGE_API_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FORGE_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    console.log(`\n📥 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('\n✅ Success! Response:', JSON.stringify(data, null, 2));

    const content = data.choices[0]?.message?.content;
    if (content) {
      console.log('\n💬 Assistant response:', content);
    } else {
      console.log('\n⚠️ No content in response');
    }

  } catch (error) {
    console.error('\n❌ Exception:', error.message);
    console.error('Stack:', error.stack);
  }
}

testLLM();
