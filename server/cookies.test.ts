import { describe, it, expect } from "vitest";
import { getSessionCookieOptions } from "./_core/cookies";

describe("Cookie Configuration", () => {
  it("should return correct cookie options for secure requests", () => {
    const mockReq = {
      protocol: "https",
      hostname: "example.manus.computer",
      headers: {},
    } as any;

    const options = getSessionCookieOptions(mockReq);

    expect(options.httpOnly).toBe(true);
    expect(options.path).toBe("/");
    expect(options.sameSite).toBe("lax");
    expect(options.secure).toBe(true);
  });

  it("should return correct cookie options for non-secure requests on localhost", () => {
    const mockReq = {
      protocol: "http",
      hostname: "localhost",
      headers: {},
    } as any;

    const options = getSessionCookieOptions(mockReq);

    expect(options.httpOnly).toBe(true);
    expect(options.path).toBe("/");
    expect(options.sameSite).toBe("lax");
    expect(options.secure).toBe(false);
  });

  it("should detect secure requests via x-forwarded-proto header", () => {
    const mockReq = {
      protocol: "http",
      hostname: "example.manus.computer",
      headers: {
        "x-forwarded-proto": "https",
      },
    } as any;

    const options = getSessionCookieOptions(mockReq);

    expect(options.secure).toBe(true);
  });

  it("should handle comma-separated x-forwarded-proto header", () => {
    const mockReq = {
      protocol: "http",
      hostname: "example.manus.computer",
      headers: {
        "x-forwarded-proto": "https, http",
      },
    } as any;

    const options = getSessionCookieOptions(mockReq);

    expect(options.secure).toBe(true);
  });

  it("should use sameSite=lax which is valid with secure=false on localhost", () => {
    // SameSite=Lax is valid with Secure=false
    // SameSite=None requires Secure=true
    // This test ensures we're using the correct combination
    const mockReq = {
      protocol: "http",
      hostname: "localhost",
      headers: {},
    } as any;

    const options = getSessionCookieOptions(mockReq);

    // This combination is valid in all browsers
    expect(options.sameSite).toBe("lax");
    expect(options.secure).toBe(false);
  });
});
