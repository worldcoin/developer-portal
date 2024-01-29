"use client";

import {
  CircleIconContainer,
  CircleIconContainerProps,
} from "@/components/CircleIconContainer";

import { AlertIcon } from "@/components/Icons/AlertIcon";
import { useEffect, useState } from "react";
import { DecoratedButton } from "@/components/DecoratedButton";
import { SuccessIcon } from "@/components/Icons/SuccessIcon";
import { Input } from "@/components/Input";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useCallback } from "react";
import { Radio } from "@/components/Radio";

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
  radio: yup.string().optional(),
});

export type TestFormValues = yup.Asserts<typeof testSchema>;

export const JoinPage = () => {
  const [variant, setVariant] =
    useState<CircleIconContainerProps["variant"]>("success");

  useEffect(() => {
    const interval = setInterval(() => {
      setVariant((prev) => {
        if (prev === "success") return "error";
        if (prev === "error") return "info";
        if (prev === "info") return "muted";
        if (prev === "muted") return "success";
        return "success";
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);
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
    <div className="flex flex-col items-center justify-center gap-2 h-screen mt-10">
      <CircleIconContainer variant={variant}>
        <AlertIcon />
      </CircleIconContainer>
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
      <div className="flex p-2 w-full items-center justify-center">
        <form
          onSubmit={handleSubmit(handleSave)}
          className="flex flex-col items-center  gap-4  w-[500px]"
          noValidate
        >
          <h1>Test Form</h1>
          <Input
            register={register("name")}
            errors={errors.name}
            required
            label="Name"
            className="w-[500px]"
            addOnPosition="left"
            addOn={
              <button
                type="button"
                className="w-16 bg-red-500 px-2 ml-1 py-2 rounded-lg"
              >
                Test
              </button>
            }
            placeholder="my_signal"
          />
          <Input
            register={register("test")}
            required
            errors={errors.test}
            label="Ronald"
            className="w-[500px]"
            placeholder="my_signal"
            helperText="The number of verifications the same person can do for this action"
          />
          <Input
            register={register("test2")}
            label="ALPHABET"
            errors={errors.test2}
            addOnPosition="left"
            disabled
            addOn={
              <button type="button">
                <SuccessIcon />
              </button>
            }
            className="w-[500px]"
            placeholder="my_signal"
            helperText="The number of verifications the same person can do for this action"
          />
          {errors.test2?.message && (
            <span className="pt-2 left-0 flex items-center text-12 text-error-500">
              {errors.test2.message}
            </span>
          )}
          <Radio
            label="Option 1"
            value="option1"
            className="w-32"
            register={register("radio")}
            errors={errors.radio}
          />
          <Radio
            label="Option 2"
            register={register("radio")}
            value="option2"
            errors={errors.radio}
            className="w-32 "
          />
          <Radio
            label="Option 3"
            register={register("radio")}
            value="option3"
            errors={errors.radio}
            className="w-32 "
            disabled
          />
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
