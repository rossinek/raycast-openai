import { useMemo, useState } from "react";
import { createChatBot } from "../utils/gpt";
import { BotSettings, getUserPreferences } from "../utils/settings";

export const useChatBot = () => {
  const { userName, assistantName } = getUserPreferences();
  const [conversation, setConversation] = useState<Array<{ user: string; message: string }>>([]);
  const bot = useMemo(
    () =>
      createChatBot({
        onChunk: (chunk) => {
          setConversation((prev) => {
            const last = prev[prev.length - 1];
            return prev.slice(0, -1).concat([{ ...last, message: `${last.message}${chunk}` }]);
          });
        },
      }),
    []
  );
  const send = async (message: string, settings: BotSettings<"chat">) => {
    setConversation([...conversation, { user: userName, message }, { user: assistantName, message: "" }]);
    try {
      await bot.send(message, settings);
    } catch (error) {
      setConversation((prev) => prev.slice(0, -2));
      throw error;
    }
  };
  return { conversation, send };
};
