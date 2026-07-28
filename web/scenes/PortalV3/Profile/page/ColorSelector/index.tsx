import { Option } from "@/scenes/PortalV3/Profile/page/ColorSelector/Option";
import { ColorName, colors } from "@/scenes/common/Profile/types";

type ColorSelectorProps = {
  value: ColorName;
  name: string;
  onChange: (value: ColorName) => void;
};

export const ColorSelector = (props: ColorSelectorProps) => {
  const initial = props.name.trim()[0] ?? "A";

  return (
    <div className="flex flex-wrap gap-3" aria-label="Avatar color">
      {(
        Object.entries(colors) as [ColorName, (typeof colors)[ColorName]][]
      ).map(([colorName, color]) => (
        <Option
          key={colorName}
          aria-label={`Use ${colorName} avatar color`}
          aria-pressed={colorName === props.value}
          initial={initial}
          selected={colorName === props.value}
          value={color}
          onClick={() => props.onChange(colorName)}
        />
      ))}
    </div>
  );
};
