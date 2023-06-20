import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Fragment, memo, useCallback, useEffect, useState } from "react";
import { InfoField } from "src/scenes/team/KeyList/Key/InfoField";
import { Button } from "src/components/Button";
import { Switch } from "src/components/Switch";
import useKeys from "src/hooks/useKeys";
import { IKeyStore, useKeyStore } from "src/stores/keyStore";
import { FetchKeysQuery } from "src/hooks/useKeys/graphql/fetch-keys.generated";

dayjs.extend(relativeTime);

const getKeyStore = (store: IKeyStore) => ({
  setCurrentKey: store.setCurrentKey,
  isUpdateKeyModalOpened: store.isUpdateKeyModalOpened,
  setIsUpdateKeyModalOpened: store.setIsUpdateKeyModalOpened,
  isDeleteKeyModalOpened: store.isDeleteKeyModalOpened,
  setIsDeleteKeyModalOpened: store.setIsDeleteKeyModalOpened,
});

export const Key = memo(function Key(props: {
  apikey: FetchKeysQuery["api_key"][number];
}) {
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const { updateKey, resetKeySecret } = useKeys();

  const {
    setCurrentKey,
    setIsUpdateKeyModalOpened,
    setIsDeleteKeyModalOpened,
  } = useKeyStore(getKeyStore);

  const handleUpdateName = useCallback(() => {
    setIsUpdateKeyModalOpened(true);
    setCurrentKey(props.apikey);
  }, [props.apikey, setCurrentKey, setIsUpdateKeyModalOpened]);

  const handleUpdateIsActive = useCallback(
    () =>
      updateKey({
        id: props.apikey.id,
        name: props.apikey.name,
        is_active: !props.apikey.is_active,
      }),
    [props.apikey.id, props.apikey.is_active, props.apikey.name, updateKey]
  );

  const handleResetKey = useCallback(async () => {
    const key = await resetKeySecret(props.apikey.id);
    setSecretKey(key);
  }, [props.apikey.id, resetKeySecret]);

  const handleRemoveKey = useCallback(() => {
    setIsDeleteKeyModalOpened(true);
    setCurrentKey(props.apikey);
  }, [props.apikey, setCurrentKey, setIsDeleteKeyModalOpened]);

  return (
    <Fragment>
      <tr>
        <td>
          <InfoField
            placeholder="Click to set key name"
            value={props.apikey.name}
            onClick={handleUpdateName}
          />
        </td>
        <td className="pr-4">
          <div className="break-all">
            {secretKey ??
              "api_" + btoa(props.apikey.id).substring(0, 10) + "..."}
          </div>
        </td>
        <td>
          <div>{dayjs(props.apikey.created_at).format("MMM D, YYYY")}</div>
        </td>
        <td className="pr-4">
          <Switch
            checked={props.apikey.is_active}
            toggle={handleUpdateIsActive}
          />
        </td>
        <td>
          <Button
            variant="secondary"
            className="px-4 py-2.5"
            onClick={handleResetKey}
          >
            Reset Key
          </Button>
        </td>
        <td>
          <Button
            variant="danger"
            className="px-4 py-2.5"
            onClick={handleRemoveKey}
          >
            Remove
          </Button>
        </td>
      </tr>
    </Fragment>
  );
});
