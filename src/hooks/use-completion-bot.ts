import { useMemo, useState } from "react";
import { createCompletionBot } from "../utils/gpt";
import { BotSettings } from "../utils/settings";

export const useCompletionBot = () => {
  const [response, setResponse] = useState<string>('');
  const bot = useMemo(() => createCompletionBot(), []);
  const send = async (message: string, settings: BotSettings<'completion'>) => {
    const answer = await bot.send(message, settings);
    setResponse(answer);
  };
  return { response, setResponse, send };
};
