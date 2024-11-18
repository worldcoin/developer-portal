import yup from "yup";

export const GetLayoutParamsSchema = yup.object().shape({
  id: yup.string().required(),
});
