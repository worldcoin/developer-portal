import { Option } from "@/scenes/Portal/Profile/page/ColorSelector/Option";
import { Color, colors } from "@/scenes/Portal/Profile/types";

type ColorSelectorProps = {
  value: Color;
  onChange: (value: Color) => void;
};

export const ColorSelector = (props: ColorSelectorProps) => {
  return (
    <div className="flex gap-x-2.5">
      {Object.entries(colors).map(([colorName, colors]) => (
        <Option
          key={colorName}
          selected={colors[100] === props.value[100]}
          value={colors}
          onClick={() => props.onChange(colors as Color)}
        />
      ))}
    </div>
  );
};
