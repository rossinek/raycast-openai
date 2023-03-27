import { launchCommand, LaunchType, Action, ActionPanel, List, LaunchProps, Icon } from "@raycast/api";
import { useEffect, useState } from "react";
import { BotPreset, readPresets, removePreset } from "./utils/presets";
import { chatBotDefaults, completionBotDefaults } from "./utils/settings";

const defaultPresets: BotPreset[] = [
  {
    id: "__completion",
    name: "Generic Completion",
    createdAt: "-",
    updatedAt: "-",
    lastUsedAt: "-",
    settings: completionBotDefaults,
  },
  {
    id: "__chat",
    name: "Generic Chat",
    createdAt: "-",
    updatedAt: "-",
    lastUsedAt: "-",
    settings: chatBotDefaults,
  },
];

export default ({ launchContext }: LaunchProps<{ launchContext: { input?: string } }>) => {
  const [items, setItems] = useState<BotPreset[]>([]);

  const [searchText, setSearchText] = useState("");
  const [filteredList, setFilteredList] = useState(items);

  useEffect(() => {
    const presets = readPresets();
    setItems(presets);
  }, []);

  useEffect(() => {
    const filtered = items
      .concat(defaultPresets)
      .filter((item) => item.name.toLocaleLowerCase().includes(searchText.toLocaleLowerCase()));
    const sorted = filtered.sort((a, b) => {
      if (a.lastUsedAt > b.lastUsedAt) return -1;
      if (a.lastUsedAt < b.lastUsedAt) return 1;
      return 0;
    });
    setFilteredList(sorted);
  }, [searchText, items]);

  const onActionClick = (preset: BotPreset) => {
    const command = preset.settings.type === "chat" ? "generic-chat" : "generic-completion";
    launchCommand({
      name: command,
      type: LaunchType.UserInitiated,
      context: {
        state: {
          preset: preset.id.startsWith("__") ? undefined : preset,
          settings: preset.settings,
        },
        input: launchContext?.input,
      },
    });
  };

  const onActionRemove = (preset: BotPreset) => {
    if (preset.id.startsWith("__")) return;
    const updatedPresets = removePreset(preset.id);
    setItems(updatedPresets);
  };

  return (
    <List
      filtering={false}
      onSearchTextChange={setSearchText}
      navigationTitle="Presets"
      searchBarPlaceholder="Pick a preset..."
    >
      {filteredList.map((item) => (
        <List.Item
          key={item.id}
          title={item.name}
          subtitle={item.settings.type}
          accessories={item.id.startsWith("__") ? [{ text: "default" }] : []}
          actions={
            <ActionPanel>
              <Action title="Run" onAction={() => onActionClick(item)} icon={Icon.Wand} />
              <Action title="Edit name" onAction={() => undefined /* todo */} icon={Icon.Pencil} />
              <Action
                title="Remove"
                onAction={() => onActionRemove(item)}
                shortcut={{ modifiers: ["cmd"], key: "backspace" }}
                icon={Icon.Trash}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
};
