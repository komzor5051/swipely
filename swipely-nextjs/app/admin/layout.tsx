import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "./components/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmails = (process.env.ADMIN_EMAIL || "").split(",").map((e) => e.trim()).filter(Boolean);
  if (!user || !user.email || !adminEmails.includes(user.email)) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#E8E8E4] px-8 py-3.5 flex items-center justify-between sticky top-0 z-10">
          <p className="text-sm text-[#9CA3AF]">
            {new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <span className="text-[#9CA3AF] text-sm">{user.email}</span>
        </header>
        <main className="flex-1 px-8 py-8 max-w-6xl w-full">{children}</main>
      </div>
    </div>
  );
}
