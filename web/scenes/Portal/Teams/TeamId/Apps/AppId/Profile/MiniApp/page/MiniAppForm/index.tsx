"use client";
import { Checkbox } from "@/components/Checkbox";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Input } from "@/components/Input";
import { SelectMultiple } from "@/components/SelectMultiple";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import {
  checkUserPermissions,
  convertArrayToHasusrArray,
  formatWhiteListedAddresses,
} from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { yupResolver } from "@hookform/resolvers/yup";
import { useCallback, useEffect, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import {
  FetchAppMetadataDocument,
  FetchAppMetadataQuery,
} from "../../../graphql/client/fetch-app-metadata.generated";
import { formCountriesList } from "../helpers/form-countries-list";
import { useUpdateMiniAppInfoMutation } from "./graphql/client/update-mini-app.generated";

const schema = yup.object().shape({
  app_mode: yup.boolean().required("This field is required"),
  whitelisted_addresses: yup.string(),

  support_email: yup.string().when("app_mode", {
    is: true,
    then: (schema) =>
      schema
        .email("Must be a valid email address")
        .required("This field is required"),
    otherwise: (schema) => schema.notRequired(),
  }),

  supported_countries: yup.array().when("app_mode", {
    is: true,
    then: (schema) =>
      schema
        .of(
          yup
            .string()
            .required("This field is required")
            .length(2, "Invalid country code"),
        )
        .min(1, "This field is required for Mini Apps")
        .required("This field is required")
        .default([]),
    otherwise: (schema) => schema.notRequired().default(null),
  }),
});

type LinksFormValues = yup.Asserts<typeof schema>;

type LinksFormProps = {
  appId: string;
  teamId: string;
  appMetadata?: FetchAppMetadataQuery["app"][0]["app_metadata"][0];
};

export const MiniAppForm = (props: LinksFormProps) => {
  const countries = useMemo(() => formCountriesList(), []);
  const { appId, teamId, appMetadata } = props;
  const { user } = useUser() as Auth0SessionUser;
  const isEditable = appMetadata?.verification_status === "unverified";

  const [updateMiniAppInfoMutation, { loading: updatingInfo }] =
    useUpdateMiniAppInfoMutation();

  const isEnoughPermissions = useMemo(() => {
    return checkUserPermissions(user, teamId ?? "", [
      Role_Enum.Owner,
      Role_Enum.Admin,
    ]);
  }, [user, teamId]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid },
    setError,
    control,
  } = useForm<LinksFormValues>({
    resolver: yupResolver(schema),
    mode: "onChange",

    defaultValues: {
      whitelisted_addresses:
        appMetadata?.whitelisted_addresses?.join(",") ?? null,
      app_mode: appMetadata?.app_mode === "mini-app" ? true : false,
      support_email: appMetadata?.support_email ?? undefined,
      supported_countries: appMetadata?.supported_countries ?? [],
    },
  });

  // Used to update the fields when view mode is change
  useEffect(() => {
    reset({
      whitelisted_addresses:
        appMetadata?.whitelisted_addresses?.join(",") ?? null,
      app_mode: appMetadata?.app_mode === "mini-app" ? true : false,
      support_email: appMetadata?.support_email ?? undefined,
      supported_countries: appMetadata?.supported_countries ?? [],
    });
  }, [
    appMetadata?.whitelisted_addresses,
    appMetadata?.app_mode,
    reset,
    appMetadata?.support_email,
    appMetadata?.supported_countries,
  ]);

  const submit = useCallback(
    async (values: LinksFormValues) => {
      if (updatingInfo) return;

      // Check if app_mode is true and whitelisted_addresses is not provided or empty
      if (
        values.app_mode &&
        (!values.whitelisted_addresses ||
          values.whitelisted_addresses.length === 0)
      ) {
        setError("whitelisted_addresses", {
          type: "manual",
          message:
            "Mini Apps must have at least one whitelisted payment address.",
        });
        return; // Stop the submission process
      }

      const supported_countries =
        values.supported_countries && values.supported_countries.length > 0
          ? convertArrayToHasusrArray(values.supported_countries)
          : null;

      try {
        const result = await updateMiniAppInfoMutation({
          variables: {
            app_metadata_id: appMetadata?.id ?? "",
            whitelisted_addresses:
              formatWhiteListedAddresses(values.whitelisted_addresses) ?? null,
            app_mode: values.app_mode ? "mini-app" : "external",
            support_email: values.support_email ?? null,
            supported_countries,
          },

          refetchQueries: [
            {
              query: FetchAppMetadataDocument,
              variables: {
                id: appId,
              },
            },
          ],
        });

        if (result instanceof Error) {
          throw result;
        }

        toast.success("App information updated successfully");
      } catch (e) {
        console.error(e);
        toast.error("Failed to update app information");
      }
    },

    [appId, appMetadata?.id, setError, updateMiniAppInfoMutation, updatingInfo],
  );

  const selectedCountries = useWatch({
    control,
    name: "supported_countries",
  });

  const appMode = useWatch({
    control,
    name: "app_mode",
  });

  return (
    <form className="grid gap-y-7" onSubmit={handleSubmit(submit)}>
      <div className="grid gap-y-2">
        <Typography variant={TYPOGRAPHY.H7}>Mini App Configuration</Typography>

        {isDirty && (
          <Typography variant={TYPOGRAPHY.R4} className="text-system-error-500">
            Warning: You have unsaved changes
          </Typography>
        )}
      </div>

      <label
        htmlFor="app_mode"
        className="grid cursor-pointer grid-cols-auto/1fr gap-x-4 rounded-xl border-[1px] border-grey-200 px-5 py-6"
      >
        <Checkbox
          id="app_mode"
          register={register("app_mode")}
          disabled={!isEditable || !isEnoughPermissions}
        />

        <div className="grid gap-y-2">
          <Typography variant={TYPOGRAPHY.R3} className="text-grey-700">
            This is a Mini App
          </Typography>

          <Typography variant={TYPOGRAPHY.R4} className="text-grey-400">
            Checking this means you have implemented mini-kit inside of your app
            and are would like this to loaded as a mini-app. Note your app will
            be rejected if this is not the case.
          </Typography>
        </div>
      </label>

      <div className="grid gap-y-4">
        <div className="grid gap-y-2">
          <Typography variant={TYPOGRAPHY.H7}>
            Whitelisted Payment Addresses (Optimism Network)
          </Typography>

          <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
            These are addresses that are allowed to receive payments for your
            app. Note minikit payment requests that do not send funds to these
            addresses will be rejected.
          </Typography>

          <Input
            label="Whitelisted Payment Addresses"
            disabled={!isEditable || !isEnoughPermissions}
            placeholder="0x12312321..., 0x12312312..."
            register={register("whitelisted_addresses")}
          />
        </div>

        {errors?.whitelisted_addresses?.message && (
          <p className="mt-2 text-xs text-system-error-500">
            {errors?.whitelisted_addresses?.message}
          </p>
        )}
      </div>

      <div className="grid gap-y-2">
        <Typography variant={TYPOGRAPHY.H7}>Supported Countries</Typography>

        <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
          If your app is Mini App then you must select a list of countries where
          Mini App will be available.
        </Typography>

        <Controller
          control={control}
          name="supported_countries"
          render={({ field }) => (
            <SelectMultiple
              values={selectedCountries}
              onChange={(value) => {
                if (!field.value) {
                  return field.onChange([]);
                }

                field.onChange(
                  field.value.some((v) => v === value)
                    ? field.value.filter((v) => v !== value)
                    : [...field.value, value],
                );
              }}
              onRemove={(value) =>
                field.onChange(field.value?.filter((v) => v !== value) ?? [])
              }
              items={countries}
              label="Supported Countries"
              disabled={!isEditable || !isEnoughPermissions}
              errors={errors.supported_countries}
              required={appMode}
              selectAll={() =>
                field.onChange(
                  selectedCountries?.length && selectedCountries.length > 0
                    ? []
                    : countries.map((c) => c.value),
                )
              }
            />
          )}
        />
      </div>

      <div className="grid gap-y-2">
        <Typography variant={TYPOGRAPHY.H7}>Support Email</Typography>

        <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
          If your app is Mini App then you must provide a support email to give
          users a way to contact you.
        </Typography>

        <Input
          label="Support Email"
          disabled={!isEditable || !isEnoughPermissions}
          placeholder="address@example.com"
          register={register("support_email")}
          errors={errors.support_email}
          required={appMode}
        />
      </div>

      <DecoratedButton
        type="submit"
        className="h-12 w-40"
        disabled={!isEditable || !isEnoughPermissions || !isDirty || !isValid}
      >
        <Typography variant={TYPOGRAPHY.M3}>Save Changes</Typography>
      </DecoratedButton>
    </form>
  );
};
