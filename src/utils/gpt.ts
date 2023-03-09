import { getPreferenceValues } from "@raycast/api";
import { Configuration, OpenAIApi, ChatCompletionRequestMessage } from "openai";
import { useMemo, useState } from "react";

const { apiKey } = getPreferenceValues<{ apiKey: string }>();
const configuration = new Configuration({ apiKey });
const openai = new OpenAIApi(configuration);

export const translate = async (text: string) => {
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: [
          "Instructions:",
          "Translate the following text. If it's in English translate it to Polish, otherwise translate it to English. Return a legible, grammatically correct translation.",
          "\n\n\n",
          "Text:",
          text,
          "\n\n\n",
          "Translation:",
        ].join("\n"),
      },
    ],
    temperature: 0,
  });
  return response.data.choices?.[0]?.message?.content?.trim() || text;
};

export const createAmaAssistant = () => {
  const conversationContext: ChatCompletionRequestMessage[] = [];

  const sendMessage = async (message: string, options: { moreTokens?: boolean } = {}) => {
    const setupMessage = [
      "You are a helpful assistant called 'Hex' that helps your master 'Artur'.",
      options.moreTokens
        ? "Your answers are precise and detailed."
        : "Your answers are short and precise preferably in bullet points.",
      "If you are need more context to give precise response, ask for it.",
    ].join(" ");
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: setupMessage }, ...conversationContext, { role: "user", content: message }],
      temperature: 0.1,
      max_tokens: undefined,
    });
    const answer = response.data.choices?.[0]?.message;
    const content = answer?.content || "Sorry, I'm not able to answer.";
    conversationContext.push({ role: "user", content: message }, { role: answer?.role || "assistant", content });
    return answer?.content || "Sorry, I'm not able to answer.";
  };

  return {
    sendMessage,
  };
};

export const useAmaAssistant = () => {
  const [conversation, setConversation] = useState<Array<{ user: string; message: string }>>([]);
  const assistant = useMemo(() => createAmaAssistant(), []);
  const sendMessage = async (message: string, options?: { moreTokens?: boolean }) => {
    const answer = await assistant.sendMessage(message, options);
    setConversation([...conversation, { user: "Artur", message }, { user: "Hex", message: answer }]);
  };
  return { conversation, sendMessage };
};
