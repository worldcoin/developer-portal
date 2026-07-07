import { yupResolver } from "@hookform/resolvers/yup";
import { useAtomValue } from "jotai";
import { FormProvider, useForm } from "react-hook-form";
import { isMiniAppAtom } from "../layout/ImagesProvider";
import { mainAppStoreFormSchema } from "./FormSchema/form-schema";
import { AppStoreFormValues } from "./FormSchema/types";
import { useFormData } from "./hooks/useFormData";
import { AppMetadata, LocalisationData } from "./types/AppStoreFormTypes";

export const AppStoreFormProvider = ({
  children,
  appMetadata,
  localisationsData,
}: {
  children: React.ReactNode;
  appMetadata: AppMetadata;
  localisationsData: LocalisationData;
}) => {
  const isMiniApp = useAtomValue(isMiniAppAtom);
  const { defaultValues } = useFormData(appMetadata, localisationsData);

  const form = useForm<AppStoreFormValues>({
    resolver: yupResolver(mainAppStoreFormSchema),
    context: { isMiniApp },
    defaultValues,
    mode: "onChange",
  });

  return <FormProvider {...form}>{children}</FormProvider>;
};
