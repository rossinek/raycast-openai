import { Form, ActionPanel, Action, useNavigation } from "@raycast/api";
import { useTextInputValidation } from "../hooks/use-validation";
import { completionBotDefaults, BotSettings } from "../utils/settings";
import { setActiveState, ActiveState } from "../utils/active-settings";
import { Fragment, useState } from "react";
import PresetSettings from "./preset-settings";
import { BotPreset, createPreset as _createPreset, updatePreset as _updatePreset } from "../utils/presets";
import { ChatCompletionRequestMessage } from "openai";

type MessageWithoutSystem = Omit<ChatCompletionRequestMessage, "role"> & {
  role: Exclude<ChatCompletionRequestMessage["role"], "system">;
};

type FormModel = {
  systemMessage: string;
  messages: MessageWithoutSystem[];
  temperature: string;
  maxTokens?: string;
};

const settingsToModel = (s: BotSettings<"chat">): FormModel => ({
  systemMessage: s.messages.find((m) => m.role === "system")?.content || "",
  messages: s.messages.filter((m) => m.role !== "system") as MessageWithoutSystem[],
  temperature: `${s.temperature ?? completionBotDefaults.temperature}`,
  maxTokens: `${s.maxTokens || completionBotDefaults.maxTokens || ""}`,
});

export default ({ state }: { state: ActiveState<"chat"> }) => {
  const { pop, push } = useNavigation();

  const [activePreset, updateActivePreset] = useState(state.preset);
  const [model, setModel] = useState<FormModel>(settingsToModel(state.settings));

  const currentMessages = [
    {
      role: "system" as const,
      content: model.systemMessage.trim(),
    },
    ...model.messages.map((message) => ({
      ...message,
      content: message.content.trim(),
    })),
  ].filter((message) => message.content.length > 0);

  const currentSettings: BotSettings<"chat"> = {
    ...state.settings,
    messages: currentMessages,
    temperature: model.temperature ? +model.temperature : undefined,
    maxTokens: model.maxTokens ? +model.maxTokens : undefined,
  };

  const hasPresetChanges =
    activePreset &&
    (JSON.stringify(activePreset.settings.messages) !== JSON.stringify(currentSettings.messages) ||
      activePreset.settings.temperature !== currentSettings.temperature ||
      activePreset.settings.maxTokens !== currentSettings.maxTokens);

  const handleSubmit = async (newPreset?: BotPreset<"chat">) => {
    await setActiveState({
      settings: currentSettings,
      preset: newPreset || activePreset,
    });
    pop();
  };

  const isNumberInRange = (value: string, min: number, max: number) => {
    const number = +value;
    return (!isNaN(number) && number >= min && number <= max) || `Must be a number between ${min} and ${max}`;
  };

  const vTemperature = useTextInputValidation((v: string) => isNumberInRange(v, 0, 2));

  const vMaxTokens = useTextInputValidation((v: string) => {
    if (!v) return true;
    const isValidNumber = isNumberInRange(v, 0, 2);
    if (isValidNumber !== true) return isValidNumber;
    return +v === Math.round(+v) || "Must be an integer";
  });

  const createPreset = () => {
    const onSubmit = (payload: { name: string }) => {
      const preset = _createPreset(payload, currentSettings);
      handleSubmit(preset);
    };
    push(<PresetSettings onSubmit={onSubmit} />);
  };

  const updatePreset = async () => {
    if (!state.preset) return;
    const updatedPreset = _updatePreset(state.preset.id, { settings: currentSettings }) as BotPreset<"chat">;
    updateActivePreset(updatedPreset);
  };

  const onRoleChange = (index: number) => (_role: string) => {
    const role = _role as MessageWithoutSystem["role"];
    setModel({
      ...model,
      messages: model.messages.map((m, i) => (i === index ? { ...m, role } : m)),
    });
  };

  const onContentChange = (index: number) => (content: string) => {
    setModel({
      ...model,
      messages: model.messages.map((m, i) => (i === index ? { ...m, content } : m)),
    });
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={() => handleSubmit()} />
          <Action title="Create new preset" onAction={createPreset} />
          {!!state.preset && (
            <Action title="Update preset" shortcut={{ modifiers: ["cmd"], key: "s" }} onAction={updatePreset} />
          )}
        </ActionPanel>
      }
    >
      {!!state.preset && (
        <>
          <Form.Description title="Preset Name" text={state.preset.name} />
          <Form.Description text={hasPresetChanges ? "⁽ʰᵃˢ ᵘⁿˢᵃᵛᵉᵈ ᶜʰᵃⁿᵍᵉˢ⁾" : " "} />
        </>
      )}

      <Form.TextArea
        id="systemMessage"
        title="System message"
        value={model.systemMessage}
        placeholder="No system message"
        onChange={(value) => setModel({ ...model, systemMessage: value })}
      />

      {model.messages.map((message, index) => (
        <Fragment key={`m_${index}`}>
          <Form.Description text="–––" />
          <Form.Dropdown id={`_role_${index}`} title="Role" value={message.role} onChange={onRoleChange(index)}>
            <Form.Dropdown.Item value="user" title="user" />
            <Form.Dropdown.Item value="assistant" title="assistant" />
          </Form.Dropdown>
          <Form.TextArea
            id={`_content_${index}`}
            title="Message"
            value={message.content}
            placeholder="Type message..."
            error={!message.content ? "Message cannot be empty" : undefined}
            onChange={onContentChange(index)}
          />
        </Fragment>
      ))}
      <Form.Description text="–––" />

      <Form.TextField
        id="temperature"
        title="Temperature"
        value={`${model.temperature}`}
        placeholder={`${completionBotDefaults.temperature}`}
        {...vTemperature.attrs}
        onChange={(value) => {
          setModel({ ...model, temperature: value });
          vTemperature.attrs.onChange?.(value);
        }}
      />

      <Form.TextField
        id="maxTokens"
        title="Max tokens"
        value={`${model.maxTokens}`}
        placeholder="(no limit)"
        {...vMaxTokens.attrs}
        onChange={(value) => {
          setModel({ ...model, maxTokens: value });
          vMaxTokens.attrs.onChange?.(value);
        }}
      />
    </Form>
  );
};
