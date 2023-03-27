import { Form, ActionPanel, Action, useNavigation } from "@raycast/api";
import { useTextInputValidation } from "../hooks/use-validation";
import { completionBotDefaults, BotSettings } from "../utils/settings";
import { setActiveState, ActiveState } from "../utils/active-settings";
import { useState } from "react";
import PresetSettings from "./preset-settings";
import { BotPreset, createPreset as _createPreset, updatePreset as _updatePreset } from "../utils/presets";

type FormModel = {
  model: BotSettings<"completion">["model"];
  prompt: string;
  temperature: string;
  maxTokens?: string;
};

const settingsToModel = (s: BotSettings<"completion">): FormModel => ({
  model: s.model || completionBotDefaults.model,
  prompt: s.prompt || completionBotDefaults.prompt,
  temperature: `${s.temperature ?? completionBotDefaults.temperature}`,
  maxTokens: `${s.maxTokens || completionBotDefaults.maxTokens || ""}`,
});

export default ({ state }: { state: ActiveState<"completion"> }) => {
  const { pop, push } = useNavigation();

  const [activePreset, updateActivePreset] = useState(state.preset);
  const [model, setModel] = useState<FormModel>(settingsToModel(state.settings));

  const currentSettings: BotSettings<"completion"> = {
    ...state.settings,
    model: model.model,
    prompt: model.prompt,
    temperature: model.temperature ? +model.temperature : undefined,
    maxTokens: model.maxTokens ? +model.maxTokens : undefined,
  };

  const hasPresetChanges =
    activePreset &&
    (activePreset.settings.model !== currentSettings.model ||
      activePreset.settings.prompt !== currentSettings.prompt ||
      activePreset.settings.temperature !== currentSettings.temperature ||
      activePreset.settings.maxTokens !== currentSettings.maxTokens);

  const handleSubmit = async (newPreset?: BotPreset<"completion">) => {
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

  const vPrompt = useTextInputValidation((v: string) => {
    return v.includes("{{ input }}") || "Prompt must include `{{ input }}`";
  });

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
    const updatedPreset = _updatePreset(state.preset.id, { settings: currentSettings }) as BotPreset<"completion">;
    updateActivePreset(updatedPreset);
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

      <Form.Dropdown
        id="model"
        title="Model"
        value={model.model}
        onChange={(value) => setModel({ ...model, model: value as "gpt-3.5-turbo" | "text-davinci-003" })}
      >
        <Form.Dropdown.Item value="text-davinci-003" title="text-davinci-003" />
        <Form.Dropdown.Item value="gpt-3.5-turbo" title="gpt-3.5-turbo" />
      </Form.Dropdown>

      <Form.TextArea
        id="prompt"
        title="Prompt"
        value={model.prompt}
        placeholder={completionBotDefaults.prompt}
        {...vPrompt.attrs}
        onChange={(value) => {
          setModel({ ...model, prompt: value });
          vPrompt.attrs.onChange?.(value);
        }}
      />

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
