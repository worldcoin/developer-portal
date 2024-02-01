"use client";
import { Table } from "@/components/Table";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { VerifiedRow } from "./VerifiedRow";
import { Footer } from "@/components/Table/Footer";
import { Header } from "@/components/Table/Header";
import { Body } from "@/components/Table/Body";
import { Row } from "@/components/Table/Row";

export type NullifierItem = {
  id: string;
  updated_at: any;
  nullifier_hash: string;
  uses?: number | null | undefined;
};

// Example of how to use this component
export const VerifiedTable = (props: { nullifiers: NullifierItem[] }) => {
  const { nullifiers } = props;
  const rowsPerPageOptions = [10, 20]; // Rows per page options
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
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
    []
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
    [logos]
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
      }
    );
  }, [nullifiers, currentPage, rowsPerPage, _selectImage]);

  return (
    <div className="flex items-center justify-end w-full">
      <div className="w-full grid gap-y-6">
        <div className="flex justify-start items-center gap-x-2">
          <h1 className="text-lg text-grey-900 font-[550]">Verified humans</h1>
          <p className="bg-grey-100 w-8 py-1 text-center rounded-xl text-xs">
            {nullifiers.length}
          </p>
        </div>
        <div className="w-full max-h-[380px] overflow-auto no-scrollbar">
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
