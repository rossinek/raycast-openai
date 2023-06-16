import {
  Configuration,
  OpenAIApi,
  ChatCompletionRequestMessage,
  CreateChatCompletionRequest,
  CreateCompletionRequest,
} from "openai";
import { BotSettings, getCompletionBotDefaults, getChatBotDefaults, getUserPreferences } from "./settings";
import type { IncomingMessage } from "node:http";

const { apiKey } = getUserPreferences();
const configuration = new Configuration({ apiKey });
const openai = new OpenAIApi(configuration);

const inputRe = /{{\s*input\s*}}/g;
export const hasInputPlaceholder = (text: string) => inputRe.test(text);
const sourcePromptWithInput = (text: string, input: string) => text.replace(inputRe, input);

export const createCompletionBot = (
  config: {
    onChunk?: (chunk: string) => void;
    onComplete?: (fullText: string) => void;
  } = {}
) => {
  const send = async (text: string, settings: BotSettings<"completion">) => {
    const prompt = hasInputPlaceholder(settings.prompt)
      ? sourcePromptWithInput(settings.prompt, text)
      : `${settings.prompt}\n\n\n${text}`;

    const defaults = getCompletionBotDefaults();
    const model = settings.model || defaults.model || "gpt-3.5-turbo";
    const temperature = settings.temperature ?? defaults.temperature;
    const max_tokens = settings.maxTokens ?? defaults.maxTokens;

    if (model === "text-davinci-003") {
      const payload = {
        model,
        temperature,
        max_tokens: max_tokens || 1024,
        prompt,
      };
      logCompletionRequest(payload);
      const response = await createStreamCompletion(payload, config);
      // const response = await openai.createCompletion(payload);
      // return response.data.choices?.[0]?.text?.trim() || "(no response)";
      return response || "(no response)";
    }
    const payload = {
      model,
      temperature,
      max_tokens,
      messages: [
        {
          role: "user" as const,
          content: prompt,
        },
      ],
    };
    logChatRequest(payload);
    const response = await createStreamChatCompletion(payload, config);
    return response || "(no response)";
  };

  return {
    send,
  };
};

export const createChatBot = (
  config: {
    onChunk?: (chunk: string) => void;
    onComplete?: (fullText: string) => void;
  } = {}
) => {
  const preferences = getUserPreferences();
  const defaultRoleNames = {
    assistant: preferences.assistantName,
    user: preferences.userName,
  };
  const defaults = getChatBotDefaults();

  const conversationContext: ChatCompletionRequestMessage[] = [];

  const send = async (message: string, settings: BotSettings<"chat">): Promise<string> => {
    const payload: CreateChatCompletionRequest = {
      model: settings.model || defaults.model || "gpt-3.5-turbo",
      temperature: settings.temperature ?? defaults.temperature,
      max_tokens: settings.maxTokens ?? defaults.maxTokens,
      messages: [
        ...settings.messages,
        ...conversationContext,
        {
          role: "user" as const,
          content: message,
        },
      ].map((m) => ({ ...m, name: m.role !== "system" ? defaultRoleNames[m.role] : undefined })),
    };

    logChatRequest(payload);
    const answer = await createStreamChatCompletion(payload, config);
    const content = answer || "(no answer)";
    conversationContext.push({ role: "user", content: message }, { role: "assistant", content });
    return content;
  };

  return {
    send,
  };
};

const logCompletionRequest = (payload: CreateCompletionRequest) => {
  console.log("---");
  console.log("→ chat request");
  const { prompt, ...config } = payload;
  console.log(config);
  console.log("prompt:");
  console.log(prompt);
  console.log("---");
};

const logChatRequest = (payload: CreateChatCompletionRequest) => {
  console.log("---");
  console.log("→ chat request");
  const { messages, ...config } = payload;
  console.log(config);
  console.log("messages:");
  messages.forEach((message) => {
    console.log(`  ${message.role}${message.name ? ` (${message.name})` : ""}: ${message.content}`);
  });
  console.log("---");
};

