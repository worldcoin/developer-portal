import { yupResolver } from "@hookform/resolvers/yup";
import cn from "classnames";
import { useForm } from "react-hook-form";
import { FieldInput } from "src/components/FieldInput";
import { validateUrl } from "src/lib/utils";
import * as yup from "yup";

interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
}

const schema = yup.object({
  url: yup.string().required().test("is-url", "Must be a valid URL", (value) => {
    return value != null ? validateUrl(value) : true;
  }),
});

type UrlFormValues = yup.InferType<typeof schema>;

export function UrlInput(props: UrlInputProps) {
  const {
    register,
    handleSubmit,
    formState: { isDirty, isValid, errors },
  } = useForm<UrlFormValues>({
    resolver: yupResolver(schema),
    mode: "onChange",
    shouldFocusError: false,
    defaultValues: {
      url: props.value ?? "",
    },
  });

  const handleSave = handleSubmit((data, event) => {
    props.onChange(data.url);
  });

  return (
    <form onSubmit={handleSave}>
      <FieldInput
        className={cn("w-full", { "border-danger/75": !isValid })}
        {...register("url", { onBlur:handleSave })}
      />
    </form>
  );
}
