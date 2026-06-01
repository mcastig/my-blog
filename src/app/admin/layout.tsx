import { AdminNav } from "@/components/admin/AdminNav/AdminNav";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  let firstName: string | null = null;
  let lastName: string | null = null;

  if (session) {
    const [user] = await db
      .select({ firstName: adminUsers.firstName, lastName: adminUsers.lastName })
      .from(adminUsers)
      .where(eq(adminUsers.id, session.userId))
      .limit(1);
    firstName = user?.firstName ?? null;
    lastName = user?.lastName ?? null;
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <AdminNav
        username={session?.username ?? ""}
        firstName={firstName}
        lastName={lastName}
      />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">{children}</main>
    </div>
  );
}
