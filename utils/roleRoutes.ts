import type { UserRole } from "../types/user";

export type HomeRoute =
  | "/collector/dashboard"
  | "/admin/dashboard"
  | "/(resident)/(tabs)/dashboard";

export function getHomeRouteForRole(role?: UserRole | null): HomeRoute {
  if (role === "collector") {
    return "/collector/dashboard";
  }

  if (role === "admin") {
    return "/admin/dashboard";
  }

  return "/(resident)/(tabs)/dashboard";
}