import { supabase } from "@/integrations/supabase/client";

export type AdminAccess = {
  userId: string;
  orgId: string;
  role: "admin" | "manager";
};

export async function getAdminAccess(): Promise<AdminAccess> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("Sign in with an organization administrator account.");

  const { data: membership, error } = await supabase
    .from("user_roles")
    .select("org_id, role")
    .eq("user_id", authData.user.id)
    .in("role", ["admin", "manager"])
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!membership) throw new Error("Your account does not have organization administrator access.");

  return { userId: authData.user.id, orgId: membership.org_id, role: membership.role };
}