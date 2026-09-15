import { formatDistanceToNowStrict } from "date-fns";
import { NullifierItem, VerifiedTableColumn } from "../index";

import { TYPOGRAPHY, Typography } from "@/components/Typography";
import Image from "next/image";
import React from "react";

export const VerifiedRow = (props: {
  nullifier: NullifierItem;
  logo: string;
  columns: VerifiedTableColumn[];
  showIcon: boolean;
}) => {
  const { nullifier, logo, columns, showIcon } = props;
  const timeAgo = formatDistanceToNowStrict(new Date(nullifier.updated_at), {
    addSuffix: true,
  });

  const renderColumn = (column: VerifiedTableColumn) => {
    switch (column) {
      case "human":
        return (
          <div className="group flex flex-row items-center gap-x-4">
            {showIcon ? (
              <Image
                src={`/avatars/${logo}`}
                alt="user"
                width={48}
                height={48}
              />
            ) : null}

            <div className="flex flex-col text-ellipsis">
              <Typography
                className="text-content-strong"
                variant={TYPOGRAPHY.R3}
              >{`${nullifier.nullifier_hash.slice(0, 10)}...${nullifier.nullifier_hash.slice(-8)}`}</Typography>

              <Typography
                className="block text-content-secondary md:hidden"
                variant={TYPOGRAPHY.R4}
              >
                {timeAgo}
              </Typography>
            </div>
          </div>
        );

      case "uses":
        return (
          <div className="grid items-center text-content-secondary max-md:text-end md:px-2">
            <Typography variant={TYPOGRAPHY.R4}>{nullifier.uses}</Typography>
          </div>
        );

      case "time":
        return (
          <div className="grid items-center whitespace-nowrap text-content-secondary max-md:hidden md:pl-2">
            <Typography variant={TYPOGRAPHY.R4}>{timeAgo}</Typography>
          </div>
        );
    }
  };

  return (
    <div className="max-md:grid max-md:grid-cols-[1fr_auto] max-md:rounded-20 max-md:border max-md:border-edge-subtle max-md:px-5 max-md:py-4 md:contents md:*:border-b md:*:border-edge-subtle md:*:py-3">
      {columns.map((column) => (
        <React.Fragment key={column}>{renderColumn(column)}</React.Fragment>
      ))}
    </div>
  );
};
