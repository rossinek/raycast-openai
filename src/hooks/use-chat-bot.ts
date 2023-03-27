import { useMemo, useState } from "react";
import { createChatBot } from "../utils/gpt";
import { BotSettings } from "../utils/settings";

export const useChatBot = () => {
  const [conversation, setConversation] = useState<Array<{ user: string; message: string }>>([]);
  const bot = useMemo(() => createChatBot(), []);
  const send = async (message: string, settings: BotSettings<'chat'>) => {
    const answer = await bot.send(message, settings);
    setConversation([...conversation, { user: "Artur", message }, { user: "Hex", message: answer }]);
  };
  return { conversation, send };
};
