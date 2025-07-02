"use client";
import { atom } from "jotai";
import { MainAppStoreFormReviewSubmitSchema } from "../../../AppStoreRefactored/form-schema";

type ReviewSubmitErrorState = {
  errors: Partial<Record<keyof MainAppStoreFormReviewSubmitSchema, string>>;
};

export const reviewSubmitErrorStateAtom = atom<ReviewSubmitErrorState>({
  errors: {},
});
