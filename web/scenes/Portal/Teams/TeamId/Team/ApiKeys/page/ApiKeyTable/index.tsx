"use client";
import { Table } from "@/components/Table";
import { Body } from "@/components/Table/Body";
import { Footer } from "@/components/Table/Footer";
import { Header } from "@/components/Table/Header";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  const rowsPerPageOptions = [10, 20]; // Rows per page options
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedKey, setSelectedKey] = useState<
    FetchKeysQuery["api_key"][0] | null
  >(null);

  const [showViewDetailsModal, setShowViewDetailsModal] = useState(false);
  const [showDeleteKeyModal, setShowDeleteKeyModal] = useState(false);
  const [totalResultsCount, setTotalResultsCount] = useState(
    apiKeys?.length ?? 0,
  );

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

  useEffect(() => {
    setTotalResultsCount(apiKeys?.length ?? 0);
  }, [apiKeys?.length]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1); // Reset to first page when rows per page changes
  };

  const apiKeysToRender = useMemo(() => {
    if (!apiKeys) {
      return [];
    }

    let filteredApiKeys = apiKeys;

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedNullifiers = filteredApiKeys.slice(startIndex, endIndex);

    return paginatedNullifiers.map(
      (apiKey: FetchKeysQuery["api_key"][0]): ApiKeyRowType => {
        return {
          openViewDetails: openViewDetails,
          apiKey: apiKey,
        };
      },
    );
  }, [apiKeys, currentPage, rowsPerPage, openViewDetails]);

  return (
    <div className="no-scrollbar w-full overflow-auto pb-16">
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

        <div className="max-md:grid md:contents">
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

      <div className="max-md:hidden">
        <Footer
          totalResults={totalResultsCount}
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={rowsPerPageOptions}
          handlePageChange={handlePageChange}
          handleRowsPerPageChange={handleRowsPerPageChange}
        />
      </div>
    </div>
  );
};
