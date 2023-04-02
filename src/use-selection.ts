import { Clipboard, launchCommand, LaunchType } from "@raycast/api";
import { execSync } from "child_process";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export default async () => {
  const previousClipboard = await Clipboard.read();
  const scriptPath = __dirname + "/assets/copy-to-clipboard.scpt";
  execSync(`osascript ${scriptPath}`);
  await delay(100);
  const input = await Clipboard.readText();
  await Clipboard.copy(previousClipboard);
  launchCommand({ name: "command-picker", type: LaunchType.UserInitiated, context: { input } });
};
