import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4" ;
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  temperature?: number;
  topP?: number;
  top_p?: number;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

// LLM Provider types
type LLMProvider = "openai" | "manus";

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

/**
 * Determine which LLM provider to use based on available API keys
 */
function selectProvider(): LLMProvider {
  // Check if OpenAI API key is available
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && openaiKey.trim().length > 0) {
    console.log("[LLM] Using OpenAI as primary provider");
    return "openai";
  }

  // Fallback to Manus Forge
  if (ENV.forgeApiKey && ENV.forgeApiKey.trim().length > 0) {
    console.log("[LLM] Using Manus Forge as fallback provider");
    return "manus";
  }

  throw new Error("No LLM provider available - missing API keys");
}

/**
 * Invoke OpenAI API
 */
async function invokeOpenAI(params: InvokeParams): Promise<InvokeResult> {
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
    temperature,
    topP,
    top_p,
    maxTokens,
    max_tokens,
  } = params;

  const payload: Record<string, unknown> = {
    model: "gpt-4o-mini", // Using GPT-4o-mini for cost efficiency and speed
    messages: messages.map(normalizeMessage),
  };

  // Add optional parameters
  if (temperature !== undefined) {
    payload.temperature = temperature;
  }
  if (topP !== undefined || top_p !== undefined) {
    payload.top_p = topP || top_p;
  }

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }

  // Set max_tokens (use provided value or default)
  if (maxTokens || max_tokens) {
    payload.max_tokens = maxTokens || max_tokens;
  }

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }

  // Fetch with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenAI API failed: ${response.status} ${response.statusText} – ${errorText}`
      );
    }

    return (await response.json()) as InvokeResult;
  } catch (fetchError: any) {
    clearTimeout(timeoutId);

    // Better error messages for common fetch failures
    if (fetchError.name === 'AbortError') {
      throw new Error(`OpenAI API timeout after 30 seconds`);
    }

    throw new Error(`OpenAI API failed: ${fetchError.message}`);
  }
}

/**
 * Invoke Manus Forge API
 */
async function invokeManusForge(params: InvokeParams): Promise<InvokeResult> {
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
    temperature,
    topP,
    top_p,
    maxTokens,
    max_tokens,
  } = params;

  const payload: Record<string, unknown> = {
    model: "gemini-2.5-flash",
    messages: messages.map(normalizeMessage),
  };

  // Add optional parameters
  if (temperature !== undefined) {
    payload.temperature = temperature;
  }
  if (topP !== undefined || top_p !== undefined) {
    payload.top_p = topP || top_p;
  }

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }

  // Set max_tokens (use provided value or default)
  payload.max_tokens = maxTokens || max_tokens || 32768;
  payload.thinking = {
    "budget_tokens": 128
  };

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }

  const apiUrl = ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
    ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
    : "https://forge.manus.ai/v1/chat/completions";

  // Fetch with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Manus Forge API failed: ${response.status} ${response.statusText} – ${errorText}`
      );
    }

    return (await response.json()) as InvokeResult;
  } catch (fetchError: any) {
    clearTimeout(timeoutId);

    // Better error messages for common fetch failures
    if (fetchError.name === 'AbortError') {
      throw new Error(`Manus Forge API timeout after 30 seconds`);
    }
    if (fetchError.cause?.code === 'ENOTFOUND') {
      throw new Error(`Manus Forge API failed: Cannot resolve hostname`);
    }
    if (fetchError.cause?.code === 'ECONNREFUSED') {
      throw new Error(`Manus Forge API failed: Connection refused`);
    }

    throw new Error(`Manus Forge API failed: ${fetchError.message}`);
  }
}

/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on certain errors
      if (error.message?.includes('401') || error.message?.includes('403')) {
        throw error; // Auth errors shouldn't be retried
      }

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`[LLM] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Main LLM invocation function with automatic provider selection and fallback
 */
export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  const provider = selectProvider();

  try {
    if (provider === "openai") {
      console.log("[LLM] Calling OpenAI GPT-4o-mini...");
      return await retryWithBackoff(() => invokeOpenAI(params), 2, 1000);
    } else {
      console.log("[LLM] Calling Manus Forge...");
      return await retryWithBackoff(() => invokeManusForge(params), 2, 1000);
    }
  } catch (primaryError: any) {
    console.error(`[LLM] Primary provider (${provider}) failed:`, primaryError.message);

    // Try fallback provider if primary fails
    if (provider === "openai") {
      // Try Manus Forge as fallback
      if (ENV.forgeApiKey && ENV.forgeApiKey.trim().length > 0) {
        console.log("[LLM] Falling back to Manus Forge...");
        try {
          return await retryWithBackoff(() => invokeManusForge(params), 2, 1000);
        } catch (fallbackError: any) {
          console.error("[LLM] Fallback provider (Manus Forge) also failed:", fallbackError.message);
          throw new Error(`All LLM providers failed. Primary: ${primaryError.message}, Fallback: ${fallbackError.message}`);
        }
      }
    } else if (provider === "manus") {
      // Try OpenAI as fallback
      const openaiKey = process.env.OPENAI_API_KEY;
      if (openaiKey && openaiKey.trim().length > 0) {
        console.log("[LLM] Falling back to OpenAI...");
        try {
          return await retryWithBackoff(() => invokeOpenAI(params), 2, 1000);
        } catch (fallbackError: any) {
          console.error("[LLM] Fallback provider (OpenAI) also failed:", fallbackError.message);
          throw new Error(`All LLM providers failed. Primary: ${primaryError.message}, Fallback: ${fallbackError.message}`);
        }
      }
    }

    // No fallback available
    throw primaryError;
  }
}
// Trigger deployment Thu Dec 18 19:31:24 EST 2025
