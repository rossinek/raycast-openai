import { Clipboard, launchCommand, LaunchType } from '@raycast/api';
import { execSync } from 'child_process';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export default async () => {
  const previousClipboard = await Clipboard.read();
  const scriptPath = __dirname + '/assets/copy-to-clipboard.scpt';
  await delay(100);
  execSync(`osascript ${scriptPath}`);
  await delay(100);
  const text = await Clipboard.readText();
  await Clipboard.copy(previousClipboard);
  launchCommand({ name: 'translate', type: LaunchType.UserInitiated, context: { text } });
}