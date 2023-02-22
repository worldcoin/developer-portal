import { Auth } from "common/Auth";
import { Illustration } from "common/Auth/Illustration";
import { Button } from "common/Auth/Button";

export function Login() {
  return (
    <Auth pageTitle="Sign Up" pageUrl="signup">
      <div className="flex flex-col items-center max-w-[544px] p-12">
        <Illustration icon="user-solid" />

        <div className="max-w-[320px] mt-8 font-sora font-semibold text-32 text-center leading-10">
          World ID is&nbsp;currently in&nbsp;beta
        </div>

        <div className="mt-2 font-rubik text-16 text-center text-neutral-medium leading-5">
          Sign in with World ID or join our waitlist
        </div>

        <Button className="max-w-[327px] w-full h-[64px] mt-8">
          Sign in with World ID
        </Button>
      </div>
    </Auth>
  );
}
