import { DecoratedButton } from "@/components/DecoratedButton";
import { SuccessIcon } from "@/components/Icons";
import { Input } from "@/components/Input";

export const JoinPage = () => {
  return (
    <div className="flex flex-col p-10 items-center justify-center gap-2 h-screen">
      <div className="flex flex-row gap-1">
        <DecoratedButton
          type="button"
          className="w-72"
          variant="primary"
          icon={<SuccessIcon />}
          showArrowRight
        >
          Primary
        </DecoratedButton>
        <DecoratedButton
          type="button"
          variant="primary"
          className="w-72"
          icon={<SuccessIcon />}
          showArrowRight
          disabled
        >
          Primary: Disabled
        </DecoratedButton>
        <DecoratedButton
          type="button"
          variant="primary"
          loading
          className="w-72"
          showArrowRight
          icon={<SuccessIcon />}
        >
          Primary: Loading
        </DecoratedButton>
      </div>
      <div className="flex flex-row gap-1">
        <DecoratedButton
          type="button"
          className="w-72"
          variant="secondary"
          icon={<SuccessIcon />}
          showArrowRight
        >
          Secondary
        </DecoratedButton>
        <DecoratedButton
          type="button"
          variant="secondary"
          className="w-72"
          icon={<SuccessIcon />}
          showArrowRight
          disabled
        >
          Secondary: Disabled
        </DecoratedButton>
        <DecoratedButton
          type="button"
          variant="secondary"
          loading
          className="w-72"
          showArrowRight
          icon={<SuccessIcon />}
        >
          Secondary: Loading
        </DecoratedButton>
      </div>
      <div className="flex flex-row gap-1">
        <DecoratedButton
          type="button"
          className="w-72"
          variant="danger"
          icon={<SuccessIcon />}
          showArrowRight
        >
          Danger
        </DecoratedButton>
        <DecoratedButton
          type="button"
          variant="danger"
          className="w-72"
          icon={<SuccessIcon />}
          showArrowRight
          disabled
        >
          Danger: Disabled
        </DecoratedButton>
        <DecoratedButton
          type="button"
          variant="danger"
          loading
          className="w-72"
          showArrowRight
          icon={<SuccessIcon />}
        >
          Danger: Loading
        </DecoratedButton>
      </div>
      <Input
        label="Signal"
        className="w-[500px]"
        placeholder="my_signal"
        required
      />
      <Input
        label="Signal"
        className="w-[500px]"
        placeholder="my_signal"
        disabled
      />
      <Input
        label="Signal"
        className="w-[500px]"
        placeholder="my_signal"
        helperText="The number of verifications the same person can do for this action"
      />
    </div>
  );
};
