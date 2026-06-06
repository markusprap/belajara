"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  BookOpen,
  Compass,
  Home,
  Settings,
  User,
  GraduationCap,
  LogOut,
  Search,
  Crown,
  MoreVertical,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from "lucide-react"
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
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getUser, clearToken } from "@/lib/api"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const [user, setUser] = React.useState<any>(null)
  const [isInstructor, setIsInstructor] = React.useState(false)
  const pathname = usePathname()

  React.useEffect(() => {
    const u = getUser()
    setUser(u)
    setIsInstructor(!!u?.is_instructor)

    // Onboarding guard: redirect if profile is incomplete
    if (u && u.is_onboarded === false && pathname !== "/onboarding") {
      router.push("/onboarding")
    }
  }, [pathname, router])

  const handleLogout = () => {
    clearToken()
    window.location.href = "/login"
  }

  const studentNav = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Katalog Kelas", url: "/catalog", icon: Search },
    { title: "Mata Kuliah", url: "/courses", icon: BookOpen },
    { title: "Eksplorasi (AI)", url: "/explore", icon: Compass },
    { title: "Upgrade Plan", url: "/pricing", icon: Crown },
  ]

  const instructorNav = [
    { title: "Portal Dosen", url: "/instructor", icon: Home },
  ]

  const navItems = isInstructor ? instructorNav : studentNav

  const getInitials = (first: string, last: string) => {
    if (!first) return "M"
    return `${first[0]}${last ? last[0] : ""}`.toUpperCase()
  }

  return (
    <Sidebar variant="inset" {...props} className="border-r border-[#E8E5E9] bg-white shadow-xs">
      {/* Brand Header */}
      <SidebarHeader className="p-5 border-b border-[#F3F1F4] bg-[#FAF9FB]/50">
        <div className="flex items-center gap-3">
          {/* Elegant geometric logo container */}
          <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-[#060708] text-white shadow-xs">
            <GraduationCap className="h-5 w-5 stroke-[1.5]" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-black tracking-tight text-[#060708] flex items-baseline">
              Belajara<span className="text-[#CF3A1F] font-bold">.</span>
            </h1>
            <p className="text-[9px] font-heading font-medium tracking-widest text-[#7E7C82] uppercase mt-0.5">
              {isInstructor ? "Portal Dosen" : "Platform Belajar AI"}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4 no-scrollbar">
        {/* Navigation Group */}
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-3 mb-2 font-heading text-[10px] font-bold uppercase tracking-wider text-[#7E7C82]">
            Menu Utama
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.url || pathname.startsWith(item.url + "/")
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={<a href={item.url} />}
                      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                        isActive
                          ? "bg-[#060708] text-white font-medium shadow-xs"
                          : "text-[#7E7C82] hover:text-[#060708] hover:bg-[#FAF9FB]"
                      }`}
                    >
                      <item.icon className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                        isActive ? "text-[#CF3A1F]" : "text-[#7E7C82] group-hover:text-[#060708]"
                      }`} />
                      <span className="text-xs">{item.title}</span>
                      
                      {/* Active indicator dot */}
                      {isActive && (
                        <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-[#CF3A1F]" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Promo Upgrade / Status Card */}
        {!isInstructor && user && (() => {
          const isPremium = !!user.is_premium;
          const tier = user.subscription_tier || (isPremium ? "scholar" : "free");
          const isPro = tier === "pro";

          if (isPremium) {
            return (
              <div className="mt-8 px-2">
                <div 
                  className="p-4 rounded-2xl border shadow-xs relative overflow-hidden group transition-all duration-300"
                  style={{
                    borderColor: isPro ? "rgba(207, 58, 31, 0.3)" : "rgba(198, 181, 191, 0.6)",
                    background: isPro 
                      ? "linear-gradient(135deg, #FFF8F7 0%, #FDECEA 100%)" 
                      : "linear-gradient(135deg, #FAF9FB 0%, #F0EBF0 100%)"
                  }}
                >
                  <div 
                    className="absolute top-0 right-0 p-1 text-white rounded-bl-xl"
                    style={{ backgroundColor: isPro ? "#CF3A1F" : "#C6B5BF" }}
                  >
                    <Crown className="h-3 w-3 fill-white" />
                  </div>
                  <h3 className="font-heading font-bold text-xs text-[#060708]">
                    {isPro ? "Akun Pro Aktif" : "Akun Scholar Aktif"}
                  </h3>
                  <p className="text-[10px] text-[#7E7C82] mt-1 leading-relaxed">
                    {isPro 
                      ? "Fitur analitik premium & bantuan prioritas AI aktif."
                      : "Fitur KRS AI rekomendasi tanpa batas & modul premium aktif."}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <Badge 
                      className="text-[9px] hover:bg-transparent border-0 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: isPro ? "rgba(207, 58, 31, 0.1)" : "rgba(198, 181, 191, 0.2)",
                        color: isPro ? "#CF3A1F" : "#060708"
                      }}
                    >
                      {isPro ? "PRO MEMBER" : "SCHOLAR MEMBER"}
                    </Badge>
                  </div>
                </div>
              </div>
            )
          }

          return (
            <div className="mt-8 px-2">
              <div className="p-4 rounded-2xl bg-[#060708] text-white shadow-xs relative overflow-hidden group">
                <div className="absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-[#CF3A1F]/10 blur-xl group-hover:bg-[#CF3A1F]/20 transition-all duration-300" />
                <div className="flex items-center gap-1 text-[#CF3A1F] mb-1">
                  <Sparkles className="h-3.5 w-3.5 fill-current" />
                  <span className="font-heading font-extrabold text-[10px] uppercase tracking-wider">Upgrade Belajara</span>
                </div>
                <h3 className="font-heading font-bold text-xs">Rekomendasi KRS AI</h3>
                <p className="text-[9px] text-[#FAF9FB]/70 mt-1 leading-relaxed">
                  Buka rekomendasi mata kuliah AI & bank soal premium sekarang.
                </p>
                <a
                  href="/pricing"
                  className="mt-3 w-full bg-[#FAF9FB] hover:bg-[#F3F1F4] text-[#060708] text-[10px] font-bold py-2 px-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-1 group/btn"
                >
                  Mulai Langganan
                  <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                </a>
              </div>
            </div>
          )
        })()}

        {/* Instructor Assistant Card */}
        {isInstructor && (
          <div className="mt-8 px-2">
            <div className="p-4 rounded-2xl border border-[#E8E5E9] bg-[#FAF9FB] shadow-xs">
              <div className="flex items-center gap-1 text-[#060708] mb-1 font-heading font-bold text-xs">
                <ShieldCheck className="h-4 w-4 text-[#CF3A1F]" />
                <span>Portal Instruktur</span>
              </div>
              <p className="text-[10px] text-[#7E7C82] leading-relaxed mt-1">
                Kelola mata kuliah, evaluasi kuis, diskusikan modul, dan lihat analisis kemajuan mahasiswa.
              </p>
            </div>
          </div>
        )}
      </SidebarContent>

      {/* Profile Footer with Dropdown */}
      <SidebarFooter className="p-4 border-t border-[#F3F1F4] bg-[#FAF9FB]/50">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-[#F3F1F4] transition-all duration-200 text-left outline-hidden group cursor-pointer bg-transparent border-0">
            <Avatar className="h-9 w-9 border border-[#E8E5E9] transition-transform duration-200 group-hover:scale-105 shrink-0">
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback className="bg-[#060708] text-white text-xs font-bold">
                {getInitials(user?.first_name || "", user?.last_name || "")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-[#060708] truncate">
                {user?.first_name ? `${user.first_name} ${user.last_name || ""}` : (user?.username || "Pengguna Belajara")}
              </h4>
              <p className="text-[10px] text-[#7E7C82] truncate mt-0.5">
                {user?.email || "belajar@lms.com"}
              </p>
            </div>
            <MoreVertical className="h-4 w-4 text-[#7E7C82] group-hover:text-[#060708] shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl border-[#E8E5E9] p-1 shadow-md bg-white">
            <div className="px-2 py-1.5 text-[10px] font-bold text-[#7E7C82] uppercase tracking-wider">
              Akun Saya
            </div>
            <DropdownMenuItem className="rounded-lg text-xs cursor-pointer focus:bg-[#FAF9FB] focus:text-[#060708] p-0">
              <a href="/profile" className="flex items-center gap-2 w-full px-2.5 py-2 text-inherit no-underline">
                <User className="h-3.5 w-3.5 shrink-0" />
                <span>Lihat Profil</span>
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg text-xs cursor-pointer focus:bg-[#FAF9FB] focus:text-[#060708] p-0">
              <a href="/settings" className="flex items-center gap-2 w-full px-2.5 py-2 text-inherit no-underline">
                <Settings className="h-3.5 w-3.5 shrink-0" />
                <span>Pengaturan</span>
              </a>
            </DropdownMenuItem>
            <SidebarSeparator className="my-1 bg-[#F3F1F4]" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="rounded-lg text-xs cursor-pointer text-[#CF3A1F] focus:bg-[#CF3A1F]/10 focus:text-[#CF3A1F] font-medium px-2.5 py-2"
            >
              <LogOut className="h-3.5 w-3.5 mr-2 shrink-0" />
              <span>Keluar (Logout)</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
