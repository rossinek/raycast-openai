import {
  Form,
  ActionPanel,
  Action,
  LaunchProps,
  showToast,
  Icon,
  closeMainWindow,
  PopToRootType,
  useNavigation,
  Toast,
} from "@raycast/api";
import { useEffect, useRef, useState } from "react";
import CompletionSettings from "./components/completion-settings";
import { useCompletionBot } from "./hooks/use-completion-bot";
import { BotSettings, getCompletionBotDefaults } from "./utils/settings";
import { ActiveState, getActiveState, setActiveState } from "./utils/active-settings";

type FormModel = {
  text: string;
};

export default ({
  launchContext,
}: LaunchProps<{ launchContext: { state?: ActiveState<"completion">; input?: string } }>) => {
  const [isLoading, setIsLoading] = useState(false);
  const [inputText, setInputText] = useState(launchContext?.input || "");

  const { response, setResponse, send } = useCompletionBot();

  const responseTextAreaRef = useRef<Form.TextField>(null);

  const { push } = useNavigation();

  const handleSubmit = async (values: FormModel) => {
    setIsLoading(true);
    const { settings } = await getActiveState("completion");
    try {
      await send(values.text, settings);
      responseTextAreaRef.current?.focus();
      showToast({ title: "Done" });
    } catch (error: any) {
      setResponse("(error)");
      showToast({ style: Toast.Style.Failure, title: "Error", message: `${error?.message}` });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const settings: BotSettings<"completion"> = launchContext?.state?.settings || getCompletionBotDefaults();
    setActiveState<"completion">({ settings, preset: launchContext?.state?.preset });
    if (launchContext?.input) {
      handleSubmit({ text: launchContext.input });
    }
  }, []);

  const swapTexts = () => {
    setInputText(response);
    setResponse(inputText);
    handleSubmit({ text: response });
  };

  const openSettings = async () => {
    const state = await getActiveState("completion");
    push(<CompletionSettings state={state} />);
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} />
          <Action
            title="Swap texts"
            icon={Icon.Switch}
            onAction={swapTexts}
            shortcut={{ modifiers: ["cmd"], key: "arrowUp" }}
          />
          <Action.CopyToClipboard
            title="Copy to Clipboard"
            content={response}
            shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
            onCopy={() => closeMainWindow({ popToRootType: PopToRootType.Immediate })}
          />
          <Action title="Completion Settings" shortcut={{ modifiers: ["cmd"], key: "/" }} onAction={openSettings} />
        </ActionPanel>
      }
      isLoading={isLoading}
    >
      <Form.TextArea
        id="text"
        title="Text"
        placeholder="Type something..."
        value={inputText}
        onChange={setInputText}
        autoFocus
      />
      {!!response && (
        <>
          <Form.Separator />
          <Form.TextArea
            id="_response"
            title="Response"
            value={response}
            onChange={setResponse}
            ref={responseTextAreaRef}
          />
        </>
      )}
    </Form>
  );
};
