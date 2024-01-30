import { Icon } from "src/components/Icon";
import { UrlInput } from "src/scenes/sign-in-with-world-id/Urls/UrlInput";

interface RedirectInputProps {
  value: string;
  onChange: (value: string) => void;
  onDelete: () => void;
}

export function RedirectInput(props: RedirectInputProps) {
  return (
    <div className="grid grid-cols-1fr/auto gap-x-2 items-center">
      <UrlInput value={props.value} onChange={props.onChange} />

      <button type="button" onClick={props.onDelete} className="text-0 group">
        <Icon
          name="close"
          className="w-6 h-6 bg-neutral-secondary group-hover:bg-neutral-dark transition-colors"
        />
      </button>
    </div>
  );
}
