import { Form, ActionPanel, Action, useNavigation } from "@raycast/api";
import { useTextInputValidation } from "../hooks/use-validation";

type FormModel = {
  name: string;
};

export default (props: { onSubmit: (preset: { name: string }) => void }) => {
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
      <Form.TextField id="name" title="Preset Name" placeholder="Name" {...vName.attrs} />
    </Form>
  );
};
