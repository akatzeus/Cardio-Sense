import { ReactNode } from "react";
import { Heart, LayoutDashboard, Activity, Brain, History, User, HelpCircle } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Live Monitor", url: "/monitor", icon: Activity },
  { title: "Predictions", url: "/predictions", icon: Brain },
  { title: "History", url: "/history", icon: History },
  { title: "Doctor", url: "/choose-doctor", icon: User },
  { title: "About / Help", url: "/about", icon: HelpCircle },
];

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar collapsible="icon">
          <div className="p-4 border-b">
            <Link to="/" className="flex items-center gap-2 font-bold text-lg">
              <Heart className="h-5 w-5 text-primary fill-primary shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">CardioSense</span>
            </Link>
          </div>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                        <NavLink to={item.url} end activeClassName="bg-sidebar-accent text-primary font-medium">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b flex items-center gap-4 px-4 bg-background">
            <SidebarTrigger />
            <h2 className="font-semibold text-lg truncate">
              {navItems.find((i) => i.url === location.pathname)?.title ?? "CardioSense"}
            </h2>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
