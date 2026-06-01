import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background bg-dots">
      <AdminNav email={admin.email} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
