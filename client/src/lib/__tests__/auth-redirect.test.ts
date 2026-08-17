import { describe, expect, it } from "vitest";
import { shouldRedirectToLogin } from "../auth-redirect";

describe("shouldRedirectToLogin", () => {
  it("does not redirect public routes when auth.me is unauthorized", () => {
    expect(shouldRedirectToLogin(true, "/")).toBe(false);
    expect(shouldRedirectToLogin(true, "/login")).toBe(false);
    expect(shouldRedirectToLogin(true, "/register")).toBe(false);
    expect(shouldRedirectToLogin(true, "/forgot-password")).toBe(false);
  });

  it("redirects protected routes when auth.me is unauthorized", () => {
    expect(shouldRedirectToLogin(true, "/dashboard")).toBe(true);
    expect(shouldRedirectToLogin(true, "/estrategias")).toBe(true);
  });

  it("never redirects authenticated requests", () => {
    expect(shouldRedirectToLogin(false, "/dashboard")).toBe(false);
    expect(shouldRedirectToLogin(false, "/login")).toBe(false);
  });
});
