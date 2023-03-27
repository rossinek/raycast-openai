import { Form } from "@raycast/api";
import { useState } from "react";

export const useTextInputValidation = (validator: (value: string) => string | boolean) => {
  const [error, setError] = useState<string | undefined>();

  const validate = (value: string) => {
    const output = validator(value);
    const hasError = typeof output === "string" || !output;
    if (hasError) setError(typeof output === "string" ? output : "Invalid value");
    else resetValidation();
  };

  const resetValidation = () => {
    if (error) setError(undefined);
  };

  const attrs: Partial<Form.ItemProps<string>> = {
    error,
    onChange: resetValidation,
    onBlur: (event) => validate(event.target.value || ''),
  }

  return {
    attrs,
    error,
    resetValidation,
  };
};
