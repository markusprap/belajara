"use client"

import * as React from "react"
import { BookOpen, Compass, Home, Settings, User, GraduationCap, LogOut } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { getUser, clearToken } from "@/lib/api"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [isInstructor, setIsInstructor] = React.useState(false)

  React.useEffect(() => {
    const u = getUser()
    setIsInstructor(!!u?.is_instructor)
  }, [])

  const handleLogout = () => {
    clearToken()
    window.location.href = "/login"
  }

  const studentNav = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Mata Kuliah", url: "/courses", icon: BookOpen },
    { title: "Eksplorasi (AI)", url: "/explore", icon: Compass },
    { title: "Profil", url: "/profile", icon: User },
    { title: "Pengaturan", url: "/settings", icon: Settings },
  ]

  const instructorNav = [
    { title: "Dashboard Dosen", url: "/instructor", icon: Home },
    { title: "Portal Dosen", url: "/instructor", icon: GraduationCap },
    { title: "Profil", url: "/profile", icon: User },
    { title: "Pengaturan", url: "/settings", icon: Settings },
  ]

  const navItems = isInstructor ? instructorNav : studentNav

  return (
    <Sidebar variant="inset" {...props} className="border-r-border bg-white">
      <SidebarHeader className="p-4">
        <h1 className="text-2xl font-heading font-bold tracking-tight text-[#060708]">
          Belajara.
        </h1>
        {isInstructor && (
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">
            Portal Dosen
          </p>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-accent">Menu Utama</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton render={<a href={item.url} />}>
                    <item.icon className="text-muted-foreground" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-[#CF3A1F] hover:bg-[#CF3A1F]/10 hover:text-[#CF3A1F] cursor-pointer">
              <LogOut className="h-4 w-4" />
              <span>Keluar (Logout)</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
