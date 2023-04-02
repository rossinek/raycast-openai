import { useMemo, useState } from "react";
import { createCompletionBot } from "../utils/gpt";
import { BotSettings } from "../utils/settings";

export const useCompletionBot = () => {
  const [response, setResponse] = useState<string>("");
  const onChunk = (chunk: string) => {
    setResponse((prev) => `${prev}${chunk}`.trimStart());
  };
  const bot = useMemo(() => createCompletionBot({ onChunk }), []);
  const send = async (message: string, settings: BotSettings<"completion">) => {
    setResponse("");
    await bot.send(message, settings);
  };
  return { response, setResponse, send };
};
