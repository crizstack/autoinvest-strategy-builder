export const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/404",
]);

export function shouldRedirectToLogin(isUnauthorized: boolean, currentPath: string) {
  return isUnauthorized && !PUBLIC_PATHS.has(currentPath);
}
