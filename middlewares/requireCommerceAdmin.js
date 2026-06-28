import { requireRole } from "./requireRole.js";

export const requireCommerceAdmin = requireRole(["PLATFORM_ADMIN", "COMMERCE_ADMIN"]);
