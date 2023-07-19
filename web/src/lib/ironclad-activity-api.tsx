import { toast } from "react-toastify";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();

const psAccessId = publicRuntimeConfig.NEXT_PUBLIC_IRONCLAD_ACCESS_ID;
const psGroupKey = publicRuntimeConfig.NEXT_PUBLIC_IRONCLAD_GROUP_KEY;
const activityApiUrl = "https://pactsafe.io";
const retrieveGroupUrl = `${activityApiUrl}/load/json?sid=${psAccessId}&gkey=${psGroupKey}`;

// NOTE pass some identifier (email, number) to signerId
// if there's will be no signer id, hook returned null on each field of return object
export async function ironCladActivityApi(params: {
  signerId: string;
}): Promise<
  | { isLatestSigned: boolean | null; sendAcceptance: () => Promise<void> }
  | never
> {
  const latestSignedUrl = `${activityApiUrl}/latest?sid=${psAccessId}&sig=${params.signerId}&gkey=${psGroupKey}`;
  let isLatestSigned: boolean | null = null;
  let groupJson: { versions: Array<string>; group: number } | null = null;

  const fetcher = <R,>(url: string): Promise<R> =>
    fetch(url, { method: "GET" })
      .then((response) => response.json())
      .then((data) => data);

  if (!psAccessId) {
    throw new Error("You should set NEXT_PUBLIC_IRONCLAD_ACCESS_ID env");
  }

  if (!psGroupKey) {
    throw new Error("You should set NEXT_PUBLIC_IRONCLAD_GROUP_KEY env");
  }

  // NOTE https://clickwrap-developer.ironcladapp.com/reference/get-the-latest-versions-signed
  try {
    const latestSigned = await fetcher<{ [key: number]: boolean }>(
      latestSignedUrl
    );

    if (!latestSigned) {
      throw Error;
    }

    isLatestSigned = Object.values(latestSigned).every((isLatest) => isLatest);
  } catch (error) {
    console.error({
      error,
      message: "Error while fetching last signed contracts",
    });

    toast.error(
      "Something went wrong with the terms signature. Please try again."
    );
  }

  try {
    const groupData = await fetcher<{
      versions: Array<string>;
      group: number;
    }>(retrieveGroupUrl);

    if (!groupData) {
      throw Error;
    }

    groupJson = groupData;
  } catch (error) {
    console.error({
      error,
      message: "Error while group JSON",
    });

    toast.error(
      "Something went wrong with the terms signature. Please try again."
    );
  }

  const acceptanceBody = {
    et: "agreed",
    gkey: psGroupKey, // cspell:disable-line
    gid: groupJson?.group,
    sid: psAccessId,
    sig: params.signerId,
    vid: groupJson?.versions.join(","),
  };

  // https://clickwrap-developer.ironcladapp.com/reference/send-contracts-signedaccepted-by-signer
  const sendAcceptance = async (): Promise<void | never> => {
    const res = await fetch(`${activityApiUrl}/send`, {
      body: JSON.stringify(acceptanceBody),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    if (!res.ok) {
      console.log("Error while sending acceptance", res);
      throw new Error("Error while sending acceptance");
    }
  };

  // NOTE Use isLatestSigned if you need to check if user accepted latest versions of contracts
  // Use sendAcceptance when you need sign docs
  // NOTE if proper env vars are not set (e.g. because on staging/dev we don't sign ToS), the signature reporting will be bypassed
  // WARNING critical to set the proper env vars on production
  return {
    isLatestSigned,
    sendAcceptance,
  };
}
