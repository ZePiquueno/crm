import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1 w-full max-w-full overflow-hidden flex flex-col bg-background">
          <header className="px-5 py-3 min-h-[56px] border-b border-border flex items-center justify-between bg-card/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded-md" />
            <ThemeToggle />
          </header>
          <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </SidebarProvider>
    </TooltipProvider>
  );
}
