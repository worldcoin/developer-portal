"use client";
import { Button } from "@/components/Button";
import { CopyIcon } from "@/components/Icons/CopyIcon";
import { Input } from "@/components/Input";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { toast } from "react-toastify";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import { DecoratedButton } from "@/components/DecoratedButton";
import { AppStatus } from "./AppStatus";
const schema = yup.object({
  name: yup
    .string()
    .required("App name is required")
    .max(50, "App name cannot exceed 50 characters"),
  category: yup.string().optional(),
});
export type BasicInformationFormValues = yup.Asserts<typeof schema>;

export const BasicInformation = (props: { appId: string }) => {
  const { appId } = props;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<BasicInformationFormValues>({
    resolver: yupResolver(schema),
    // defaultValues: { ...currentApp?.app_metadata, ...description },
  });

  const copyId = () => {
    navigator.clipboard.writeText(appId);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="grid grid-cols-2">
      <div className="">
        <form className="grid gap-y-7">
          <Typography variant={TYPOGRAPHY.H7}>Basic Information</Typography>
          <AppStatus disb />
          <Input
            register={register("name")}
            errors={errors.name}
            label="App name"
            required
            placeholder="Enter your App NAme"
          />
          {/* TODO: Use Dropdown Selector */}
          <Input label="Category" required placeholder="Category" />
          <Input
            label="ID"
            disabled
            placeholder={appId}
            addOnRight={
              <Button
                type="button"
                onClick={copyId}
                className="text-grey-900 pr-2"
              >
                <CopyIcon />
              </Button>
            }
          />
          <Input label="Publisher" required disabled placeholder="Team Name" />
          <DecoratedButton
            type="submit"
            variant="primary"
            className=" mr-5 w-40 h-12"
            disabled={isSubmitting}
          >
            <Typography variant={TYPOGRAPHY.M3}>Save Changes</Typography>
          </DecoratedButton>
        </form>
      </div>
    </div>
  );
};
