import { Option } from "@/scenes/PortalV3/Profile/page/ColorSelector/Option";
import { Color, colors } from "@/scenes/common/Profile/types";

type ColorSelectorProps = {
  value: Color;
  name: string;
  onChange: (value: Color) => void;
};

export const ColorSelector = (props: ColorSelectorProps) => {
  const initial = props.name.trim()[0] ?? "A";

  return (
    <div className="flex flex-wrap gap-3" aria-label="Avatar color">
      {Object.entries(colors).map(([colorName, colors]) => (
        <Option
          key={colorName}
          aria-label={`Use ${colorName} avatar color`}
          aria-pressed={colors[100] === props.value[100]}
          initial={initial}
          selected={colors[100] === props.value[100]}
          value={colors}
          onClick={() => props.onChange(colors as Color)}
        />
      ))}
    </div>
  );
};
