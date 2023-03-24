import { useRouter } from "next/router";
import {
  MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { Auth } from "src/components/Auth";
import { Button } from "src/components/Auth/Button";
import { Checkbox } from "src/components/Auth/Checkbox";
import { FieldInput } from "src/components/Auth/FieldInput";
import { FieldLabel } from "src/components/Auth/FieldLabel";
import { FieldText } from "src/components/Auth/FieldText";
import { Illustration } from "src/components/Auth/Illustration";
import { Typography } from "src/components/Auth/Typography";
import { urls } from "src/lib/urls";

export function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [terms, setTerms] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (router.isReady) {
      const email = router.query.email;
      setEmail(email as string);
    }
  }, [router.isReady, router.query.email]);

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
        const { returnTo } = await response.json();
        localStorage.removeItem("signup_token");
        localStorage.removeItem("invite_token");
        router.push(returnTo); // NOTE: We don't use enterApp because the return url may cause an infinite cycle
      } else {
        setLoading(false);
      }
      // FIXME: Handle errors
    },
    [email, teamName, router]
  );

  useEffect(() => {
    const signup_token = localStorage.getItem("signup_token");
    if (!signup_token) {
      router.push(urls.login());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- we want to run this only onces
  }, []);

  useEffect(() => {
    if (teamName && terms) {
      setIsReady(true);
    } else {
      setIsReady(false);
    }
  }, [teamName, terms]);

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
              value={email}
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
            onChange={(e) => {
              e.target.checked ? setTerms(true) : setTerms(false);
            }}
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
          disabled={loading || !isReady}
        >
          Create my account
        </Button>
      </div>
    </Auth>
  );
}
