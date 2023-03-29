import { useMemo, useState } from "react";
import { createChatBot } from "../utils/gpt";
import { BotSettings, getUserPreferences } from "../utils/settings";

export const useChatBot = () => {
  const { userName, assistantName } = getUserPreferences();
  const [conversation, setConversation] = useState<Array<{ user: string; message: string }>>([]);
  const bot = useMemo(() => createChatBot(), []);
  const send = async (message: string, settings: BotSettings<"chat">) => {
    const answer = await bot.send(message, settings);
    setConversation([...conversation, { user: userName, message }, { user: assistantName, message: answer }]);
  };
  return { conversation, send };
};
