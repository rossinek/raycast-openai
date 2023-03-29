import { randomUUID } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir as getHomeDir } from "node:os";
import path from "node:path";

import { BotSettings, BotType, getUserPreferences } from "./settings";

export type BotPreset<Type extends BotType = BotType> = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string;
  settings: BotSettings<Type>;
};

const PRESETS_FILE_PATH = path.join(getHomeDir(), ".raycast-hex-presets.json");
const BACKUPS_DIR_PATH = path.join(getHomeDir(), ".raycast-hex-backup");
const getBackupFrequencyMs = () => 1000 * 60 * 60 * 24 * getUserPreferences().backupFrequency;

const savePresets = (presets: BotPreset[]) => {
  writeFileSync(PRESETS_FILE_PATH, JSON.stringify(presets), { flag: "w" });
};

export const readPresets = (): BotPreset[] => {
  if (existsSync(PRESETS_FILE_PATH)) {
    return JSON.parse(readFileSync(PRESETS_FILE_PATH).toString()) as BotPreset[];
  }
  return [];
};

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
  if (!existsSync(BACKUPS_DIR_PATH)) return true;
  const dateRe = /presets-([^/]+)\.json$/;
  const backups = readdirSync(BACKUPS_DIR_PATH)
    .map((f) => f.match(dateRe)?.[1])
    .filter(Boolean)
    .map((d) => new Date(d as string));
  const noBackups = !backups.length;
  return noBackups || Date.now() - Math.max(...backups.map((d) => +d)) > getBackupFrequencyMs();
};

const backupPresetsIfNeeded = () => {
  if (!existsSync(PRESETS_FILE_PATH) || !shouldBackupPresets()) return;
  if (!existsSync(BACKUPS_DIR_PATH)) {
    mkdirSync(BACKUPS_DIR_PATH);
  }
  copyFileSync(PRESETS_FILE_PATH, path.join(BACKUPS_DIR_PATH, `presets-${new Date().toISOString()}.json`));
};
