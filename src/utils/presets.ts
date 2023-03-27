import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir as getHomeDir } from "node:os";
import path from "node:path";

import { BotSettings, BotType } from "./settings";

export type BotPreset<Type extends BotType = BotType> = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string;
  settings: BotSettings<Type>;
};

const PRESETS_PATH = path.join(getHomeDir(), ".raycast-hex-presets.json");

const savePresets = (presets: BotPreset[]) => {
  writeFileSync(PRESETS_PATH, JSON.stringify(presets), { flag: "w" });
};

export const readPresets = (): BotPreset[] => {
  if (existsSync(PRESETS_PATH)) {
    return JSON.parse(readFileSync(PRESETS_PATH).toString()) as BotPreset[];
  }
  return [];
};

export const createPreset = <Type extends BotType>(
  info: { name: string },
  settings: BotSettings<Type>
): BotPreset<Type> => {
  const presets = readPresets();
  const preset: BotPreset<Type> = {
    ...info,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
    settings,
  };
  presets.push(preset);
  savePresets(presets);
  return preset;
};

export const updatePreset = <Type extends BotType>(
  presetId: string,
  patch: Partial<Omit<BotPreset<Type>, "id" | "createdAt" | "updatedAt">>
): BotPreset<Type> => {
  const presets = readPresets();
  const index = presets.findIndex((p) => p.id === presetId);
  if (index > -1) {
    const preset = {
      ...(presets[index] as BotPreset<Type>),
      ...patch,
      updatedAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
    };
    presets[index] = preset;
    savePresets(presets);
    return preset;
  }
  throw new Error(`Preset with id ${presetId} not found`);
};

export const removePreset = (presetId: string): BotPreset[] => {
  const presets = readPresets();
  const index = presets.findIndex((p) => p.id === presetId);
  if (index > -1) {
    presets.splice(index, 1);
    savePresets(presets);
    return presets;
  }
  throw new Error(`Preset with id ${presetId} not found`);
};
