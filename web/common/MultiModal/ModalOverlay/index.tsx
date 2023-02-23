import { Fragment, memo, ReactNode, useEffect } from "react";
import usePortal from "react-useportal";
import cn from "classnames";

/* FIXME: react-useportal does not work with react18, we need to redo the modal window components without using it.
          We can get the portal from radix-ui but it is better to get the ready-made modal window implementation
          from radix-ui or headless-ui */
export const ModalOverlay = memo(function ModalOverlay(props: {
  isOpen: boolean;
  close: () => void;
  handleReturn?: () => void;
  noForcedOverflowHidden?: boolean;
  noContentCentering?: boolean;
  zIndex?: number;
  classNames?: string;
  backgroundClassNames?: string;
  children?: ReactNode;
}) {
  const { Portal } = usePortal();

  useEffect(() => {
    if (!props.noForcedOverflowHidden) {
      return;
    }

    if (props.isOpen) {
      document.documentElement.style.overflow = "hidden";
      return;
    }

    document.documentElement.style.overflow = "";

    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [props.isOpen, props.noForcedOverflowHidden]);

  if (!props.isOpen) {
    return null;
  }

  return (
    <Fragment>
      <Portal>
        <div
          className={cn(
            "fixed inset-0 items-center justify-center",
            `z-${props.zIndex !== undefined ? props.zIndex : 50}`,
            { "grid grid-flow-cols": !props.noContentCentering },
            props.classNames
          )}
        >
          <span
            className={cn(
              "absolute inset-0 -z-10 bg-000000/60",
              props.backgroundClassNames
            )}
            onClick={props.close}
          />
          {props.children}
        </div>
      </Portal>
    </Fragment>
  );
});
