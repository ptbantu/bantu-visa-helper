import { SidebarProvider, SidebarTrigger } from "@/src/components/ui/sidebar";
import { TooltipProvider } from "@/src/components/ui/tooltip";
import { AppSidebar } from "./app-sidebar";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-slate-50">
          <AppSidebar />
          <main className="flex-1 flex flex-col relative">
            <SidebarTrigger className="absolute top-4 left-4 z-50 md:hidden" />
            {children}
          </main>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
