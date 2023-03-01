import {
  useCallback,
  useEffect,
  useState,
  MouseEvent as ReactMouseEvent,
} from "react";
import { Auth } from "common/Auth";
import { useRouter } from "next/router";
import { urls } from "urls";
import { FieldLabel } from "common/Auth/FieldLabel";
import { FieldInput } from "common/Auth/FieldInput";
import { FieldText } from "common/Auth/FieldText";
import { Checkbox } from "common/Auth/Checkbox";
import { Button } from "common/Auth/Button";
import { Illustration } from "common/Auth/Illustration";
import { Typography } from "common/Auth/Typography";
import { IAuthStore, useAuthStore } from "stores/authStore";
import { shallow } from "zustand/shallow";

const getParams = (store: IAuthStore) => ({
  setToken: store.setToken,
});

export function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const { setToken } = useAuthStore(getParams, shallow);

  const submit = useCallback(
    async (e: ReactMouseEvent<HTMLButtonElement, MouseEvent>) => {
      setLoading(true);
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
        localStorage.removeItem("signup_token");
        setToken(token);
        router.push("/app"); // NOTE: We don't use enterApp because the return url may cause an infinite cycle
      } else {
        setLoading(false);
      }
      // FIXME: Handle errors
    },
    [email, setToken, teamName, router]
  );

  useEffect(() => {
    const signup_token = localStorage.getItem("signup_token");
    if (!signup_token) {
      router.push(urls.login());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- we want to run this only onces
  }, []);

  return (
    <Auth pageTitle="Sign Up" pageUrl="signup">
      <div className="flex flex-col items-center max-w-[544px] p-12">
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
              disabled={loading}
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
              disabled={loading}
            />
          </div>
        </div>

        <div className="w-full mt-8 grid gap-y-4">
          <Checkbox
            className="font-rubik"
            label="I agree with the Developer Portal Terms, which incorporates by reference the Worldcoin User Terms and Conditions and the Worldcoin Privacy Statement."
            disabled={loading}
          />

          <Checkbox
            className="font-rubik"
            label="I want to receive product updates about Worldcoin for developers."
            disabled={loading}
          />
        </div>

        <Button
          className="max-w-[327px] w-full h-[64px] mt-8"
          onClick={submit}
          type="button"
          disabled={loading}
        >
          Create my account
        </Button>
      </div>
    </Auth>
  );
}
