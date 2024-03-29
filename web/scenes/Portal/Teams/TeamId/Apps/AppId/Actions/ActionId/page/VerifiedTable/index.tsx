"use client";
import { Table } from "@/components/Table";
import { Body } from "@/components/Table/Body";
import { Footer } from "@/components/Table/Footer";
import { Header } from "@/components/Table/Header";
import { Row } from "@/components/Table/Row";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { VerifiedRow } from "./VerifiedRow";

export type NullifierItem = {
  id: string;
  updated_at: any;
  nullifier_hash: string;
  uses?: number | null | undefined;
};

// Example of how to use this component
export const VerifiedTable = (props: { nullifiers: NullifierItem[] }) => {
  const { nullifiers } = props;
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

  const headers = [
    <span key={0}>Human</span>,
    <span key={1}>Uses</span>,
    <span key={2}>Time</span>,
  ];

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

  const actionsToRender = useMemo(() => {
    if (!nullifiers) {
      return [];
    }

    let filteredNullifiers = nullifiers;

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedNullifiers = filteredNullifiers.slice(startIndex, endIndex);

    return paginatedNullifiers.map(
      (nullifier: NullifierItem, index: number) => {
        return VerifiedRow({
          nullifier: nullifier,
          key: index,
          logo: _selectImage(nullifier.nullifier_hash),
        });
      },
    );
  }, [nullifiers, currentPage, rowsPerPage, _selectImage]);

  return (
    <div className="flex w-full items-center justify-end">
      <div className="grid w-full gap-y-6">
        <div className="flex items-center justify-start gap-x-2">
          <Typography variant={TYPOGRAPHY.H7}>Verified humans</Typography>
          <Typography
            variant={TYPOGRAPHY.R5}
            className="w-8 rounded-xl bg-grey-100 py-1 text-center"
          >
            {nullifiers.length}
          </Typography>
        </div>
        <div className="no-scrollbar w-full overflow-auto">
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
              {actionsToRender.map((rowData: ReactNode[], index: number) => {
                return <Row row={rowData} key={index} />;
              })}
            </Body>
          </Table>
        </div>
      </div>
    </div>
  );
};
