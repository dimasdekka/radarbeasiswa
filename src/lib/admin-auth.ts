import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * Returns the authenticated admin user, or null if not authenticated/not admin.
 * Per PRD section 4.12 — basic admin protection for demo.
 */
export async function requireAdmin() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, role: true },
  });

  if (!dbUser || dbUser.role !== "ADMIN") return null;
  return dbUser;
}
