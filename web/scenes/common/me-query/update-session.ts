"use server";

import { getSession, updateSession } from "@auth0/nextjs-auth0";

export const updateSessionUser = async (user: any) => {
  let session = await getSession();

  if (!session) {
    return;
  }

  const updatedSession = {
    ...session,
    user: {
      ...session.user,
      hasura: {
        ...user,
      },
    },
  };

  session = updatedSession;
  await updateSession(session);
};
