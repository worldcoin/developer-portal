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
    api_key
    name
`;

const FetchKeyQuery = gql`
  query FetchKey($id: String!) {
    api_key(where: {id: {_eq: $id}}) {
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
  mutation UpdateAction($id: String!, $status: String!) {
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
  mutation ResetAPIKey($key_id: String!) {
    reset_api_key(key_id: $key_id) {
      api_key
    }
  }
`;

const fetchKey = async (_key: [string, string | undefined]) => {
  const currentKey = useKeyStore.getState().currentKey;

  if (!currentKey) {
    return null;
  }

  const response = await graphQLRequest<{
    key: Array<APIKeyModel>;
  }>({
    query: FetchKeyQuery,
    variables: {
      id: currentKey.id,
    },
  });

  return response.data?.key?.[0] ?? null;
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
  const { is_active } = args.arg;
  const currentKey = useKeyStore.getState().currentKey;

  if (!currentKey) {
    return null;
  }

  const response = await graphQLRequest<{
    update_api_key_by_pk: APIKeyModel;
  }>({
    query: UpdateKeyMutation,
    variables: {
      id: currentKey.id,
      name: currentKey.name,
      is_active: is_active,
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
    api_key: Pick<APIKeyModel, "id">;
  }>({
    query: DeleteKeyQuery,
    variables: { id },
  });
  if (response.data?.api_key) {
    return response.data?.api_key;
  }
  throw Error("Could not delete API key");
};

const resetAPIKeyFetcher = async (_key: [string, string | undefined]) => {
  const currentKey = useKeyStore.getState().currentKey;

  if (!currentKey) {
    return null;
  }

  const response = await graphQLRequest<{
    reset_api_key: { api_key: string };
  }>({
    query: ResetAPIKeyMutation,
    variables: { key_id: currentKey.id },
  });

  if (response.data?.reset_api_key.api_key) {
    return response.data.reset_api_key.api_key;
  }

  throw new Error("Failed to reset API key.");
};

const getKeyStore = (store: IKeyStore) => ({
  keys: store.keys,
  currentKey: store.currentKey,
  currentSecret: store.currentSecret,
  setKeys: store.setKeys,
  setCurrentKey: store.setCurrentKey,
  setCurrentKeyById: store.setCurrentKeyById,
  setCurrentSecret: store.setCurrentSecret,
});

const useKeys = () => {
  const {
    keys,
    currentKey,
    currentSecret,
    setKeys,
    setCurrentKey,
    setCurrentKeyById,
    setCurrentSecret,
  } = useKeyStore(getKeyStore, shallow);

  const {
    data: key,
    error: keyError,
    isLoading: keyIsLoading,
  } = useSWR<APIKeyModel | null>(["apiKey", currentKey?.id], fetchKey, {
    onSuccess: (data) => setCurrentKey(data),
  });

  const onInsertSuccess = useCallback(
    (data: APIKeyModel) => {
      if (data) {
        setKeys([data]);
        toast.success("API key created");
      }
    },
    [setKeys]
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
          setCurrentKey(data);
        }
      },
    }
  );

  const deleteKeyMutation = useSWRMutation("app", deleteKeyFetcher, {
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

  const { trigger: resetAPIKey } = useSWRMutation(
    ["apiKey", currentKey?.id],
    resetAPIKeyFetcher,
    {
      onSuccess: (apiKey) => {
        if (apiKey) {
          setCurrentSecret(apiKey);
          toast.success("API key has been reset");
        }
      },
    }
  );

  const router = useRouter();

  // NOTE: hide API secret on router history change
  useEffect(() => {
    router.events.on("beforeHistoryChange", () => setCurrentSecret(null));
  }, [router.events, setCurrentSecret]);

  return {
    key,
    keyError,
    keyIsLoading,
    createKey,
    updateKey,
    deleteKey,

    currentSecret,
    resetAPIKey,
  };
};

export default useKeys;
