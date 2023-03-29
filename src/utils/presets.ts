import { randomUUID } from "node:crypto";

import { BotSettings, BotType, getUserPreferences } from "./settings";
import { backupPresets, getBackupFilesList, hasPresetsFile, readPresets, savePresets } from "./storage";

export { readPresets } from "./storage";

export type BotPreset<Type extends BotType = BotType> = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string;
  settings: BotSettings<Type>;
};

const getBackupFrequencyMs = () => 1000 * 60 * 60 * 24 * getUserPreferences().backupFrequency;

export const createPreset = <Type extends BotType>(
  info: { name: string },
  settings: BotSettings<Type>
): BotPreset<Type> => {
  backupPresetsIfNeeded();
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
  backupPresetsIfNeeded();
  const presets = readPresets();
  const index = presets.findIndex((p) => p.id === presetId);
  if (index > -1) {
    const preset = {
      ...(presets[index] as BotPreset<Type>),
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    presets[index] = preset;
    savePresets(presets);
    return preset;
  }
  throw new Error(`Preset with id ${presetId} not found`);
};

export const removePreset = (presetId: string): BotPreset[] => {
  backupPresetsIfNeeded();
  const presets = readPresets();
  const index = presets.findIndex((p) => p.id === presetId);
  if (index > -1) {
    presets.splice(index, 1);
    savePresets(presets);
    return presets;
  }
  throw new Error(`Preset with id ${presetId} not found`);
};

const shouldBackupPresets = () => {
  const dateRe = /presets-([^/]+)\.json$/;
  const backups = getBackupFilesList()
    .map((f) => f.match(dateRe)?.[1])
    .filter(Boolean)
    .map((d) => new Date(d as string));
  const noBackups = !backups.length;
  return noBackups || Date.now() - Math.max(...backups.map((d) => +d)) > getBackupFrequencyMs();
};

const backupPresetsIfNeeded = () => {
  if (!hasPresetsFile() || !shouldBackupPresets()) return;
  backupPresets(`presets-${new Date().toISOString()}.json`);
};
