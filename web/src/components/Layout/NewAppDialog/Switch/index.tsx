import { memo, ReactNode } from "react";
import { Option } from './Option'

export { Option as SwitchOption }

export interface SwitchProps {
  children: ReactNode
}

export const Switch = memo(function Switch(
  props: SwitchProps
) {
  const { children } = props;

  return (
    <div className="grid lg:grid-cols-2 gap-y-3 mt-6 bg-f1f5f8 border-2 border-transparent rounded-xl">
      {children}
    </div>
  );
});
