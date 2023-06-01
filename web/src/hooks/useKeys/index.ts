import { useRouter } from "next/router";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { IKeyStore, useKeyStore } from "src/stores/keyStore";
import { shallow } from "zustand/shallow";

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

const getKeyStore = (store: IKeyStore) => ({
  keys: store.keys,
  currentKey: store.currentKey,
  keySecret: store.keySecret,
  setKeys: store.setKeys,
  setCurrentKey: store.setCurrentKey,
  setCurrentKeyById: store.setCurrentKeyById,
  setKeySecret: store.setKeySecret,
});

const useKeys = () => {
  const {
    currentKey,
    keySecret,
    setKeys,
    setCurrentKey,
    // setCurrentKeyById,
    setKeySecret,
  } = useKeyStore(getKeyStore, shallow);

  const {
    data: fetchedKeys,
    error,
    loading,
  } = useFetchKeysQuery({
    onCompleted: (data) => {
      if (data?.api_key && data?.api_key.length) {
        setKeys(data?.api_key);
        setCurrentKey(data.api_key[0]);
      }
    },
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
          setCurrentKey(data.insert_api_key_one);
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
        toast.error("Failed to update API key");
      },
    });

    if (errors || !updatedKey?.update_api_key_by_pk) {
      return null;
    }

    return updatedKey?.update_api_key_by_pk;
  };

  const [deleteKeyMutation] = useDeleteKeyMutation();

  const deleteKey = async () => {
    if (!currentKey) {
      return null;
    }

    const { data: deletedKey, errors } = await deleteKeyMutation({
      variables: {
        id: currentKey?.id,
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

  const resetKeySecret = async () => {
    if (!currentKey) {
      return null;
    }

    const { data: keyAfterReset, errors } = await resetApiKeyMutation({
      variables: { id: currentKey?.id },
      refetchQueries: [{ query: FetchKeysDocument }],

      onCompleted: (data) => {
        if (data?.reset_api_key?.api_key) {
          const newKeySecret = {
            ...keySecret,
            [currentKey?.id]: data.reset_api_key.api_key,
          };

          setKeySecret(newKeySecret);

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

  const router = useRouter();

  // NOTE: hide API secret on router history change
  useEffect(() => {
    router.events.on("beforeHistoryChange", () => setKeySecret({}));
  }, [router.events, setKeySecret]);

  return {
    keys: fetchedKeys?.api_key ?? [],
    error,
    isLoading: loading,
    createKey,
    updateKey,
    deleteKey,

    currentKey,
    setCurrentKey,
    keySecret,
    resetKeySecret,
  };
};

export default useKeys;
