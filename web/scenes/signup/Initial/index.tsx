import {
  Fragment,
  memo,
  MouseEvent as ReactMouseEvent,
  useCallback,
  useState,
} from "react";
import { FieldLabel } from "common/Auth/FieldLabel";
import { FieldInput } from "common/Auth/FieldInput";
import { FieldText } from "common/Auth/FieldText";
import { Checkbox } from "common/Auth/Checkbox";
import { Button } from "common/Auth/Button";
import { Illustration } from "common/Auth/Illustration";
import { Typography } from "common/Auth/Typography";
import { useAuthContext } from "contexts/AuthContext";

interface InitialInterface {
  onSuccess: () => void;
}

export const Initial = memo(function Initial(props: InitialInterface) {
  const [email, setEmail] = useState("");
  const [teamName, setTeamName] = useState("");
  const { setToken } = useAuthContext();

  const submit = useCallback(
    async (e: ReactMouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.preventDefault();
      const signup_token = localStorage.getItem("signup_token");
      // FIXME: move to axios
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          team_name: teamName,
          signup_token,
          ironclad_id: "temp",
          // FIXME: missing `ironclad_id` & ToS signature stuff
        }),
      });

      if (response.ok) {
        const { token } = await response.json();
        setToken(token);
        localStorage.removeItem("signup_token");
        props.onSuccess();
      }
      // FIXME: Handle errors
    },
    [email, props, setToken, teamName]
  );

  return (
    <Fragment>
      <Illustration icon="user-solid" />

      <Typography className="mt-8" variant="title">
        Nice to meet you
      </Typography>

      <Typography className="mt-2" variant="subtitle">
        Just a few details to create your account
      </Typography>

      <div className="flex flex-col mt-8 w-full">
        <FieldLabel className="mb-2 font-rubik">Email</FieldLabel>

        <div className="relative">
          <FieldInput
            className="w-full font-rubik"
            placeholder="enter email address"
            type="email"
            onChange={(e) => {
              setEmail(e.target.value);
            }}
          />
        </div>

        <FieldText className="mt-3">
          Only for transactional notifications, unless you want to receive
          updates
        </FieldText>
      </div>

      <div className="flex flex-col mt-8 w-full">
        <FieldLabel required className="mb-2 font-rubik">
          Team name
        </FieldLabel>

        <div className="relative">
          <FieldInput
            className="w-full font-rubik"
            placeholder="input your teams name"
            type="text"
            onChange={(e) => {
              setTeamName(e.target.value);
            }}
          />
        </div>
      </div>

      <div className="w-full mt-8 grid gap-y-4">
        <Checkbox
          className="font-rubik"
          label="I agree with the Developer Portal Terms, which incorporates by reference the Worldcoin User Terms and Conditions and the Worldcoin Privacy Statement."
        />

        <Checkbox
          className="font-rubik"
          label="I want to receive product updates about Worldcoin for developers."
        />
      </div>

      <Button
        className="max-w-[327px] w-full h-[64px] mt-8"
        onClick={submit}
        type="button"
      >
        Create my account
      </Button>
    </Fragment>
  );
});
