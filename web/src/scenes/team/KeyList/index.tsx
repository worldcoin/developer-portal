import { Icon } from "@/components/Icon";
import { Fragment, memo } from "react";
import { APIKeyModel } from "src/lib/models";
import { Key } from "./Key";
import { Button } from "src/components/Button";
import { DeleteKey } from "./DeleteKey";
import { NewKey } from "./NewKey";
import { IKeyStore, useKeyStore } from "src/stores/keyStore";
import { UpdateKey } from "./UpdateKey";
import { FetchKeysQuery } from "src/hooks/useKeys/graphql/fetch-keys.generated";

export interface KeyListProps {
  keys: FetchKeysQuery["api_key"];
}

const getKeyStore = (store: IKeyStore) => ({
  isNewKeyModalOpened: store.isNewKeyModalOpened,
  setIsNewKeyModalOpened: store.setIsNewKeyModalOpened,
});

export const KeyList = memo(function KeyList(props: KeyListProps) {
  const { setIsNewKeyModalOpened } = useKeyStore(getKeyStore);

  return (
    <div>
      <NewKey />
      <UpdateKey />
      <DeleteKey />

      <div className="flex justify-between text-14 mt-4">
        <div className="space-x-2">
          <span className="text-14 font-medium">API keys</span>

          <span className="bg-ebecef py-1 px-1.5 rounded-[4px]">
            {props.keys.length}
          </span>
        </div>

        <Button
          className="py-3.5 px-8 uppercase"
          onClick={() => setIsNewKeyModalOpened(true)}
        >
          Create New Key
        </Button>
      </div>
      <div>
        <table className="w-full max-w-full">
          <thead>
            <tr>
              <th className="w-1/5 pb-2 whitespace-nowrap text-12 text-left border-b border-f3f4f5">
                Name
              </th>
              <th className="w-1/3 pb-2 whitespace-nowrap text-12 text-left border-b border-f3f4f5">
                API Key
              </th>
              <th className="w-1/6 pb-2 whitespace-nowrap text-12 text-left border-b border-f3f4f5">
                Created
              </th>
              <th className="pb-2 pr-4 whitespace-nowrap text-12 text-left border-b border-f3f4f5">
                Status
              </th>
              <th className="pb-2 whitespace-nowrap border-b border-f3f4f5" />
              <th className="pb-2 whitespace-nowrap border-b border-f3f4f5" />
            </tr>
          </thead>
          {props.keys && props.keys?.length === 0 && (
            <tbody>
              <tr>
                <td className="pt-8 pb-4 text-center" colSpan={5}>
                  <div className="relative h-[182px] flex flex-col items-center justify-center bg-center bg-[url('/images/empty-actions.svg')]">
                    <Icon name="api" className="w-6 h-6" />
                    <div className="mt-4 font-sora font-semibold text-14 leading-4">
                      This team has no API keys yet
                    </div>
                    <div className="mt-1.5 text-12 text-657080 leading-4">
                      Try adding one to get started
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          )}
          {props.keys &&
            props.keys?.length > 0 &&
            props.keys.map((apikey) => (
              <Fragment key={apikey.id}>
                <tbody>
                  <tr>
                    <td className="h-4" />
                  </tr>
                </tbody>
                <Key apikey={apikey} />
              </Fragment>
            ))}
        </table>
      </div>
    </div>
  );
});
