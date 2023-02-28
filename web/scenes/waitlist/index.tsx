import { Auth } from "common/Auth";
import { useCallback, useState } from "react";
import { Initial } from "./Initial";
import { Success } from "./Success";

enum Screen {
  Initial,
  Success,
}

export function WaitList() {
  const [screen, setScreen] = useState<Screen>(Screen.Initial);

  const addToWaitList = useCallback(() => {
    //TODO: Add adding to waitlist logic
    setScreen(Screen.Success);
  }, []);

  return (
    <Auth pageTitle="Join to waitlist" pageUrl="waitlist">
      <div className="flex flex-col items-center max-w-[544px] w-screen p-12 gap-8">
        {screen === Screen.Initial && <Initial onSuccess={addToWaitList} />}
        {screen === Screen.Success && <Success />}
      </div>
    </Auth>
  );
}
