"use client";
import { Pagination } from "@/components/Pagination";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useCallback, useEffect, useMemo, useState } from "react";
import { VerifiedRow } from "./VerifiedRow";

export type NullifierItem = {
  id: string;
  updated_at: any;
  nullifier_hash: string;
  uses?: number | null | undefined;
};

export type VerifiedTableColumn = "human" | "uses" | "time";

const getColumnLabel = (column: VerifiedTableColumn): string => {
  switch (column) {
    case "human":
      return "Human";
    case "uses":
      return "Uses";
    case "time":
      return "Time";
  }
};

// This table is just going to be limited to 100 rows to prevent performance issues
export const VerifiedTable = (props: {
  nullifiers: NullifierItem[];
  columns: VerifiedTableColumn[];
}) => {
  const { nullifiers, columns } = props;
  const rowsPerPageOptions = [5, 10, 20]; // Rows per page options
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalResultsCount, setTotalResultsCount] = useState(nullifiers.length);

  const logos = useMemo(
    () => [
      "alien.png",
      "bear.png",
      "cow.png",
      "dinosaur.png",
      "dog.png",
      "dragon.png",
      "exploding_owl.png",
      "exploding_unicorn.png",
      "fox.png",
      "ghost.png",
      "giraffe.png",
      "koala.png",
      "lion.png",
      "love_skull.png",
      "monkey.png",
      "mouse.png",
      "mybskull.png",
      "octopus.png",
      "owl.png",
      "panda.png",
      "pig.png",
      "rabbit.png",
      "rooster.png",
      "shark.png",
      "skull.png",
      "sleeping_cow.png",
      "tiger.png",
      "unicorn.png",
      "wolf.png",
    ],
    [],
  );

  // Update total results count when nullifiers change
  useEffect(() => {
    setTotalResultsCount(nullifiers.length);
  }, [nullifiers]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1); // Reset to first page when rows per page changes
  };

  const _selectImage = useCallback(
    (hash: string) => {
      const hashValue = parseInt(hash.slice(0, 10), 16);
      return logos[hashValue % logos.length];
    },
    [logos],
  );

  const paginatedNullifiers = useMemo(() => {
    if (!nullifiers) {
      return [];
    }

    let filteredNullifiers = nullifiers;

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredNullifiers.slice(startIndex, endIndex);
  }, [nullifiers, currentPage, rowsPerPage]);

  return (
    <div className="flex w-full items-center justify-end">
      <div className="grid w-full gap-y-6">
        <div className="mt-6 flex items-center justify-start gap-x-2">
          <Typography variant={TYPOGRAPHY.H7}>Verified humans</Typography>

          <Typography
            variant={TYPOGRAPHY.R5}
            className="w-8 rounded-xl bg-grey-100 py-1 text-center"
          >
            {nullifiers.length}
          </Typography>
        </div>

        <div className="no-scrollbar w-full overflow-auto">
          <div
            className="grid"
            style={{
              gridTemplateColumns: columns
                .map((c) => (c === "time" ? "min-content" : "auto"))
                .join(" "),
            }}
          >
            <div className="text-left text-xs font-[400] text-grey-400 max-md:flex max-md:justify-between md:contents md:[&>*]:border-b md:[&>*]:border-grey-100">
              {columns.map((column) => (
                <div
                  key={column}
                  className={
                    column === "human"
                      ? "py-3 pr-2 max-md:pl-5"
                      : column === "uses"
                        ? "px-2 py-3 max-md:pr-5"
                        : "py-3 pl-2 max-md:hidden max-md:px-4"
                  }
                >
                  {getColumnLabel(column)}
                </div>
              ))}
            </div>

            <div className="max-md:grid max-md:gap-y-2 md:contents">
              {paginatedNullifiers.map((nullifier, index) => (
                <VerifiedRow
                  nullifier={nullifier}
                  key={index}
                  logo={_selectImage(nullifier.nullifier_hash)}
                  columns={columns}
                />
              ))}
            </div>
          </div>

          <Pagination
            totalResults={totalResultsCount}
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={rowsPerPageOptions}
            handlePageChange={handlePageChange}
            handleRowsPerPageChange={handleRowsPerPageChange}
          />
        </div>
      </div>
    </div>
  );
};
