"use client";
import Error from "next/error";

export const Unauthorized = () => {
  return <Error statusCode={401} title="Unauthorized" />;
};
