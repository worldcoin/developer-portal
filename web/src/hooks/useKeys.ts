import { gql } from "@apollo/client";
import { useRouter } from "next/router";
import { useEffect } from "react";
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
  query FetchKey(id: String!) {
    api_key(where: {id: {_eq: $id}}) {
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
    // keys,
    currentKey,
    currentSecret,
    // setKeys,
    setCurrentKey,
    // setCurrentKeyById,
    setCurrentSecret,
  } = useKeyStore(getKeyStore, shallow);

  const {
    data: key,
    error: keyError,
    isLoading: keyIsLoading,
  } = useSWR<APIKeyModel | null>(["apiKey", currentKey?.id], fetchKey, {
    onSuccess: (data) => setCurrentKey(data),
  });

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

  const { trigger: resetAPIKey } = useSWRMutation(
    ["redirect", currentKey?.id],
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
    updateKey,

    currentSecret,
    resetAPIKey,
  };
};

export default useKeys;
