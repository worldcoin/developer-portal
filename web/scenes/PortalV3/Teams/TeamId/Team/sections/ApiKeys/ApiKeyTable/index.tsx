"use client";
import { useCallback, useState } from "react";
import { FetchKeysQuery } from "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/graphql/client/fetch-keys.generated";
import { ApiKeyRow } from "./ApiKeyRow";
import { DeleteKeyModal } from "./DeleteKeyModal";
import { ApiKeysTableHeader } from "./TableHeader";
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

      <div
        role="table"
        aria-label="API keys"
        className="overflow-hidden rounded-[10px] border border-portal-border bg-white"
      >
        <ApiKeysTableHeader />

        <div
          role="rowgroup"
          className="max-h-[240px] [scrollbar-width:thin] overflow-y-auto"
        >
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
    </div>
  );
};
