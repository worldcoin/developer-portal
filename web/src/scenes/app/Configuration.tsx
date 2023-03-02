import { FieldInput } from "src/components/FieldInput";
import { apps } from "src/components/Layout/temp-data";
import { ChangeEvent, memo, useEffect, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import { AppModel } from "src/lib/models";
import { AppStore, useAppStore } from "src/stores/appStore";
import { shallow } from "zustand/shallow";
import useApps from "src/hooks/useApps";

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

export const Configuration = memo(function Configuration() {
  const currentApp = useAppStore((store) => store.currentApp);

  const initialValues = useMemo(
    () => ({
      name: currentApp?.name || "",
      description: currentApp?.description_internal || "",
    }),
    [currentApp?.description_internal, currentApp?.name]
  );

  const { updateAppName, updateAppDescription } = useApps();
  const [appName, setAppName] = useState<string>(initialValues.name);
  const [debouncedAppName] = useDebounce(appName, 1000);

  const [appDescription, setAppDescription] = useState<string>(
    initialValues.description
  );

  const [debouncedAppDescription] = useDebounce(appDescription, 1000);

  useEffect(() => {
    setAppName(initialValues.name);
    setAppDescription(initialValues.description);
  }, [initialValues]);

  useEffect(() => {
    if (!debouncedAppName || debouncedAppName === initialValues.name) {
      return;
    }

    updateAppName(debouncedAppName);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- NOTE: we only want to run this effect when debouncedAppName changes
  }, [debouncedAppName]);

  useEffect(() => {
    if (
      !debouncedAppDescription ||
      debouncedAppDescription === initialValues.description
    ) {
      return;
    }

    updateAppDescription(debouncedAppDescription);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- NOTE: we only want to run this effect when debouncedAppDescription changes
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
