import { memo, useCallback } from "react";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useUpdateSignInActionMutation } from "../graphql/client/update-sign-in-action.generated";
import { SignInActionQuery } from "../../graphql/server/fetch-signin.generated";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Input } from "@/components/Input";
import { DecoratedButton } from "@/components/DecoratedButton";
import { toast } from "react-toastify";

const schema = yup.object({
  privacy_policy_uri: yup.string().url("Must be a valid URL").optional(),
  terms_uri: yup.string().url("Must be a valid URL").optional(),
});

type ClientInformation = yup.InferType<typeof schema>;

// This component will not be rendered if signInAction is not defined
export const LinksForm = memo(function LinksForm(props: {
  teamId: string;
  signInAction: SignInActionQuery["action"][0];
}) {
  const { teamId, signInAction } = props;
  const [updateSignInActionMutation] = useUpdateSignInActionMutation({
    context: { headers: { team_id: teamId } },
  });

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
        console.error(error);
        toast.error("Error updating action");
      }
    },
    [signInAction?.id]
  );

  return (
    <form className="grid gap-y-5" onSubmit={handleSubmit(submit)}>
      <div className="grid gap-y-3">
        <Typography as="h6" variant={TYPOGRAPHY.M2}>
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
        errors={errors?.privacy_policy_uri}
      />
      <Input
        register={register("terms_uri")}
        placeholder="https://"
        label="Terms of Use"
        className="h-16"
        errors={errors?.terms_uri}
      />

      <DecoratedButton type="submit" className="w-fit text-sm h-12">
        <Typography variant={TYPOGRAPHY.M3}>Save Changes</Typography>
      </DecoratedButton>
    </form>
  );
});
