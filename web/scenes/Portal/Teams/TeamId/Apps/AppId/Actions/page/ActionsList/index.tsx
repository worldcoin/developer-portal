"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { SearchIcon } from "@/components/Icons/SearchIcon";
import { Input } from "@/components/Input";
import { Table } from "@/components/Table";
import { Body } from "@/components/Table/Body";
import { Footer } from "@/components/Table/Footer";
import { Header } from "@/components/Table/Header";
import { Row } from "@/components/Table/Row";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { EngineType } from "@/lib/types";
import clsx from "clsx";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { GetActionsQuery } from "../graphql/client/actions.generated";
import { ActionRow } from "./ActionRow";

type ActionRow = {
  cells: ReactNode[];
  id: string;
};

export const ActionsList = (props: {
  actions: GetActionsQuery["action"];
  className: string;
  engineType?: string;
}) => {
  const { actions, className, engineType } = props;
  const pathName = usePathname() ?? "";
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalResultsCount, setTotalResultsCount] = useState(actions.length);
  const rowsPerPageOptions = [10, 20]; // Rows per page options
  const headers = [<span key={0}>Name</span>, <span key={1}>Uses</span>, null];

  const isOnChainApp = useMemo(() => {
    return engineType === EngineType.OnChain;
  }, [engineType]);

  const { register, control } = useForm<{ actionSearch: string }>({
    mode: "onChange",
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
      setCurrentPage(1);
      const fieldsToSearch = ["name", "description", "action"] as const;

      filteredActions = filteredActions.filter(
        (action: GetActionsQuery["action"][0]) => {
          return fieldsToSearch.some((field) => {
            return action[field]
              ?.toLowerCase()
              .includes(actionsSearch.toLowerCase());
          });
        },
      );
    }

    setTotalResultsCount(filteredActions.length);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedActions = filteredActions.slice(startIndex, endIndex);

    return paginatedActions.map(
      (action: GetActionsQuery["action"][0], index: number) => {
        return {
          cells: ActionRow({
            action: action,
            key: index,
            pathName: isOnChainApp
              ? `${pathName}/${action.id}/settings`
              : `${pathName}/${action.id}`,
          }),
          id: action.id,
        };
      },
    );
  }, [
    actions,
    actionsSearch,
    currentPage,
    isOnChainApp,
    pathName,
    rowsPerPage,
  ]);

  return (
    <div
      className={clsx(
        "flex max-h-full w-full items-center justify-center py-10",
        className,
      )}
    >
      <div className=" grid w-full gap-y-5">
        <div className="grid gap-2 font-[550] text-grey-900">
          <Typography variant={TYPOGRAPHY.H6} className="text-2xl">
            Incognito Actions
          </Typography>
          <Typography variant={TYPOGRAPHY.R3} className="text-grey-500 ">
            Allow users to verify that they are a unique person without
            revealing their identity
          </Typography>
        </div>
        <div className="mt-5 grid w-full grid-cols-1 items-center justify-between gap-x-2 gap-y-4 md:grid-cols-1fr/auto">
          <Input
            register={register("actionSearch")}
            label=""
            placeholder="Search actions by name"
            className="max-w-136 pt-2 text-base"
            addOnLeft={<SearchIcon className="mx-2 text-grey-400" />}
          />
          <DecoratedButton
            className="h-12 w-full md:w-36"
            href="?createAction=true"
          >
            <Typography variant={TYPOGRAPHY.M3} className="whitespace-nowrap">
              New action
            </Typography>
          </DecoratedButton>
        </div>
        <div className="w-full overflow-auto">
          <Table
            footer={
              <Footer
                totalResults={totalResultsCount}
                currentPage={currentPage}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={rowsPerPageOptions}
                handlePageChange={handlePageChange}
                handleRowsPerPageChange={handleRowsPerPageChange}
              />
            }
          >
            <Header headers={headers} />
            <Body>
              {actionsToRender.map((rowData: ActionRow, index: number) => {
                return (
                  <Row
                    row={rowData.cells}
                    key={index}
                    handleOnClick={() =>
                      router.push(
                        isOnChainApp
                          ? `${pathName}/${rowData.id}/settings`
                          : `${pathName}/${rowData.id}`,
                      )
                    }
                    className="cursor-pointer"
                  />
                );
              })}
            </Body>
          </Table>
        </div>
      </div>
    </div>
  );
};
