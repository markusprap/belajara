"use client"

import * as React from "react"
import { BookOpen, Compass, Home, Settings, User, GraduationCap, LogOut, Info } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getUser, clearToken } from "@/lib/api"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [isInstructor, setIsInstructor] = React.useState(false)
  const [user, setUserState] = React.useState<any>(null)
  
  const [profileOpen, setProfileOpen] = React.useState(false)
  const [settingsOpen, setSettingsOpen] = React.useState(false)

  React.useEffect(() => {
    const u = getUser()
    setUserState(u)
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
    { title: "Profil", onClick: () => setProfileOpen(true), icon: User },
    { title: "Pengaturan", onClick: () => setSettingsOpen(true), icon: Settings },
  ]

  const instructorNav = [
    { title: "Dashboard Dosen", url: "/instructor", icon: Home },
    { title: "Portal Dosen", url: "/instructor", icon: GraduationCap },
    { title: "Profil", onClick: () => setProfileOpen(true), icon: User },
    { title: "Pengaturan", onClick: () => setSettingsOpen(true), icon: Settings },
  ]

  const navItems = isInstructor ? instructorNav : studentNav

  return (
    <>
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
                    {item.onClick ? (
                      <SidebarMenuButton onClick={item.onClick} className="cursor-pointer">
                        <item.icon className="text-muted-foreground" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton render={<a href={item.url} />}>
                        <item.icon className="text-muted-foreground" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    )}
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

      {/* Profil Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-[#060708] flex items-center gap-2">
              <User className="h-5 w-5 text-accent" /> Profil Pengguna
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-[#FAF9FB] border border-border">
              <div className="h-12 w-12 rounded-full bg-[#C6B5BF]/25 flex items-center justify-center text-primary font-heading font-bold text-lg">
                {user?.first_name?.charAt(0) || user?.username?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div>
                <h3 className="font-heading font-bold text-primary">
                  {user?.first_name ? `${user.first_name} ${user.last_name || ""}` : user?.username || "Pengguna Belajara"}
                </h3>
                <p className="text-xs text-muted-foreground">{user?.email || "No Email"}</p>
              </div>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Username:</span>
                <span className="font-semibold text-primary">{user?.username}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Peran (Role):</span>
                <span className="font-semibold text-primary">
                  {user?.is_instructor ? "Dosen / Pengajar" : "Mahasiswa"}
                </span>
              </div>
              {!user?.is_instructor && (
                <>
                  <div className="flex justify-between py-1.5 border-b border-border">
                    <span className="text-muted-foreground">NIM:</span>
                    <span className="font-semibold text-primary">{user?.nim || "2201010101"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border">
                    <span className="text-muted-foreground">Jurusan:</span>
                    <span className="font-semibold text-primary">{user?.jurusan || "Informatika"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border">
                    <span className="text-muted-foreground">Universitas:</span>
                    <span className="font-semibold text-primary">{user?.universitas || "Universitas Indonesia"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border">
                    <span className="text-muted-foreground">Semester:</span>
                    <span className="font-semibold text-primary">{user?.semester || 3}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Status Akun:</span>
                <span className={`font-semibold ${user?.is_premium ? "text-[#CF3A1F]" : "text-muted-foreground"}`}>
                  {user?.is_premium ? "Premium (Akses Penuh)" : "Free (Terbatas)"}
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pengaturan Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-[#060708] flex items-center gap-2">
              <Settings className="h-5 w-5 text-accent" /> Pengaturan Aplikasi
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-4 rounded-lg bg-[#FAF9FB] border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-primary">Bahasa (Language)</span>
                <select className="text-xs border rounded p-1 bg-white" defaultValue="id">
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English (US)</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-primary">Tema Tampilan</span>
                <select className="text-xs border rounded p-1 bg-white" defaultValue="light">
                  <option value="light">Terang (Qurtuba Light)</option>
                  <option value="dark" disabled>Gelap (Mendatang)</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-primary">Notifikasi Email</span>
                <input type="checkbox" defaultChecked />
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 justify-center mt-2">
              <Info className="h-3.5 w-3.5" /> Belajara v1.0.0-mvp &bull; Protected by JWT HMAC-SHA512
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
