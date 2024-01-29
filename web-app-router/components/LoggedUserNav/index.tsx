import { Button } from "../Button";
import { TYPOGRAPHY, Typography } from "../Typography";

// TODO: update to take user name or image from session
export const LoggedUserNav = (props: { name: string }) => {
  const nameFirstLetter = props.name.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-x-5">
      <Button href="#">
        <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
          Help
        </Typography>
      </Button>

      <Button href="https://docs.worldcoin.org">
        <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
          Docs
        </Typography>
      </Button>

      {/* TODO: update to make drop down on click */}
      <Button type="button">
        <span className="h-6 w-6 text-xs flex justify-center items-center bg-additional-pink-100 text-additional-pink-500 rounded-full">
          {nameFirstLetter}
        </span>
      </Button>
    </div>
  );
};
