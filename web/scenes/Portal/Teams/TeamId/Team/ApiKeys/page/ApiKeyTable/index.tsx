"use client";
import { useCallback, useMemo, useState } from "react";
import { FetchKeysQuery } from "../graphql/client/fetch-keys.generated";
import { ApiKeyRow } from "./ApiKeyRow";
import { DeleteKeyModal } from "./DeleteKeyModal";
import { ViewDetailsModal } from "./ViewDetailsModal";
import { TYPOGRAPHY, Typography } from "@/components/Typography";

type ApiKeysTableProps = {
  teamId?: string;
  apiKeys?: FetchKeysQuery["api_key"];
};

type ApiKeyRowType = {
  apiKey: FetchKeysQuery["api_key"][0];
  openViewDetails: (key: FetchKeysQuery["api_key"][0]) => void;
};

export const ApiKeysTable = (props: ApiKeysTableProps) => {
  const { teamId, apiKeys } = props;
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

  const apiKeysToRender = useMemo(() => {
    if (!apiKeys) {
      return [];
    }

    return apiKeys.map(
      (apiKey: FetchKeysQuery["api_key"][0]): ApiKeyRowType => {
        return {
          openViewDetails: openViewDetails,
          apiKey: apiKey,
        };
      },
    );
  }, [apiKeys, openViewDetails]);

  return (
    <div className="w-full md:pb-16">
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

      <div className="md:table md:w-full">
        <div className="hidden text-grey-400 md:table-row">
          <div className="md:table-cell md:border-b md:border-grey-200 md:py-3">
            <Typography variant={TYPOGRAPHY.R5} as="div">
              Name
            </Typography>
          </div>

          <div className="md:table-cell md:border-b md:border-grey-200 md:py-3">
            <Typography variant={TYPOGRAPHY.R5} as="div">
              API Key
            </Typography>
          </div>

          <div className="md:table-cell md:border-b md:border-grey-200 md:py-3">
            <Typography variant={TYPOGRAPHY.R5} as="div">
              Created
            </Typography>
          </div>

          <div className="md:table-cell md:border-b md:border-grey-200 md:py-3">
            <Typography variant={TYPOGRAPHY.R5} as="div">
              Status
            </Typography>
          </div>

          <div className="md:table-cell md:border-b md:border-grey-200 md:py-3" />
        </div>

        <div className="max-md:grid max-md:gap-y-2 md:contents">
          {apiKeysToRender.map((rowData: any, index: number) => {
            return (
              <ApiKeyRow
                apiKey={rowData.apiKey}
                index={index}
                key={`api_key_row_${index}`}
                teamId={teamId ?? ""}
                openViewDetails={openViewDetails}
                openDeleteKeyModal={openDeleteKeyModal}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
