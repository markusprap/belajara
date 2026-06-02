"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2, CheckCircle } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = React.useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    nim: "",
    jurusan: "Informatika",
    universitas: "Universitas Indonesia",
    semester: "3"
  })
  
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validations
    if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim() || !formData.nim.trim()) {
      setError("Kolom Username, Email, Password, dan NIM wajib diisi.")
      return
    }

    if (formData.password.length < 6) {
      setError("Password minimal harus terdiri dari 6 karakter.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      await api.auth.register({
        ...formData,
        semester: parseInt(formData.semester)
      })
      setSuccess(true)
      setTimeout(() => {
        router.push("/login")
      }, 2500)
    } catch (err: any) {
      setError(err.message || "Registrasi gagal. NIM atau username mungkin sudah terdaftar.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="font-heading text-4xl font-bold tracking-tight text-primary">
            Belajara.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground font-medium">
            Buat akun Mahasiswa baru dan mulai optimalkan rencana studimu
          </p>
        </div>

        <Card className="border border-border bg-white shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold font-heading text-primary">Registrasi Mahasiswa</CardTitle>
            <CardDescription className="text-xs">
              Isi data akademik Anda dengan lengkap untuk sinkronisasi kurikulum AI.
            </CardDescription>
          </CardHeader>
          
          {success ? (
            <div className="p-8 text-center space-y-4 flex flex-col items-center justify-center min-h-[350px]">
              <div className="h-12 w-12 bg-accent/20 border border-accent/40 text-primary rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-xl font-bold text-primary">Registrasi Berhasil!</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Akun Anda berhasil didaftarkan. Mengalihkan Anda ke halaman login...
              </p>
              <Loader2 className="h-5 w-5 text-accent animate-spin mt-2" />
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {error && (
                  <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg flex items-start gap-2 border border-destructive/20">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Section: Akun Utama */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-accent border-b pb-1">Detail Kredensial</h3>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="username" className="text-xs font-semibold text-primary">Username *</Label>
                      <Input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="username_kamu"
                        value={formData.username}
                        onChange={handleChange}
                        className="bg-white border border-border rounded-lg"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-semibold text-primary">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="nama@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="bg-white border border-border rounded-lg"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-semibold text-primary">Password *</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Minimal 6 karakter"
                      value={formData.password}
                      onChange={handleChange}
                      className="bg-white border border-border rounded-lg"
                      disabled={loading}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="first_name" className="text-xs font-semibold text-primary">Nama Depan</Label>
                      <Input
                        id="first_name"
                        name="first_name"
                        type="text"
                        placeholder="Budi"
                        value={formData.first_name}
                        onChange={handleChange}
                        className="bg-white border border-border rounded-lg"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="last_name" className="text-xs font-semibold text-primary">Nama Belakang</Label>
                      <Input
                        id="last_name"
                        name="last_name"
                        type="text"
                        placeholder="Santoso"
                        value={formData.last_name}
                        onChange={handleChange}
                        className="bg-white border border-border rounded-lg"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Data Akademik */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-accent border-b pb-1">Informasi Akademik</h3>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="nim" className="text-xs font-semibold text-primary">NIM (Nomor Induk Mahasiswa) *</Label>
                      <Input
                        id="nim"
                        name="nim"
                        type="text"
                        placeholder="2201010101"
                        value={formData.nim}
                        onChange={handleChange}
                        className="bg-white border border-border rounded-lg"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="semester" className="text-xs font-semibold text-primary">Semester Saat Ini</Label>
                      <select
                        id="semester"
                        name="semester"
                        value={formData.semester}
                        onChange={handleChange}
                        className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm text-primary focus:outline-none cursor-pointer"
                        disabled={loading}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                          <option key={sem} value={sem}>Semester {sem}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="jurusan" className="text-xs font-semibold text-primary">Jurusan / Program Studi</Label>
                    <select
                      id="jurusan"
                      name="jurusan"
                      value={formData.jurusan}
                      onChange={handleChange}
                      className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm text-primary focus:outline-none cursor-pointer"
                      disabled={loading}
                    >
                      <option value="Informatika">Informatika</option>
                      <option value="Sistem Informasi">Sistem Informasi</option>
                      <option value="Teknik Komputer">Teknik Komputer</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="universitas" className="text-xs font-semibold text-primary">Universitas / Perguruan Tinggi</Label>
                    <Input
                      id="universitas"
                      name="universitas"
                      type="text"
                      placeholder="Universitas Indonesia"
                      value={formData.universitas}
                      onChange={handleChange}
                      className="bg-white border border-border rounded-lg"
                      disabled={loading}
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3 pt-4 border-t">
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg py-2.5 font-medium flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Mendaftarkan...</span>
                    </>
                  ) : (
                    <span>Daftar Sekarang</span>
                  )}
                </Button>
                <div className="text-xs text-center text-muted-foreground mt-2">
                  Sudah memiliki akun?{" "}
                  <Link
                    href="/login"
                    className="font-bold text-destructive hover:text-destructive/80 transition-colors"
                  >
                    Masuk di sini
                  </Link>
                </div>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
