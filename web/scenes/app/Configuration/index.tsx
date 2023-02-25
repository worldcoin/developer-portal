import { FieldInput } from "common/FieldInput";
import { apps } from "common/Layout/temp-data";
import { ChangeEvent, memo, useEffect, useState } from "react";
import { useDebounce } from "use-debounce";

const Label = memo(function Label(props: {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label>
      <span className="text-14 font-medium">{props.label}</span>
      <FieldInput
        className="text-14 w-full"
        value={props.value}
        onChange={props.onChange}
      />
    </label>
  );
});

export const Configuration = memo(function Configuration(props: {
  app: (typeof apps)[0];
}) {
  const [appName, setAppName] = useState<string>("");
  const [debouncedAppInput] = useDebounce(appName, 1000);
  const [appDescription, setAppDescription] = useState<string>("");
  const [debouncedAppDescription] = useDebounce(appDescription, 1000);

  useEffect(() => {
    setAppName(props.app.name);
    setAppDescription(props.app.description_internal);
  }, [props.app.name, props.app.description_internal]);

  //ANCHOR: Action after user stop typing for app name
  //TODO: Add app name updating
  useEffect(() => {
    if (!debouncedAppInput) {
      return;
    }

    console.log("debouncedAppInput: ", debouncedAppInput);
  }, [debouncedAppInput]);

  //ANCHOR: Action after user stop typing for app description
  //TODO: Add app description updating
  useEffect(() => {
    if (!debouncedAppDescription) {
      return;
    }

    console.log("debouncedAppDescription: ", debouncedAppDescription);
  }, [debouncedAppDescription]);

  return (
    <section className="grid gap-y-8">
      <h2 className="text-20 font-sora font-semibold">Configuration</h2>

      <Label
        label="App Name"
        value={appName}
        onChange={(e) => setAppName(e.target.value)}
      />

      <Label
        label="App Description"
        value={appDescription}
        onChange={(e) => setAppDescription(e.target.value)}
      />
    </section>
  );
});
