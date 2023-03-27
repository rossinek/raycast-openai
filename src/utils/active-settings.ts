import { LocalStorage } from "@raycast/api";
import { BotPreset, updatePreset } from "./presets";
import { completionBotDefaults, BotSettings, BotType, chatBotDefaults } from "./settings";

export type ActiveState<Type extends BotType = BotType> = { settings: BotSettings<Type>; preset?: BotPreset<Type> };

export const setActiveState = async <Type extends BotType>(state: ActiveState<Type>) => {
  await LocalStorage.setItem(`${state.settings.type}-settings`, JSON.stringify(state));
  if (state.preset) {
    updatePreset(state.preset?.id, { lastUsedAt: new Date().toISOString() });
  }
};

export const getActiveState = async <Type extends BotType>(type: Type): Promise<ActiveState<Type>> => {
  const serializedSettings = await LocalStorage.getItem(`${type}-settings`);
  if (!serializedSettings) {
    if (type === "completion") return { settings: completionBotDefaults } as ActiveState<Type>;
    if (type === "chat") return { settings: chatBotDefaults } as ActiveState<Type>;
    throw new Error(`Unknown bot type: ${type}`);
  }
  return JSON.parse(serializedSettings as string) as ActiveState<Type>;
};
