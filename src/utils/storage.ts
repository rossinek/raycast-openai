import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir as getHomeDir } from "node:os";
import path from "node:path";
import { BotPreset } from "./presets";

const MAIN_DIR_PATH = path.join(getHomeDir(), ".raycast-hex");
const PRESETS_FILE_PATH = path.join(MAIN_DIR_PATH, "presets.json");
const BACKUPS_DIR_PATH = path.join(MAIN_DIR_PATH, "backups");

export const ensureMainDirExists = () => {
  if (!existsSync(MAIN_DIR_PATH)) {
    mkdirSync(MAIN_DIR_PATH);
  }
};

export const ensureBackupDirExists = () => {
  ensureMainDirExists();
  if (!existsSync(BACKUPS_DIR_PATH)) {
    mkdirSync(BACKUPS_DIR_PATH);
  }
};

export const savePresets = (presets: BotPreset[]) => {
  ensureMainDirExists();
  writeFileSync(PRESETS_FILE_PATH, JSON.stringify(presets), { flag: "w" });
};

export const readPresets = (): BotPreset[] => {
  if (existsSync(PRESETS_FILE_PATH)) {
    return JSON.parse(readFileSync(PRESETS_FILE_PATH).toString()) as BotPreset[];
  }
  return [];
};

export const hasPresetsFile = () => existsSync(PRESETS_FILE_PATH);

export const getBackupFilesList = (): string[] => {
  if (!existsSync(BACKUPS_DIR_PATH)) return [];
  const backups = readdirSync(BACKUPS_DIR_PATH).filter((f) => f.endsWith(".json"));
  return backups;
};

export const backupPresets = (filename: string) => {
  ensureBackupDirExists();
  copyFileSync(PRESETS_FILE_PATH, path.join(BACKUPS_DIR_PATH, filename));
};
