import { DecoratedButton } from "@/components/DecoratedButton";

export const JoinPage = () => {
  return (
    <div className="flex flex-col p-10 items-center justify-center gap-2 h-screen">
      <div className="flex flex-row gap-1">
        <DecoratedButton
          type="button"
          className="w-72"
          variant="primary"
          icon="success"
          showArrowRight
        >
          Primary
        </DecoratedButton>
        <DecoratedButton
          type="button"
          variant="primary"
          className="w-72"
          icon="success"
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
          icon="success"
        >
          Primary: Loading
        </DecoratedButton>
      </div>
      <div className="flex flex-row gap-1">
        <DecoratedButton
          type="button"
          className="w-72"
          variant="secondary"
          icon="success"
          showArrowRight
        >
          Secondary
        </DecoratedButton>
        <DecoratedButton
          type="button"
          variant="secondary"
          className="w-72"
          icon="success"
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
          icon="success"
        >
          Secondary: Loading
        </DecoratedButton>
      </div>
      <div className="flex flex-row gap-1">
        <DecoratedButton
          type="button"
          className="w-72"
          variant="danger"
          icon="success"
          showArrowRight
        >
          Danger
        </DecoratedButton>
        <DecoratedButton
          type="button"
          variant="danger"
          className="w-72"
          icon="success"
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
          icon="success"
        >
          Danger: Loading
        </DecoratedButton>
      </div>
    </div>
  );
};
