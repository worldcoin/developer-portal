import getConfig from "next/config";

type LastSignedResponse = Record<string, boolean>;

type GroupDataResponse = {
  versions: Array<string>;
  group: number;
};

export class IroncladActivityApi {
  private _psAccessId: string;
  private _psGroupKey: string;
  private _baseUrl: string;
  private _isLatestSigned: boolean | null;
  private _groupData: GroupDataResponse | null;

  constructor() {
    const { publicRuntimeConfig } = getConfig();

    this._psAccessId =
      publicRuntimeConfig.NEXT_PUBLIC_IRONCLAD_ACCESS_ID as string;

    this._psGroupKey =
      publicRuntimeConfig.NEXT_PUBLIC_IRONCLAD_GROUP_KEY as string;

    this._baseUrl = "https://pactsafe.io";
    this._isLatestSigned = null;
    this._groupData = null;
  }

  private _validateVariables() {
    if (!this._psAccessId) {
      throw new Error("You should set NEXT_PUBLIC_IRONCLAD_ACCESS_ID env");
    }

    if (!this._psGroupKey) {
      throw new Error("You should set NEXT_PUBLIC_IRONCLAD_GROUP_KEY env");
    }
  }

  public async getIsLastSigned(signerId: string) {
    if (!this._isLatestSigned) {
      this._validateVariables();

      const res = await fetch(
        `${this._baseUrl}/latest?sid=${this._psAccessId}&sig=${signerId}&gkey=${this._psGroupKey}`
      );

      if (!res.ok) {
        throw new Error("Unable to fetch lastSigned");
      }

      const latestSigned: LastSignedResponse = await res.json();

      if (!latestSigned) {
        throw new Error("Unable to get lastSigned");
      }

      this._isLatestSigned = Object.values(latestSigned).every(
        (isLatest) => isLatest
      );
    }

    return this._isLatestSigned;
  }

  public async sendAcceptance(signerId: string) {
    this._validateVariables();

    if (!this._groupData) {
      const res = await fetch(
        `${this._baseUrl}/load/json?sid=${this._psAccessId}&gkey=${this._psGroupKey}`
      );

      if (!res.ok) {
        throw new Error("Unable to fetch group data");
      }

      const groupData: GroupDataResponse = await res.json();
      this._groupData = groupData;
    }

    const res = await fetch(`${this._baseUrl}/send`, {
      body: JSON.stringify({
        et: "agreed",
        gkey: this._psGroupKey,
        sid: this._psAccessId,
        sig: signerId,
        gid: this._groupData!.group,
        vid: this._groupData!.versions.join(","),
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    // NOTE: response is not json here, so we are just checking if it's ok
    if (!res.ok) {
      console.log("Error while sending acceptance", res);
      throw new Error("Error while sending acceptance");
    }
  }
}
