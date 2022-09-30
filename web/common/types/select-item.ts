import { IconType } from "common/Icon";

export type SelectItem = {
  icon: { name: IconType; noMask?: boolean };
  name: string;
  value: string;
  disabled?: boolean;
};
