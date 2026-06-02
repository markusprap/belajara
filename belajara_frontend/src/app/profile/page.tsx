"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { User, GraduationCap } from "lucide-react"
import { getUser } from "@/lib/api"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = React.useState<any>(null)

  React.useEffect(() => {
    const u = getUser()
    if (!u) {
      router.push("/login")
    } else {
      setUser(u)
    }
  }, [router])

  if (!user) return null

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="font-heading text-lg font-semibold text-[#060708]">
            Profil Pengguna
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6 bg-[#FAF9FB]">
          <div className="max-w-3xl space-y-6">
            <div>
              <h1 className="text-3xl font-heading font-bold text-[#060708]">Profil Saya</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Kelola informasi pribadi dan data akademik Anda.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Profile Card Summary */}
              <Card className="md:col-span-1 bg-white border border-border shadow-sm flex flex-col items-center p-6 text-center">
                <div className="h-20 w-20 rounded-full bg-[#C6B5BF]/25 flex items-center justify-center text-[#060708] font-heading font-bold text-3xl mb-4">
                  {user.first_name?.charAt(0) || user.username?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <h3 className="font-heading font-bold text-xl text-[#060708] leading-tight">
                  {user.first_name ? `${user.first_name} ${user.last_name || ""}` : user.username}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">{user.email || "Tidak ada email"}</p>
                <div className="mt-4">
                  {user.is_premium ? (
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded bg-[#CF3A1F]/10 text-[#CF3A1F] border border-[#CF3A1F]/30">
                      Akses Premium
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded bg-muted text-muted-foreground border">
                      Akun Gratis
                    </span>
                  )}
                </div>
              </Card>

              {/* Profile Details */}
              <Card className="md:col-span-2 bg-white border border-border shadow-sm">
                <CardHeader className="pb-3 border-b border-border">
                  <CardTitle className="font-heading text-lg text-[#060708] flex items-center gap-2">
                    <User className="h-5 w-5 text-accent animate-pulse" /> Detail Akun
                  </CardTitle>
                  <CardDescription className="text-xs">Informasi dasar akun masuk Anda di Belajara.</CardDescription>
                </CardHeader>
                <CardContent className="divide-y divide-border pt-2 text-sm">
                  <div className="flex justify-between py-3">
                    <span className="text-muted-foreground">Username:</span>
                    <span className="font-semibold text-[#060708]">{user.username}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-semibold text-[#060708]">{user.email || "-"}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-muted-foreground">Peran Pengguna:</span>
                    <span className="font-semibold text-accent">
                      {user.is_instructor ? "Dosen / Pengajar" : "Mahasiswa"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Academic Section for Student */}
            {!user.is_instructor && (
              <Card className="bg-white border border-border shadow-sm">
                <CardHeader className="pb-3 border-b border-border">
                  <CardTitle className="font-heading text-lg text-[#060708] flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-accent" /> Informasi Akademik
                  </CardTitle>
                  <CardDescription className="text-xs">Informasi program studi dan semester aktif Anda.</CardDescription>
                </CardHeader>
                <CardContent className="divide-y divide-border pt-2 text-sm">
                  <div className="flex justify-between py-3">
                    <span className="text-muted-foreground">NIM (Nomor Induk Mahasiswa):</span>
                    <span className="font-semibold text-[#060708]">{user.nim || "2201010101"}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-muted-foreground">Program Studi / Jurusan:</span>
                    <span className="font-semibold text-[#060708]">{user.jurusan || "Informatika"}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-muted-foreground">Universitas / Kampus:</span>
                    <span className="font-semibold text-[#060708]">{user.universitas || "Universitas Indonesia"}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-muted-foreground">Semester Aktif:</span>
                    <span className="font-semibold text-[#060708]">Semester {user.semester || 3}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
