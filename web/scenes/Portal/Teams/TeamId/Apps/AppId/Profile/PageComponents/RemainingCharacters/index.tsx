import { TYPOGRAPHY, Typography } from "@/components/Typography";

type RemainingCharactersProps = {
  text?: string;
  maxChars: number;
};

export const RemainingCharacters: React.FC<RemainingCharactersProps> = ({
  text,
  maxChars,
}) => {
  const remainingCharacters = maxChars - (text?.length || 0);

  return (
    <Typography variant={TYPOGRAPHY.R5} className="text-grey-400">
      {remainingCharacters}
    </Typography>
  );
};

