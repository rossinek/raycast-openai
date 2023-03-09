import { Form, ActionPanel, Action, LaunchProps, Clipboard, showToast } from "@raycast/api";
import { useEffect, useRef, useState } from "react";
import { translate } from "./utils/gpt";

type FormModel = {
  text: string;
};

export default ({ launchContext }: LaunchProps<{ launchContext: { text?: string } }>) => {
  const [isLoading, setIsLoading] = useState(false);
  const [translation, setTranslation] = useState("");

  const translationTextAreaRef = useRef<Form.TextField>(null);

  const handleSubmit = async (values: FormModel) => {
    setIsLoading(true);
    const translation = await translate(values.text);
    setTranslation(translation);
    await Clipboard.copy(translation);
    setIsLoading(false);
    translationTextAreaRef.current?.focus();
    showToast({ title: "Success", message: "Translation copied to clipboard" });
  };

  useEffect(() => {
    if (launchContext?.text) {
      handleSubmit({ text: launchContext.text });
    }
  }, []);

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} />
        </ActionPanel>
      }
      isLoading={isLoading}
    >
      <Form.TextArea id="text" title="Text" placeholder="Type something..." defaultValue={launchContext?.text || ""} autoFocus />
      {translation && (
        <>
          <Form.Separator />
          <Form.TextArea
            id="_translation"
            title="Translation"
            defaultValue={translation}
            ref={translationTextAreaRef}
          />
        </>
      )}
    </Form>
  );
}
