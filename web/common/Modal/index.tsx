import { memo, ReactNode, useEffect } from "react";
import cn from "classnames";
import usePortal from "react-useportal";
import { Icon } from "common/Icon";

export const Modal = memo(function Modal(props: {
  children: ReactNode;
  className?: string;
  close: () => void;
  isAlt?: boolean;
  isShown: boolean;
  heading?: string;
  buttonClassName?: string;
  withCloseButton?: boolean;
}) {
  const { Portal } = usePortal();

  useEffect(() => {
    if (props.isShown) {
      document.documentElement.style.overflow = "hidden";
      return;
    }

    document.documentElement.style.overflow = "";
  }, [props.isShown]);

  if (!props.isShown) {
    return null;
  }

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center sm:p-8 md:p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className="absolute inset-0 -z-10 bg-000000/60"
          onClick={props.close}
        />

        <div
          className={cn(
            "max-w-[420px] z-60 p-12 rounded-xl bg-ffffff",
            props.className
          )}
        >
          <div className="flex w-full">
            {props.heading && (
              <div className="mr-auto text-26 font-bold">{props.heading}</div>
            )}

            {props.withCloseButton && (
              <button
                type="button"
                onClick={props.close}
                className="ml-auto text-0 border border-primary/20 rounded-md p-2 "
              >
                <Icon name="close" className="w-6 h-6 text-primary" />
              </button>
            )}
          </div>

          {props.children}
        </div>
      </div>
    </Portal>
  );
});
