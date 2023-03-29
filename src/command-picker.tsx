import { launchCommand, LaunchType, Action, ActionPanel, List, LaunchProps, Icon, useNavigation } from "@raycast/api";
import { useEffect, useState } from "react";
import PresetSettings from "./components/preset-settings";
import { BotPreset, readPresets, removePreset, updatePreset } from "./utils/presets";
import { getChatBotDefaults, getCompletionBotDefaults } from "./utils/settings";

const getDefaultPresets = (): BotPreset[] => [
  {
    id: "__completion",
    name: "Generic Completion",
    createdAt: "-",
    updatedAt: "-",
    lastUsedAt: "-",
    settings: getCompletionBotDefaults(),
  },
  {
    id: "__chat",
    name: "Generic Chat",
    createdAt: "-",
    updatedAt: "-",
    lastUsedAt: "-",
    settings: getChatBotDefaults(),
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
      .concat(getDefaultPresets())
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

  const { push } = useNavigation();

  const onActionRename = (preset: BotPreset) => {
    const onSubmit = (payload: { name: string }) => {
      const updatedPreset = updatePreset(preset.id, { name: payload.name });
      const newItems = items.map((item) => (item.id === preset.id ? updatedPreset : item));
      setItems(newItems);
    };
    push(<PresetSettings preset={preset} onSubmit={onSubmit} />);
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
              <Action title="Rename" onAction={() => onActionRename(item)} icon={Icon.Pencil} />
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
