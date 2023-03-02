import { IconType } from "src/components/Icon";

export type SelectItem = {
  icon: { name: IconType; noMask?: boolean };
  name: string;
  value: string;
  disabled?: boolean;
};
