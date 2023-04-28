import cn from "classnames";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import { Fragment, memo, MouseEvent as ReactMouseEvent, useState } from "react";
import { InfoField } from "src/scenes/team/KeyList/Key/InfoField";
import { APIKeyModel } from "src/lib/models";
import { Button } from "src/components/Button";
import { Switch } from "src/components/Switch";
import useKeys from "src/hooks/useKeys";
import { toast } from "react-toastify";
import { IKeyStore, useKeyStore } from "src/stores/keyStore";

dayjs.extend(relativeTime);

const getKeyStore = (store: IKeyStore) => ({
  isUpdateKeyModalOpened: store.isUpdateKeyModalOpened,
  setIsUpdateKeyModalOpened: store.setIsUpdateKeyModalOpened,
  isDeleteKeyModalOpened: store.isDeleteKeyModalOpened,
  setIsDeleteKeyModalOpened: store.setIsDeleteKeyModalOpened,
});

export const Key = memo(function Key(props: { apikey: APIKeyModel }) {
  const { currentKey, setCurrentKey, updateKey, keySecret, resetKeySecret } =
    useKeys();
  const { setIsUpdateKeyModalOpened, setIsDeleteKeyModalOpened } =
    useKeyStore(getKeyStore);

  const handleUpdateName = (apikey: APIKeyModel) => {
    setCurrentKey(apikey);
    setIsUpdateKeyModalOpened(true);
  };

  const handleUpdateIsActive = (apikey: APIKeyModel) => {
    setCurrentKey(apikey);
    updateKey({
      id: apikey.id,
      name: apikey.name,
      is_active: !apikey.is_active,
    });
  };

  const handleResetKey = (apikey: APIKeyModel) => {
    setCurrentKey(apikey);
    resetKeySecret();
    toast.success("API Key secret reset successfully");
  };

  const handleRemoveKey = (apikey: APIKeyModel) => {
    setCurrentKey(apikey);
    setIsDeleteKeyModalOpened(true);
  };

  return (
    <Fragment>
      <tr>
        <td>
          <InfoField
            placeholder="Click to set key name"
            value={props.apikey.name}
            onClick={(e) => handleUpdateName(props.apikey)}
          />
        </td>
        <td className="pr-4">
          <div className="break-all">
            {keySecret && keySecret[props.apikey.id]}
          </div>
        </td>
        <td>
          <div>{dayjs(props.apikey.created_at).format("MMM D, YYYY")}</div>
        </td>
        <td className="pr-4">
          <Switch
            checked={props.apikey.is_active}
            toggle={() => handleUpdateIsActive(props.apikey)}
          />
        </td>
        <td>
          <Button
            variant="secondary"
            className="px-4 py-2.5"
            onClick={() => handleResetKey(props.apikey)}
          >
            Reset Key
          </Button>
        </td>
        <td>
          <Button
            variant="danger"
            className="px-4 py-2.5"
            onClick={() => handleRemoveKey(props.apikey)}
          >
            Remove
          </Button>
        </td>
      </tr>
    </Fragment>
  );
});
