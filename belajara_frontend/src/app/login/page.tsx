"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2, Sparkles } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError("Username dan password tidak boleh kosong.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await api.auth.login(username, password)
      const user = res?.user || api.auth.getUser()
      if (user?.is_instructor) {
        router.push('/instructor')
      } else {
        router.push('/')
      }
    } catch (err: any) {
      setError(err.message || "Gagal masuk. Silakan periksa kembali username dan password Anda.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="font-heading text-4xl font-bold tracking-tight text-primary">
            Belajara.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground font-medium">
            Platform Pembelajaran Interaktif Berbasis AI
          </p>
        </div>

        <Card className="border border-border bg-white shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold font-heading text-primary">Masuk Akun</CardTitle>
            <CardDescription className="text-xs">
              Masukkan username dan password Anda untuk mengakses dashboard belajar.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg flex items-start gap-2 border border-destructive/20">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs font-semibold text-primary">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Masukkan username (cth: mahasiswa)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-white border border-border focus:ring-accent rounded-lg"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold text-primary">Password</Label>
                  <Link
                    href="#"
                    className="text-xs text-accent hover:text-accent-foreground font-medium transition-colors"
                  >
                    Lupa password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white border border-border focus:ring-accent rounded-lg"
                  disabled={loading}
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg py-2.5 font-medium flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>Masuk</span>
                )}
              </Button>
              <div className="text-xs text-center text-muted-foreground mt-2">
                Belum punya akun?{" "}
                <Link
                  href="/register"
                  className="font-bold text-destructive hover:text-destructive/80 transition-colors"
                >
                  Daftar Sekarang
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Info banner for Demo */}
        <div className="text-center p-3 bg-secondary/50 rounded-lg border border-border text-[11px] text-muted-foreground">
          <p className="font-semibold text-primary flex items-center justify-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-destructive" />
            Mode Demo / Integrasi Terhubung
          </p>
          <p className="mt-0.5">Dapat login dengan username <strong>mahasiswa</strong> & password bebas untuk pengetesan offline.</p>
        </div>
      </div>
    </div>
  )
}
