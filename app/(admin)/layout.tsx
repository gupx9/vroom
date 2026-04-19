import { logout } from "@/app/actions/auth";
import { verifySession } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import AdminNav from "@/app/components/AdminNav";
import NotificationSystem from "@/app/components/NotificationSystem";
import GlobalAuctionFinalizer from "@/app/components/GlobalAuctionFinalizer";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession();

  if (!session?.userId || session.role !== "admin") {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { username: true },
  });

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <GlobalAuctionFinalizer />

      {/* Top Navigation Bar */}
      <header className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-6">
          {/* Logo */}
          <Link
            href="/admin/moderation"
            className="hover:opacity-80 transition-opacity shrink-0"
          >
            <Image
              src="/logo.png"
              alt="VROOM.IO"
              width={220}
              height={64}
              className="h-30 w-auto"
            />
          </Link>

          {/* Center nav links */}
          <AdminNav />

          {/* Right: username + logout */}
          <div className="flex items-center gap-3 shrink-0">
            <NotificationSystem />
            <span className="text-sm text-zinc-400 hidden sm:block">
              <span className="text-white font-medium">{user?.username}</span>
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600 rounded-full mix-blend-screen filter blur-[128px] opacity-[0.12] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
