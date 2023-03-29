# Hex

Simple UI for OpenAI completion and chat API.

It allows to use OpenAI API with Raycast commands. Settings can be saved as presets and can be easily used with the "Use Selection" command or with the "Pick a Command" command.

## Commands

- **GPT Use Selection** - Use currently selected text from front-most application in other commands. It saves current selection, open a command picker.
- **GPT Command Picker** - Can be used to use saved completion or chat presets. It is also used by \"Use Selection\" command to pick what to do with the current selection.
- **GPT Generic Prompt** - Write a prompt for GPT from scratch (with the ability to change settings and save as a preset).
- **GPT Generic Chat** - A generic chat with GPT (with the ability to change settings and save as a preset).

## Usage

```sh
# install dependencies
pnpm install

# start the extension in development mode
# this command also imports the extension to Raycast
pnpm run dev
```

After successful extension build press `⌃` `C` to stop dev server. The extension stays in Raycast.
