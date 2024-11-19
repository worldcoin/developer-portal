import * as yup from "yup";

const AppStoreLayoutElementMap = {
  app: "app",
  banner: "banner",
  "app-collection": "app-collection",
  "banner-collection": "banner-collection",
  "secondary-category": "secondary-category",
};

const AppSchema = yup.object().shape({
  id: yup.string().required(),
});

const AppStoreLayoutBannerSchema = yup
  .object()
  .shape({
    highlightColorHex: yup.string().required(),
    title: yup.string().required(),
    titleColorHex: yup.string().required(),
    subtitle: yup.string().required(),
    subtitleColorHex: yup.string().required(),
    backgroundColorHex: yup.string(),
    backgroundImageUrl: yup.string(),
  })
  .test(
    "backgroundColorHexOrBackgroundImageUrl",
    "Either backgroundColorHex or backgroundImageUrl must be provided",
    function (value) {
      return (
        (!!value.backgroundColorHex && !value.backgroundImageUrl) ||
        (!value.backgroundColorHex && !!value.backgroundImageUrl)
      );
    },
  );

const AppStoreLayoutAppElementSchema = yup.object().shape({
  elementType: yup.mixed().oneOf([AppStoreLayoutElementMap.app]).required(),
  elements: AppSchema.required(),
});

const AppStoreLayoutBannerElementSchema = yup.object().shape({
  elementType: yup.mixed().oneOf([AppStoreLayoutElementMap.banner]).required(),
  elements: AppStoreLayoutBannerSchema.required(),
});

const AppStoreLayoutAppCollectionElementSchema = yup.object().shape({
  elementType: yup
    .mixed()
    .oneOf([AppStoreLayoutElementMap["app-collection"]])
    .required(),
  title: yup.string().required(),
  indexed: yup.boolean().required(),
  elements: yup.array().of(AppSchema).required(),
});

const AppStoreLayoutBannerCollectionElementSchema = yup.object().shape({
  elementType: yup
    .mixed()
    .oneOf([AppStoreLayoutElementMap["banner-collection"]])
    .required(),
  title: yup.string().required(),
  elements: yup.array().of(AppStoreLayoutBannerSchema).required(),
});

const AppStoreLayoutSecondaryCategoryElementSchema = yup
  .object()
  .shape({
    elementType: yup
      .mixed()
      .oneOf([AppStoreLayoutElementMap["secondary-category"]])
      .required(),
    title: yup.string().required(),
    subtitle: yup.string().required(),
    elements: yup
      .array()
      .of(
        yup.lazy((value) => {
          switch (value.elementType) {
            case AppStoreLayoutElementMap.app:
              return AppStoreLayoutAppElementSchema;
            case AppStoreLayoutElementMap.banner:
              return AppStoreLayoutBannerElementSchema;
            case AppStoreLayoutElementMap["app-collection"]:
              return AppStoreLayoutAppCollectionElementSchema;
            case AppStoreLayoutElementMap["banner-collection"]:
              return AppStoreLayoutBannerCollectionElementSchema;
            default:
              return yup.mixed().notRequired();
          }
        }),
      )
      .required(),
    backgroundColorHex: yup.string(),
    backgroundImageUrl: yup.string(),
  })
  .test(
    "backgroundColorHexOrBackgroundImageUrl",
    "Either backgroundColorHex or backgroundImageUrl must be provided",
    function (value) {
      return (
        (!!value.backgroundColorHex && !value.backgroundImageUrl) ||
        (!value.backgroundColorHex && !!value.backgroundImageUrl)
      );
    },
  );

const AppStoreLayoutSchema = yup.array(
  yup.object().shape({
    category: yup.string().required(),
    elements: yup
      .array()
      .of(
        yup.lazy((value) => {
          switch (value.elementType) {
            case AppStoreLayoutElementMap.app:
              return AppStoreLayoutAppElementSchema;
            case AppStoreLayoutElementMap.banner:
              return AppStoreLayoutBannerElementSchema;
            case AppStoreLayoutElementMap["app-collection"]:
              return AppStoreLayoutAppCollectionElementSchema;
            case AppStoreLayoutElementMap["banner-collection"]:
              return AppStoreLayoutBannerCollectionElementSchema;
            case AppStoreLayoutElementMap["secondary-category"]:
              return AppStoreLayoutSecondaryCategoryElementSchema;
            default:
              return yup.mixed().notRequired();
          }
        }),
      )
      .required(),
  }),
);

export {
  AppSchema,
  AppStoreLayoutAppCollectionElementSchema,
  AppStoreLayoutAppElementSchema,
  AppStoreLayoutBannerCollectionElementSchema,
  AppStoreLayoutBannerElementSchema,
  AppStoreLayoutBannerSchema,
  AppStoreLayoutSchema,
  AppStoreLayoutSecondaryCategoryElementSchema,
};
