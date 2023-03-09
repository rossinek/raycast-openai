import { Form, ActionPanel, Action } from "@raycast/api";
import { useRef, useState } from "react";
import { useAmaAssistant } from "./utils/gpt";

type FormModel = {
  message: string;
  moreTokens: boolean;
};

export default () => {
  const [isLoading, setIsLoading] = useState(false);
  const { conversation, sendMessage } = useAmaAssistant();

  const translationTextAreaRef = useRef<Form.TextField>(null);

  const handleSubmit = async (values: FormModel) => {
    setIsLoading(true);
    await sendMessage(values.message);
    setIsLoading(false);
    translationTextAreaRef.current?.reset();
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} />
        </ActionPanel>
      }
      isLoading={isLoading}
    >
      {conversation.length > 0 && (
        <>
          <Form.Description
            title="Conversation"
            text={conversation
              .map((item) => {
                return `${item.user}:\n${item.message.trim()}`;
              })
              .join("\n\n")}
          />
          <Form.Separator />
        </>
      )}
      <Form.TextArea
        id="message"
        title="New message"
        placeholder="Type something..."
        autoFocus
        ref={translationTextAreaRef}
      />
      <Form.Checkbox id="moreTokens" label="Long answer" />
    </Form>
  );
};
