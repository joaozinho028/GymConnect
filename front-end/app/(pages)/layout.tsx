"use client";

import Header from "@/components/Header";

export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLogout={() => console.log("logout")} />
      {/* <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} /> */}
      <main className="pt-20 px-4 md:px-8">{children}</main>
    </div>
  );
}
