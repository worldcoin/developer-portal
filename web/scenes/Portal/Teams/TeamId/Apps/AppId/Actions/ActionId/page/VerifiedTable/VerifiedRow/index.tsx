import { formatDistanceToNowStrict } from "date-fns";
import { NullifierItem } from "../index";

import { TYPOGRAPHY, Typography } from "@/components/Typography";
import Image from "next/image";

export const VerifiedRow = (props: {
  nullifier: NullifierItem;
  key: number;
  logo: string;
}) => {
  const { nullifier, key, logo } = props;
  const timeAgo = formatDistanceToNowStrict(new Date(nullifier.updated_at), {
    addSuffix: true,
  });

  return [
    <div
      key={`nullifier_${key}_1`}
      className="group flex flex-row items-center gap-x-3 px-2 py-3"
    >
      <Image src={`/avatars/${logo}`} alt="user" width={40} height={40} />
      <div className="text-grey-900">
        <Typography variant={TYPOGRAPHY.R4}>
          {`${nullifier.nullifier_hash.slice(0, 10)}...${nullifier.nullifier_hash.slice(-8)}`}
        </Typography>
      </div>
    </div>,
    <div key={`nullifier_${key}_2`} className="w-12 text-grey-500">
      <Typography variant={TYPOGRAPHY.R4}>{nullifier.uses}</Typography>
    </div>,
    <div key={`nullifier_${key}_3`} className="text-grey-500">
      <Typography variant={TYPOGRAPHY.R4}>{timeAgo}</Typography>
    </div>,
  ];
};

