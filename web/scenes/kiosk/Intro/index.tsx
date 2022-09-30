import { memo, useCallback } from "react";
import cn from "classnames";
import { Icon } from "common/Icon";

const cards = [
  {
    icon: require("../assets/card-1.svg").default.src as string,

    text: (
      <p>
        User scans the QR code shown here with their <b>Worldcoin</b> app
      </p>
    ),
  },

  {
    icon: require("../assets/card-2.svg").default.src as string,
    text: "You’ll receive confirmation immediately if everything was successful.",
  },

  {
    icon: require("../assets/card-3.svg").default.src as string,
    text: "Click “New verification” to show a new QR code.",
  },

  {
    icon: require("../assets/card-4.svg").default.src as string,
    text: (
      <p>
        <b>Only one user at a time.</b> Each user should use their own QR code.
      </p>
    ),
  },
];

export const Intro = memo(function Intro(props: {
  actionId?: string;
  setScreen: (screen: string) => void;
}) {
  const handleClickStart = useCallback(() => {
    props.setScreen("waiting");
  }, [props]);

  return (
    <div className="grid justify-items-center gap-y-28 lg:gap-y-12">
      <div className="grid grid-cols-2 grid-rows-2 gap-16 lg:grid-rows-1 lg:grid-flow-col">
        {cards.map((card, index) => (
          <div
            className="grid grid-flow-row auto-rows-min place-items-center"
            key={index}
          >
            <span className="relative w-24 h-24 overflow-hidden rounded-full bg-f1f5f8 dark:bg-neutral-dark">
              <Icon
                className="absolute inset-1 text-neutral-dark dark:text-ffffff"
                path={card.icon}
              />
            </span>

            <div className="self-start mt-6 max-w-[198px] text-neutral leading-[1.2] text-center">
              {card.text}
            </div>
          </div>
        ))}
      </div>

      <button
        className={cn(
          "min-w-[320px] w-min p-4.5 font-semibold font-sora text-center uppercase rounded-xl bg-primary",
          "text-ffffff hover:opacity-70 transition-opacity",
          "shadow-[0px_10px_20px_rgba(83,67,212,.2),_inset_0px_-1px_1px_rgba(0,0,0,.3),_inset_0px_1px_1px_rgba(255,255,255,.2)]"
        )}
        onClick={handleClickStart}
      >
        continue
      </button>
    </div>
  );
});
