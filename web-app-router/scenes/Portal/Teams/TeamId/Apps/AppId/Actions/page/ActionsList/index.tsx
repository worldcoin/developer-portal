"use client";
import { Table } from "@/components/Table";
import { Body } from "@/components/Table/Body";
import { Row } from "@/components/Table/Row";
import { Footer } from "@/components/Table/Footer";
import { Header } from "@/components/Table/Header";
import { ReactNode, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ActionRow } from "./ActionRow";
import { DecoratedButton } from "@/components/DecoratedButton";
import { SearchIcon } from "@/components/Icons/SearchIcon";
import { Input } from "@/components/Input";
import clsx from "clsx";
import { usePathname, useRouter } from "next/navigation";
import { TYPOGRAPHY, Typography } from "@/components/Typography";

type ActionRow = {
  cells: ReactNode[];
  id: string;
};

export const ActionsList = (props: { actions: any; className: string }) => {
  const { actions, className } = props;
  const pathName = usePathname() ?? "";
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalResultsCount, setTotalResultsCount] = useState(actions.length);
  const rowsPerPageOptions = [10, 20]; // Rows per page options
  const headers = [<span key={0}>Name</span>, <span key={1}>Uses</span>, null];

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

      filteredActions = filteredActions.filter((action: any) => {
        return fieldsToSearch.some((field) => {
          return action[field]
            ?.toLowerCase()
            .includes(actionsSearch.toLowerCase());
        });
      });
    }

    setTotalResultsCount(filteredActions.length);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedActions = filteredActions.slice(startIndex, endIndex);

    return paginatedActions.map((action: any, index: number) => {
      return {
        cells: ActionRow({ action: action, key: index, pathName: pathName }),
        id: action.id,
      };
    });
  }, [actions, actionsSearch, currentPage, pathName, rowsPerPage]);

  return (
    <div
      className={clsx(
        "flex items-center justify-center w-full py-10 max-h-full",
        className,
      )}
    >
      <div className=" w-full grid gap-y-5">
        <div className="grid gap-2 text-grey-900 font-[550]">
          <Typography variant={TYPOGRAPHY.H6} className="text-2xl">
            Incognito Actions
          </Typography>
          <Typography variant={TYPOGRAPHY.R3} className="text-grey-500 ">
            Allow users to verify that they are a unique person without
            revealing their identity
          </Typography>
        </div>
        <div className="grid md:grid-cols-1fr/auto w-full justify-between items-center mt-5 gap-x-2 grid-cols-1 gap-y-2">
          <Input
            register={register("actionSearch")}
            label=""
            placeholder="Search actions by name"
            className="max-w-136 pt-2 text-base"
            addOnLeft={<SearchIcon className="mx-2 text-grey-400" />}
          />
          <DecoratedButton className="h-12 w-36" href="?createAction=true">
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
                      router.push(`${pathName}/${rowData.id}`)
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
