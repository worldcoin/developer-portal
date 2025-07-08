import { yupResolver } from "@hookform/resolvers/yup";
import { FormProvider, useForm } from "react-hook-form";
import { FetchAppMetadataQuery } from "../graphql/client/fetch-app-metadata.generated";
import { AppStoreFormValues, mainAppStoreFormSchema } from "./form-schema";
import { FetchLocalisationsQuery } from "./graphql/client/fetch-localisations.generated";
import { useFormData } from "./hooks/useFormData";

export const AppStoreFormProvider = ({
  children,
  appMetadata,
  localisationsData,
}: {
  children: React.ReactNode;
  appMetadata:
    | FetchAppMetadataQuery["app"][0]["verified_app_metadata"][0]
    | FetchAppMetadataQuery["app"][0]["app_metadata"][0];
  localisationsData: FetchLocalisationsQuery["localisations"];
}) => {
  const { defaultValues } = useFormData(appMetadata, localisationsData);

  const form = useForm<AppStoreFormValues>({
    resolver: yupResolver(mainAppStoreFormSchema),
    defaultValues,
  });

  return <FormProvider {...form}>{children}</FormProvider>;
};
