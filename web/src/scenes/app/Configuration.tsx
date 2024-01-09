import { FieldInput } from "src/components/FieldInput";
import { KeyboardEvent, memo, useCallback, useEffect, useRef } from "react";
import { useAppStore } from "src/stores/appStore";
import useApps from "src/hooks/useApps";
import { Icon } from "@/components/Icon";
import { FieldSelect } from "@/components/FieldSelect";
import { FieldTextArea } from "@/components/FieldTextArea";
import { FieldCheckbox } from "@/components/FieldCheckbox";

const dropDownOptions = [
  { value: "Social", label: "Social" },
  { value: "Gaming", label: "Gaming" },
  { value: "Business", label: "Business" },
  { value: "Finance", label: "Finance" },
  { value: "Productivity", label: "Productivity" },
];

const Label = memo(function Label(props: {
  label: string;
  value: string;
  saving?: boolean;
  onSave: (value: string) => void;
  disabled?: boolean;
  disabledMessage?: string;
}) {
  const { value, onSave, disabled } = props;

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
      <div className="relative group">
        <FieldInput
          ref={ref}
          className="text-14 w-full disabled:cursor-not-allowed"
          defaultValue={value}
          onBlur={handleBlur}
          onKeyPress={handleKeyPress}
          disabled={disabled}
        />
        {props.saving && (
          <Icon
            className="absolute right-0 top-1/2 -mt-2 mr-2 w-4 h-4 animate-spin"
            name="spinner"
            noMask
          />
        )}
        {disabled && props.disabledMessage && (
          <div className="absolute invisible group-hover:visible top-[100%] mt-1 text-14 text-neutral-secondary">
            {props.disabledMessage}
          </div>
        )}
      </div>
    </label>
  );
});
const TextArea = memo(function Label(props: {
  label: string;
  value: string;
  saving?: boolean;
  onSave: (value: string) => void;
  disabled?: boolean;
  disabledMessage?: string;
}) {
  const { value, onSave, disabled } = props;

  const ref = useRef<HTMLTextAreaElement | null>(null);

  const handleSave = useCallback(() => {
    const newValue = ref.current?.value;
    if (newValue && newValue !== value) {
      onSave(newValue);
    }
  }, [value, onSave]);

  const handleBlur = useCallback(() => {
    handleSave();
  }, [handleSave]);

  // Update the input value when the value prop changes
  useEffect(() => {
    if (ref.current) {
      ref.current.value = value;
    }
  }, [value]);

  return (
    <label>
      <span className="text-14 font-medium">{props.label}</span>
      <div className="relative group">
        <FieldTextArea
          ref={ref}
          className="text-14 w-full disabled:cursor-not-allowed"
          defaultValue={value}
          onBlur={handleBlur}
          disabled={disabled}
        />
        {props.saving && (
          <Icon
            className="absolute right-0 top-1/2 -mt-2 mr-2 w-4 h-4 animate-spin"
            name="spinner"
            noMask
          />
        )}
        {disabled && props.disabledMessage && (
          <div className="absolute invisible group-hover:visible top-[100%] mt-1 text-14 text-neutral-secondary">
            {props.disabledMessage}
          </div>
        )}
      </div>
    </label>
  );
});

const Checkbox = memo(function Checkbox(props: {
  label: string;
  checked: boolean;
  saving?: boolean;
  onToggle: (checked: boolean) => void;
  disabled?: boolean;
  disabledMessage?: string;
}) {
  const { checked, onToggle, disabled, saving, disabledMessage, label } = props;

  const ref = useRef<HTMLInputElement | null>(null);

  const handleToggle = useCallback(() => {
    if (ref.current) {
      onToggle(ref.current.checked);
    }
  }, [onToggle]);

  // Update the checkbox checked state when the checked prop changes
  useEffect(() => {
    if (ref.current) {
      ref.current.checked = checked;
    }
  }, [checked]);

  return (
    <label className="flex items-center space-x-2">
      <FieldCheckbox
        ref={ref}
        checked={checked}
        onChange={handleToggle}
        disabled={disabled}
      />
      <span className="text-14 font-medium">{label}</span>
      {saving && (
        <Icon className="w-4 h-4 animate-spin" name="spinner" noMask />
      )}
      {disabled && disabledMessage && (
        <div className="text-14 text-neutral-secondary">{disabledMessage}</div>
      )}
    </label>
  );
});

