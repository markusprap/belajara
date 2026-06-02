"use client"

import * as React from "react"
import { BookOpen, Compass, Home, Settings, User, GraduationCap } from "lucide-react"
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
} from "@/components/ui/sidebar"
import { getUser } from "@/lib/api"

const studentNav = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Mata Kuliah", url: "/courses", icon: BookOpen },
  { title: "Eksplorasi (AI)", url: "/explore", icon: Compass },
  { title: "Profil", url: "#", icon: User },
  { title: "Pengaturan", url: "#", icon: Settings },
]

const instructorNav = [
  { title: "Dashboard Dosen", url: "/instructor", icon: Home },
  { title: "Portal Dosen", url: "/instructor", icon: GraduationCap },
  { title: "Profil", url: "#", icon: User },
  { title: "Pengaturan", url: "#", icon: Settings },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [isInstructor, setIsInstructor] = React.useState(false)

  React.useEffect(() => {
    const user = getUser()
    setIsInstructor(!!user?.is_instructor)
  }, [])

  const navItems = isInstructor ? instructorNav : studentNav

  return (
    <Sidebar variant="inset" {...props} className="border-r-border bg-white">
      <SidebarHeader className="p-4">
        <h1 className="text-2xl font-heading font-bold tracking-tight text-primary">
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
    </Sidebar>
  )
}
