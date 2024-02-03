import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "@/styles/globals.css";
import { ApolloWrapper } from "@/lib/apollo-wrapper";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import { CSSProperties } from "react";
import { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const rubik = Rubik({ weight: ["400"], subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html
      lang="en"
      style={
        {
          "--font-rubik": rubik.style.fontFamily,
        } as CSSProperties
      }
    >
      <body>
        <UserProvider>
          <ApolloWrapper>
            <SkeletonTheme baseColor="#F3F4F5" highlightColor="#EBECEF">
              {children}
            </SkeletonTheme>
          </ApolloWrapper>
        </UserProvider>
      </body>
    </html>
  );
};
