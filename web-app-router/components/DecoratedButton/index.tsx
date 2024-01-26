import { Button, CommonButtonProps } from "@/components/Button";
import { memo } from "react";
import { ArrowRightIcon } from "@/components/Icons/ArrowRightIcon";
import { tv } from 'tailwind-variants'

const decoratedButton = tv({
  slots: {
    base: 'px-6 py-2.5 rounded-xl border font-medium relative',
    inner: 'gap-2 flex items-center justify-center',
  },
  variants: {
    variant: {
      primary: {
        base: '',
        inner: 'before:absolute before:inset-0 before:rounded-[11px] before:shadow-[0_0_0_1px_rgba(255,255,255,.1)_inset]',
      },
      secondary: {
        base: '',
      },
      danger: {
        base: '',
      }
    },
    loading: {
      true: {},
      false: {},
    },
    disabled: {
      true: {},
      false: {},
    },
  },
  compoundVariants: [
    {
      variant: 'primary',
      disabled: false,
      loading: false,
      class: {
        base: 'bg-grey-900 text-white bg-gradient-to-b border-grey-900 from-white/15 to-transparent shadow-button hover:bg-gradient-to-b hover:from-white/20 hover:to-transparent',
      }
    },
    {
      variant: 'primary',
      disabled: true,
      loading: false,
      class: {
        base: 'bg-grey-100 text-grey-300 pointer-events-none'
      },
    },
    {
      variant: 'primary',
      disabled: false,
      loading: true,
      class: {
        base: 'bg-grey-100 text-grey-400 pointer-events-none'
      },
    },
    {
      variant: 'secondary',
      disabled: false,
      loading: false,
      class: {
        base: 'bg-grey-0 text-grey-700 border-grey-200 shadow-button hover:bg-grey-100 hover:text-grey-900',
      }
    },
    {
      variant: 'secondary',
      disabled: true,
      loading: false,
      class: {
        base: 'bg-grey-0 text-grey-300 border-grey-100 pointer-events-none'
      },
    },
    {
      variant: 'secondary',
      disabled: false,
      loading: true,
      class: {
        base: 'bg-grey-0 text-grey-400 border-grey-200 pointer-events-none'
      },
    },
    {
      variant: 'danger',
      disabled: false,
      loading: false,
      class: {
        base: 'bg-grey-0 text-system-error-600 border-system-error-400 inset-0 hover:bg-system-error-50',
      }
    },
    {
      variant: 'danger',
      disabled: true,
      loading: false,
      class: {
        base: 'border-system-error-200 text-system-error-300 pointer-events-none'
      },
    },
    {
      variant: 'danger',
      disabled: false,
      loading: true,
      class: {
        base: 'border-system-error-300 text-system-error-400 pointer-events-none'
      },
    }
  ],
  defaultVariants: {
    variant: 'primary',
    disabled: false,
    loading: false,
  }
});

type DecoratedButtonProps = CommonButtonProps & {
  icon?: React.ReactElement;
  showArrowRight?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  variant?: "primary" | "secondary" | "danger";
};

export const DecoratedButton = memo(function DecoratedButton(
  props: DecoratedButtonProps
) {
  const {
    icon,
    showArrowRight,
    loading,
    disabled,
    className,
    variant,
    ...restProps
  } = props;

  const { base, inner } = decoratedButton({ variant, disabled, loading })

  return (
    <Button
      disabled={disabled}
      className={base({ className })}
      {...restProps}
    >
      <div
        className={inner()}
      >
        {icon}
        {props.children}
        {showArrowRight && <ArrowRightIcon className="w-6 h-6" />}
      </div>
    </Button>
  );
});
