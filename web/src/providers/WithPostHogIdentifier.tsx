import { usePostHog } from "@/hooks/usePostHog";
import { useUser } from "@auth0/nextjs-auth0/client";
import gql from "graphql-tag";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import React, { useEffect } from "react";

interface WithPostHogProps {
  children: React.ReactNode;
}
interface HasuraUserData {
  posthog_id: string;
  id: string;
  auth0Id: string;
  team_id: string;
  email: string;
  name: string;
}

const WithPostHogIdentifier: React.FC<WithPostHogProps> = ({ children }) => {
  const { user, isLoading } = useUser();
  usePostHog();

  useEffect(() => {
    // Fetch the PostHog ID for the current user
    if (!isLoading) {
      if (user && user.hasura) {
        const userData = user.hasura as HasuraUserData;
        // If the user is logged in, identify them with PostHog
        posthog.identify(userData.posthog_id!, {
          email: user.email,
          // You can add more user properties here if needed
        });
      } else {
        // If the user is not logged in, reset the PostHog user
        posthog.reset();
      }
    }
  }, [user, isLoading]);

  return (
    <>
      <PostHogProvider client={posthog}>{children}</PostHogProvider>
    </>
  );
};

export default WithPostHogIdentifier;
