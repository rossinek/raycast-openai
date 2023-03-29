import { Form, ActionPanel, Action, useNavigation } from "@raycast/api";
import { useTextInputValidation } from "../hooks/use-validation";
import { BotPreset } from "../utils/presets";

type FormModel = {
  name: string;
};

export default (props: { preset?: BotPreset; onSubmit: (preset: { name: string }) => void }) => {
  const { pop } = useNavigation();

  const handleSubmit = (values: FormModel) => {
    props.onSubmit({ name: values.name.trim() });
    pop();
  };

  const vName = useTextInputValidation((v: string) => {
    return !!v.trim() || "Name must not be empty";
  });

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="name"
        title="Preset Name"
        defaultValue={props.preset?.name || ""}
        placeholder="Name"
        {...vName.attrs}
      />
    </Form>
  );
};
