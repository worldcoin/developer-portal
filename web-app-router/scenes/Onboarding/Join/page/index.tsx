"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { SuccessIcon } from "@/components/Icons";
import { Input } from "@/components/Input";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useCallback } from "react";

const testSchema = yup.object().shape({
  name: yup
    .string()
    .required("Name is required")
    .max(50, "App name cannot exceed 50 characters"),
  test: yup
    .number()
    .max(1500, "Overview cannot exceed 1500 characters")
    .required("This section is required"),
  test2: yup
    .string()
    .max(1500, "How it works cannot exceed 1500 characters")
    .optional(),
});

export type TestFormValues = yup.Asserts<typeof testSchema>;

export const JoinPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<TestFormValues>({
    resolver: yupResolver(testSchema),
  });
  const handleSave = useCallback(async (data: TestFormValues) => {
    try {
      console.log("App information saved");
      console.log(data);
    } catch (errors: any) {
      console.log(errors);
    }
  }, []);

  return (
    <div className="flex flex-col p-10 items-center justify-center gap-2 h-screen">
      <div className="flex flex-row gap-1">
        <DecoratedButton
          type="button"
          className="w-72"
          variant="primary"
          icon={<SuccessIcon />}
          showArrowRight
        >
          Primary
        </DecoratedButton>
        <DecoratedButton
          type="button"
          variant="primary"
          className="w-72"
          icon={<SuccessIcon />}
          showArrowRight
          disabled
        >
          Primary: Disabled
        </DecoratedButton>
        <DecoratedButton
          type="button"
          variant="primary"
          loading
          className="w-72"
          showArrowRight
          icon={<SuccessIcon />}
        >
          Primary: Loading
        </DecoratedButton>
      </div>
      <div className="flex flex-row gap-1">
        <DecoratedButton
          type="button"
          className="w-72"
          variant="secondary"
          icon={<SuccessIcon />}
          showArrowRight
        >
          Secondary
        </DecoratedButton>
        <DecoratedButton
          type="button"
          variant="secondary"
          className="w-72"
          icon={<SuccessIcon />}
          showArrowRight
          disabled
        >
          Secondary: Disabled
        </DecoratedButton>
        <DecoratedButton
          type="button"
          variant="secondary"
          loading
          className="w-72"
          showArrowRight
          icon={<SuccessIcon />}
        >
          Secondary: Loading
        </DecoratedButton>
      </div>
      <div className="flex flex-row gap-1">
        <DecoratedButton
          type="button"
          className="w-72"
          variant="danger"
          icon={<SuccessIcon />}
          showArrowRight
        >
          Danger
        </DecoratedButton>
        <DecoratedButton
          type="button"
          variant="danger"
          className="w-72"
          icon={<SuccessIcon />}
          showArrowRight
          disabled
        >
          Danger: Disabled
        </DecoratedButton>
        <DecoratedButton
          type="button"
          variant="danger"
          loading
          className="w-72"
          showArrowRight
          icon={<SuccessIcon />}
        >
          Danger: Loading
        </DecoratedButton>
      </div>
      <div className="flex p-2 w-full ">
        <form
          onSubmit={handleSubmit(handleSave)}
          className="flex flex-col items-center w-full gap-2"
        >
          <h1>Test Form</h1>
          <Input
            register={register("name")}
            errors={errors.name}
            required
            label="Name"
            className="w-[500px]"
            placeholder="my_signal"
          />
          <Input
            register={register("test")}
            required
            errors={errors.test}
            label="Test"
            disabled
            className="w-[500px]"
            placeholder="my_signal"
          />
          <Input
            register={register("test2")}
            label="Test2"
            errors={errors.test2}
            addOnPosition="right"
            addOn={
              <button type="button">
                <SuccessIcon />
              </button>
            }
            className="w-[500px]"
            placeholder="my_signal"
            helperText="The number of verifications the same person can do for this action"
          />
          {errors.name?.message && (
            <span className="pt-2 left-0 flex items-center text-12 text-error-500">
              {errors.name.message}
            </span>
          )}
          <DecoratedButton
            type="submit"
            className="w-72"
            variant="primary"
            icon={<SuccessIcon />}
            showArrowRight
          >
            Danger
          </DecoratedButton>
        </form>
      </div>
    </div>
  );
};
