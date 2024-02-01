"use client";

import { Checkbox } from "@/components/Checkbox";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Input } from "@/components/Input";
import { Link } from "@/components/Link";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { yupResolver } from "@hookform/resolvers/yup";
import { useCallback, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { useRouter } from "next/navigation";
import { CreateTeamBody, CreateTeamResponse } from "@/api/create-team";
import { useSearchParams } from "next/navigation";

const schema = yup.object({
  teamName: yup.string().required("Please enter a team name"),

  termsAndConditions: yup
    .boolean()
    .isTrue("Please, accept terms and conditions")
    .required("Please, accept terms and conditions"),

  productUpdates: yup.boolean().optional(),
});

type FormValues = yup.InferType<typeof schema>;

export const Form = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invite_id = searchParams?.get("invite_id");

  const {
    register,
    handleSubmit,
    formState: { isValid, errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  const submit = useCallback(
    async (values: FormValues) => {
      const body: CreateTeamBody = {
        team_name: values.teamName,
        invite_id,
      };

      let data: CreateTeamResponse | null = null;

      try {
        const res = await fetch("/api/create-team", {
          method: "POST",
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const error = await res.json();
          throw error;
        }

        data = await res.json();
      } catch (error) {
        // TODO: handle error
        return console.error("Something went wrong while creating a team");
      }

      if (!data || !data.returnTo) {
        return console.log("Something went wrong");
      }

      router.push(data.returnTo);
    },
    [invite_id, router],
  );

  return (
    <form onSubmit={handleSubmit(submit)} className="grid gap-y-8">
      <Input
        register={register("teamName")}
        label="Team name"
        className="w-full"
        placeholder="Name will be visible to the members"
        required
        errors={errors.teamName}
      />

      <div className="grid gap-y-8 p-6 border border-grey-200 rounded-xl">
        <div className="grid grid-cols-auto/1fr gap-x-3">
          <Checkbox register={register("termsAndConditions")} />

          {/* TODO: add link */}
          <Typography variant={TYPOGRAPHY.R3}>
            I agree with{" "}
            <Link href="#" className="underline">
              Terms & Conditions
            </Link>{" "}
            <span className="text-system-error-600">*</span>
          </Typography>
        </div>

        <div className="grid grid-cols-auto/1fr gap-x-3 gap-y-1">
          <Checkbox
            register={register("productUpdates")}
            className="col-start-1 row-start-1"
          />

          <Typography
            variant={TYPOGRAPHY.R3}
            className="row-start-1 col-start-2"
          >
            I want to receive product updates
          </Typography>

          <Typography
            variant={TYPOGRAPHY.R4}
            className="text-gray-400 row-start-2 col-start-2"
          >
            Once upon a time we will send you an email with current updates
            about Worldcoin for developers
          </Typography>
        </div>
      </div>

      <DecoratedButton
        type="submit"
        className="mt-2 max-w-[180px] justify-self-center"
        disabled={!isValid || isSubmitting}
      >
        Create team
      </DecoratedButton>
    </form>
  );
};
