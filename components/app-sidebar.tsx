"use client";

import * as React from "react"
import Link from "next/link"
import { LayoutDashboard, Settings, UserPlus } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Ícone do Facebook inline (sem dependência externa)
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    iconColor: "",
  },
  {
    title: "CRM",
    url: "/crm",
    icon: UserPlus,
    iconColor: "",
  },
  {
    title: "Facebook",
    url: "/facebook",
    icon: null,
    iconColor: "text-[#1877F2]",
  },
  {
    title: "Configurações",
    url: "/configuracoes",
    icon: Settings,
    iconColor: "",
  },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xl font-bold py-6 px-4 text-primary">Captação CRM</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url} className="flex items-center gap-2 px-3 py-2 -mx-2 hover:bg-sidebar-accent rounded-md transition-colors text-sidebar-foreground">
                      {item.icon ? (
                        <item.icon className={`w-5 h-5 text-sidebar-accent-foreground ${item.iconColor}`} />
                      ) : (
                        <FacebookIcon className={`w-5 h-5 ${item.iconColor}`} />
                      )}
                      <span className="font-medium text-[15px]">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
