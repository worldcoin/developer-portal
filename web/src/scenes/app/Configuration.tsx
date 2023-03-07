import { FieldInput } from "src/components/FieldInput";
import {
  ChangeEvent,
  KeyboardEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useDebounce } from "use-debounce";
import { useAppStore } from "src/stores/appStore";
import useApps from "src/hooks/useApps";
import { Icon } from "@/components/Icon";

const Label = memo(function Label(props: {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  saving?: boolean;
  onSave: () => void;
}) {
  const { onSave } = props;

  const handleBlur = useCallback(() => {
    onSave();
  }, [onSave]);

  const handleKeyPress = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        onSave();
      }
    },
    [onSave]
  );

  return (
    <label>
      <span className="text-14 font-medium">{props.label}</span>
      <div className="relative">
        <FieldInput
          className="text-14 w-full"
          value={props.value}
          onChange={props.onChange}
          onBlur={handleBlur}
          onKeyPress={handleKeyPress}
        />
        {props.saving && (
          <Icon
            className="absolute right-0 top-1/2 -mt-2 mr-2 w-4 h-4 animate-spin"
            name="spinner"
            noMask
          />
        )}
      </div>
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
  const [appNameSaving, setAppNameSaving] = useState<boolean>(false);
  const handleSaveAppName = useCallback(async () => {
    setAppNameSaving(true);
    await updateAppName(appName);
    setAppNameSaving(false);
  }, [appName, updateAppName]);

  const [appDescription, setAppDescription] = useState<string>(
    initialValues.description
  );
  const [appDescriptionSaving, setAppDescriptionSaving] =
    useState<boolean>(false);
  const handleSavDescriptionName = useCallback(async () => {
    setAppDescriptionSaving(true);
    await updateAppDescription(appDescription);
    setAppDescriptionSaving(false);
  }, [appDescription, updateAppDescription]);

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
        saving={appNameSaving}
        onSave={handleSaveAppName}
      />

      <Label
        label="App Description"
        value={appDescription}
        onChange={(e) => setAppDescription(e.target.value)}
        saving={appDescriptionSaving}
        onSave={handleSavDescriptionName}
      />
    </section>
  );
});
