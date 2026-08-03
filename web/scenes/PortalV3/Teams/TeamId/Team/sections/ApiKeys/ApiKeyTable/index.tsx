"use client";
import { useCallback, useState } from "react";
import { FetchKeysQuery } from "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/graphql/client/fetch-keys.generated";
import { ApiKeyRow } from "./ApiKeyRow";
import { DeleteKeyModal } from "./DeleteKeyModal";
import { ViewDetailsModal } from "./ViewDetailsModal";

type ApiKeysTableProps = {
  teamId?: string;
  apiKeys?: FetchKeysQuery["api_key"];
  openRotateKeyModal: (key: FetchKeysQuery["api_key"][0]) => void;
};

export const ApiKeysTable = (props: ApiKeysTableProps) => {
  const { teamId, apiKeys, openRotateKeyModal } = props;
  const [selectedKey, setSelectedKey] = useState<
    FetchKeysQuery["api_key"][0] | null
  >(null);

  const [showViewDetailsModal, setShowViewDetailsModal] = useState(false);
  const [showDeleteKeyModal, setShowDeleteKeyModal] = useState(false);

  const openViewDetails = useCallback(
    (key: FetchKeysQuery["api_key"][0]) => {
      setSelectedKey(key);
      setShowViewDetailsModal(true);
    },
    [setSelectedKey, setShowViewDetailsModal],
  );

  const openDeleteKeyModal = useCallback(
    (key: FetchKeysQuery["api_key"][0]) => {
      setSelectedKey(key);
      setShowDeleteKeyModal(true);
    },
    [setShowDeleteKeyModal, setSelectedKey],
  );

  return (
    <div className="w-full">
      <ViewDetailsModal
        teamId={teamId}
        isOpen={showViewDetailsModal}
        setIsOpen={setShowViewDetailsModal}
        keyId={selectedKey?.id}
        name={selectedKey?.name}
        isActive={selectedKey?.is_active ?? false}
      />

      <DeleteKeyModal
        isOpen={showDeleteKeyModal}
        setIsOpen={setShowDeleteKeyModal}
        teamId={teamId}
        keyId={selectedKey?.id}
        name={selectedKey?.name}
      />

      <div className="grid grid-cols-[minmax(0,1fr)_80px_32px] items-center gap-3 border-y border-grey-100 bg-grey-25 px-5 py-2.5 font-gta text-12 leading-4 text-grey-400">
        <span>Name</span>
        <span>Status</span>
        <span aria-hidden="true" />
      </div>

      <div className="max-h-[229px] [scrollbar-width:thin] overflow-y-auto">
        {apiKeys?.map((apiKey, index) => (
          <ApiKeyRow
            apiKey={apiKey}
            index={index}
            key={apiKey.id}
            teamId={teamId ?? ""}
            openViewDetails={openViewDetails}
            openDeleteKeyModal={openDeleteKeyModal}
            openRotateKeyModal={openRotateKeyModal}
          />
        ))}
      </div>
    </div>
  );
};
