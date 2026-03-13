import type { Metadata } from "next";
import "../src/index.css";
import { LanguageProvider } from "@/src/contexts/LanguageContext";
import { AppSidebar } from "@/src/components/app-sidebar";
import { SidebarProvider } from "@/src/components/ui/sidebar";

export const metadata: Metadata = {
  title: "Visa CRM",
  description: "Visa CRM Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <LanguageProvider>
          <SidebarProvider>
            <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
              <AppSidebar />
              <div className="flex-1 flex flex-col overflow-auto">
                {children}
              </div>
            </div>
          </SidebarProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
