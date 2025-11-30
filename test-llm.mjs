import { invokeLLM } from "./server/_core/llm.js";

async function test() {
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hola" }
      ]
    });
    console.log("✅ LLM works!");
    console.log("Response:", response.choices[0]?.message?.content);
  } catch (error) {
    console.error("❌ LLM failed:", error.message);
  }
}

test();
