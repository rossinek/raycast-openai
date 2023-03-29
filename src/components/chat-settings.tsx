import { Form, ActionPanel, Action, useNavigation } from "@raycast/api";
import { useTextInputValidation } from "../hooks/use-validation";
import { getChatBotDefaults, BotSettings, ChatModel, CHAT_MODELS } from "../utils/settings";
import { setActiveState, ActiveState } from "../utils/active-settings";
import { Fragment, useState } from "react";
import PresetSettings from "./preset-settings";
import { BotPreset, createPreset as _createPreset, updatePreset as _updatePreset } from "../utils/presets";
import { ChatCompletionRequestMessage } from "openai";

type MessageWithoutSystem = Omit<ChatCompletionRequestMessage, "role"> & {
  role: Exclude<ChatCompletionRequestMessage["role"], "system">;
};

type FormModel = {
  model: ChatModel;
  systemMessage: string;
  messages: MessageWithoutSystem[];
  temperature: string;
  maxTokens?: string;
};

const settingsToModel = (s: BotSettings<"chat">): FormModel => {
  const defaults = getChatBotDefaults();
  return {
    model: s.model || defaults.model || "gpt-3.5-turbo",
    systemMessage: s.messages.find((m) => m.role === "system")?.content || "",
    messages: s.messages.filter((m) => m.role !== "system") as MessageWithoutSystem[],
    temperature: `${s.temperature ?? defaults.temperature}`,
    maxTokens: `${s.maxTokens || defaults.maxTokens || ""}`,
  };
};

export default ({ state }: { state: ActiveState<"chat"> }) => {
  const { pop, push } = useNavigation();

  const [activePreset, updateActivePreset] = useState(state.preset);
  const [formModel, setFormModel] = useState<FormModel>(settingsToModel(state.settings));

  const currentMessages = [
    {
      role: "system" as const,
      content: formModel.systemMessage.trim(),
    },
    ...formModel.messages.map((message) => ({
      ...message,
      content: message.content.trim(),
    })),
  ].filter((message) => message.content.length > 0);

  const currentSettings: BotSettings<"chat"> = {
    ...state.settings,
    model: formModel.model,
    messages: currentMessages,
    temperature: formModel.temperature ? +formModel.temperature : undefined,
    maxTokens: formModel.maxTokens ? +formModel.maxTokens : undefined,
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
    setFormModel({
      ...formModel,
      messages: formModel.messages.map((m, i) => (i === index ? { ...m, role } : m)),
    });
  };

  const onContentChange = (index: number) => (content: string) => {
    setFormModel({
      ...formModel,
      messages: formModel.messages.map((m, i) => (i === index ? { ...m, content } : m)),
    });
  };

  const defaults = getChatBotDefaults();

  const addMessage = () => {
    setFormModel({
      ...formModel,
      messages: [
        ...formModel.messages,
        {
          role: formModel.messages.slice(-1)[0]?.role === "user" ? "assistant" : "user",
          content: "",
        },
      ],
    });
  };

  const removeMessage = () => {
    setFormModel({
      ...formModel,
      messages: formModel.messages.slice(0, -1),
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
          <Action title="Add message" shortcut={{ modifiers: ["cmd"], key: "=" }} onAction={addMessage} />
          {formModel.messages.length > 0 && (
            <Action title="Remove message" shortcut={{ modifiers: ["cmd"], key: "-" }} onAction={removeMessage} />
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

      <Form.Dropdown
        id="model"
        title="Model"
        value={formModel.model}
        onChange={(value) => setFormModel({ ...formModel, model: value as ChatModel })}
      >
        {CHAT_MODELS.map((model) => (
          <Form.Dropdown.Item key={model} value={model} title={model} />
        ))}
      </Form.Dropdown>

      <Form.TextField
        id="temperature"
        title="Temperature"
        info="What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic."
        value={`${formModel.temperature}`}
        placeholder={`${defaults.temperature}`}
        {...vTemperature.attrs}
        onChange={(value) => {
          setFormModel({ ...formModel, temperature: value });
          vTemperature.attrs.onChange?.(value);
        }}
      />

      <Form.TextField
        id="maxTokens"
        title="Max tokens"
        value={`${formModel.maxTokens}`}
        placeholder="(no limit)"
        {...vMaxTokens.attrs}
        onChange={(value) => {
          setFormModel({ ...formModel, maxTokens: value });
          vMaxTokens.attrs.onChange?.(value);
        }}
      />

      <Form.TextArea
        id="systemMessage"
        title="System message"
        value={formModel.systemMessage}
        placeholder="No system message"
        onChange={(value) => setFormModel({ ...formModel, systemMessage: value })}
      />

      <Form.Description text="Messages" />

      {formModel.messages.map((message, index) => (
        <Fragment key={`m_${index}`}>
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
          {index < formModel.messages.length - 1 && <Form.Description text="  " />}
        </Fragment>
      ))}
      <Form.Description text="Use actions to add/remove messages" />
    </Form>
  );
};
