import { requireRole } from "./requireRole.js";

export const requirePlatformAuth = requireRole(["PLATFORM_ADMIN"], {
  loginPath: "/platform/login"
});
