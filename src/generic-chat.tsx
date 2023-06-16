import { Form, ActionPanel, Action, LaunchProps, useNavigation, showToast, Toast } from "@raycast/api";
import { useEffect, useRef, useState } from "react";
import ChatSettings from "./components/chat-settings";
import { useChatBot } from "./hooks/use-chat-bot";
import { ActiveState, getActiveState, setActiveState } from "./utils/active-settings";
import { BotSettings, getChatBotDefaults } from "./utils/settings";

type FormModel = {
  message: string;
};

export default ({ launchContext }: LaunchProps<{ launchContext: { state?: ActiveState<"chat">; input?: string } }>) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(launchContext?.input || "");

  const { conversation, send } = useChatBot();

  const messageTextAreaRef = useRef<Form.TextField>(null);

  const { push } = useNavigation();

  const handleSubmit = async (values: FormModel) => {
    setIsLoading(true);
    const message = values.message;
    messageTextAreaRef.current?.reset();
    const { settings } = await getActiveState("chat");
    try {
      await send(message, settings);
      showToast({ title: "Done" });
    } catch (error: any) {
      showToast({ style: Toast.Style.Failure, title: "Error", message: `${error?.message}` });
      setMessage(message);
      messageTextAreaRef.current?.focus();
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const settings: BotSettings<"chat"> = launchContext?.state?.settings || getChatBotDefaults();
    setActiveState<"chat">({ settings, preset: launchContext?.state?.preset });
    if (launchContext?.input) {
      handleSubmit({ message: launchContext.input });
    }
  }, []);

  const openSettings = async () => {
    const state = await getActiveState("chat");
    push(<ChatSettings state={state} />);
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} />
          <Action title="TODO" onAction={() => null} />
          <Action title="Chat Settings" shortcut={{ modifiers: ["cmd"], key: "/" }} onAction={openSettings} />
        </ActionPanel>
      }
      isLoading={isLoading}
    >
      {conversation.map(({ message, user }, index) => (
        <Form.TextArea
          key={index}
          enableMarkdown
          id={`_m${index}`}
          title={user}
          value={message.trim()}
          onChange={() => null}
        />
      ))}
      {conversation.length > 0 && <Form.Separator />}
      <Form.TextArea
        id="message"
        value={message}
        title="New message"
        placeholder="Type something..."
        autoFocus
        onChange={setMessage}
        ref={messageTextAreaRef}
      />
    </Form>
  );
};
