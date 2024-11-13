"use client";
import { atom } from "jotai";
import { Fragment, ReactNode } from "react";

type FormSubmitState = {
  isSubmitted: boolean;
};

export const formSubmitStateAtom = atom<FormSubmitState>({
  isSubmitted: false,
});

export const FormSubmitStateProvider = (props: { children: ReactNode }) => {
  return <Fragment>{props.children}</Fragment>;
};
