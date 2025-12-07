import { describe, it, expect } from "vitest";
import { verifySendGridConnection } from "./sendgrid";

describe("SendGrid Service", () => {
  it("should verify SendGrid API key is valid", async () => {
    const result = await verifySendGridConnection();

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  }, 10000); // 10 second timeout for API call
});