// ---------------

const asStreamResponse = <
  T extends Awaited<ReturnType<typeof openai.createCompletion> | ReturnType<typeof openai.createChatCompletion>>
>(
  res: T
) =>
  res as unknown as Omit<T, "data"> & {
    data: T["data"] & { on: (event: "data", callback: (data: Buffer) => void) => void };
  };

const createOnDataCallback = (config: {
  parser: (message: string) => string;
  onChunk?: (chunk: string) => void;
  onComplete?: (fullText: string) => void;
}) => {
  let fullText = "";
  return (data: Buffer) => {
    const lines = data
      .toString()
      .split("\n")
      .filter((line) => line.trim() !== "");
    let chunkText = "";
    for (const line of lines) {
      const message = line.replace(/^data: /, "");
      if (message === "[DONE]") {
        config.onChunk?.(chunkText);
        config.onComplete?.(fullText);
        return;
      }
      try {
        const parsed = config.parser(message);
        chunkText += parsed;
        fullText += parsed;
      } catch (error) {
        console.error("Could not JSON parse stream message", message, error);
      }
    }
    config.onChunk?.(chunkText);
  };
};
class StreamRequestError extends Error {
  cause?: Error;
  constructor(message: string, cause?: Error) {
    super(message || "Stream request error");
    this.cause = cause;
  }
}

const parseStreamError = (error: any, timeout = 300): Promise<Error> => {
  return new Promise((_resolve) => {
    let resolved = false;
    const resolve = (err?: StreamRequestError) => {
      if (resolved) return;
      resolved = true;
      _resolve(err || new StreamRequestError(error?.message || "", error));
    };
    setTimeout(resolve, timeout);
    if (!error?.response?.status) {
      console.error("[stream request error]", error?.message);
      resolve();
      return;
    }
    error.response.data.on("data", (data: Buffer) => {
      const message = data.toString();
      try {
        const parsed = JSON.parse(message);
        console.error("[stream request error]", parsed.error.message);
        resolve(new StreamRequestError(parsed.error.message, error));
      } catch {
        console.error("[stream request error]", message);
        resolve(new StreamRequestError(message, error));
      }
    });
  });
};

const handleStreamRequest = async (
  _res: ReturnType<typeof openai.createCompletion> | ReturnType<typeof openai.createChatCompletion>,
  parser: (message: string) => string,
  config: {
    onChunk?: (chunk: string) => void;
    onComplete?: (fullText: string) => void;
  } = {}
) => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise<string>(async (resolve, reject) => {
    try {
      const res = asStreamResponse(await _res);
      res.data.on(
        "data",
        createOnDataCallback({
          parser,
          onChunk: config.onChunk,
          onComplete: (fullText) => {
            config.onComplete?.(fullText);
            resolve(fullText);
          },
        })
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      reject(await parseStreamError(error));
    }
  });
};

const createStreamCompletion = async (
  payload: CreateCompletionRequest,
  config: {
    onChunk?: (chunk: string) => void;
    onComplete?: (fullText: string) => void;
  } = {}
) => {
  return handleStreamRequest(
    openai.createCompletion({ ...payload, stream: true }, { responseType: "stream" }),
    (message) => {
      const parsed = JSON.parse(message);
      return parsed.choices?.[0]?.text || "";
    },
    config
  );
};

const createStreamChatCompletion = async (
  payload: CreateChatCompletionRequest,
  config: {
    onChunk?: (chunk: string) => void;
    onComplete?: (fullText: string) => void;
  } = {}
) => {
  return handleStreamRequest(
    openai.createChatCompletion({ ...payload, stream: true }, { responseType: "stream" }),
    (message) => {
      const parsed = JSON.parse(message);
      return parsed.choices?.[0]?.delta?.content || "";
    },
    config
  );
};
