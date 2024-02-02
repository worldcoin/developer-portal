"use client";

import {
  RedirectsDocument,
  useRedirectsQuery,
} from "./graphql/client/fetch-redirect.generated";
import { DecoratedButton } from "@/components/DecoratedButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { memo, useCallback, useState } from "react";
import { RedirectInput } from "./RedirectInput";
import { useInsertRedirectMutation } from "./graphql/client/insert-redirect.generated";
import { useUpdateRedirectMutation } from "./graphql/client/update-redirect.generated";
import { useDeleteRedirectMutation } from "./graphql/client/delete-redirect.generated";
import { toast } from "react-toastify";
import { Button } from "@/components/Button";
import { CloseIcon } from "@/components/Icons/CloseIcon";

export const Redirects = memo(function Redirects(props: { actionID: string }) {
  const { actionID } = props;
  const [addRedirectFormShown, setAddRedirectFormShown] = useState(false);

  const { data, loading } = useRedirectsQuery({
    variables: {
      action_id: actionID ?? "",
    },
  });

  const [insertRedirectMutation] = useInsertRedirectMutation();

  const [updateRedirectMutation] = useUpdateRedirectMutation();

  const [deleteRedirectMutation] = useDeleteRedirectMutation();

  const addRedirect = useCallback(
    async (redirect_uri: string) => {
      try {
        await insertRedirectMutation({
          variables: {
            action_id: actionID,
            uri: redirect_uri,
          },
          refetchQueries: [
            {
              query: RedirectsDocument,
              variables: { action_id: actionID },
            },
          ],
          awaitRefetchQueries: true,
        });
        setAddRedirectFormShown(false);
      } catch (error) {
        console.error(error);
        toast.error("Error adding redirect");
      }
    },
    [actionID, insertRedirectMutation],
  );

  const deleteRedirect = useCallback(
    async (id: string) => {
      try {
        await deleteRedirectMutation({
          variables: {
            id,
          },
          refetchQueries: [
            {
              query: RedirectsDocument,
              variables: { action_id: actionID },
            },
          ],
          awaitRefetchQueries: true,
        });
      } catch (error) {
        console.error(error);
        toast.error("Error deleting redirect");
      }
    },
    [actionID, deleteRedirectMutation],
  );
  const redirects = data?.redirect;
  if (loading) return <div></div>;
  return (
    <div className="grid gap-y-5">
      {redirects?.map((redirect) => (
        <RedirectInput
          key={`signin-redirect-input-${redirect.id}`}
          placeholder="https://"
          currentValue={redirect.redirect_uri}
          className="h-14"
          addOnRight={
            <Button
              type="button"
              className="pr-2"
              onClick={() => deleteRedirect(redirect.id)}
            >
              <CloseIcon />
            </Button>
          }
          handleChange={(value: string) => {
            if (value !== redirect.redirect_uri) {
              updateRedirectMutation({
                variables: { id: redirect.id, uri: value },
                refetchQueries: [
                  {
                    query: RedirectsDocument,
                    variables: { action_id: actionID },
                  },
                ],
                awaitRefetchQueries: true,
              });
            }
          }}
        />
      ))}
      {addRedirectFormShown && (
        <RedirectInput
          currentValue=""
          placeholder="https://"
          className="h-14"
          addOnRight={
            <Button
              type="button"
              className="pr-2"
              onClick={() => setAddRedirectFormShown(false)}
            >
              <CloseIcon />
            </Button>
          }
          handleChange={async (value) => {
            await addRedirect(value);
          }}
        />
      )}
      <DecoratedButton
        type="button"
        variant="secondary"
        className="w-fit text-sm h-12"
        onClick={() => setAddRedirectFormShown(true)}
      >
        <Typography variant={TYPOGRAPHY.M3}>Add another</Typography>
      </DecoratedButton>
    </div>
  );
});
