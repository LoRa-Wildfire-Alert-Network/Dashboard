export type Permission =
  | "view_nodes"
  | "subscribe_nodes";

export const ALL_PERMISSIONS: Permission[] = [
  "view_nodes",
  "subscribe_nodes",
];

export interface OrgRole {
  id: number;
  org_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  permissions: Permission[];
}

export interface OrgMember {
  user_id: string;
  email: string;
  name: string | null;
  clerk_role: string;
  assigned_role: OrgRole | null;
}
