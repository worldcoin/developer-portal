import { toast } from "react-toastify";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();

export class IronClad {
  #psAccessId = publicRuntimeConfig.NEXT_PUBLIC_IRONCLAD_ACCESS_ID as string;
  #psGroupKey = publicRuntimeConfig.NEXT_PUBLIC_IRONCLAD_GROUP_KEY as string;
  #baseUrl = "https://pactsafe.io";

  #isLatestSigned: boolean | null = null;
  #groupData: { versions: Array<string>; group: number } | null = null;

  constructor(public signerId: string) {
    if (!this.#psAccessId) {
      throw new Error("You should set NEXT_PUBLIC_IRONCLAD_ACCESS_ID env");
    }

    if (!this.#psGroupKey) {
      throw new Error("You should set NEXT_PUBLIC_IRONCLAD_GROUP_KEY env");
    }
  }

  #fetcher = <R,>(url: string): Promise<R> =>
    fetch(url, { method: "GET" })
      .then((response) => response.json())
      .then((data) => data);

  get isLatestSigned() {
    return new Promise(async (resolve, reject) => {
      if (!this.#isLatestSigned) {
        const latestSigned = await this.#fetcher<{ [key: number]: boolean }>(
          `${this.#baseUrl}/latest?sid=${this.#psAccessId}&sig=${
            this.signerId
          }&gkey=${this.#psGroupKey}`
        );

        if (!latestSigned) {
          reject(new Error("Unable to get lastSigned"));
        }

        this.#isLatestSigned = Object.values(latestSigned).every(
          (isLatest) => isLatest
        );
      }

      resolve(this.#isLatestSigned);
    });
  }

  async #fetchGroupData() {
    const res = await this.#fetcher<{
      versions: Array<string>;
      group: number;
    }>(
      `${this.#baseUrl}/load/json?sid=${this.#psAccessId}&gkey=${
        this.#psGroupKey
      }`
    );

    if (!res) {
      throw Error("Unable to fetch group data");
    }

    this.#groupData = res;
  }

  async sendAcceptance() {
    if (!this.#groupData) {
      await this.#fetchGroupData();
    }

    const res = await fetch(`${this.#baseUrl}/send`, {
      body: JSON.stringify({
        et: "agreed",
        gkey: this.#psGroupKey,
        sid: this.#psAccessId,
        sig: this.signerId,
        gid: this.#groupData!.group,
        vid: this.#groupData!.versions.join(","),
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    if (!res.ok) {
      console.log("Error while sending acceptance", res);
      throw new Error("Error while sending acceptance");
    }
  }
}
