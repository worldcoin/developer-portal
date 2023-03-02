import { memo, ReactNode, useCallback } from "react";
import cn from "classnames";
import { Tab } from "./types";
import { Icon } from "src/common/Icon";

export const Tabs = memo(function Tabs(props: {
  tabs: Array<Tab>;
  children?: ReactNode;
  className?: string;
  tabsClassName?: string;
  currentTab: Tab;
  setTab: (value: Tab) => void;
}) {
  const changeTab = useCallback((tab: Tab) => () => props.setTab(tab), [props]);

  return (
    <div className={cn(props.className)}>
      <div
        className={cn(
          "[box-shadow:inset__0_-1px_0_rgba(133,132,148,0.3)] grid grid-flow-col justify-start gap-x-24",
          props.tabsClassName
        )}
      >
        {props.tabs.map((tab, index) => (
          <button
            onClick={changeTab(tab)}
            className={cn(
              "pb-6 hover:opacity-70 transition-opacity border-b text-14 leading-4",
              { "border-primary": props.currentTab.name === tab.name },
              { "border-000000/0": props.currentTab.name !== tab.name },
              { "flex space-x-2 items-center": tab.notifications }
            )}
            type="button"
            key={`action-tab-${index}-${tab}`}
          >
            <span className="relative top-[1px] font-medium text-primary">
              {tab.label || tab.name}
            </span>
            {tab.notifications > 0 && (
              <div className="relative top-[1px] flex justify-center items-center text-danger">
                <Icon className="w-4 h-4" name="warning" />
              </div>
            )}
          </button>
        ))}
      </div>
      {!!props.children && <div className="py-12">{props.children}</div>}
    </div>
  );
});
