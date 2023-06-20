import { toast } from "react-toastify";

import {
  FetchKeysDocument,
  useFetchKeysQuery,
} from "./graphql/fetch-keys.generated";

import {
  InsertKeyMutationVariables,
  useInsertKeyMutation,
} from "./graphql/insert-key.generated";

import {
  UpdateKeyMutationVariables,
  useUpdateKeyMutation,
} from "./graphql/update-key.generated";

import { useDeleteKeyMutation } from "./graphql/delete-key.generated";
import { useResetApiKeyMutation } from "./graphql/reset-key.generated";

const useKeys = () => {
  const {
    data: fetchedKeys,
    error,
    loading,
  } = useFetchKeysQuery({
    onError: (e) => {
      console.error(e);
      toast.error("Failed to fetch API keys");
    },
  });

  const [insertKeyMutation] = useInsertKeyMutation();

  const createKey = async (object: InsertKeyMutationVariables["object"]) => {
    const { data: insertedKey, errors } = await insertKeyMutation({
      variables: {
        object,
      },

      refetchQueries: [{ query: FetchKeysDocument }],

      onCompleted: (data) => {
        if (data?.insert_api_key_one) {
          toast.success("API key created");
        }
      },

      onError: () => {
        toast.error("Failed to create new API key");
      },
    });

    if (errors || !insertedKey?.insert_api_key_one) {
      return null;
    }

    return insertedKey?.insert_api_key_one;
  };

  const [updateKeyMutation] = useUpdateKeyMutation();

  const updateKey = async (variables: UpdateKeyMutationVariables) => {
    const { data: updatedKey, errors } = await updateKeyMutation({
      variables,
      refetchQueries: [{ query: FetchKeysDocument }],

      onCompleted: (data) => {
        if (data?.update_api_key_by_pk) {
          toast.success("API key updated");
        }
      },

      onError: () => {
        toast.error("Failed to update this API key. Please try again.");
      },
    });

    if (errors || !updatedKey?.update_api_key_by_pk) {
      return null;
    }

    return updatedKey?.update_api_key_by_pk;
  };

  const [deleteKeyMutation] = useDeleteKeyMutation();

  const deleteKey = async (id: string) => {
    const { data: deletedKey, errors } = await deleteKeyMutation({
      variables: {
        id,
      },

      refetchQueries: [{ query: FetchKeysDocument }],

      onCompleted: (data) => {
        if (data?.delete_api_key_by_pk) {
          toast.success("API key deleted");
        }
      },

      onError: () => {
        toast.error("Failed to delete API key");
      },
    });

    if (errors || !deletedKey?.delete_api_key_by_pk) {
      return null;
    }

    return deletedKey?.delete_api_key_by_pk;
  };

  const [resetApiKeyMutation] = useResetApiKeyMutation();

  const resetKeySecret = async (id: string) => {
    const { data: keyAfterReset, errors } = await resetApiKeyMutation({
      variables: { id },
      refetchQueries: [{ query: FetchKeysDocument }],

      onCompleted: (data) => {
        if (data?.reset_api_key?.api_key) {
          toast.success(
            "API key has been reset. Save this value now, it will not be shown again!",
            {
              autoClose: 10000,
            }
          );
        }
      },

      onError: (e) => {
        console.error(e);
        toast.error("Failed to reset API key");
      },
    });

    if (errors || !keyAfterReset?.reset_api_key?.api_key) {
      return null;
    }

    return keyAfterReset?.reset_api_key?.api_key;
  };

  return {
    keys: fetchedKeys?.api_key ?? [],
    error,
    isLoading: loading,
    createKey,
    updateKey,
    deleteKey,
    resetKeySecret,
  };
};

export default useKeys;
