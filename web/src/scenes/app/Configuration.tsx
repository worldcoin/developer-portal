import { FieldInput } from "src/components/FieldInput";
import { KeyboardEvent, memo, useCallback, useEffect, useRef } from "react";
import { useAppStore } from "src/stores/appStore";
import useApps from "src/hooks/useApps";
import { Icon } from "@/components/Icon";

const Label = memo(function Label(props: {
  label: string;
  value: string;
  saving?: boolean;
  onSave: (value: string) => void;
}) {
  const { value, onSave } = props;

  const ref = useRef<HTMLInputElement | null>(null);

  const handleSave = useCallback(() => {
    const newValue = ref.current?.value;
    if (newValue && newValue !== value) {
      onSave(newValue);
    }
  }, [value, onSave]);

  const handleBlur = useCallback(() => {
    handleSave();
  }, [handleSave]);

  const handleKeyPress = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSave();
      }
    },
    [handleSave]
  );

  // Update the input value when the value prop changes
  useEffect(() => {
    if (ref.current) {
      ref.current.value = value;
    }
  }, [value]);

  return (
    <label>
      <span className="text-14 font-medium">{props.label}</span>
      <div className="relative">
        <FieldInput
          ref={ref}
          className="text-14 w-full"
          defaultValue={value}
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
  const {
    updateAppName,
    isUpdateAppNameMutating,
    updateAppDescription,
    isUpdateAppDescriptionMutating,
  } = useApps();

  return (
    <section className="grid gap-y-8">
      <h2 className="text-20 font-sora font-semibold">Configuration</h2>

      <Label
        label="App Name"
        value={currentApp?.name || ""}
        saving={isUpdateAppNameMutating}
        onSave={updateAppName}
      />

      <Label
        label="App Description"
        value={currentApp?.description_internal || ""}
        saving={isUpdateAppDescriptionMutating}
        onSave={updateAppDescription}
      />
    </section>
  );
});
