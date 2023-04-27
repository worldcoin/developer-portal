import { gql } from "@apollo/client";
import { useRouter } from "next/router";
import { useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import { graphQLRequest } from "src/lib/frontend-api";
import { APIKeyModel } from "src/lib/models";
import { IKeyStore, useKeyStore } from "src/stores/keyStore";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { shallow } from "zustand/shallow";

const keyFields = `
    id
    team_id
    created_at
    updated_at
    is_active
    name
`;

const FetchKeysQuery = gql`
  query FetchKeys {
    api_key(order_by: { created_at: asc }) {
      ${keyFields}
    }
  }
`;

const InsertKeyQuery = gql`
  mutation InsertKey($object: api_key_insert_input!) {
    insert_api_key_one(object: $object) {
      ${keyFields}
    }
  }
`;

const UpdateKeyMutation = gql`
  mutation UpdateKey($id: String!, $name: String!, $is_active: Boolean!) {
    update_api_key_by_pk(pk_columns: {id: $id}, _set: {name: $name, is_active: $is_active}) {
      ${keyFields}
    }
  }
`;

const DeleteKeyQuery = gql`
  mutation DeleteKey($id: String!) {
    delete_api_key_by_pk(id: $id) {
      id
    }
  }
`;

const ResetAPIKeyMutation = gql`
  mutation ResetAPIKey($id: String!) {
    reset_api_key(id: $id) {
      api_key
    }
  }
`;

const fetchKeys = async () => {
  const response = await graphQLRequest<{
    api_key: Array<APIKeyModel>;
  }>({
    query: FetchKeysQuery,
  });

  if (response.data?.api_key.length) {
    return response.data.api_key;
  }
  return [];
};

type NewKeyPayload = Pick<APIKeyModel, "name">;

const insertKeyFetcher = async (_key: string, args: { arg: NewKeyPayload }) => {
  const { name } = args.arg;

  const response = await graphQLRequest<{
    insert_api_key_one: APIKeyModel;
  }>({
    query: InsertKeyQuery,
    variables: {
      object: {
        name,
      },
    },
  });

  if (response.data?.insert_api_key_one) {
    return response.data.insert_api_key_one;
  }

  throw new Error("Failed to insert API key");
};

const updateKeyFetcher = async (
  _key: [string, string | undefined],
  args: {
    arg: {
      id: APIKeyModel["id"];
      name: APIKeyModel["name"];
      is_active: APIKeyModel["is_active"];
    };
  }
) => {
  const { id, name, is_active } = args.arg;
  const currentKey = useKeyStore.getState().currentKey;

  if (!currentKey) {
    return null;
  }

  const response = await graphQLRequest<{
    update_api_key_by_pk: APIKeyModel;
  }>({
    query: UpdateKeyMutation,
    variables: {
      id,
      name,
      is_active,
    },
  });

  if (response.data?.update_api_key_by_pk) {
    return response.data.update_api_key_by_pk;
  }

  throw new Error("Failed to update API key");
};

const deleteKeyFetcher = async (
  _key: string,
  args: {
    arg: {
      id: APIKeyModel["id"];
    };
  }
) => {
  const { id } = args.arg;
  const response = await graphQLRequest<{
    delete_api_key_by_pk: Pick<APIKeyModel, "id">;
  }>({
    query: DeleteKeyQuery,
    variables: { id },
  });
  if (response.data?.delete_api_key_by_pk) {
    return response.data?.delete_api_key_by_pk;
  }
  throw Error("Could not delete API key");
};

const resetKeySecretFetcher = async (_key: [string, string | undefined]) => {
  const currentKey = useKeyStore.getState().currentKey;

  if (!currentKey) {
    return null;
  }

  const response = await graphQLRequest<{
    reset_api_key: { api_key: string };
  }>({
    query: ResetAPIKeyMutation,
    variables: { id: currentKey.id },
  });

  if (response.data?.reset_api_key.api_key) {
    return response.data.reset_api_key.api_key;
  }

  throw new Error("Failed to reset API key.");
};

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
    keys,
    currentKey,
    keySecret,
    setKeys,
    setCurrentKey,
    // setCurrentKeyById,
    setKeySecret,
  } = useKeyStore(getKeyStore, shallow);

  const { data, error, isLoading } = useSWR<Array<APIKeyModel>>(
    "apiKey",
    fetchKeys,
    {
      onSuccess: (data) => {
        if (data.length) {
          setKeys(data);
          setCurrentKey(data[0]); // DEBUG
        }
      },
    }
  );

  const onInsertSuccess = useCallback(
    (data: APIKeyModel) => {
      if (data) {
        setKeys([...keys, data]);
        toast.success("API key created");
      }
    },
    [keys, setKeys]
  );

  const insertKeyMutation = useSWRMutation("apiKey", insertKeyFetcher, {
    onSuccess: onInsertSuccess,
    onError: () => {
      toast.error("Failed to create new API key");
    },
  });

  const createKey = useCallback(
    async (data: NewKeyPayload) => {
      return await insertKeyMutation.trigger(data);
    },
    [insertKeyMutation]
  );

  const { trigger: updateKey } = useSWRMutation(
    ["apiKey", currentKey?.id],
    updateKeyFetcher,
    {
      onSuccess: (data) => {
        if (data) {
          const newKeys = keys.map((key) => (key.id === data.id ? data : key));

          setKeys(newKeys);
        }
      },
    }
  );

  const deleteKeyMutation = useSWRMutation("apiKey", deleteKeyFetcher, {
    onSuccess: (data) => {
      if (data) {
        setCurrentKey(null);
        toast.success("API key deleted");
      }
    },
  });

  const deleteKey = useCallback(() => {
    if (!currentKey) {
      return;
    }
    return deleteKeyMutation.trigger({
      id: currentKey.id,
    });
  }, [currentKey, deleteKeyMutation]);

  const { trigger: resetKeySecret } = useSWRMutation(
    ["apiKey", currentKey?.id],
    resetKeySecretFetcher,
    {
      onSuccess: (apiKey) => {
        if (apiKey) {
          setKeySecret(apiKey);
          toast.success("API key has been reset");
        }
      },
    }
  );

  const router = useRouter();

  // NOTE: hide API secret on router history change
  useEffect(() => {
    router.events.on("beforeHistoryChange", () => setKeySecret(null));
  }, [router.events, setKeySecret]);

  return {
    keys: data,
    error,
    isLoading,
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
