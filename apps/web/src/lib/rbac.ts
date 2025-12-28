export type Role = "admin" | "moderator" | "viewer";

export function canModerate(claims?: any) {
  const role: Role | undefined = claims?.role || claims?.roles?.[0];
  return role === "admin" || role === "moderator";
}
