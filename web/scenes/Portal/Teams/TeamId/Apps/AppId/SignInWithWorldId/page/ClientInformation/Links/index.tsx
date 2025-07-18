import { DecoratedButton } from "@/components/DecoratedButton";
import { Input } from "@/components/Input";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { yupResolver } from "@hookform/resolvers/yup";
import clsx from "clsx";
import { memo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { SignInActionQuery } from "../../graphql/server/fetch-signin.generated";
import { useUpdateSignInActionMutation } from "../graphql/client/update-sign-in-action.generated";

const schema = yup
  .object({
    privacy_policy_uri: yup.string().url("Must be a valid URL").optional(),
    terms_uri: yup.string().url("Must be a valid URL").optional(),
  })
  .noUnknown();

type ClientInformation = yup.InferType<typeof schema>;

// This component will not be rendered if signInAction is not defined
export const LinksForm = memo(function LinksForm(props: {
  teamId: string;
  signInAction: SignInActionQuery["action"][0];
  canEdit: boolean;
}) {
  const { teamId, signInAction, canEdit } = props;
  const [updateSignInActionMutation] = useUpdateSignInActionMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientInformation>({
    resolver: yupResolver(schema),
    shouldFocusError: false,
    defaultValues: {
      privacy_policy_uri: signInAction?.privacy_policy_uri ?? "",
      terms_uri: signInAction?.terms_uri ?? "",
    },
  });

  const submit = useCallback(
    async (data: ClientInformation) => {
      try {
        if (!signInAction) return; // This should never happen
        await updateSignInActionMutation({
          variables: {
            id: signInAction?.id,
            input: {
              privacy_policy_uri: data.privacy_policy_uri,
              terms_uri: data.terms_uri,
            },
          },
        });
        toast.success("Links saved!");
      } catch (error) {
        console.error("Update Sign in Links Error: ", error);
        toast.error("Error updating action");
      }
    },
    [signInAction, updateSignInActionMutation],
  );

  return (
    <form className="grid gap-y-5" onSubmit={handleSubmit(submit)}>
      <div className="grid gap-y-3">
        <Typography as="h6" variant={TYPOGRAPHY.H7}>
          Legal links
        </Typography>
        <Typography as="p" variant={TYPOGRAPHY.R3} className="text-grey-500">
          Links to where your Privacy Policy and Terms of Use are posted
        </Typography>
      </div>
      <Input
        register={register("privacy_policy_uri")}
        placeholder="https://"
        label="Privacy Policy"
        className="h-16"
        disabled={!canEdit}
        errors={errors?.privacy_policy_uri}
      />
      <Input
        register={register("terms_uri")}
        placeholder="https://"
        label="Terms of Use"
        className="h-16"
        disabled={!canEdit}
        errors={errors?.terms_uri}
      />

      <DecoratedButton
        type="submit"
        className={clsx("h-12 w-fit text-sm", { hidden: !canEdit })}
      >
        <Typography variant={TYPOGRAPHY.M3}>Save Changes</Typography>
      </DecoratedButton>
    </form>
  );
});
