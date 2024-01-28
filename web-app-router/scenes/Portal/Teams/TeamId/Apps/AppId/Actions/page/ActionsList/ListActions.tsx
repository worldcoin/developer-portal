"use client";
import { TableComponent } from "@/components/Table";
import { useMemo, useState } from "react";
import { ActionRow } from "./ActionRow";
import { DecoratedButton } from "@/components/DecoratedButton";
import { useForm, useWatch } from "react-hook-form";
import { Input } from "@/components/Input";

// Example of how to use this component
export const ListActions = (props: { actions: any }) => {
  const { actions } = props;
  const headers = [<span key={0}>Name</span>, <span key={1}>Uses</span>, null];
  const totalResults = actions.length;
  const rowsPerPageOptions = [10, 20]; // Rows per page options
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const { register, control } = useForm<{ actionSearch: string }>({
    mode: "onChange",
  });

  const paginatedActions = actions.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  const rows = paginatedActions.map((action: any, index: number) => {
    return ActionRow({ action: action, key: index });
  });

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1); // Reset to first page when rows per page changes
  };

  const actionsSearch = useWatch({
    control,
    name: "actionSearch",
  });

  const actionsToRender = useMemo(() => {
    if (!actions) {
      return [];
    }

    let filteredActions = actions;

    if (actionsSearch) {
      const fieldsToSearch = ["name", "description", "action"] as const;
      filteredActions = filteredActions.filter((action: any) => {
        return fieldsToSearch.some((field) => {
          return action[field]
            ?.toLowerCase()
            .includes(actionsSearch.toLowerCase());
        });
      });
    }

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedActions = filteredActions.slice(startIndex, endIndex);

    return paginatedActions.map((action: any, index: number) => {
      return ActionRow({ action: action, key: index });
    });
  }, [actions, actionsSearch, currentPage, rowsPerPage]);

  // TODO: Add a search bar
  return (
    <div className="flex items-center justify-center w-full p-10 ">
      <div className="max-w-[1180px] w-full grid gap-2">
        <div className="grid gap-2 text-grey-900 font-[550]">
          <h1 className="text-2xl">Incognito Actions</h1>
          <p className="text-grey-500 text-base font-[400] ">
            Allow users to verify that they are a unique person without
            revealing their identity
          </p>
        </div>
        <div className="flex w-full justify-between items-center">
          <Input
            register={register("actionSearch")}
            label=""
            placeholder="Search actions by name"
            className="w-inputLarge pt-2"
          />
          <DecoratedButton className="h-12" href="?createAction=true">
            New action
          </DecoratedButton>
        </div>
        <div className="w-full max-h-[400px] overflow-auto">
          <TableComponent
            headers={headers}
            rows={actionsToRender}
            totalResults={actionsToRender?.length ?? 0}
            rowsPerPageOptions={rowsPerPageOptions}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </div>
      </div>
    </div>
  );
};
