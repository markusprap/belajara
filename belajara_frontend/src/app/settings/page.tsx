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
import { Label } from "@/components/ui/label"
import { Globe, Bell, Info, Settings } from "lucide-react"
import { getToken } from "@/lib/api"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const router = useRouter()

  React.useEffect(() => {
    const token = getToken()
    if (!token) {
      router.push("/login")
    }
  }, [router])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="font-heading text-lg font-semibold text-[#060708]">
            Pengaturan
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6 bg-[#FAF9FB]">
          <div className="max-w-3xl space-y-6">
            <div>
              <h1 className="text-3xl font-heading font-bold text-[#060708]">Pengaturan Aplikasi</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Sesuaikan preferensi sistem pembelajaran Belajara Anda.
              </p>
            </div>

            <Card className="bg-white border border-border shadow-sm">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="font-heading text-lg text-[#060708] flex items-center gap-2">
                  <Globe className="h-5 w-5 text-accent" /> Lokalisasi & Tampilan
                </CardTitle>
                <CardDescription className="text-xs">Sesuaikan bahasa dan tema visual aplikasi.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-semibold text-primary">Bahasa Sistem</Label>
                    <p className="text-xs text-muted-foreground">Bahasa yang digunakan untuk menu dan sistem.</p>
                  </div>
                  <select className="text-xs border rounded-lg p-2 bg-white w-48 focus:ring-accent" defaultValue="id">
                    <option value="id">Bahasa Indonesia</option>
                    <option value="en">English (US)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#FAF9FB]">
                  <div>
                    <Label className="text-sm font-semibold text-primary">Tema Aplikasi</Label>
                    <p className="text-xs text-muted-foreground">Pilih skema warna tampilan aplikasi.</p>
                  </div>
                  <select className="text-xs border rounded-lg p-2 bg-white w-48 focus:ring-accent" defaultValue="light">
                    <option value="light">Terang (Qurtuba Light)</option>
                    <option value="dark" disabled>Gelap (Segera Hadir)</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-[#E8E5E9] shadow-sm">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="font-heading text-lg text-[#060708] flex items-center gap-2">
                  <Bell className="h-5 w-5 text-accent" /> Preferensi Notifikasi
                </CardTitle>
                <CardDescription className="text-xs">Kelola pemberitahuan aktivitas evaluasi dan forum.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-semibold text-primary">Notifikasi Email</Label>
                    <p className="text-xs text-muted-foreground">Dapatkan email rangkuman diskusi baru dan ulasan evaluasi.</p>
                  </div>
                  <input type="checkbox" className="h-4 w-4 accent-primary" defaultChecked />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    <Label className="text-sm font-semibold text-primary">Notifikasi Hasil Rekomendasi Rencana Studi AI</Label>
                    <p className="text-xs text-muted-foreground">Kirim notifikasi push ketika analisis dokumen silabus selesai.</p>
                  </div>
                  <input type="checkbox" className="h-4 w-4 accent-primary" defaultChecked />
                </div>
              </CardContent>
            </Card>

            <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 justify-center mt-6">
              <Info className="h-3.5 w-3.5" /> Belajara v1.0.0-mvp &bull; Protected by JWT HMAC-SHA512
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
