import type { ChatCompletionRequestMessage } from "openai";

type BaseBotSettings = {
  temperature?: number;
  maxTokens?: number;
};

export type BotType = "chat" | "completion";

type ChatBotSettings = BaseBotSettings & {
  type: "chat";
  messages: ChatCompletionRequestMessage[];
};

type CompletionBotSettings = BaseBotSettings & {
  type: "completion";
  prompt: string; // must contain place for user input `{{ input }}`
  model?: "gpt-3.5-turbo" | "text-davinci-003";
};

export type BotSettings<Type extends BotType = BotType> = (ChatBotSettings | CompletionBotSettings) & { type: Type };

export const chatBotDefaults: BotSettings<"chat"> = {
  type: "chat",
  temperature: 0.7,
  messages: [
    {
      role: "system",
      content: [
        "You are a helpful assistant called 'Hex' that helps your boss 'Artur'.",
        "Your answers are short and precise preferably in bullet points.",
        "If you are need more context to give precise response, ask for it.",
      ].join(" "),
    },
    { role: "user", content: "Hello Hex!", name: "Artur" },
    { role: "assistant", content: "Hi Artur, what can I do for you?", name: "Hex" },
  ],
};

export const completionBotDefaults: BotSettings<"completion"> = {
  type: "completion",
  temperature: 0.7,
  model: "text-davinci-003",
  prompt: "{{ input }}",
};
