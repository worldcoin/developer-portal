import { POST } from "@/api/v2/app/submit-app-review";
import { NextRequest } from "next/server";

describe("/api/v2/app/submit-app-review", () => {
  it("Can successfully submit an app review", async () => {
    const mockReq = new NextRequest(
      "https://cdn.test.com/api/v2/app/submit-app-review",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proof: "proof",
          nullifierHash: "nullifierHash",
          merkleRoot: "merkleRoot",
          verificationLevel: "verificationLevel",
          rating: 3,
          country: "us",
          appId: "app_id",
        }),
      },
    );

    const res = await POST(mockReq);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body).toEqual({
      success: true,
    });
  });
});
