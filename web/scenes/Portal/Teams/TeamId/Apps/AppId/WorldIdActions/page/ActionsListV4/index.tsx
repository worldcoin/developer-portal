"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { SearchIcon } from "@/components/Icons/SearchIcon";
import { Input } from "@/components/Input";
import { Pagination } from "@/components/Pagination";
import { Section } from "@/components/Section";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useEffect, useMemo, useState } from "react";
import { ActionRowV4 } from "./ActionRowV4";

import type { GetActionsV4Query } from "../graphql/client/get-actions-v4.generated";

type ActionsListV4Props = {
  actions: GetActionsV4Query["action_v4"];
  onCreateClick: () => void;
};

export const ActionsListV4 = (props: ActionsListV4Props) => {
  const { actions, onCreateClick } = props;
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const rowsPerPageOptions = [10, 25, 50];

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Filter actions based on search query
  const filteredActions = useMemo(
    () =>
      actions.filter((action) =>
        action.action.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [actions, searchQuery],
  );

  // Paginate filtered actions
  const paginatedActions = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredActions.slice(startIndex, endIndex);
  }, [filteredActions, currentPage, rowsPerPage]);

  // Transform actions to match ActionRowV4 props
  const transformedActions = paginatedActions.map((action) => ({
    id: action.id,
    action: action.action,
    description: action.description,
    uses: action.nullifiers_aggregate?.aggregate?.count ?? 0,
    environment: action.environment as "staging" | "production",
  }));

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1); // Reset to first page when rows per page changes
  };

  return (
    <>
      <Section>
        <Section.Header>
          <Section.Header.Title>
            <Typography variant={TYPOGRAPHY.H6}>Actions</Typography>
            <Typography
              as="p"
              variant={TYPOGRAPHY.R3}
              className="text-grey-500"
            >
              Actions are used to request uniqueness proofs
            </Typography>
          </Section.Header.Title>

          <Section.Header.Search className="md:col-span-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              label=""
              placeholder="Search action by identifier"
              className="w-full pt-2 text-base"
              addOnLeft={<SearchIcon className="mx-2 text-grey-400" />}
            />
          </Section.Header.Search>

          <Section.Header.Button className="max-md:!bottom-[4.25rem] md:row-start-1 md:items-start">
            <DecoratedButton
              type="button"
              variant="primary"
              className="h-12 w-[132px]"
              onClick={onCreateClick}
              testId="create-action-v4-list"
              aria-label="Create new action"
            >
              <Typography variant={TYPOGRAPHY.M3} className="whitespace-nowrap">
                New action
              </Typography>
            </DecoratedButton>
          </Section.Header.Button>
        </Section.Header>

        <div className="md:grid md:grid-cols-[700px_1fr]">
          <div className="max-md:grid max-md:grid-cols-2 max-md:border-x max-md:border-transparent max-md:px-4 md:contents">
            <div className="py-3 md:border-b md:border-gray-100">
              <Typography variant={TYPOGRAPHY.R5} className="text-grey-400">
                Identifier
              </Typography>
            </div>

            <div className="py-3 pl-2 max-md:text-end md:border-b md:border-gray-100">
              <Typography variant={TYPOGRAPHY.R5} className="text-grey-400">
                Uses
              </Typography>
            </div>
          </div>

          <div className="max-md:grid max-md:gap-y-2 md:contents">
            {filteredActions.length === 0 ? (
              <div className="col-span-2 flex flex-col items-center justify-center py-10">
                <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
                  {searchQuery
                    ? "No actions found matching your search"
                    : "No actions yet"}
                </Typography>
              </div>
            ) : (
              transformedActions.map((action) => (
                <ActionRowV4 key={action.id} action={action} />
              ))
            )}
          </div>
        </div>
      </Section>

      {/* Pagination */}
      {filteredActions.length > 0 && (
        <Pagination
          totalResults={filteredActions.length}
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={rowsPerPageOptions}
          handlePageChange={handlePageChange}
          handleRowsPerPageChange={handleRowsPerPageChange}
          className="pb-8"
        />
      )}
    </>
  );
};
