import { queryOptions } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { CMSItem } from "@/lib/cms";

// Shared with the Vercel functions that build these pages' <head> (see that file).
export { currentPrincipal, foundationMissions, foundationVision, groupStaff, profilePages, staffGroups } from "../../../api/_lib/profile";
export type { ProfilePage, StaffGroup } from "../../../api/_lib/profile";

export const principalQuery = queryOptions({ queryKey: ["public-content", "principal"], queryFn: () => apiGet<CMSItem[]>("/content/principal"), retry: false });
export const staffQuery = queryOptions({ queryKey: ["public-content", "staff"], queryFn: () => apiGet<CMSItem[]>("/content/staff"), retry: false });
