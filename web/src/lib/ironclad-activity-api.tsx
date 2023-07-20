import { toast } from "react-toastify";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();

const psAccessId = publicRuntimeConfig.NEXT_PUBLIC_IRONCLAD_ACCESS_ID as string;
const psGroupKey = publicRuntimeConfig.NEXT_PUBLIC_IRONCLAD_GROUP_KEY as string;
const baseUrl = "https://pactsafe.io";
let isLatestSigned: boolean | null = null;
let groupData: { versions: Array<string>; group: number } | null = null;

const fetcher = <R,>(url: string): Promise<R> =>
  fetch(url, { method: "GET" })
    .then((response) => response.json())
    .then((data) => data);

function validateVariables() {
  if (!psAccessId) {
    throw new Error("You should set NEXT_PUBLIC_IRONCLAD_ACCESS_ID env");
  }

  if (!psGroupKey) {
    throw new Error("You should set NEXT_PUBLIC_IRONCLAD_GROUP_KEY env");
  }
}

export async function getIsLastSigned(signerId: string) {
  if (!isLatestSigned) {
    validateVariables();

    const latestSigned = await fetcher<{ [key: number]: boolean }>(
      `${baseUrl}/latest?sid=${psAccessId}&sig=${signerId}&gkey=${psGroupKey}`
    );

    if (!latestSigned) {
      throw new Error("Unable to get lastSigned");
    }

    isLatestSigned = Object.values(latestSigned).every((isLatest) => isLatest);
  }

  return isLatestSigned;
}

async function fetchGroupData() {
  const res = await fetcher<{
    versions: Array<string>;
    group: number;
  }>(`${baseUrl}/load/json?sid=${psAccessId}&gkey=${psGroupKey}`);

  if (!res) {
    throw Error("Unable to fetch group data");
  }

  groupData = res;
}

export async function sendAcceptance(signerId: string) {
  validateVariables();

  if (!groupData) {
    await fetchGroupData();
  }

  const res = await fetch(`${baseUrl}/send`, {
    body: JSON.stringify({
      et: "agreed",
      gkey: psGroupKey,
      sid: psAccessId,
      sig: signerId,
      gid: groupData!.group,
      vid: groupData!.versions.join(","),
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  if (!res.ok) {
    console.log("Error while sending acceptance", res);
    throw new Error("Error while sending acceptance");
  }
}
