import { getPreferenceValues } from "@raycast/api";
import type { ChatCompletionRequestMessage } from "openai";

export const getUserPreferences = () => {
  const preferences = getPreferenceValues<{
    apiKey: string;
    userName?: string;
    assistantName?: string;
    backupFrequency: string;
  }>();
  return {
    ...preferences,
    userName: preferences.userName || "Human",
    assistantName: preferences.assistantName || "Hex",
    backupFrequency: +preferences.backupFrequency,
  };
};

type BaseBotSettings = {
  temperature?: number;
  maxTokens?: number;
};

export type BotType = "chat" | "completion";

export const CHAT_MODELS = ["gpt-4", "gpt-4-32k", "gpt-3.5-turbo"] as const;
export type ChatModel = (typeof CHAT_MODELS)[number];

type ChatBotSettings = BaseBotSettings & {
  type: "chat";
  messages: ChatCompletionRequestMessage[];
  model?: ChatModel;
};

export const COMPLETION_MODELS = ["gpt-4", "gpt-4-32k", "gpt-3.5-turbo", "text-davinci-003"] as const;
export type CompletionModel = (typeof COMPLETION_MODELS)[number];

type CompletionBotSettings = BaseBotSettings & {
  type: "completion";
  prompt: string; // must contain place for user input `{{ input }}`
  model?: CompletionModel;
};

export type BotSettings<Type extends BotType = BotType> = (ChatBotSettings | CompletionBotSettings) & { type: Type };

export const getChatBotDefaults = (): BotSettings<"chat"> => {
  const { userName, assistantName } = getUserPreferences();
  return {
    type: "chat",
    model: "gpt-3.5-turbo",
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content: [
          `You are a helpful assistant called "${assistantName}" that helps your boss "${userName}".`,
          "Your answers are short and precise preferably in bullet points.",
          "If you are need more context to give precise response, ask for it.",
        ].join(" "),
      },
      { role: "user", content: `Hello ${assistantName}!`, name: userName },
      { role: "assistant", content: `Hi ${userName}, what can I do for you?`, name: assistantName },
    ],
  };
};

export const getCompletionBotDefaults = (): BotSettings<"completion"> => ({
  type: "completion",
  temperature: 0.7,
  model: "text-davinci-003",
  prompt: "{{ input }}",
});
