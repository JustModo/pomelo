import type { Metadata } from "next";
import AdminSidebar from "@/components/admin/admin-sidebar";
import React from "react";

export const metadata: Metadata = {
  title: {
    default: "Admin Dashboard",
    template: "%s | Pomelo Admin",
  },
  description: "Administrative panel for Pomelo contest platform.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen w-full pt-12">
      <AdminSidebar />
      <div className="flex-1 w-full pb-16 md:pb-0">
        {children}
      </div>
    </main>
  );
}
