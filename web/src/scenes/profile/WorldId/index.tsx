import { Icon } from "@/components/Icon";
import { HTMLAttributes, memo } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const worldId = tv({
  slots: {
    base: "flex items-center gap-x-3 p-4 border border-gray-200 rounded-xl shadow-card-new",
    icon: "relative flex items-center justify-center w-10 h-10 text-white bg-gray-900 rounded-full",
    text: "grow",
    action: "flex items-center gap-x-1 leading-1px whitespace-nowrap",
  },
  variants: {
    connected: {
      true: {
        action: "text-gray-400",
      },
      false: {
        icon: "bg-gray-400",
        action: "text-blue-500",
      },
    },
    verified: {
      true: {},
      false: {},
    },
  },
});

type WorldIdProps = VariantProps<typeof worldId> &
  HTMLAttributes<HTMLDivElement>;

export const WorldId = memo(function WorldId(props: WorldIdProps) {
  const { connected = false, verified = false } = props;
  const { base, icon, text, action } = worldId({ connected, verified });

  return (
    <div className={base()}>
      <div>
        <div className={icon()}>
          <Icon name="logomark" className="w-5 h-5" />
          {connected && verified && (
            <Icon
              name="badge-check2"
              noMask
              className="absolute right-[-3px] bottom-[-3px] w-4.5 h-4.5"
            />
          )}
        </div>
      </div>

      <div className={text()}>
        <div className="leading-5 font-medium text-14 text-gray-900">
          World ID
        </div>

        <div className="flex gap-x-1 leading-4 text-12 text-gray-700">
          {!connected && "Not connected"}

          {connected && !verified && (
            <>
              <span>Connected</span> <span>•</span> <span>Not verified</span>
            </>
          )}

          {connected && verified && (
            <>
              <span>Connected</span> <span>•</span> <span>Verified</span>
            </>
          )}
        </div>
      </div>

      <button className={action()}>
        <Icon name="link" className="w-4 h-4" />

        {!connected && <span className="text-12">Connect</span>}

        {connected && <span className="text-12">Disconnect</span>}
      </button>
    </div>
  );
});
