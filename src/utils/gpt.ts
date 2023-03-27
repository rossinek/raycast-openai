import { getPreferenceValues } from "@raycast/api";
import {
  Configuration,
  OpenAIApi,
  ChatCompletionRequestMessage,
  CreateChatCompletionRequest,
  CreateCompletionRequest,
} from "openai";
import { BotSettings, completionBotDefaults } from "./settings";

const { apiKey } = getPreferenceValues<{ apiKey: string }>();
const configuration = new Configuration({ apiKey });
const openai = new OpenAIApi(configuration);

export const createCompletionBot = () => {
  const send = async (text: string, settings: BotSettings<"completion">) => {
    const prompt = settings.prompt.includes("{{ input }}")
      ? settings.prompt.replaceAll("{{ input }}", text)
      : `${settings.prompt}\n\n${text}`;

    const model = settings.model || completionBotDefaults.model;
    const temperature = settings.temperature || completionBotDefaults.temperature;
    const max_tokens = settings.maxTokens || completionBotDefaults.maxTokens;

    if (model === "text-davinci-003") {
      const payload = {
        model,
        temperature,
        max_tokens: max_tokens || 1024,
        prompt,
      };
      logCompletionRequest(payload);
      const response = await openai.createCompletion(payload);
      console.log(response.data);
      return response.data.choices?.[0]?.text?.trim() || "(no response)";
    }
    const payload = {
      model: "gpt-3.5-turbo",
      temperature,
      max_tokens,
      messages: [
        {
          role: "user" as const,
          content: prompt,
        },
      ],
    };
    const response = await openai.createChatCompletion(payload);
    logChatRequest(payload);
    return response.data.choices?.[0]?.message?.content?.trim() || "(no response)";
  };

  return {
    send,
  };
};

const defaultRoleNames = {
  assistant: "Hex",
  user: "Artur",
};

export const createChatBot = () => {
  const conversationContext: ChatCompletionRequestMessage[] = [];

  const send = async (message: string, settings: BotSettings<"chat">) => {
    const payload: CreateChatCompletionRequest = {
      model: "gpt-3.5-turbo",
      temperature: settings.temperature || completionBotDefaults.temperature,
      max_tokens: settings.maxTokens || completionBotDefaults.maxTokens,
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
    const response = await openai.createChatCompletion(payload);

    const answer = response.data.choices?.[0]?.message;
    const content = answer?.content || "Sorry, I'm not able to answer.";
    conversationContext.push({ role: "user", content: message }, { role: answer?.role || "assistant", content });
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
    console.log(`  ${message.role}${message.name ? ` (${message.name})` : ""}): ${message.content}`);
  });
  console.log("---");
};
