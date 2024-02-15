import { TYPOGRAPHY, Typography } from "@/components/Typography";

type RemainingCharactersProps = {
  worldAppDescription?: string;
  maxChars: number;
};

export const RemainingCharacters: React.FC<RemainingCharactersProps> = ({
  worldAppDescription,
  maxChars,
}) => {
  const remainingCharacters = maxChars - (worldAppDescription?.length || 0);

  return (
    <Typography variant={TYPOGRAPHY.R5} className="text-grey-400">
      {remainingCharacters}
    </Typography>
  );
};