const Dropdown = memo(function Dropdown(props: {
  label: string;
  options: Array<{ value: string; label: string }>;
  selectedValue: string;
  onChange: (value: string) => void;
  saving?: boolean;
  disabled?: boolean;
  disabledMessage?: string;
}) {
  const { selectedValue, onChange, disabled } = props;

  const ref = useRef<HTMLSelectElement | null>(null);

  const handleChange = useCallback(() => {
    const newValue = ref.current?.value;
    if (newValue && newValue !== selectedValue) {
      onChange(newValue);
    }
  }, [selectedValue, onChange]);

  // Update the select value when the selectedValue prop changes
  useEffect(() => {
    if (ref.current) {
      ref.current.value = selectedValue;
    }
  }, [selectedValue]);

  return (
    <label>
      <span className="text-14 font-medium ">{props.label}</span>
      <div className="relative group">
        <FieldSelect
          ref={ref}
          className="text-14 disabled:cursor-not-allowed bg-gray-100"
          value={selectedValue}
          onChange={handleChange}
          disabled={disabled}
          options={props.options}
        />
        {props.saving && (
          <Icon
            className="absolute right-0 top-1/2 -mt-2 mr-2 w-4 h-4 animate-spin"
            name="spinner"
            noMask
          />
        )}
        {disabled && props.disabledMessage && (
          <div className="absolute invisible group-hover:visible top-[100%] mt-1 text-14 text-neutral-secondary">
            {props.disabledMessage}
          </div>
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
    updateAppCategory,
    isUpdateAppCategoryMutating,
    updateAppLink,
    isUpdateAppLinkMutating,
    updateDeveloperAllowAppStoreListing,
    isUpdateDeveloperAllowAppStoreListingMutating,
  } = useApps();

  return (
    <section className="grid gap-y-8">
      <h2 className="text-20 font-sora font-semibold">Configuration</h2>

      <Label
        label="App Name"
        value={currentApp?.name || ""}
        saving={isUpdateAppNameMutating}
        onSave={updateAppName}
        disabled={currentApp?.is_verified}
        disabledMessage={
          currentApp?.is_verified
            ? "Verified app name can't be changed."
            : undefined
        }
      />

      <h1 className="font-bold">App Description</h1>
      <TextArea
        label="Overview"
        value={currentApp?.description_internal || ""}
        saving={isUpdateAppDescriptionMutating}
        onSave={updateAppDescription}
      />
      <TextArea
        label="How it works"
        value={currentApp?.description_internal || ""}
        saving={isUpdateAppDescriptionMutating}
        onSave={updateAppDescription}
      />
      <TextArea
        label="How To Connect"
        value={currentApp?.description_internal || ""}
        saving={isUpdateAppDescriptionMutating}
        onSave={updateAppDescription}
      />
      <Label
        label="App Link"
        value={currentApp?.link || ""}
        saving={isUpdateAppLinkMutating}
        onSave={updateAppLink}
      />
      <Dropdown
        label="Category"
        options={dropDownOptions}
        onChange={updateAppCategory}
        saving={isUpdateAppCategoryMutating}
        selectedValue={currentApp?.category || ""}
      />
      <Checkbox
        label="Allow app to be listed on the app store"
        checked={currentApp?.developer_allow_app_store_listing || false}
        onToggle={updateDeveloperAllowAppStoreListing}
        saving={isUpdateDeveloperAllowAppStoreListingMutating}
      />
    </section>
  );
});
