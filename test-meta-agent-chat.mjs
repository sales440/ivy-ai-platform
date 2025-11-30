import fetch from 'node-fetch';

const API_URL = process.env.TEST_URL || 'https://ivy-ai-platform-production.up.railway.app';

async function testChat(message) {
  console.log(`\n🧪 Testing message: "${message}"`);
  console.log('=' .repeat(60));
  
  try {
    const response = await fetch(`${API_URL}/api/trpc/metaAgent.chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversationHistory: []
      })
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    return null;
  }
}

async function main() {
  console.log('🚀 Testing Meta-Agent Chat Interface');
  console.log(`API URL: ${API_URL}`);
  
  // Test 1: Natural language greeting (should use LLM)
  await testChat('Hola Meta-Agent');
  
  // Test 2: Explicit command (should use command handler)
  await testChat('status');
  
  // Test 3: Natural question (should use LLM)
  await testChat('¿Cómo estás?');
  
  // Test 4: Another command
  await testChat('help');
}

main().catch(console.error);
