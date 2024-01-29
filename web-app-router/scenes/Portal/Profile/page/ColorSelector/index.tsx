import { Option } from "@/scenes/Portal/Profile/page/ColorSelector/Option";
import { ColorName, colors } from "@/scenes/Portal/Profile/types";

type ColorSelectorProps = {
  value: ColorName;
  onChange: (value: ColorName) => void;
};

export const ColorSelector = (props: ColorSelectorProps) => {
  return (
    <div className="flex gap-x-2.5">
      {Object.keys(colors).map((colorName) => (
        <Option
          key={colorName}
          selected={colorName === props.value}
          value={colorName as ColorName}
          onClick={() => props.onChange(colorName as ColorName)}
        />
      ))}
    </div>
  );
};
